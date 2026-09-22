import type { PrismaClient } from '@prisma/client';
import type { RelatorioEstrategiaRepository } from './relatorio.service.js';

export class PrismaRelatorioEstrategiaRepository implements RelatorioEstrategiaRepository {
  constructor(private db: PrismaClient) {}

  async buscarPorUsuario(usuarioId: string) {
    return this.buscar({ usuarioId });
  }

  async buscarPorOrganizacaoAluno(organizacaoId: string) {
    return this.buscar({ id: organizacaoId, usuario: { perfil: 'ALUNO' } });
  }

  private async buscar(where: { usuarioId: string } | { id: string; usuario: { perfil: 'ALUNO' } }) {
    const organizacao = await this.db.organizacao.findFirst({
      where,
      select: {
        nome: true, setor: true, descricao: true,
        analises: { orderBy: [{ categoria: 'asc' }, { id: 'asc' }], select: { tipo: true, categoria: true, descricao: true, impacto: true } },
        estrategias: { orderBy: { versao: 'desc' }, take: 1, select: { versao: true, atualizadaEm: true, perspectiva: true, posicao: true, plano: true, padrao: true } },
        objetivos: { orderBy: { codigo: 'asc' }, select: { codigo: true, descricao: true, prazo: true, status: true } },
        servicos: {
          orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
          select: {
            nome: true, descricao: true, publicoAlvo: true, status: true,
            vinculos: { orderBy: { id: 'asc' }, select: { justificativaValor: true, contribuicao: true, objetivo: { select: { codigo: true } }, indicador: { select: { nome: true, tipo: true, unidade: true } } } },
            indicadores: {
              orderBy: { id: 'asc' },
              select: {
                nome: true, tipo: true, unidade: true, meta: true, sentido: true,
                medicoes: {
                  orderBy: [{ periodoRef: 'desc' }, { id: 'desc' }],
                  select: {
                    periodoRef: true, valor: true, denominador: true, origem: true,
                    cenario: { select: { id: true, semente: true, perfil: true, geradorVersao: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!organizacao) return null;
    const estrategia = organizacao.estrategias[0] ?? null;
    return {
      organizacao: { nome: organizacao.nome, setor: organizacao.setor, descricao: organizacao.descricao },
      analises: organizacao.analises,
      estrategia,
      objetivos: organizacao.objetivos,
      servicos: organizacao.servicos.map((servico) => ({
        ...servico,
        vinculos: servico.vinculos.map((vinculo) => ({ objetivoCodigo: vinculo.objetivo.codigo, justificativaValor: vinculo.justificativaValor, contribuicao: vinculo.contribuicao.toNumber(), indicador: vinculo.indicador })),
        indicadores: servico.indicadores.map((indicador) => ({
          ...indicador,
          meta: indicador.meta.toNumber(),
          medicoes: indicador.medicoes.map((medicao) => ({ ...medicao, valor: medicao.valor.toNumber() }))
        }))
      }))
    };
  }
}
