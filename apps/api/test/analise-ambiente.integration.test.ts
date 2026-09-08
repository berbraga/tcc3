import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { criarApp } from '../src/app.js';
import { PrismaAnaliseAmbienteRepository } from '../src/infra/repositories.js';
import { JwtTokenService } from '../src/infra/token.js';
import { AnaliseAmbienteService } from '../src/modules/analises-ambiente/analise-ambiente.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['swot-ana@eduitsm.local', 'swot-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
const analises = new AnaliseAmbienteService(new PrismaAnaliseAmbienteRepository(db));
const app = criarApp({
  authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
  tokenService: tokens,
  organizacaoService: {
    obterMinha: async () => { throw new Error('fora do escopo'); },
    atualizarMinha: async () => { throw new Error('fora do escopo'); },
    verificarAcesso: async () => { throw new Error('fora do escopo'); }
  },
  analiseAmbienteService: analises,
  estrategiaService: {
    obterAtual: async () => null,
    salvarNovaVersao: async () => { throw new Error('fora do escopo'); },
    listarVersoes: async () => []
  },
  objetivoService: {
    listar: async () => [],
    criar: async () => { throw new Error('fora do escopo'); },
    obterCobertura: async () => { throw new Error('fora do escopo'); }
  }
}, 'http://localhost:5173');

let tokenAna = '';
let tokenBia = '';
let bancoSeguro = false;

describe('API de análise de ambiente com persistência real', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const [ana, bia] = await Promise.all([
      db.usuario.create({ data: { nome: 'Ana SWOT', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } } }),
      db.usuario.create({ data: { nome: 'Bia SWOT', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } } })
    ]);
    tokenAna = tokens.assinar({ sub: ana.id, perfil: 'ALUNO' });
    tokenBia = tokens.assinar({ sub: bia.id, perfil: 'ALUNO' });
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('executa CRUD HTTP e retorna 404 sem alterar item de outra organização', async () => {
    const criada = await request(app).post('/api/v1/analises-ambiente').set('authorization', `Bearer ${tokenAna}`).send({
      tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe experiente', impacto: 'ALTO'
    });
    expect(criada.status).toBe(201);

    const lista = await request(app).get('/api/v1/analises-ambiente').set('authorization', `Bearer ${tokenAna}`);
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual([criada.body]);

    const estrangeira = await request(app).put(`/api/v1/analises-ambiente/${criada.body.id}`).set('authorization', `Bearer ${tokenBia}`).send({
      tipo: 'EXTERNO', categoria: 'AMEACA', descricao: 'Alteração indevida', impacto: 'BAIXO'
    });
    expect(estrangeira.status).toBe(404);
    expect(estrangeira.body).toMatchObject({ code: 'ANALISE_NAO_ENCONTRADA' });

    const atualizada = await request(app).put(`/api/v1/analises-ambiente/${criada.body.id}`).set('authorization', `Bearer ${tokenAna}`).send({
      tipo: 'INTERNO', categoria: 'FRAQUEZA', descricao: 'Equipe reduzida', impacto: 'MEDIO'
    });
    expect(atualizada.status).toBe(200);
    expect(atualizada.body).toMatchObject({ descricao: 'Equipe reduzida', categoria: 'FRAQUEZA' });

    const removida = await request(app).delete(`/api/v1/analises-ambiente/${criada.body.id}`).set('authorization', `Bearer ${tokenAna}`);
    expect(removida.status).toBe(204);
    await expect(db.analiseAmbiente.findUnique({ where: { id: criada.body.id } })).resolves.toBeNull();
  });

  it('responde 422 para descrição vazia', async () => {
    const response = await request(app).post('/api/v1/analises-ambiente').set('authorization', `Bearer ${tokenAna}`).send({
      tipo: 'INTERNO', categoria: 'FORCA', descricao: '   ', impacto: null
    });
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'DADOS_INVALIDOS' });
  });

  it.each(['put', 'delete'] as const)('mantém 404 no %s para UUID válido de outra organização', async (metodo) => {
    const criada = await request(app).post('/api/v1/analises-ambiente').set('authorization', `Bearer ${tokenAna}`).send({
      tipo: 'EXTERNO', categoria: 'OPORTUNIDADE', descricao: 'Mercado em expansão', impacto: 'ALTO'
    });

    const response = metodo === 'put'
      ? await request(app).put(`/api/v1/analises-ambiente/${criada.body.id}`).set('authorization', `Bearer ${tokenBia}`).send({
          tipo: 'EXTERNO', categoria: 'AMEACA', descricao: 'Alteração indevida', impacto: 'BAIXO'
        })
      : await request(app).delete(`/api/v1/analises-ambiente/${criada.body.id}`).set('authorization', `Bearer ${tokenBia}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ code: 'ANALISE_NAO_ENCONTRADA' });
    await expect(db.analiseAmbiente.findUnique({ where: { id: criada.body.id } })).resolves.toMatchObject({ descricao: 'Mercado em expansão' });
  });

  it.each(['put', 'delete'] as const)('responde 422 no %s para UUID malformado', async (metodo) => {
    const response = metodo === 'put'
      ? await request(app).put('/api/v1/analises-ambiente/uuid-invalido').set('authorization', `Bearer ${tokenAna}`).send({
          tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe experiente', impacto: 'ALTO'
        })
      : await request(app).delete('/api/v1/analises-ambiente/uuid-invalido').set('authorization', `Bearer ${tokenAna}`);

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'DADOS_INVALIDOS' });
  });
});
