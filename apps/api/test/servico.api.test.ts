import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { JwtTokenService } from '../src/infra/token.js';
import { PrismaServicoRepository } from '../src/modules/servicos/servico.repository.js';
import { ServicoService } from '../src/modules/servicos/servico.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['servico-ana@eduitsm.local', 'servico-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
let tokenAna = '';
let tokenBia = '';
let bancoSeguro = false;

const servico = {
  nome: 'Portal de vendas',
  descricao: 'Canal digital para clientes corporativos',
  publicoAlvo: 'Clientes B2B',
  status: 'EM_OPERACAO' as const
};

describe('API de serviços, custos e demanda', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const [ana, bia] = await Promise.all([
      db.usuario.create({ data: { nome: 'Ana Serviços', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } } }),
      db.usuario.create({ data: { nome: 'Bia Serviços', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } } })
    ]);
    tokenAna = tokens.assinar({ sub: ana.id, perfil: 'ALUNO' });
    tokenBia = tokens.assinar({ sub: bia.id, perfil: 'ALUNO' });
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('expõe CRUD isolado e mantém descontinuados na listagem', async () => {
    const app = appReal();
    const criada = await request(app).post('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`).send(servico);
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ organizacaoId: expect.any(String), nome: servico.nome, status: 'EM_OPERACAO' });

    const cruzada = await request(app).put(`/api/v1/servicos/${criada.body.id}`).set('authorization', `Bearer ${tokenBia}`).send({ ...servico, nome: 'Tentativa externa' });
    expect(cruzada.status).toBe(404);
    expect(cruzada.body).toMatchObject({ code: 'SERVICO_NAO_ENCONTRADO' });

    const descontinuada = await request(app).put(`/api/v1/servicos/${criada.body.id}`).set('authorization', `Bearer ${tokenAna}`).send({ ...servico, status: 'DESCONTINUADO' });
    expect(descontinuada.status).toBe(200);
    const lista = await request(app).get('/api/v1/servicos?organizacaoId=ignorada').set('authorization', `Bearer ${tokenAna}`);
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual([expect.objectContaining({ id: criada.body.id, status: 'DESCONTINUADO' })]);

    const removivel = await request(app).post('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`).send({ ...servico, nome: 'Serviço temporário' });
    const removida = await request(app).delete(`/api/v1/servicos/${removivel.body.id}`).set('authorization', `Bearer ${tokenAna}`);
    expect(removida.status).toBe(204);
  });

  it('registra e lista CAPEX/OPEX e demanda com ownership pelo relacionamento', async () => {
    const app = appReal();
    const criada = await request(app).post('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`).send({ ...servico, nome: 'ERP corporativo' });
    const capex = await request(app).post(`/api/v1/servicos/${criada.body.id}/custos`).set('authorization', `Bearer ${tokenAna}`).send({ tipo: 'CAPEX', valorPrevisto: 150000, valorRealizado: 149500, periodo: '2026-09' });
    const opex = await request(app).post(`/api/v1/servicos/${criada.body.id}/custos`).set('authorization', `Bearer ${tokenAna}`).send({ tipo: 'OPEX', valorPrevisto: 15000, valorRealizado: null, periodo: '2026-09' });
    expect(capex.status).toBe(201);
    expect(opex.status).toBe(201);

    const custos = await request(app).get(`/api/v1/servicos/${criada.body.id}/custos`).set('authorization', `Bearer ${tokenAna}`);
    expect(custos.body).toHaveLength(2);
    expect(custos.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: 'CAPEX', valorPrevisto: 150000, valorRealizado: 149500 }),
      expect.objectContaining({ tipo: 'OPEX', valorPrevisto: 15000, valorRealizado: null })
    ]));

    const demanda = await request(app).post(`/api/v1/servicos/${criada.body.id}/demanda`).set('authorization', `Bearer ${tokenAna}`).send({ periodo: '2026-09', demandaPrevista: 10000, capacidadeInstalada: 8000, unidade: 'transações/mês' });
    expect(demanda.status).toBe(201);
    const demandas = await request(app).get(`/api/v1/servicos/${criada.body.id}/demanda`).set('authorization', `Bearer ${tokenAna}`);
    expect(demandas.body).toEqual([expect.objectContaining({ demandaPrevista: 10000, capacidadeInstalada: 8000 })]);

    for (const rota of ['custos', 'demanda']) {
      const externa = await request(app).get(`/api/v1/servicos/${criada.body.id}/${rota}`).set('authorization', `Bearer ${tokenBia}`);
      expect(externa.status).toBe(404);
      expect(externa.body).toMatchObject({ code: 'SERVICO_NAO_ENCONTRADO' });
    }

    const exclusao = await request(app).delete(`/api/v1/servicos/${criada.body.id}`).set('authorization', `Bearer ${tokenAna}`);
    expect(exclusao.status).toBe(422);
    expect(exclusao.body).toMatchObject({ code: 'SERVICO_POSSUI_RELACOES' });
  });

  it('responde 422 para custos negativos e demanda/capacidade inválida', async () => {
    const app = appReal();
    const criada = await request(app).post('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`).send({ ...servico, nome: 'Serviço validado' });

    const custo = await request(app).post(`/api/v1/servicos/${criada.body.id}/custos`).set('authorization', `Bearer ${tokenAna}`).send({ tipo: 'CAPEX', valorPrevisto: -1, periodo: '2026-09' });
    expect(custo.status).toBe(422);

    const demanda = await request(app).post(`/api/v1/servicos/${criada.body.id}/demanda`).set('authorization', `Bearer ${tokenAna}`).send({ periodo: '2026-13', demandaPrevista: -1, capacidadeInstalada: 1.5, unidade: '' });
    expect(demanda.status).toBe(422);
  });

  it('TS13 — cadastro e consulta HTTP permanecem em até dois segundos', async () => {
    const app = appReal();
    const inicioCadastro = performance.now();
    const cadastro = await request(app).post('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`).send({ ...servico, nome: 'Serviço medido' });
    const cadastroMs = performance.now() - inicioCadastro;

    const inicioConsulta = performance.now();
    const consulta = await request(app).get('/api/v1/servicos').set('authorization', `Bearer ${tokenAna}`);
    const consultaMs = performance.now() - inicioConsulta;

    expect(cadastro.status).toBe(201);
    expect(consulta.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: cadastro.body.id, nome: 'Serviço medido' })]));
    expect(cadastroMs).toBeLessThanOrEqual(2_000);
    expect(consultaMs).toBeLessThanOrEqual(2_000);
  });
});

function appReal() {
  const servicoService = new ServicoService(new PrismaServicoRepository(db));
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
    objetivoService: {
      listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
      obterCobertura: async () => { throw new Error('fora do escopo'); }, obterResumoCobertura: async () => ({ objetivosAlinhados: 0 })
    },
    servicoService,
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
  } satisfies Dependencias;
  return criarApp(deps, 'http://localhost:5173');
}
