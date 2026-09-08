import { Prisma, type PrismaClient } from '@prisma/client';
import type { CenarioInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';
import type { CenarioRepository } from './cenario.service.js';
import type { RegistroSimulado } from './gerador.js';

export class PrismaCenarioRepository implements CenarioRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    return (await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } }))?.id ?? null;
  }

  async buscarServicos(organizacaoId: string, ids: readonly string[]) {
    return this.db.servico.findMany({
      where: { organizacaoId, id: { in: [...ids] } },
      select: { id: true, status: true, indicadores: { select: { id: true, tipo: true } } }
    });
  }

  async persistir(organizacaoId: string, input: CenarioInput, servicoIdsEmOperacao: readonly string[], registros: RegistroSimulado[], medicoes: { indicadorId: string; valor: number }[]) {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(CAST(${organizacaoId} AS text) || ':' || CAST(${input.periodoFim} AS text), 0))`);
      const servicos = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "servico"
        WHERE "organizacao_id" = CAST(${organizacaoId} AS uuid)
          AND "id" IN (${Prisma.join(servicoIdsEmOperacao.map((id) => Prisma.sql`CAST(${id} AS uuid)`))})
          AND "status" = 'EM_OPERACAO'
        FOR UPDATE
      `);
      if (servicos.length !== servicoIdsEmOperacao.length) {
        throw new AppError(422, 'SERVICO_NAO_DISPONIVEL', 'Um serviço selecionado não está mais em operação.');
      }
      const cenario = await tx.cenarioSimulacao.create({ data: {
        organizacaoId,
        semente: input.semente,
        periodoInicio: new Date(`${input.periodoInicio}T00:00:00.000Z`),
        periodoFim: new Date(`${input.periodoFim}T00:00:00.000Z`),
        volumeRegistros: input.volumeRegistros,
        perfil: input.perfil
      } });
      await tx.registroOperacional.createMany({ data: registros.map((registro) => ({ ...registro, cenarioId: cenario.id })) });
      const periodoRef = new Date(`${input.periodoFim}T00:00:00.000Z`);
      await tx.medicao.deleteMany({
        where: {
          periodoRef,
          origem: 'SIMULADO',
          indicador: { servico: { organizacaoId } },
          ...(medicoes.length === 0 ? {} : { indicadorId: { notIn: medicoes.map((medicao) => medicao.indicadorId) } })
        }
      });
      for (const medicao of medicoes) {
        await tx.medicao.upsert({
          where: { indicadorId_periodoRef: { indicadorId: medicao.indicadorId, periodoRef } },
          create: { indicadorId: medicao.indicadorId, periodoRef, valor: medicao.valor, origem: 'SIMULADO' },
          update: { valor: medicao.valor, origem: 'SIMULADO' }
        });
      }
      return cenario;
    });
  }

  async obterPainel(organizacaoId: string, periodo?: string) {
    const mes = periodo ? limitesDoMes(periodo) : undefined;
    const indicadores = await this.db.indicador.findMany({
      where: { servico: { organizacaoId, status: 'EM_OPERACAO' }, medicoes: { some: mes ? { periodoRef: mes } : {} } },
      orderBy: [{ servico: { nome: 'asc' } }, { nome: 'asc' }],
      select: {
        id: true, nome: true, tipo: true, unidade: true, meta: true, sentido: true,
        servico: { select: { id: true, nome: true } },
        medicoes: { where: mes ? { periodoRef: mes } : {}, select: { valor: true } }
      }
    });
    return indicadores.map((indicador) => ({
      periodo: periodo ?? null,
      servicoId: indicador.servico.id,
      nomeServico: indicador.servico.nome,
      indicadorId: indicador.id,
      nome: indicador.nome,
      tipo: indicador.tipo,
      unidade: indicador.unidade,
      meta: indicador.meta.toNumber(),
      sentido: indicador.sentido,
      valores: indicador.medicoes.map((medicao) => medicao.valor.toNumber())
    }));
  }
}

function limitesDoMes(periodo: string) {
  const [ano, mes] = periodo.split('-').map(Number);
  return { gte: new Date(Date.UTC(ano!, mes! - 1, 1)), lt: new Date(Date.UTC(ano!, mes!, 1)) };
}
