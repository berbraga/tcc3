import type { PrismaClient } from '@prisma/client';
import type { RelatorioEstrategiaRepository } from './relatorio.service.js';

export class PrismaRelatorioEstrategiaRepository implements RelatorioEstrategiaRepository {
  constructor(private db: PrismaClient) {}

  async buscarPorUsuario(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({
      where: { usuarioId },
      select: {
        nome: true, setor: true, descricao: true,
        estrategias: { orderBy: { versao: 'desc' }, take: 1, select: { versao: true, atualizadaEm: true, perspectiva: true, posicao: true, plano: true, padrao: true } },
        objetivos: { orderBy: { codigo: 'asc' }, select: { codigo: true, descricao: true, prazo: true, status: true } },
        servicos: {
          orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
          select: {
            nome: true, descricao: true, publicoAlvo: true, status: true,
            vinculos: { orderBy: { id: 'asc' }, select: { justificativaValor: true, contribuicao: true, objetivo: { select: { codigo: true } } } },
            indicadores: { orderBy: { id: 'asc' }, select: { nome: true, tipo: true, unidade: true, meta: true, sentido: true } }
          }
        }
      }
    });
    if (!organizacao) return null;
    const estrategia = organizacao.estrategias[0] ?? null;
    return {
      organizacao: { nome: organizacao.nome, setor: organizacao.setor, descricao: organizacao.descricao },
      estrategia,
      objetivos: organizacao.objetivos,
      servicos: organizacao.servicos.map((servico) => ({
        ...servico,
        vinculos: servico.vinculos.map((vinculo) => ({ objetivoCodigo: vinculo.objetivo.codigo, justificativaValor: vinculo.justificativaValor, contribuicao: vinculo.contribuicao.toNumber() })),
        indicadores: servico.indicadores.map((indicador) => ({ ...indicador, meta: indicador.meta.toNumber() }))
      }))
    };
  }
}
