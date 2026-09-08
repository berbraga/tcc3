import { describe, expect, it } from 'vitest';
import {
  custoServicoSchema,
  demandaCapacidadeSchema,
  servicoSchema,
  type CustoServicoInput,
  type DemandaCapacidadeInput,
  type ServicoInput
} from '@eduitsm/shared';
import {
  ServicoService,
  type CustoServicoResultado,
  type DemandaCapacidadeResultado,
  type ServicoRepository,
  type ServicoResultado
} from '../src/modules/servicos/servico.service.js';

const servico: ServicoInput = {
  nome: 'Portal de vendas',
  descricao: 'Canal digital para clientes corporativos',
  publicoAlvo: 'Clientes B2B',
  status: 'EM_OPERACAO'
};

class RepositorioEmMemoria implements ServicoRepository {
  servicos: ServicoResultado[] = [];
  custos: CustoServicoResultado[] = [];
  demandas: DemandaCapacidadeResultado[] = [];
  organizacoes: Record<string, string> = { u1: 'org1', u2: 'org2' };
  private proximoId = 1;

  async buscarOrganizacaoId(usuarioId: string) {
    return this.organizacoes[usuarioId] ?? null;
  }

  async listar(organizacaoId: string) {
    return this.servicos.filter((item) => item.organizacaoId === organizacaoId);
  }

  async criar(organizacaoId: string, input: ServicoInput) {
    const criado = {
      id: `00000000-0000-4000-8000-${String(this.proximoId++).padStart(12, '0')}`,
      organizacaoId,
      ...input,
      descricao: input.descricao ?? null,
      publicoAlvo: input.publicoAlvo ?? null,
      criadoEm: new Date('2026-09-08T00:00:00.000Z')
    };
    this.servicos.push(criado);
    return criado;
  }

  async atualizar(organizacaoId: string, id: string, input: ServicoInput) {
    const index = this.servicos.findIndex((item) => item.id === id && item.organizacaoId === organizacaoId);
    if (index < 0) return null;
    const atualizado = {
      ...this.servicos[index]!,
      ...input,
      descricao: input.descricao ?? null,
      publicoAlvo: input.publicoAlvo ?? null
    };
    this.servicos[index] = atualizado;
    return atualizado;
  }

  async remover(organizacaoId: string, id: string) {
    const index = this.servicos.findIndex((item) => item.id === id && item.organizacaoId === organizacaoId);
    if (index < 0) return 'NAO_ENCONTRADO' as const;
    if (this.custos.some((item) => item.servicoId === id) || this.demandas.some((item) => item.servicoId === id)) {
      return 'POSSUI_RELACOES' as const;
    }
    this.servicos.splice(index, 1);
    return 'REMOVIDO' as const;
  }

  async listarCustos(organizacaoId: string, servicoId: string) {
    if (!this.pertence(servicoId, organizacaoId)) return null;
    return this.custos.filter((item) => item.servicoId === servicoId);
  }

  async adicionarCusto(organizacaoId: string, servicoId: string, input: CustoServicoInput) {
    if (!this.pertence(servicoId, organizacaoId)) return null;
    const custo = { id: `c${this.custos.length + 1}`, servicoId, ...input, valorRealizado: input.valorRealizado ?? null };
    this.custos.push(custo);
    return custo;
  }

  async listarDemanda(organizacaoId: string, servicoId: string) {
    if (!this.pertence(servicoId, organizacaoId)) return null;
    return this.demandas.filter((item) => item.servicoId === servicoId);
  }

  async adicionarDemanda(organizacaoId: string, servicoId: string, input: DemandaCapacidadeInput) {
    if (!this.pertence(servicoId, organizacaoId)) return null;
    const demanda = { id: `d${this.demandas.length + 1}`, servicoId, ...input };
    this.demandas.push(demanda);
    return demanda;
  }

  private pertence(servicoId: string, organizacaoId: string) {
    return this.servicos.some((item) => item.id === servicoId && item.organizacaoId === organizacaoId);
  }
}

describe('Serviço de portfólio', () => {
  it('valida contratos sem aceitar organização do cliente ou valores inválidos', () => {
    expect(servicoSchema.parse(servico)).toEqual(servico);
    expect(servicoSchema.safeParse({ ...servico, organizacaoId: 'org2' }).success).toBe(false);
    expect(servicoSchema.safeParse({ ...servico, status: 'DESCONHECIDO' }).success).toBe(false);

    expect(custoServicoSchema.safeParse({ tipo: 'CAPEX', valorPrevisto: 150_000, valorRealizado: 145_000, periodo: '2026-09' }).success).toBe(true);
    expect(custoServicoSchema.safeParse({ tipo: 'OPEX', valorPrevisto: 15_000, valorRealizado: null, periodo: '2026-10' }).success).toBe(true);
    expect(custoServicoSchema.safeParse({ tipo: 'CAPEX', valorPrevisto: -0.01, periodo: '2026-09' }).success).toBe(false);
    expect(custoServicoSchema.safeParse({ tipo: 'OPEX', valorPrevisto: 1, valorRealizado: -1, periodo: '2026-09' }).success).toBe(false);

    expect(demandaCapacidadeSchema.safeParse({ periodo: '2026-09', demandaPrevista: 10_000, capacidadeInstalada: 8_000, unidade: 'transações/mês' }).success).toBe(true);
    expect(demandaCapacidadeSchema.safeParse({ periodo: 'setembro', demandaPrevista: 1, capacidadeInstalada: 1, unidade: 'chamados' }).success).toBe(false);
    expect(demandaCapacidadeSchema.safeParse({ periodo: '2026-09', demandaPrevista: -1, capacidadeInstalada: 1.5, unidade: '' }).success).toBe(false);
  });

  it('executa CRUD somente na organização derivada do usuário autenticado', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new ServicoService(repository);
    const criado = await service.criar('u1', servico);
    await service.criar('u2', { ...servico, nome: 'Serviço estrangeiro' });

    await expect(service.listar('u1')).resolves.toEqual([criado]);
    const atualizado = await service.atualizar('u1', criado.id, { ...servico, nome: 'Portal corporativo' });
    expect(atualizado.nome).toBe('Portal corporativo');
    await expect(service.atualizar('u2', criado.id, servico)).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(service.remover('u2', criado.id)).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });

    await expect(service.remover('u1', criado.id)).resolves.toBeUndefined();
    await expect(service.listar('u1')).resolves.toEqual([]);
  });

  it('registra CAPEX/OPEX e demanda somente em serviço da própria organização', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new ServicoService(repository);
    const criado = await service.criar('u1', servico);

    const capex = await service.adicionarCusto('u1', criado.id, { tipo: 'CAPEX', valorPrevisto: 150_000, valorRealizado: 149_500, periodo: '2026-09' });
    const opex = await service.adicionarCusto('u1', criado.id, { tipo: 'OPEX', valorPrevisto: 15_000, valorRealizado: null, periodo: '2026-09' });
    await expect(service.listarCustos('u1', criado.id)).resolves.toEqual([capex, opex]);

    const demanda = await service.adicionarDemanda('u1', criado.id, {
      periodo: '2026-09', demandaPrevista: 10_000, capacidadeInstalada: 8_000, unidade: 'transações/mês'
    });
    await expect(service.listarDemanda('u1', criado.id)).resolves.toEqual([demanda]);

    await expect(service.adicionarCusto('u2', criado.id, { tipo: 'OPEX', valorPrevisto: 1, periodo: '2026-09' })).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(service.listarDemanda('u2', criado.id)).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });
  });

  it('bloqueia exclusão com relações e mantém serviço descontinuado no histórico', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new ServicoService(repository);
    const criado = await service.criar('u1', servico);
    await service.adicionarCusto('u1', criado.id, { tipo: 'CAPEX', valorPrevisto: 100, periodo: '2026-09' });

    await expect(service.remover('u1', criado.id)).rejects.toMatchObject({ status: 422, code: 'SERVICO_POSSUI_RELACOES' });
    await service.atualizar('u1', criado.id, { ...servico, status: 'DESCONTINUADO' });
    await expect(service.listar('u1')).resolves.toEqual([expect.objectContaining({ id: criado.id, status: 'DESCONTINUADO' })]);
  });
});
