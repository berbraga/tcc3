import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { objetivoSchema, type ObjetivoInput } from '@eduitsm/shared';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { PrismaObjetivoRepository } from '../src/modules/objetivos/objetivo.repository.js';
import {
  ObjetivoService,
  type CoberturaObjetivoResultado,
  type ObjetivoRepository,
  type ObjetivoResultado
} from '../src/modules/objetivos/objetivo.service.js';
import { JwtTokenService } from '../src/infra/token.js';
import { validarBancoDeTeste } from './database-safety.js';

const objetivo: ObjetivoInput = {
  codigo: 'OE-01',
  descricao: 'Aumentar a receita corporativa em 20%',
  prazo: '2027-06-30',
  status: 'ATIVO'
};

class RepositorioEmMemoria implements ObjetivoRepository {
  itens: ObjetivoResultado[] = [];
  organizacoes: Record<string, string> = { u1: 'org1', u2: 'org2' };
  coberturas: Record<string, CoberturaObjetivoResultado> = {};
  private proximoId = 1;

  async buscarOrganizacaoId(usuarioId: string) {
    return this.organizacoes[usuarioId] ?? null;
  }

  async listar(organizacaoId: string) {
    return this.itens.filter((item) => item.organizacaoId === organizacaoId);
  }

  async criar(organizacaoId: string, input: ObjetivoInput) {
    if (this.itens.some((item) => item.organizacaoId === organizacaoId && item.codigo === input.codigo)) {
      throw { code: 'P2002' };
    }
    const criado = { id: `00000000-0000-4000-8000-${String(this.proximoId++).padStart(12, '0')}`, organizacaoId, ...input, prazo: input.prazo ? new Date(input.prazo) : null };
    this.itens.push(criado);
    return criado;
  }

  async obterCobertura(organizacaoId: string, id: string) {
    if (!this.itens.some((item) => item.id === id && item.organizacaoId === organizacaoId)) return null;
    return this.coberturas[id] ?? { objetivoId: id, servicosVinculados: 0, cobertura: 0 };
  }

  async contarObjetivosAlinhados(organizacaoId: string) {
    return this.itens.filter((item) => item.organizacaoId === organizacaoId && (this.coberturas[item.id]?.servicosVinculados ?? 0) > 0).length;
  }
}

describe('objetivos estratégicos', () => {
  it('valida status, prazo e impede organização definida pelo cliente', () => {
    expect(objetivoSchema.parse(objetivo)).toEqual(objetivo);
    expect(objetivoSchema.safeParse({ ...objetivo, status: 'DESCONHECIDO' }).success).toBe(false);
    expect(objetivoSchema.safeParse({ ...objetivo, prazo: 'jun/2027' }).success).toBe(false);
    expect(objetivoSchema.safeParse({ ...objetivo, organizacaoId: 'org2' }).success).toBe(false);
  });

  it('lista somente objetivos da organização autenticada e converte código duplicado em 422', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new ObjetivoService(repository);
    const criado = await service.criar('u1', objetivo);
    await service.criar('u2', objetivo);

    await expect(service.listar('u1')).resolves.toEqual([criado]);
    await expect(service.criar('u1', objetivo)).rejects.toMatchObject({
      status: 422,
      code: 'CODIGO_OBJETIVO_DUPLICADO'
    });
  });

  it('retorna cobertura zero quando o objetivo ainda não possui vínculos', async () => {
    const service = new ObjetivoService(new RepositorioEmMemoria());
    const criado = await service.criar('u1', objetivo);

    await expect(service.obterCobertura('u1', criado.id)).resolves.toEqual({
      objetivoId: criado.id,
      servicosVinculados: 0,
      cobertura: 0
    });
    await expect(service.obterCobertura('u2', criado.id)).rejects.toMatchObject({
      status: 404,
      code: 'OBJETIVO_NAO_ENCONTRADO'
    });
  });

  it('expõe listagem, criação e cobertura derivadas somente do usuário autenticado', async () => {
    const objetivoService = new ObjetivoService(new RepositorioEmMemoria());
    const deps = dependencias(objetivoService, { sub: 'u1', perfil: 'ALUNO' });
    const app = criarApp(deps, 'http://localhost:5173');

    const criada = await request(app).post('/api/v1/objetivos').set('authorization', 'Bearer valido').send(objetivo);
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ codigo: 'OE-01', status: 'ATIVO', organizacaoId: 'org1' });

    const lista = await request(app).get('/api/v1/objetivos?organizacaoId=org2').set('authorization', 'Bearer valido');
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);

    const cobertura = await request(app).get(`/api/v1/objetivos/${criada.body.id}/cobertura`).set('authorization', 'Bearer valido');
    expect(cobertura.status).toBe(200);
    expect(cobertura.body).toEqual({ objetivoId: criada.body.id, servicosVinculados: 0, cobertura: 0 });

    const clienteDefineOrganizacao = await request(app).post('/api/v1/objetivos').set('authorization', 'Bearer valido').send({ ...objetivo, organizacaoId: 'org2' });
    expect(clienteDefineOrganizacao.status).toBe(422);
  });
});

function dependencias(
  objetivoService: ObjetivoService,
  auth: { sub: string; perfil: 'ALUNO' }
): Dependencias {
  return {
    authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
    tokenService: { verificar: () => auth },
    organizacaoService: {
      obterMinha: async () => { throw new Error('fora do escopo'); },
      atualizarMinha: async () => { throw new Error('fora do escopo'); },
      verificarAcesso: async () => { throw new Error('fora do escopo'); }
    },
    analiseAmbienteService: {
      listar: async () => [],
      criar: async () => { throw new Error('fora do escopo'); },
      atualizar: async () => { throw new Error('fora do escopo'); },
      remover: async () => { throw new Error('fora do escopo'); }
    },
    estrategiaService: {
      obterAtual: async () => null,
      salvarNovaVersao: async () => { throw new Error('fora do escopo'); },
      listarVersoes: async () => []
    },
    objetivoService,
    servicoService: {
      listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
      atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); },
      listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); },
      listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); }
    },
    vinculoService: {
      listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
      remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => []
    },
    indicadorService: {
      listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); },
      atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }
    },
    cenarioService: { criar: async () => { throw new Error('fora do escopo'); }, obterPainel: async () => [] },
    relatorioEstrategiaService: { obter: async () => { throw new Error('fora do escopo'); }, exportar: async () => { throw new Error('fora do escopo'); } }
  };
}

const db = new PrismaClient();
const emails = ['objetivo-ana@eduitsm.local', 'objetivo-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
let tokenAna = '';
let tokenBia = '';
let bancoSeguro = false;

describe('persistência e isolamento de objetivos', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const [ana, bia] = await Promise.all([
      db.usuario.create({ data: { nome: 'Ana Objetivos', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } } }),
      db.usuario.create({ data: { nome: 'Bia Objetivos', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } } })
    ]);
    tokenAna = tokens.assinar({ sub: ana.id, perfil: 'ALUNO' });
    tokenBia = tokens.assinar({ sub: bia.id, perfil: 'ALUNO' });
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('persiste o objetivo, recusa duplicata e oculta cobertura de outra organização', async () => {
    const objetivoService = new ObjetivoService(new PrismaObjetivoRepository(db));
    const appReal = criarApp({ ...dependencias(objetivoService, { sub: 'u1', perfil: 'ALUNO' }), tokenService: tokens }, 'http://localhost:5173');

    const criada = await request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenAna}`).send(objetivo);
    expect(criada.status).toBe(201);
    await expect(db.objetivoEstrategico.findUnique({ where: { id: criada.body.id } })).resolves.toMatchObject({ codigo: objetivo.codigo });

    const duplicada = await request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenAna}`).send(objetivo);
    expect(duplicada.status).toBe(422);
    expect(duplicada.body).toMatchObject({ code: 'CODIGO_OBJETIVO_DUPLICADO' });

    const coberturaVazia = await request(appReal).get(`/api/v1/objetivos/${criada.body.id}/cobertura`).set('authorization', `Bearer ${tokenAna}`);
    expect(coberturaVazia.body).toEqual({ objetivoId: criada.body.id, servicosVinculados: 0, cobertura: 0 });

    const estrangeira = await request(appReal).get(`/api/v1/objetivos/${criada.body.id}/cobertura`).set('authorization', `Bearer ${tokenBia}`);
    expect(estrangeira.status).toBe(404);
    expect(estrangeira.body).toMatchObject({ code: 'OBJETIVO_NAO_ENCONTRADO' });
  });

  it('soma contribuições fracionárias sem erro de ponto flutuante', async () => {
    const objetivoService = new ObjetivoService(new PrismaObjetivoRepository(db));
    const appReal = criarApp({ ...dependencias(objetivoService, { sub: 'u1', perfil: 'ALUNO' }), tokenService: tokens }, 'http://localhost:5173');
    const criada = await request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenAna}`).send({ ...objetivo, codigo: 'OE-02' });
    const [primeiro, segundo] = await Promise.all([
      db.servico.create({ data: { organizacaoId: criada.body.organizacaoId, nome: 'Portal B2B' } }),
      db.servico.create({ data: { organizacaoId: criada.body.organizacaoId, nome: 'Automação comercial' } })
    ]);
    await db.vinculoEstrategico.createMany({ data: [
      { servicoId: primeiro.id, objetivoId: criada.body.id, justificativaValor: 'Parcela um', contribuicao: '0.10' },
      { servicoId: segundo.id, objetivoId: criada.body.id, justificativaValor: 'Parcela dois', contribuicao: '0.20' }
    ] });

    const cobertura = await request(appReal).get(`/api/v1/objetivos/${criada.body.id}/cobertura`).set('authorization', `Bearer ${tokenAna}`);

    expect(cobertura.status).toBe(200);
    expect(cobertura.body).toMatchObject({ servicosVinculados: 2, cobertura: 0.3 });
  });

  it('conta objetivos alinhados uma vez e somente na organização autenticada', async () => {
    const objetivoService = new ObjetivoService(new PrismaObjetivoRepository(db));
    const appReal = criarApp({ ...dependencias(objetivoService, { sub: 'u1', perfil: 'ALUNO' }), tokenService: tokens }, 'http://localhost:5173');
    const [alinhadoBia, semVinculoBia, alinhadoAna] = await Promise.all([
      request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenBia}`).send({ ...objetivo, codigo: 'OE-BIA-01' }),
      request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenBia}`).send({ ...objetivo, codigo: 'OE-BIA-02' }),
      request(appReal).post('/api/v1/objetivos').set('authorization', `Bearer ${tokenAna}`).send({ ...objetivo, codigo: 'OE-ANA-03' })
    ]);
    const [servicoBiaUm, servicoBiaDois, servicoAna] = await Promise.all([
      db.servico.create({ data: { organizacaoId: alinhadoBia.body.organizacaoId, nome: 'Serviço Bia 1' } }),
      db.servico.create({ data: { organizacaoId: alinhadoBia.body.organizacaoId, nome: 'Serviço Bia 2' } }),
      db.servico.create({ data: { organizacaoId: alinhadoAna.body.organizacaoId, nome: 'Serviço Ana' } })
    ]);
    await db.vinculoEstrategico.createMany({ data: [
      { servicoId: servicoBiaUm.id, objetivoId: alinhadoBia.body.id, justificativaValor: 'Primeiro vínculo', contribuicao: '0.25' },
      { servicoId: servicoBiaDois.id, objetivoId: alinhadoBia.body.id, justificativaValor: 'Segundo vínculo', contribuicao: '0.25' },
      { servicoId: servicoAna.id, objetivoId: alinhadoAna.body.id, justificativaValor: 'Outra organização', contribuicao: '0.50' }
    ] });

    const resumo = await request(appReal).get('/api/v1/objetivos/cobertura').set('authorization', `Bearer ${tokenBia}`);

    expect(semVinculoBia.status).toBe(201);
    expect(resumo.status).toBe(200);
    expect(resumo.body).toEqual({ objetivosAlinhados: 1 });
  });
});
