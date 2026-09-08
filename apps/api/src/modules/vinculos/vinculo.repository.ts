import { Prisma, type PrismaClient } from '@prisma/client';
import type { VinculoRepository } from './vinculo.service.js';

export class PrismaVinculoRepository implements VinculoRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async buscarServico(organizacaoId: string, id: string) {
    return this.db.servico.findFirst({ where: { id, organizacaoId }, select: { id: true, organizacaoId: true, nome: true, status: true } });
  }

  async objetivoExiste(organizacaoId: string, id: string) {
    return (await this.db.objetivoEstrategico.count({ where: { id, organizacaoId } })) > 0;
  }

  async listar(organizacaoId: string) {
    const vinculos = await this.db.vinculoEstrategico.findMany({
      where: { servico: { organizacaoId } },
      orderBy: { id: 'asc' }
    });
    return vinculos.map((vinculo) => ({ ...vinculo, contribuicao: vinculo.contribuicao.toNumber() }));
  }

  async criarComLimite(organizacaoId: string, input: Parameters<VinculoRepository['criarComLimite']>[1]) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM objetivo_estrategico WHERE id = ${input.objetivoId}::uuid AND organizacao_id = ${organizacaoId}::uuid FOR UPDATE`;
      const total = await tx.vinculoEstrategico.aggregate({
        where: { objetivoId: input.objetivoId, objetivo: { organizacaoId } },
        _sum: { contribuicao: true }
      });
      const saldoDisponivel = Number((100 - (total._sum.contribuicao ?? new Prisma.Decimal(0)).toNumber()).toFixed(2));
      if (input.contribuicao > saldoDisponivel) return { saldoDisponivel };
      const vinculo = await tx.vinculoEstrategico.create({ data: input });
      return { ...vinculo, contribuicao: vinculo.contribuicao.toNumber() };
    });
  }

  async remover(organizacaoId: string, id: string) {
    const result = await this.db.vinculoEstrategico.deleteMany({ where: { id, servico: { organizacaoId } } });
    return result.count > 0;
  }

  async listarPendencias(organizacaoId: string) {
    return this.db.servico.findMany({
      where: { organizacaoId, status: 'EM_OPERACAO', vinculos: { none: {} } },
      select: { id: true, organizacaoId: true, nome: true, status: true },
      orderBy: { id: 'asc' }
    });
  }
}
