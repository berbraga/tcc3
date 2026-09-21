import type { PrismaClient } from '@prisma/client';
import { normalizarEstrategia } from '@eduitsm/shared';
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
      await tx.$queryRaw`SELECT id FROM organizacao WHERE id = ${organizacaoId}::uuid FOR UPDATE`;
      const atual = await tx.estrategiaServico.findFirst({
        where: { organizacaoId },
        orderBy: { versao: 'desc' }
      });
      const estrategia = normalizarEstrategia(input);
      if (atual && atual.perspectiva === estrategia.perspectiva && atual.posicao === estrategia.posicao
        && atual.plano === estrategia.plano && atual.padrao === estrategia.padrao) return atual;
      return tx.estrategiaServico.create({ data: { organizacaoId, ...estrategia, versao: (atual?.versao ?? 0) + 1 } });
    });
  }
}
