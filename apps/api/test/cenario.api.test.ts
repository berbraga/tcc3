import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { JwtTokenService } from '../src/infra/token.js';
import { PrismaCenarioRepository } from '../src/modules/simulacao/cenario.repository.js';
import { CenarioService } from '../src/modules/simulacao/cenario.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['cenario-ana@eduitsm.local', 'cenario-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
let tokenAna = '';
let tokenBia = '';
let organizacaoAna = '';
let portalId = '';
let legadoId = '';
let bancoSeguro = false;

describe('API de cenários e painel de indicadores', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const ana = await db.usuario.create({ data: { nome: 'Ana Cenários', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } }, include: { organizacao: true } });
    const bia = await db.usuario.create({ data: { nome: 'Bia Cenários', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } }, include: { organizacao: true } });
    tokenAna = tokens.assinar({ sub: ana.id, perfil: 'ALUNO' });
    tokenBia = tokens.assinar({ sub: bia.id, perfil: 'ALUNO' });
    organizacaoAna = ana.organizacao!.id;
    portalId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Portal de vendas', status: 'EM_OPERACAO' } })).id;
    legadoId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Legado', status: 'DESCONTINUADO' } })).id;
    await db.indicador.createMany({ data: [
      { servicoId: portalId, nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' },
      { servicoId: portalId, nome: 'Satisfação', tipo: 'SATISFACAO', unidade: 'nota', meta: 4, sentido: 'MAIOR_MELHOR' },
      { servicoId: portalId, nome: 'Tempo de atendimento', tipo: 'TEMPO_ATENDIMENTO', unidade: 'min', meta: 180, sentido: 'MENOR_MELHOR' },
      { servicoId: legadoId, nome: 'SLA legado', tipo: 'SLA', unidade: '%', meta: 99, sentido: 'MAIOR_MELHOR' }
    ] });
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('persiste cenário, registros gerados e medições na mesma execução (TS04)', async () => {
    const resposta = await criarCenario(appReal());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ semente: 20260908, volumeRegistros: 12, registrosGerados: 12, medicoesGeradas: 3 });
    const registros = await db.registroOperacional.findMany({ where: { cenarioId: resposta.body.id }, orderBy: { dataAbertura: 'asc' } });
    expect(registros).toHaveLength(12);
    expect(new Set(registros.map((registro) => registro.servicoId))).toEqual(new Set([portalId]));
    await expect(db.medicao.count({ where: { indicador: { servico: { organizacaoId: organizacaoAna } } } })).resolves.toBe(3);
  });

  it('agrega medições por serviço e indicador sem expor outra organização', async () => {
    const app = appReal();
    await criarCenario(app);
    const painelAna = await request(app).get('/api/v1/indicadores/painel').set('authorization', `Bearer ${tokenAna}`);
    const painelBia = await request(app).get('/api/v1/indicadores/painel').set('authorization', `Bearer ${tokenBia}`);

    expect(painelAna.status).toBe(200);
    expect(painelAna.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ servicoId: portalId, nome: 'Disponibilidade', tipo: 'SLA', situacao: expect.stringMatching(/META/) }),
      expect.objectContaining({ servicoId: portalId, nome: 'Satisfação', tipo: 'SATISFACAO' }),
      expect.objectContaining({ servicoId: portalId, nome: 'Tempo de atendimento', tipo: 'TEMPO_ATENDIMENTO' })
    ]));
    expect(painelBia.status).toBe(200);
    expect(painelBia.body).toEqual([]);
  });
});

function criarCenario(app: ReturnType<typeof appReal>) {
  return request(app).post('/api/v1/cenarios').set('authorization', `Bearer ${tokenAna}`).send({
    semente: 20260908, periodoInicio: '2026-01-01', periodoFim: '2026-01-31', volumeRegistros: 12, perfil: 'REALISTA', servicoIds: [portalId, legadoId]
  });
}

function appReal() {
  const deps = {
    authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
    tokenService: tokens,
    organizacaoService: { obterMinha: async () => { throw new Error('fora do escopo'); }, atualizarMinha: async () => { throw new Error('fora do escopo'); }, verificarAcesso: async () => { throw new Error('fora do escopo'); } },
    analiseAmbienteService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
    estrategiaService: { obterAtual: async () => null, salvarNovaVersao: async () => { throw new Error('fora do escopo'); }, listarVersoes: async () => [] },
    objetivoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, obterCobertura: async () => { throw new Error('fora do escopo'); }, obterResumoCobertura: async () => ({ objetivosAlinhados: 0 }) },
    servicoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); }, listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); } },
    vinculoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => [] },
    indicadorService: { listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
    cenarioService: new CenarioService(new PrismaCenarioRepository(db))
  } satisfies Dependencias;
  return criarApp(deps, 'http://localhost:5173');
}
