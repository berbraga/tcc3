import { Prisma, type PrismaClient } from '@prisma/client';
import type { ObjetivoRepository } from './objetivo.service.js';

export class PrismaObjetivoRepository implements ObjetivoRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async listar(organizacaoId: string) {
    return this.db.objetivoEstrategico.findMany({ where: { organizacaoId }, orderBy: { codigo: 'asc' } });
  }

  async criar(organizacaoId: string, input: Parameters<ObjetivoRepository['criar']>[1]) {
    return this.db.objetivoEstrategico.create({
      data: { organizacaoId, ...input, prazo: input.prazo ? new Date(input.prazo) : null }
    });
  }

  async atualizar(organizacaoId: string, id: string, input: Parameters<ObjetivoRepository['atualizar']>[2]) {
    const result = await this.db.objetivoEstrategico.updateMany({
      where: { id, organizacaoId },
      data: { ...input, prazo: input.prazo ? new Date(input.prazo) : null }
    });
    if (result.count === 0) return null;
    return this.db.objetivoEstrategico.findFirst({ where: { id, organizacaoId } });
  }

  async remover(organizacaoId: string, id: string) {
    const objetivo = await this.db.objetivoEstrategico.findFirst({
      where: { id, organizacaoId },
      select: { id: true, _count: { select: { vinculos: true, indicadores: true } } }
    });
    if (!objetivo) return 'NAO_ENCONTRADO' as const;
    if (objetivo._count.vinculos > 0 || objetivo._count.indicadores > 0) return 'POSSUI_RELACOES' as const;
    const result = await this.db.objetivoEstrategico.deleteMany({ where: { id, organizacaoId } });
    return result.count === 0 ? 'NAO_ENCONTRADO' as const : 'REMOVIDO' as const;
  }

  async contarObjetivosAlinhados(organizacaoId: string) {
    return this.db.objetivoEstrategico.count({ where: { organizacaoId, vinculos: { some: {} } } });
  }

  async obterCobertura(organizacaoId: string, id: string) {
    const objetivo = await this.db.objetivoEstrategico.findFirst({
      where: { id, organizacaoId },
      select: { id: true, vinculos: { select: { contribuicao: true } } }
    });
    if (!objetivo) return null;
    return {
      objetivoId: objetivo.id,
      servicosVinculados: objetivo.vinculos.length,
      cobertura: objetivo.vinculos.reduce((total, vinculo) => total.plus(vinculo.contribuicao), new Prisma.Decimal(0)).toNumber()
    };
  }
}
