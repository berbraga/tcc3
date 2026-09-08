import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { estrategiaSchema, type EstrategiaInput } from '@eduitsm/shared';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { PrismaEstrategiaRepository } from '../src/modules/estrategia/estrategia.repository.js';
import {
  EstrategiaService,
  estrategiaCompleta,
  type EstrategiaRepository,
  type EstrategiaResultado
} from '../src/modules/estrategia/estrategia.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const completa: EstrategiaInput = {
  perspectiva: 'Ser referência em serviços digitais.',
  posicao: 'Atender o varejo com diferenciação por agilidade.',
  plano: 'Entregar o portal B2B em seis meses.',
  padrao: 'Priorizar automação em decisões recorrentes.'
};

class RepositorioEmMemoria implements EstrategiaRepository {
  itens: EstrategiaResultado[] = [];
  organizacoes: Record<string, string> = { u1: 'org1', u2: 'org2' };

  async buscarOrganizacaoId(usuarioId: string) {
    return this.organizacoes[usuarioId] ?? null;
  }

  async obterAtual(organizacaoId: string) {
    return (await this.listarVersoes(organizacaoId))[0] ?? null;
  }

  async listarVersoes(organizacaoId: string) {
    return this.itens
      .filter((item) => item.organizacaoId === organizacaoId)
      .sort((a, b) => b.versao - a.versao);
  }

  async salvarNovaVersao(organizacaoId: string, input: EstrategiaInput) {
    const versao = Math.max(0, ...this.itens.filter((item) => item.organizacaoId === organizacaoId).map((item) => item.versao)) + 1;
    const item = { id: `${organizacaoId}-v${versao}`, organizacaoId, ...input, versao, atualizadaEm: new Date(versao) };
    this.itens.push(item);
    return item;
  }
}

class RepositorioConcorrente extends RepositorioEmMemoria {
  private aguardando: Array<() => void> = [];

  override async salvarNovaVersao(organizacaoId: string, input: EstrategiaInput) {
    const versao = Math.max(0, ...this.itens.filter((item) => item.organizacaoId === organizacaoId).map((item) => item.versao)) + 1;
    await new Promise<void>((resolve) => {
      this.aguardando.push(resolve);
      if (this.aguardando.length === 2) this.aguardando.splice(0).forEach((liberar) => liberar());
    });
    if (this.itens.some((item) => item.organizacaoId === organizacaoId && item.versao === versao)) {
      throw { code: 'P2002' };
    }
    const item = { id: `${organizacaoId}-v${versao}`, organizacaoId, ...input, versao, atualizadaEm: new Date(versao) };
    this.itens.push(item);
    return item;
  }
}

describe('estratégia de serviço', () => {
  it.each([
    ['perspectiva', { ...completa, perspectiva: '   ' }],
    ['posição', { ...completa, posicao: null }],
    ['plano', { ...completa, plano: '' }],
    ['padrão', { ...completa, padrao: null }]
  ])('considera incompleta quando %s está vazio (RN02)', (_campo, estrategia) => {
    expect(estrategiaCompleta(estrategia)).toBe(false);
  });

  it('considera completa somente quando os quatro Ps têm conteúdo (RN02)', () => {
    expect(estrategiaCompleta(completa)).toBe(true);
    expect(estrategiaSchema.safeParse({ ...completa, organizacaoId: 'org2' }).success).toBe(false);
  });

  it('cria a versão inicial, preserva a anterior e lista da mais nova para a mais antiga (RN03)', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new EstrategiaService(repository);
    const inicial = await service.salvarNovaVersao('u1', { ...completa, plano: null });
    const revisada = await service.salvarNovaVersao('u1', completa);

    expect(inicial).toMatchObject({ organizacaoId: 'org1', versao: 1, plano: null });
    expect(revisada).toMatchObject({ organizacaoId: 'org1', versao: 2, plano: completa.plano });
    await expect(service.obterAtual('u1')).resolves.toEqual(revisada);
    await expect(service.listarVersoes('u1')).resolves.toEqual([revisada, inicial]);
    await expect(service.listarVersoes('u2')).resolves.toEqual([]);
  });

  it('converte uma colisão entre duas gravações concorrentes em erro de domínio 422', async () => {
    const repository = new RepositorioConcorrente();
    const service = new EstrategiaService(repository);
    const resultados = await Promise.allSettled([
      service.salvarNovaVersao('u1', completa),
      service.salvarNovaVersao('u1', { ...completa, plano: 'Plano concorrente' })
    ]);

    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado.status === 'rejected')[0]).toMatchObject({
      reason: { status: 422, code: 'CONFLITO_VERSAO_ESTRATEGIA' }
    });
    expect(repository.itens).toHaveLength(1);
  });

  it('expõe criação, versão atual e histórico somente para o usuário autenticado', async () => {
    const estrategiaService = new EstrategiaService(new RepositorioEmMemoria());
    const deps = {
      authService: {
        registrar: async () => { throw new Error('fora do escopo'); },
        login: async () => { throw new Error('fora do escopo'); }
      },
      tokenService: {
        verificar: () => ({ sub: 'u1', perfil: 'ALUNO' as const })
      },
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
      estrategiaService,
      objetivoService: {
        listar: async () => [],
        criar: async () => { throw new Error('fora do escopo'); },
        obterCobertura: async () => { throw new Error('fora do escopo'); },
        obterResumoCobertura: async () => ({ objetivosAlinhados: 0 })
      },
      servicoService: {
        listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
        atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); },
        listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); },
        listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); }
      }
    } satisfies Dependencias;
    const app = criarApp(deps, 'http://localhost:5173');

    const criada = await request(app).post('/api/v1/estrategia').set('authorization', 'Bearer valido').send(completa);
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ versao: 1, perspectiva: completa.perspectiva });

    const atual = await request(app).get('/api/v1/estrategia?organizacaoId=org2').set('authorization', 'Bearer valido');
    expect(atual.status).toBe(200);
    expect(atual.body).toEqual(criada.body);

    const versoes = await request(app).get('/api/v1/estrategia/versoes').set('authorization', 'Bearer valido');
    expect(versoes.status).toBe(200);
    expect(versoes.body).toEqual([criada.body]);

    const organizacaoDoCliente = await request(app).post('/api/v1/estrategia').set('authorization', 'Bearer valido').send({ ...completa, organizacaoId: 'org2' });
    expect(organizacaoDoCliente.status).toBe(422);
  });
});

const db = new PrismaClient();
const emails = ['estrategia-ana@eduitsm.local', 'estrategia-bia@eduitsm.local'];
let usuarios: { ana: string; bia: string };
let bancoSeguro = false;

describe('persistência da estratégia', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    const [ana, bia] = await Promise.all([
      db.usuario.create({ data: { nome: 'Ana Estratégia', email: emails[0]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Ana' } } } }),
      db.usuario.create({ data: { nome: 'Bia Estratégia', email: emails[1]!, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO', organizacao: { create: { nome: 'Organização Bia' } } } })
    ]);
    usuarios = { ana: ana.id, bia: bia.id };
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('persiste max + 1, preserva o histórico e não mistura organizações', async () => {
    const service = new EstrategiaService(new PrismaEstrategiaRepository(db));
    const inicial = await service.salvarNovaVersao(usuarios.ana, { ...completa, plano: null });
    const revisada = await service.salvarNovaVersao(usuarios.ana, completa);
    await service.salvarNovaVersao(usuarios.bia, { ...completa, perspectiva: 'Estratégia de Bia' });

    expect(inicial).toMatchObject({ versao: 1, plano: null });
    expect(revisada).toMatchObject({ versao: 2, plano: completa.plano });
    await expect(service.obterAtual(usuarios.ana)).resolves.toMatchObject({ id: revisada.id, versao: 2 });
    await expect(service.listarVersoes(usuarios.ana)).resolves.toMatchObject([
      { id: revisada.id, versao: 2 },
      { id: inicial.id, versao: 1 }
    ]);
  });
});
