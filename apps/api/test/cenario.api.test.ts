import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { JwtTokenService } from '../src/infra/token.js';
import { PrismaCenarioRepository } from '../src/modules/simulacao/cenario.repository.js';
import { CenarioService, type CenarioRepository } from '../src/modules/simulacao/cenario.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['cenario-ana@eduitsm.local', 'cenario-bia@eduitsm.local'];
const tokens = new JwtTokenService('segredo-de-integracao-com-mais-de-32-caracteres', '1h');
let tokenAna = '';
let tokenBia = '';
let organizacaoAna = '';
let portalId = '';
let legadoId = '';
let crmId = '';
let indicadorCrmId = '';
let instavelId = '';
let indicadorInstavelId = '';
let servicoBiaId = '';
let falhoId = '';
let indicadorFalhoId = '';
let semIndicadorId = '';
let custoId = '';
let indicadorCustoId = '';
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
    crmId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'CRM', status: 'EM_OPERACAO' } })).id;
    instavelId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Serviço instável', status: 'EM_OPERACAO' } })).id;
    falhoId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Serviço com falha', status: 'EM_OPERACAO' } })).id;
    semIndicadorId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Serviço sem indicador', status: 'EM_OPERACAO' } })).id;
    custoId = (await db.servico.create({ data: { organizacaoId: organizacaoAna, nome: 'Serviço com custo sem fonte', status: 'EM_OPERACAO' } })).id;
    servicoBiaId = (await db.servico.create({ data: { organizacaoId: bia.organizacao!.id, nome: 'Serviço da Bia', status: 'EM_OPERACAO' } })).id;
    await db.indicador.createMany({ data: [
      { servicoId: portalId, nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' },
      { servicoId: portalId, nome: 'Satisfação', tipo: 'SATISFACAO', unidade: 'nota', meta: 4, sentido: 'MAIOR_MELHOR' },
      { servicoId: portalId, nome: 'Tempo de atendimento', tipo: 'TEMPO_ATENDIMENTO', unidade: 'min', meta: 180, sentido: 'MENOR_MELHOR' },
      { servicoId: legadoId, nome: 'SLA legado', tipo: 'SLA', unidade: '%', meta: 99, sentido: 'MAIOR_MELHOR' },
      { servicoId: crmId, nome: 'SLA CRM', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' },
      { servicoId: instavelId, nome: 'SLA instável', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' },
      { servicoId: falhoId, nome: 'SLA com falha', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' }
    ] });
    indicadorCrmId = (await db.indicador.findFirstOrThrow({ where: { servicoId: crmId } })).id;
    indicadorInstavelId = (await db.indicador.findFirstOrThrow({ where: { servicoId: instavelId } })).id;
    indicadorFalhoId = (await db.indicador.findFirstOrThrow({ where: { servicoId: falhoId } })).id;
    indicadorCustoId = (await db.indicador.create({ data: { servicoId: custoId, nome: 'Custo realizado', tipo: 'CUSTO', unidade: 'R$', meta: 10, sentido: 'MENOR_MELHOR' } })).id;
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('TS07 — ignora o serviço descontinuado e persiste cenário, registros e medições', async () => {
    const resposta = await criarCenario(appReal(), [portalId, legadoId]);

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

  it('filtra o painel pelo mês validado e informa o período consultado', async () => {
    const app = appReal();
    await criarCenario(app, [crmId], '2026-01-31');
    await criarCenario(app, [portalId], '2026-02-28');

    const janeiro = await request(app).get('/api/v1/indicadores/painel?periodo=2026-01').set('authorization', `Bearer ${tokenAna}`);
    const fevereiro = await request(app).get('/api/v1/indicadores/painel?periodo=2026-02').set('authorization', `Bearer ${tokenAna}`);
    const invalido = await request(app).get('/api/v1/indicadores/painel?periodo=2026-13').set('authorization', `Bearer ${tokenAna}`);

    expect(janeiro.status).toBe(200);
    expect(janeiro.body).toEqual(expect.arrayContaining([expect.objectContaining({ servicoId: crmId, periodo: '2026-01', cenarioId: expect.any(String) })]));
    expect(fevereiro.status).toBe(200);
    expect(fevereiro.body).toEqual(expect.arrayContaining([expect.objectContaining({ servicoId: portalId, periodo: '2026-02' })]));
    expect(fevereiro.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ servicoId: crmId })]));
    expect(invalido.status).toBe(422);
  });

  it('recusa serviço estrangeiro sem persistir cenário, registros ou medições', async () => {
    const cenariosAntes = await db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } });
    const registrosAntes = await db.registroOperacional.count({ where: { servicoId: portalId } });
    const medicoesAntes = await db.medicao.count({ where: { indicador: { servico: { organizacaoId: organizacaoAna } } } });

    const resposta = await criarCenario(appReal(), [portalId, servicoBiaId]);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toMatchObject({ code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } })).resolves.toBe(cenariosAntes);
    await expect(db.registroOperacional.count({ where: { servicoId: portalId } })).resolves.toBe(registrosAntes);
    await expect(db.medicao.count({ where: { indicador: { servico: { organizacaoId: organizacaoAna } } } })).resolves.toBe(medicoesAntes);
  });

  it('UC11 — exige ao menos um indicador em serviço operacional selecionado antes de persistir', async () => {
    const cenariosAntes = await db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } });

    const resposta = await criarCenario(appReal(), [semIndicadorId], '2026-04-30');

    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ code: 'SEM_INDICADORES' });
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } })).resolves.toBe(cenariosAntes);
  });

  it('repetição idêntica é idempotente e não duplica cenário, registros ou medições', async () => {
    const app = appReal();
    const primeiro = await criarCenario(app, [portalId], '2026-05-31');
    const segundo = await criarCenario(app, [portalId], '2026-05-31');

    expect(primeiro.status).toBe(201);
    expect(segundo.status).toBe(200);
    expect(segundo.body).toMatchObject({ id: primeiro.body.id, reutilizado: true, registrosGerados: 12, medicoesGeradas: 3 });
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna, periodoFim: new Date('2026-05-31T00:00:00.000Z') } })).resolves.toBe(1);
    await expect(db.registroOperacional.count({ where: { cenarioId: primeiro.body.id } })).resolves.toBe(12);
  });

  it('preserva e identifica as medições de cenários distintos no mesmo período, sem agregá-las', async () => {
    const app = appReal();
    const primeiro = await criarCenario(app, [portalId], '2026-06-30');
    const segundo = await request(app).post('/api/v1/cenarios').set('authorization', `Bearer ${tokenAna}`).send({
      semente: 20260909, periodoInicio: '2026-06-01', periodoFim: '2026-06-30', volumeRegistros: 12, perfil: 'REALISTA', servicoIds: [portalId]
    });
    const painel = await request(app).get('/api/v1/indicadores/painel?periodo=2026-06').set('authorization', `Bearer ${tokenAna}`);

    expect(primeiro.status).toBe(201);
    expect(segundo.status).toBe(201);
    expect(painel.status).toBe(200);
    const sla = painel.body.filter((item: { indicadorId: string; tipo: string }) => item.indicadorId && item.tipo === 'SLA');
    expect(sla).toEqual(expect.arrayContaining([
      expect.objectContaining({ cenarioId: primeiro.body.id, medicoes: 1 }),
      expect.objectContaining({ cenarioId: segundo.body.id, medicoes: 1 })
    ]));
    expect(new Set(sla.map((item: { cenarioId: string }) => item.cenarioId))).toEqual(new Set([primeiro.body.id, segundo.body.id]));
  });

  it('mostra sem medição quando o indicador não possui fonte operacional definida', async () => {
    const app = appReal();
    const cenario = await criarCenario(app, [custoId], '2026-08-31');
    const painel = await request(app).get(`/api/v1/indicadores/painel?periodo=2026-08&cenarioId=${cenario.body.id}`).set('authorization', `Bearer ${tokenAna}`);

    expect(cenario).toHaveProperty('status', 201);
    expect(cenario.body).toMatchObject({ medicoesGeradas: 0 });
    expect(painel.status).toBe(200);
    expect(painel.body).toEqual([expect.objectContaining({ indicadorId: indicadorCustoId, valor: null, denominador: 0, situacao: null, medicoes: 0, cenarioId: cenario.body.id })]);
  });

  it('preserva cenários com conjuntos de serviços diferentes no mesmo período', async () => {
    const app = appReal();
    const primeiro = await criarCenario(app, [portalId, crmId], '2026-03-31');
    expect(primeiro.status).toBe(201);
    await expect(db.medicao.count({ where: { indicador: { servico: { organizacaoId: organizacaoAna } }, periodoRef: new Date('2026-03-31T00:00:00.000Z') } })).resolves.toBe(4);

    const segundo = await criarCenario(app, [portalId], '2026-03-31');
    expect(segundo.status).toBe(201);
    await expect(db.medicao.findMany({ where: { periodoRef: new Date('2026-03-31T00:00:00.000Z'), indicador: { servico: { organizacaoId: organizacaoAna } } }, select: { indicadorId: true } })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ indicadorId: indicadorCrmId })]));
    await expect(db.medicao.count({ where: { periodoRef: new Date('2026-03-31T00:00:00.000Z'), indicador: { servico: { organizacaoId: organizacaoAna } } } })).resolves.toBe(7);
    await expect(db.registroOperacional.count({ where: { cenarioId: { in: [primeiro.body.id, segundo.body.id] } } })).resolves.toBe(24);
  });

  it('serializa repetições concorrentes e conserva uma única execução', async () => {
    const app = appReal();
    const [primeiro, segundo] = await Promise.all([criarCenario(app, [crmId], '2026-07-31'), criarCenario(app, [crmId], '2026-07-31')]);

    expect([primeiro.status, segundo.status].sort()).toEqual([200, 201]);
    expect(primeiro.body.id).toBe(segundo.body.id);
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna, periodoFim: new Date('2026-07-31T00:00:00.000Z') } })).resolves.toBe(1);
    await expect(db.medicao.count({ where: { periodoRef: new Date('2026-07-31T00:00:00.000Z'), indicadorId: indicadorCrmId } })).resolves.toBe(1);
  });

  it('cancela toda a persistência quando serviço muda para descontinuado antes da transação', async () => {
    const cenariosAntes = await db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } });
    const registrosAntes = await db.registroOperacional.count({ where: { servicoId: instavelId } });
    const medicoesAntes = await db.medicao.count({ where: { indicadorId: indicadorInstavelId } });

    const resposta = await criarCenario(appComDescontinuacaoDurantePersistencia(), [instavelId]);

    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ code: 'SERVICO_NAO_DISPONIVEL' });
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } })).resolves.toBe(cenariosAntes);
    await expect(db.registroOperacional.count({ where: { servicoId: instavelId } })).resolves.toBe(registrosAntes);
    await expect(db.medicao.count({ where: { indicadorId: indicadorInstavelId } })).resolves.toBe(medicoesAntes);
  });

  it('reverte cenário e registros quando o upsert falha após createMany', async () => {
    const cenariosAntes = await db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } });
    const registrosAntes = await db.registroOperacional.count({ where: { servicoId: falhoId } });

    const resposta = await criarCenario(appComFalhaAposCreateMany(), [falhoId]);

    expect(resposta.status).toBe(500);
    await expect(db.cenarioSimulacao.count({ where: { organizacaoId: organizacaoAna } })).resolves.toBe(cenariosAntes);
    await expect(db.registroOperacional.count({ where: { servicoId: falhoId } })).resolves.toBe(registrosAntes);
    await expect(db.medicao.count({ where: { indicadorId: indicadorFalhoId } })).resolves.toBe(0);
  });
});

function criarCenario(app: ReturnType<typeof appReal>, servicoIds = [portalId], periodoFim = '2026-01-31') {
  return request(app).post('/api/v1/cenarios').set('authorization', `Bearer ${tokenAna}`).send({
    semente: 20260908, periodoInicio: `${periodoFim.slice(0, 7)}-01`, periodoFim, volumeRegistros: 12, perfil: 'REALISTA', servicoIds
  });
}

function appComDescontinuacaoDurantePersistencia() {
  const base = new PrismaCenarioRepository(db);
  const repository: CenarioRepository = {
    buscarOrganizacaoId: (usuarioId) => base.buscarOrganizacaoId(usuarioId),
    buscarServicos: (organizacaoId, ids) => base.buscarServicos(organizacaoId, ids),
    persistir: async (...args) => {
      await db.servico.update({ where: { id: instavelId }, data: { status: 'DESCONTINUADO' } });
      return base.persistir(...args);
    },
    obterPainel: (organizacaoId) => base.obterPainel(organizacaoId)
  };
  return appReal(new CenarioService(repository));
}

function appComFalhaAposCreateMany() {
  const base = new PrismaCenarioRepository(db);
  const repository: CenarioRepository = {
    buscarOrganizacaoId: (usuarioId) => base.buscarOrganizacaoId(usuarioId),
    buscarServicos: (organizacaoId, ids) => base.buscarServicos(organizacaoId, ids),
    persistir: async (...args) => {
      await db.indicador.delete({ where: { id: indicadorFalhoId } });
      return base.persistir(...args);
    },
    obterPainel: (organizacaoId) => base.obterPainel(organizacaoId)
  };
  return appReal(new CenarioService(repository));
}

function appReal(cenarioService = new CenarioService(new PrismaCenarioRepository(db))) {
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
    cenarioService,
    relatorioEstrategiaService: { obter: async () => { throw new Error('fora do escopo'); }, exportar: async () => { throw new Error('fora do escopo'); } }
  } satisfies Dependencias;
  return criarApp(deps, 'http://localhost:5173');
}
