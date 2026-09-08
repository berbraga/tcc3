import type { PrismaClient } from '@prisma/client';
import type { CenarioInput } from '@eduitsm/shared';
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

  async persistir(organizacaoId: string, input: CenarioInput, registros: RegistroSimulado[], medicoes: { indicadorId: string; valor: number }[]) {
    return this.db.$transaction(async (tx) => {
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

  async obterPainel(organizacaoId: string) {
    const indicadores = await this.db.indicador.findMany({
      where: { servico: { organizacaoId, status: 'EM_OPERACAO' }, medicoes: { some: {} } },
      orderBy: [{ servico: { nome: 'asc' } }, { nome: 'asc' }],
      select: {
        id: true, nome: true, tipo: true, unidade: true, meta: true, sentido: true,
        servico: { select: { id: true, nome: true } },
        medicoes: { select: { valor: true } }
      }
    });
    return indicadores.map((indicador) => ({
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
