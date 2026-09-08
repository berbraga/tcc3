import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  CustoServicoResultado,
  ServicoRepository
} from './servico.service.js';

export class PrismaServicoRepository implements ServicoRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async listar(organizacaoId: string) {
    return this.db.servico.findMany({ where: { organizacaoId }, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] });
  }

  async criar(organizacaoId: string, input: Parameters<ServicoRepository['criar']>[1]) {
    return this.db.servico.create({
      data: {
        organizacaoId,
        ...input,
        descricao: input.descricao ?? null,
        publicoAlvo: input.publicoAlvo ?? null
      }
    });
  }

  async atualizar(organizacaoId: string, id: string, input: Parameters<ServicoRepository['atualizar']>[2]) {
    const result = await this.db.servico.updateMany({
      where: { id, organizacaoId },
      data: { ...input, descricao: input.descricao ?? null, publicoAlvo: input.publicoAlvo ?? null }
    });
    if (result.count === 0) return null;
    return this.db.servico.findFirst({ where: { id, organizacaoId } });
  }

  async remover(organizacaoId: string, id: string) {
    const servico = await this.db.servico.findFirst({
      where: { id, organizacaoId },
      select: {
        id: true,
        _count: { select: { custos: true, demandas: true, vinculos: true, indicadores: true, registros: true } }
      }
    });
    if (!servico) return 'NAO_ENCONTRADO' as const;
    if (Object.values(servico._count).some((total) => total > 0)) return 'POSSUI_RELACOES' as const;
    try {
      const removido = await this.db.servico.deleteMany({ where: { id, organizacaoId } });
      return removido.count === 0 ? 'NAO_ENCONTRADO' as const : 'REMOVIDO' as const;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') return 'POSSUI_RELACOES' as const;
      throw error;
    }
  }

  async listarCustos(organizacaoId: string, servicoId: string) {
    if (!await this.servicoExiste(organizacaoId, servicoId)) return null;
    const custos = await this.db.custoServico.findMany({ where: { servicoId }, orderBy: [{ periodo: 'asc' }, { id: 'asc' }] });
    return custos.map((custo) => this.mapCusto(custo));
  }

  async adicionarCusto(organizacaoId: string, servicoId: string, input: Parameters<ServicoRepository['adicionarCusto']>[2]) {
    if (!await this.servicoExiste(organizacaoId, servicoId)) return null;
    return this.mapCusto(await this.db.custoServico.create({ data: { servicoId, ...input, valorRealizado: input.valorRealizado ?? null } }));
  }

  async listarDemanda(organizacaoId: string, servicoId: string) {
    if (!await this.servicoExiste(organizacaoId, servicoId)) return null;
    return this.db.demandaCapacidade.findMany({ where: { servicoId }, orderBy: [{ periodo: 'asc' }, { id: 'asc' }] });
  }

  async adicionarDemanda(organizacaoId: string, servicoId: string, input: Parameters<ServicoRepository['adicionarDemanda']>[2]) {
    if (!await this.servicoExiste(organizacaoId, servicoId)) return null;
    return this.db.demandaCapacidade.create({ data: { servicoId, ...input } });
  }

  private async servicoExiste(organizacaoId: string, id: string) {
    return (await this.db.servico.count({ where: { id, organizacaoId } })) > 0;
  }

  private mapCusto(custo: { id: string; servicoId: string; tipo: CustoServicoResultado['tipo']; valorPrevisto: Prisma.Decimal; valorRealizado: Prisma.Decimal | null; periodo: string }): CustoServicoResultado {
    return {
      ...custo,
      valorPrevisto: custo.valorPrevisto.toNumber(),
      valorRealizado: custo.valorRealizado?.toNumber() ?? null
    };
  }
}
