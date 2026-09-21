import { Prisma, type PrismaClient } from '@prisma/client';
import type { CenarioInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';
import { GERADOR_VERSAO, type RegistroSimulado } from './gerador.js';
import type { CenarioRepository } from './cenario.service.js';

export class PrismaCenarioRepository implements CenarioRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    return (await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } }))?.id ?? null;
  }

  async buscarServicos(organizacaoId: string, ids: readonly string[]) {
    return this.db.servico.findMany({
      where: { organizacaoId, id: { in: [...ids] } },
      select: { id: true, nome: true, status: true, indicadores: { select: { id: true, tipo: true } } }
    });
  }

  async persistir(organizacaoId: string, input: CenarioInput, chaveReproducao: string, servicoIdsEmOperacao: readonly string[], registros: readonly RegistroSimulado[], medicoes: readonly { indicadorId: string; valor: number; denominador: number }[]) {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(CAST(${organizacaoId} AS text) || ':' || ${chaveReproducao}, 0))`);
      const existente = await tx.cenarioSimulacao.findUnique({
        where: { organizacaoId_chaveReproducao: { organizacaoId, chaveReproducao } },
        include: { _count: { select: { registros: true, medicoes: true } } }
      });
      if (existente) return { cenario: existente, reutilizado: true, registrosGerados: existente._count.registros, medicoesGeradas: existente._count.medicoes };

      const servicos = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "servico"
        WHERE "organizacao_id" = CAST(${organizacaoId} AS uuid)
          AND "id" IN (${Prisma.join(servicoIdsEmOperacao.map((id) => Prisma.sql`CAST(${id} AS uuid)`))})
          AND "status" = 'EM_OPERACAO'
        FOR UPDATE
      `);
      if (servicos.length !== servicoIdsEmOperacao.length) throw new AppError(422, 'SERVICO_NAO_DISPONIVEL', 'Um serviço selecionado não está mais em operação.');
      const cenario = await tx.cenarioSimulacao.create({ data: {
        organizacaoId, semente: input.semente, periodoInicio: new Date(`${input.periodoInicio}T00:00:00.000Z`), periodoFim: new Date(`${input.periodoFim}T00:00:00.000Z`), volumeRegistros: input.volumeRegistros, perfil: input.perfil, geradorVersao: GERADOR_VERSAO, chaveReproducao
      } });
      await tx.registroOperacional.createMany({ data: registros.map((registro) => ({ ...registro, cenarioId: cenario.id })) });
      const periodoRef = new Date(`${input.periodoFim}T00:00:00.000Z`);
      if (medicoes.length > 0) await tx.medicao.createMany({ data: medicoes.map((medicao) => ({ ...medicao, periodoRef, cenarioId: cenario.id, origem: 'SIMULADO' })) });
      return { cenario, reutilizado: false, registrosGerados: registros.length, medicoesGeradas: medicoes.length };
    });
  }

  async obterPainel(organizacaoId: string, periodo?: string, cenarioId?: string) {
    const mes = periodo ? limitesDoMes(periodo) : undefined;
    const cenarios = await this.db.cenarioSimulacao.findMany({
      where: { organizacaoId, ...(cenarioId ? { id: cenarioId } : {}), ...(mes ? { periodoFim: mes } : {}) },
      orderBy: [{ periodoFim: 'asc' }, { criadoEm: 'asc' }],
      select: { id: true, semente: true, perfil: true, periodoInicio: true, periodoFim: true, geradorVersao: true, registros: { distinct: ['servicoId'], select: { servicoId: true } } }
    });
    if (cenarios.length === 0) return [];
    const idsDosCenarios = cenarios.map((cenario) => cenario.id);
    const idsDosServicos = [...new Set(cenarios.flatMap((cenario) => cenario.registros.map((registro) => registro.servicoId)))];
    const indicadores = await this.db.indicador.findMany({
      where: { servicoId: { in: idsDosServicos }, servico: { organizacaoId, status: 'EM_OPERACAO' } },
      select: { id: true, nome: true, tipo: true, unidade: true, meta: true, sentido: true, servico: { select: { id: true, nome: true } } }
    });
    const medicoes = await this.db.medicao.findMany({
      where: { origem: 'SIMULADO', cenarioId: { in: idsDosCenarios }, indicador: { servico: { organizacaoId, status: 'EM_OPERACAO' } } },
      orderBy: [{ periodoRef: 'asc' }, { cenario: { criadoEm: 'asc' } }, { indicador: { nome: 'asc' } }],
      select: {
        valor: true, denominador: true, cenarioId: true, indicadorId: true
      }
    });
    const porCenarioIndicador = new Map(medicoes.flatMap((medicao) => medicao.cenarioId === null ? [] : [[`${medicao.cenarioId}:${medicao.indicadorId}`, medicao] as const]));
    return cenarios.flatMap((cenario) => {
      const servicosDoCenario = new Set(cenario.registros.map((registro) => registro.servicoId));
      return indicadores.filter((indicador) => servicosDoCenario.has(indicador.servico.id)).map((indicador) => {
        const medicao = porCenarioIndicador.get(`${cenario.id}:${indicador.id}`);
        return {
          periodo: cenario.periodoFim.toISOString().slice(0, 7), cenarioId: cenario.id,
          cenario: { semente: cenario.semente, perfil: cenario.perfil, periodoInicio: cenario.periodoInicio.toISOString().slice(0, 10), periodoFim: cenario.periodoFim.toISOString().slice(0, 10), geradorVersao: cenario.geradorVersao },
          servicoId: indicador.servico.id, nomeServico: indicador.servico.nome, indicadorId: indicador.id, nome: indicador.nome, tipo: indicador.tipo, unidade: indicador.unidade, meta: indicador.meta.toNumber(), sentido: indicador.sentido,
          valor: medicao?.valor.toNumber() ?? null, denominador: medicao?.denominador ?? 0
        };
      });
    });
  }
}

function limitesDoMes(periodo: string) {
  const [ano, mes] = periodo.split('-').map(Number);
  return { gte: new Date(Date.UTC(ano!, mes! - 1, 1)), lt: new Date(Date.UTC(ano!, mes!, 1)) };
}
