import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { JwtTokenService } from '../src/infra/token.js';
import { IndicadorService } from '../src/modules/indicadores/indicador.service.js';
import { PrismaIndicadorRepository } from '../src/modules/indicadores/indicador.repository.js';
import { ObjetivoService } from '../src/modules/objetivos/objetivo.service.js';
import { PrismaObjetivoRepository } from '../src/modules/objetivos/objetivo.repository.js';
import { PrismaVinculoRepository } from '../src/modules/vinculos/vinculo.repository.js';
import { VinculoService } from '../src/modules/vinculos/vinculo.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['alinhamento-ana@eduitsm.local', 'alinhamento-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
let tokenAna = '';
let tokenBia = '';
let organizacaoAna = '';
let organizacaoBia = '';
let bancoSeguro = false;

describe('API de vínculos e indicadores', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const [ana, bia] = await Promise.all([
      db.usuario.create({ data: { nome: 'Ana Alinhamento', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } }, include: { organizacao: true } }),
      db.usuario.create({ data: { nome: 'Bia Alinhamento', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } }, include: { organizacao: true } })
    ]);
    tokenAna = tokens.assinar({ sub: ana.id, perfil: 'ALUNO' });
    tokenBia = tokens.assinar({ sub: bia.id, perfil: 'ALUNO' });
    organizacaoAna = ana.organizacao!.id;
    organizacaoBia = bia.organizacao!.id;
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('cria vínculos, informa saldo, lista pendências e atualiza cobertura', async () => {
    const app = appReal();
    const [servicoA, servicoB, pendente] = await Promise.all([
      criarServico(organizacaoAna, 'Portal'),
      criarServico(organizacaoAna, 'ERP'),
      criarServico(organizacaoAna, 'Service desk')
    ]);
    await criarServico(organizacaoAna, 'Legado', 'DESCONTINUADO');
    await criarServico(organizacaoAna, 'Catálogo futuro', 'PROPOSTO');
    const objetivo = await db.objetivoEstrategico.create({ data: { organizacaoId: organizacaoAna, codigo: 'OBJ-API-1', descricao: 'Elevar receita', status: 'ATIVO' } });
    const objetivoExterno = await db.objetivoEstrategico.create({ data: { organizacaoId: organizacaoBia, codigo: 'OBJ-API-2', descricao: 'Outro objetivo', status: 'ATIVO' } });

    const vazio = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoA.id, objetivoId: objetivo.id, justificativaValor: ' ', contribuicao: 10 });
    expect(vazio.status).toBe(422);
    const zero = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoA.id, objetivoId: objetivo.id, justificativaValor: 'Valor', contribuicao: 0 });
    expect(zero.status).toBe(422);

    const servico404 = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: '00000000-0000-4000-8000-000000000099', objetivoId: objetivo.id, justificativaValor: 'Valor', contribuicao: 10 });
    expect(servico404.status).toBe(404);
    const objetivo404 = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoA.id, objetivoId: objetivoExterno.id, justificativaValor: 'Valor', contribuicao: 10 });
    expect(objetivo404.status).toBe(404);

    const primeiro = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoA.id, objetivoId: objetivo.id, justificativaValor: 'Canal principal', contribuicao: 60 });
    expect(primeiro.status).toBe(201);
    const excedente = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoB.id, objetivoId: objetivo.id, justificativaValor: 'Apoio operacional', contribuicao: 41 });
    expect(excedente.status).toBe(422);
    expect(excedente.body).toMatchObject({ code: 'CONTRIBUICAO_EXCEDE_LIMITE', message: expect.stringContaining('40'), details: { saldoDisponivel: 40 } });
    const segundo = await request(app).post('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`).send({ servicoId: servicoB.id, objetivoId: objetivo.id, justificativaValor: 'Apoio operacional', contribuicao: 40 });
    expect(segundo.status).toBe(201);

    const lista = await request(app).get('/api/v1/vinculos').set('authorization', `Bearer ${tokenAna}`);
    expect(lista.body).toHaveLength(2);
    const pendencias = await request(app).get('/api/v1/vinculos/pendencias').set('authorization', `Bearer ${tokenAna}`);
    expect(pendencias.body).toEqual([expect.objectContaining({ id: pendente.id, status: 'EM_OPERACAO' })]);
    const cobertura = await request(app).get(`/api/v1/objetivos/${objetivo.id}/cobertura`).set('authorization', `Bearer ${tokenAna}`);
    expect(cobertura.body).toMatchObject({ servicosVinculados: 2, cobertura: 100 });

    const exclusaoExterna = await request(app).delete(`/api/v1/vinculos/${primeiro.body.id}`).set('authorization', `Bearer ${tokenBia}`);
    expect(exclusaoExterna.status).toBe(404);
    const exclusao = await request(app).delete(`/api/v1/vinculos/${primeiro.body.id}`).set('authorization', `Bearer ${tokenAna}`);
    expect(exclusao.status).toBe(204);
  });

  it('valida RN04/RN08, preserva histórico descontinuado e autoriza PUT/DELETE', async () => {
    const app = appReal();
    const servico = await criarServico(organizacaoAna, 'Monitoramento');
    const descontinuado = await criarServico(organizacaoAna, 'Monitor legado', 'DESCONTINUADO');
    const externo = await criarServico(organizacaoBia, 'Monitor externo');
    const objetivo = await db.objetivoEstrategico.create({ data: { organizacaoId: organizacaoAna, codigo: 'OBJ-API-3', descricao: 'Disponibilidade', status: 'ATIVO' } });
    const base = { objetivoId: objetivo.id, nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR' };

    const semMeta = await request(app).post(`/api/v1/servicos/${servico.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`).send({ ...base, meta: undefined });
    expect(semMeta.status).toBe(422);
    const inexistente = await request(app).post('/api/v1/servicos/00000000-0000-4000-8000-000000000099/indicadores').set('authorization', `Bearer ${tokenAna}`).send(base);
    expect(inexistente.status).toBe(404);
    const cruzado = await request(app).post(`/api/v1/servicos/${externo.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`).send(base);
    expect(cruzado.status).toBe(404);
    const bloqueado = await request(app).post(`/api/v1/servicos/${descontinuado.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`).send(base);
    expect(bloqueado.status).toBe(422);
    expect(bloqueado.body).toMatchObject({ code: 'SERVICO_DESCONTINUADO' });

    const maior = await request(app).post(`/api/v1/servicos/${servico.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`).send(base);
    const menor = await request(app).post(`/api/v1/servicos/${servico.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`).send({ ...base, nome: 'Tempo médio', tipo: 'TEMPO_ATENDIMENTO', unidade: 'min', meta: 30, sentido: 'MENOR_MELHOR' });
    expect(maior.status).toBe(201);
    expect(menor.status).toBe(201);
    await db.servico.update({ where: { id: servico.id }, data: { status: 'DESCONTINUADO' } });
    const historico = await request(app).get(`/api/v1/servicos/${servico.id}/indicadores`).set('authorization', `Bearer ${tokenAna}`);
    expect(historico.body).toEqual(expect.arrayContaining([expect.objectContaining({ sentido: 'MAIOR_MELHOR' }), expect.objectContaining({ sentido: 'MENOR_MELHOR' })]));

    const atualizada = await request(app).put(`/api/v1/indicadores/${maior.body.id}`).set('authorization', `Bearer ${tokenAna}`).send({ ...base, nome: 'Disponibilidade mensal', meta: 99.9 });
    expect(atualizada.status).toBe(200);
    expect(atualizada.body).toMatchObject({ nome: 'Disponibilidade mensal', meta: 99.9 });
    const exclusaoExterna = await request(app).delete(`/api/v1/indicadores/${maior.body.id}`).set('authorization', `Bearer ${tokenBia}`);
    expect(exclusaoExterna.status).toBe(404);
    const exclusao = await request(app).delete(`/api/v1/indicadores/${maior.body.id}`).set('authorization', `Bearer ${tokenAna}`);
    expect(exclusao.status).toBe(204);
  });
});

function criarServico(organizacaoId: string, nome: string, status: 'EM_OPERACAO' | 'DESCONTINUADO' | 'PROPOSTO' = 'EM_OPERACAO') {
  return db.servico.create({ data: { organizacaoId, nome, status } });
}

function appReal() {
  const deps = {
    authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
    tokenService: tokens,
    organizacaoService: {
      obterMinha: async () => { throw new Error('fora do escopo'); },
      atualizarMinha: async () => { throw new Error('fora do escopo'); },
      verificarAcesso: async () => { throw new Error('fora do escopo'); }
    },
    analiseAmbienteService: {
      listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
      atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }
    },
    estrategiaService: { obterAtual: async () => null, salvarNovaVersao: async () => { throw new Error('fora do escopo'); }, listarVersoes: async () => [] },
    objetivoService: new ObjetivoService(new PrismaObjetivoRepository(db)),
    servicoService: {
      listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); },
      listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); }, listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); }
    },
    vinculoService: new VinculoService(new PrismaVinculoRepository(db)),
    indicadorService: new IndicadorService(new PrismaIndicadorRepository(db))
  } satisfies Dependencias;
  return criarApp(deps, 'http://localhost:5173');
}
