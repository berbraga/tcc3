import {
  estrategiaCompleta,
  relatorioEstrategiaExportacao,
  type EstrategiaInput,
  type RelatorioEstrategia
} from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

type EstrategiaDoRelatorio = EstrategiaInput & { versao: number; atualizadaEm: Date };

export interface RelatorioEstrategiaResultado {
  organizacao: { nome: string; setor: string | null; descricao: string | null };
  estrategia: EstrategiaDoRelatorio | null;
  objetivos: { codigo: string; descricao: string; prazo: Date | null; status: string }[];
  servicos: {
    nome: string; descricao: string | null; publicoAlvo: string | null; status: string;
    vinculos: { objetivoCodigo: string; justificativaValor: string; contribuicao: number }[];
    indicadores: {
      nome: string; tipo: string; unidade: string; meta: number; sentido: string;
      medicoes: { periodoRef: Date; valor: number; denominador: number; origem: string; cenario: { id: string; semente: number; perfil: string; geradorVersao: string } | null }[];
    }[];
  }[];
}

export interface RelatorioEstrategiaRepository {
  buscarPorUsuario(usuarioId: string): Promise<RelatorioEstrategiaResultado | null>;
  buscarPorOrganizacaoAluno(organizacaoId: string): Promise<RelatorioEstrategiaResultado | null>;
}

export class RelatorioEstrategiaService {
  constructor(private repository: RelatorioEstrategiaRepository) {}

  async obter(usuarioId: string): Promise<RelatorioEstrategia> {
    return this.formatar(await this.buscar(usuarioId));
  }

  async exportar(usuarioId: string) {
    const relatorio = this.formatar(await this.buscar(usuarioId));
    if (!relatorio.estrategia || !estrategiaCompleta(relatorio.estrategia)) {
      throw new AppError(422, 'ESTRATEGIA_INCOMPLETA', 'Preencha os quatro Ps antes de exportar o relatório.');
    }
    return { ...relatorioEstrategiaExportacao, conteudo: renderizarHtml(relatorio) };
  }

  async obterParaProfessor(organizacaoId: string): Promise<RelatorioEstrategia> {
    const relatorio = await this.repository.buscarPorOrganizacaoAluno(organizacaoId);
    if (!relatorio) throw new AppError(404, 'AMBIENTE_ALUNO_NAO_ENCONTRADO', 'Ambiente de aluno não encontrado.');
    return this.formatar(relatorio);
  }

  private async buscar(usuarioId: string) {
    const relatorio = await this.repository.buscarPorUsuario(usuarioId);
    if (!relatorio) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return relatorio;
  }

  private formatar(relatorio: RelatorioEstrategiaResultado): RelatorioEstrategia {
    return {
      ...relatorio,
      estrategia: relatorio.estrategia && {
        ...relatorio.estrategia,
        atualizadaEm: relatorio.estrategia.atualizadaEm.toISOString(),
        perspectiva: relatorio.estrategia.perspectiva ?? '',
        posicao: relatorio.estrategia.posicao ?? '',
        plano: relatorio.estrategia.plano ?? '',
        padrao: relatorio.estrategia.padrao ?? ''
      },
      objetivos: relatorio.objetivos.map((objetivo) => ({ ...objetivo, prazo: objetivo.prazo?.toISOString().slice(0, 10) ?? null })),
      servicos: relatorio.servicos.map((servico) => ({
        ...servico,
        indicadores: servico.indicadores.map((indicador) => ({
          ...indicador,
          medicoes: indicador.medicoes.map((medicao) => ({
            periodo: medicao.periodoRef.toISOString().slice(0, 10),
            valor: medicao.valor,
            denominador: medicao.denominador,
            origem: medicao.origem,
            cenario: medicao.cenario ? { ...medicao.cenario } : null
          }))
        }))
      }))
    };
  }
}

const escaparHtml = (texto: string) => texto.replace(/[&<>"']/g, (caractere) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]!);
const texto = (valor: string | null) => escaparHtml(valor ?? 'Não informado');

function renderizarHtml(relatorio: RelatorioEstrategia) {
  const estrategia = relatorio.estrategia!;
  const objetivos = relatorio.objetivos.map((objetivo) => `<li><strong>${texto(objetivo.codigo)}</strong>: ${texto(objetivo.descricao)} (${texto(objetivo.status)})</li>`).join('');
  const servicos = relatorio.servicos.map((servico) => `<li><h3>${texto(servico.nome)}</h3><p>${texto(servico.descricao)}</p><p>Público: ${texto(servico.publicoAlvo)} · Status: ${texto(servico.status)}</p><ul>${servico.vinculos.map((vinculo) => `<li>${texto(vinculo.objetivoCodigo)}: ${texto(vinculo.justificativaValor)} (${vinculo.contribuicao}%)</li>`).join('')}</ul><ul>${servico.indicadores.map((indicador) => `<li>${texto(indicador.nome)}: meta ${indicador.meta} ${texto(indicador.unidade)} (${texto(indicador.sentido)})<ul>${indicador.medicoes.map((medicao) => `<li>Resultado: ${medicao.valor} ${texto(indicador.unidade)} · período ${texto(medicao.periodo)} · origem ${texto(medicao.origem)} · denominador ${medicao.denominador}${medicao.cenario ? ` · cenário ${texto(medicao.cenario.id)}` : ''}</li>`).join('') || '<li>Sem medição</li>'}</ul></li>`).join('')}</ul></li>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório da estratégia</title></head><body><h1>Relatório da estratégia — ${texto(relatorio.organizacao.nome)}</h1><p>Versão ${estrategia.versao} · Atualizada em ${texto(estrategia.atualizadaEm)}</p><h2>Estratégia (4 Ps)</h2><dl><dt>Perspectiva</dt><dd>${texto(estrategia.perspectiva)}</dd><dt>Posição</dt><dd>${texto(estrategia.posicao)}</dd><dt>Plano</dt><dd>${texto(estrategia.plano)}</dd><dt>Padrão</dt><dd>${texto(estrategia.padrao)}</dd></dl><h2>Objetivos</h2><ul>${objetivos}</ul><h2>Portfólio, vínculos e indicadores</h2><ul>${servicos}</ul></body></html>`;
}
