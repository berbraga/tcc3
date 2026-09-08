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
