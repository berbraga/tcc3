import type { PrismaClient } from '@prisma/client';
import type { EstrategiaRepository } from './estrategia.service.js';

export class PrismaEstrategiaRepository implements EstrategiaRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async obterAtual(organizacaoId: string) {
    return this.db.estrategiaServico.findFirst({ where: { organizacaoId }, orderBy: { versao: 'desc' } });
  }

  async listarVersoes(organizacaoId: string) {
    return this.db.estrategiaServico.findMany({ where: { organizacaoId }, orderBy: { versao: 'desc' } });
  }

  async salvarNovaVersao(organizacaoId: string, input: Parameters<EstrategiaRepository['salvarNovaVersao']>[1]) {
    return this.db.$transaction(async (tx) => {
      const atual = await tx.estrategiaServico.findFirst({
        where: { organizacaoId },
        orderBy: { versao: 'desc' },
        select: { versao: true }
      });
      return tx.estrategiaServico.create({ data: { organizacaoId, ...input, versao: (atual?.versao ?? 0) + 1 } });
    });
  }
}
