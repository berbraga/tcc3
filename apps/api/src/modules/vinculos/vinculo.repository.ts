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

  async servicoExiste(id: string) {
    return (await this.db.servico.count({ where: { id } })) > 0;
  }

  async objetivoExiste(organizacaoId: string, id: string) {
    return (await this.db.objetivoEstrategico.count({ where: { id, organizacaoId } })) > 0;
  }

  async objetivoExisteGlobalmente(id: string) {
    return (await this.db.objetivoEstrategico.count({ where: { id } })) > 0;
  }

  async buscarIndicador(organizacaoId: string, id: string) {
    const indicador = await this.db.indicador.findFirst({
      where: { id, servico: { organizacaoId } },
      select: { id: true, servicoId: true, objetivoId: true, nome: true, tipo: true, unidade: true, servico: { select: { organizacaoId: true } } }
    });
    return indicador && {
      id: indicador.id,
      organizacaoId: indicador.servico.organizacaoId,
      servicoId: indicador.servicoId,
      objetivoId: indicador.objetivoId,
      nome: indicador.nome,
      tipo: indicador.tipo,
      unidade: indicador.unidade
    };
  }

  async indicadorExiste(id: string) {
    return (await this.db.indicador.count({ where: { id } })) > 0;
  }

  async listar(organizacaoId: string) {
    const vinculos = await this.db.vinculoEstrategico.findMany({
      where: { servico: { organizacaoId } },
      orderBy: { id: 'asc' },
      include: { indicador: { select: { id: true, nome: true, tipo: true, unidade: true } } }
    });
    return vinculos.map((vinculo) => ({ ...vinculo, contribuicao: vinculo.contribuicao.toNumber() }));
  }

  async criarComLimite(organizacaoId: string, input: Parameters<VinculoRepository['criarComLimite']>[1]) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM objetivo_estrategico WHERE id = ${input.objetivoId}::uuid AND organizacao_id = ${organizacaoId}::uuid FOR UPDATE`;
      if (input.indicadorId) {
        const indicador = await tx.indicador.findFirst({
          where: { id: input.indicadorId, servico: { organizacaoId } },
          select: { servicoId: true, objetivoId: true }
        });
        if (!indicador) throw Object.assign(new Error('Indicador não encontrado.'), { code: 'INDICADOR_NAO_ENCONTRADO' });
        if (indicador.servicoId !== input.servicoId) throw Object.assign(new Error('Indicador pertence a outro serviço.'), { code: 'INDICADOR_SERVICO_INCOMPATIVEL' });
        if (indicador.objetivoId && indicador.objetivoId !== input.objetivoId) throw Object.assign(new Error('Indicador associado a outro objetivo.'), { code: 'INDICADOR_OBJETIVO_INCOMPATIVEL' });
      }
      const total = await tx.vinculoEstrategico.aggregate({
        where: { objetivoId: input.objetivoId, objetivo: { organizacaoId } },
        _sum: { contribuicao: true }
      });
      const saldoDisponivel = Number((100 - (total._sum.contribuicao ?? new Prisma.Decimal(0)).toNumber()).toFixed(2));
      if (input.contribuicao > saldoDisponivel) return { saldoDisponivel };
      const vinculo = await tx.vinculoEstrategico.create({
        data: input,
        include: { indicador: { select: { id: true, nome: true, tipo: true, unidade: true } } }
      });
      return { ...vinculo, contribuicao: vinculo.contribuicao.toNumber() };
    });
  }

  async remover(organizacaoId: string, id: string) {
    const result = await this.db.vinculoEstrategico.deleteMany({ where: { id, servico: { organizacaoId } } });
    return result.count > 0;
  }

  async listarPendencias(organizacaoId: string) {
    return this.db.servico.findMany({
      where: { organizacaoId, vinculos: { none: {} } },
      select: { id: true, organizacaoId: true, nome: true, status: true },
      orderBy: { id: 'asc' }
    });
  }
}
