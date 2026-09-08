import type { PrismaClient } from '@prisma/client';
import type { IndicadorRepository } from './indicador.service.js';

export class PrismaIndicadorRepository implements IndicadorRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async buscarServico(organizacaoId: string, id: string) {
    return this.db.servico.findFirst({ where: { id, organizacaoId }, select: { id: true, organizacaoId: true, status: true } });
  }

  async objetivoExiste(organizacaoId: string, id: string) {
    return (await this.db.objetivoEstrategico.count({ where: { id, organizacaoId } })) > 0;
  }

  async listarPorServico(organizacaoId: string, servicoId: string) {
    if (!await this.buscarServico(organizacaoId, servicoId)) return null;
    const indicadores = await this.db.indicador.findMany({ where: { servicoId }, orderBy: { id: 'asc' } });
    return indicadores.map((indicador) => ({ ...indicador, meta: indicador.meta.toNumber() }));
  }

  async criar(_organizacaoId: string, servicoId: string, input: Parameters<IndicadorRepository['criar']>[2]) {
    const indicador = await this.db.indicador.create({ data: { servicoId, ...input, objetivoId: input.objetivoId ?? null } });
    return { ...indicador, meta: indicador.meta.toNumber() };
  }

  async atualizar(organizacaoId: string, id: string, input: Parameters<IndicadorRepository['atualizar']>[2]) {
    const result = await this.db.indicador.updateMany({
      where: { id, servico: { organizacaoId } },
      data: { ...input, objetivoId: input.objetivoId ?? null }
    });
    if (result.count === 0) return null;
    const indicador = await this.db.indicador.findFirst({ where: { id, servico: { organizacaoId } } });
    return indicador && { ...indicador, meta: indicador.meta.toNumber() };
  }

  async remover(organizacaoId: string, id: string) {
    const result = await this.db.indicador.deleteMany({ where: { id, servico: { organizacaoId } } });
    return result.count > 0;
  }
}
