import PDFDocument from 'pdfkit';
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
  analises?: { tipo: string; categoria: string; descricao: string; impacto: string | null }[];
  estrategia: EstrategiaDoRelatorio | null;
  objetivos: { codigo: string; descricao: string; prazo: Date | null; status: string }[];
  servicos: {
    nome: string; descricao: string | null; publicoAlvo: string | null; status: string;
    vinculos: { objetivoCodigo: string; justificativaValor: string; contribuicao: number; indicador?: { nome: string; tipo: string; unidade: string } | null }[];
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

  async exportar(usuarioId: string): Promise<{ nomeArquivo: string; contentType: 'application/pdf'; conteudo: Buffer }> {
    const relatorio = this.validarExportacao(this.formatar(await this.buscar(usuarioId)));
    return { ...relatorioEstrategiaExportacao, conteudo: await renderizarPdf(relatorio) };
  }

  /** Prévia HTML segura para impressão/navegador; a exportação oficial é PDF. */
  async renderizarHtml(usuarioId: string): Promise<string> {
    return gerarHtml(this.validarExportacao(this.formatar(await this.buscar(usuarioId))));
  }

  async obterParaProfessor(organizacaoId: string): Promise<RelatorioEstrategia> {
    const relatorio = await this.repository.buscarPorOrganizacaoAluno(organizacaoId);
    if (!relatorio) throw new AppError(404, 'AMBIENTE_ALUNO_NAO_ENCONTRADO', 'Ambiente de aluno não encontrado.');
    return this.formatar(relatorio);
  }

  private validarExportacao(relatorio: RelatorioEstrategia) {
    if (!relatorio.estrategia || !estrategiaCompleta(relatorio.estrategia)) {
      const camposFaltantes = listarCamposFaltantes(relatorio.estrategia);
      throw new AppError(
        422,
        'ESTRATEGIA_INCOMPLETA',
        `A exportação foi bloqueada porque faltam: ${camposFaltantes.join(', ')}.`,
        { camposFaltantes }
      );
    }
    return relatorio as RelatorioEstrategia & { estrategia: NonNullable<RelatorioEstrategia['estrategia']> };
  }

  private async buscar(usuarioId: string) {
    const relatorio = await this.repository.buscarPorUsuario(usuarioId);
    if (!relatorio) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return relatorio;
  }

  private formatar(relatorio: RelatorioEstrategiaResultado): RelatorioEstrategia {
    return {
      ...relatorio,
      analises: relatorio.analises ?? [],
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
        vinculos: servico.vinculos.map((vinculo) => ({ ...vinculo, indicador: vinculo.indicador ?? null })),
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

const rotulosPs = [
  ['perspectiva', 'Perspectiva'],
  ['posicao', 'Posição'],
  ['plano', 'Plano'],
  ['padrao', 'Padrão']
] as const;

export function listarCamposFaltantes(estrategia: RelatorioEstrategia['estrategia']): string[] {
  if (!estrategia) return rotulosPs.map(([, rotulo]) => rotulo);
  return rotulosPs
    .filter(([campo]) => !estrategia[campo]?.trim())
    .map(([, rotulo]) => rotulo);
}

const escaparHtml = (valor: string) => valor.replace(/[&<>"']/g, (caractere) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]!);
const texto = (valor: string | null) => escaparHtml(valor ?? 'Não informado');
const textoPlano = (valor: string | null) => valor ?? 'Não informado';

export function gerarHtml(relatorio: RelatorioEstrategia & { estrategia: NonNullable<RelatorioEstrategia['estrategia']> }) {
  const estrategia = relatorio.estrategia;
  const analises = (relatorio.analises ?? []).map((analise) => `<li><strong>${texto(analise.categoria)}</strong> (${texto(analise.tipo)}): ${texto(analise.descricao)}${analise.impacto ? ` · impacto ${texto(analise.impacto)}` : ''}</li>`).join('') || '<li>Sem análise de ambiente registrada.</li>';
  const objetivos = relatorio.objetivos.map((objetivo) => `<li><strong>${texto(objetivo.codigo)}</strong>: ${texto(objetivo.descricao)} (${texto(objetivo.status)})</li>`).join('') || '<li>Sem objetivos registrados.</li>';
  const servicos = relatorio.servicos.map((servico) => `<li><h3>${texto(servico.nome)}</h3><p>${texto(servico.descricao)}</p><p>Público: ${texto(servico.publicoAlvo)} · Status: ${texto(servico.status)}</p><h4>Vínculos</h4><ul>${servico.vinculos.map((vinculo) => `<li>${texto(vinculo.objetivoCodigo)}: ${texto(vinculo.justificativaValor)} (${vinculo.contribuicao}%)${vinculo.indicador ? ` · indicador: ${texto(vinculo.indicador.nome)} (${texto(vinculo.indicador.tipo)})` : ' · indicador não associado'}</li>`).join('') || '<li>Sem vínculo estratégico</li>'}</ul><h4>Indicadores</h4><ul>${servico.indicadores.map((indicador) => `<li>${texto(indicador.nome)}: meta ${indicador.meta} ${texto(indicador.unidade)} (${texto(indicador.sentido)})<ul>${indicador.medicoes.map((medicao) => `<li>Resultado: ${medicao.valor} ${texto(indicador.unidade)} · período ${texto(medicao.periodo)} · origem ${texto(medicao.origem)} · denominador ${medicao.denominador}${medicao.cenario ? ` · cenário ${texto(medicao.cenario.id)}` : ''}</li>`).join('') || '<li>Sem medição</li>'}</ul></li>`).join('') || '<li>Sem indicador configurado</li>'}</ul></li>`).join('') || '<li>Sem serviços registrados.</li>';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório da estratégia</title></head><body><h1>Relatório da estratégia — ${texto(relatorio.organizacao.nome)}</h1><p>Versão ${estrategia.versao} · Atualizada em ${texto(estrategia.atualizadaEm)}</p><h2>Análise de ambiente (SWOT)</h2><ul>${analises}</ul><h2>Estratégia (4 Ps)</h2><dl><dt>Perspectiva</dt><dd>${texto(estrategia.perspectiva)}</dd><dt>Posição</dt><dd>${texto(estrategia.posicao)}</dd><dt>Plano</dt><dd>${texto(estrategia.plano)}</dd><dt>Padrão</dt><dd>${texto(estrategia.padrao)}</dd></dl><h2>Objetivos</h2><ul>${objetivos}</ul><h2>Portfólio, vínculos e indicadores</h2><ul>${servicos}</ul></body></html>`;
}

function escreverTitulo(documento: PDFKit.PDFDocument, titulo: string) {
  documento.moveDown(0.6).font('Helvetica-Bold').fontSize(15).text(titulo).moveDown(0.25).font('Helvetica').fontSize(10);
}

function escreverLinha(documento: PDFKit.PDFDocument, rotulo: string, valor: string) {
  documento.font('Helvetica-Bold').text(`${rotulo}: `, { continued: true }).font('Helvetica').text(valor);
}

async function renderizarPdf(relatorio: RelatorioEstrategia & { estrategia: NonNullable<RelatorioEstrategia['estrategia']> }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const documento = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: 'Relatório da estratégia EduITSM', Author: 'EduITSM' } });
    const fragmentos: Buffer[] = [];
    documento.on('data', (fragmento: Buffer) => fragmentos.push(Buffer.from(fragmento)));
    documento.once('error', reject);
    documento.once('end', () => resolve(Buffer.concat(fragmentos)));

    documento.font('Helvetica-Bold').fontSize(20).text('Relatório da estratégia');
    documento.font('Helvetica').fontSize(11).text(relatorio.organizacao.nome);
    if (relatorio.organizacao.setor) documento.text(`Setor: ${relatorio.organizacao.setor}`);
    if (relatorio.organizacao.descricao) documento.text(relatorio.organizacao.descricao);
    documento.moveDown(0.5).fontSize(9).fillColor('#444444').text(`Versão ${relatorio.estrategia.versao} - Atualizada em ${relatorio.estrategia.atualizadaEm}`).fillColor('#000000').fontSize(10);

    escreverTitulo(documento, 'Análise de ambiente (SWOT)');
    if ((relatorio.analises ?? []).length === 0) documento.text('Sem análise de ambiente registrada.');
    for (const analise of relatorio.analises ?? []) documento.text(`• ${analise.categoria} (${analise.tipo}): ${analise.descricao}${analise.impacto ? ` - impacto ${analise.impacto}` : ''}`, { indent: 8 });

    escreverTitulo(documento, 'Estratégia (4 Ps)');
    escreverLinha(documento, 'Perspectiva', relatorio.estrategia.perspectiva);
    escreverLinha(documento, 'Posição', relatorio.estrategia.posicao);
    escreverLinha(documento, 'Plano', relatorio.estrategia.plano);
    escreverLinha(documento, 'Padrão', relatorio.estrategia.padrao);

    escreverTitulo(documento, 'Objetivos estratégicos');
    if (relatorio.objetivos.length === 0) documento.text('Sem objetivos registrados.');
    for (const objetivo of relatorio.objetivos) documento.text(`• ${objetivo.codigo} - ${objetivo.descricao}. Status: ${objetivo.status}. Prazo: ${objetivo.prazo ?? 'Não informado'}`, { indent: 8 });

    escreverTitulo(documento, 'Portfólio, vínculos e indicadores');
    if (relatorio.servicos.length === 0) documento.text('Sem serviços registrados.');
    for (const servico of relatorio.servicos) {
      documento.moveDown(0.3).font('Helvetica-Bold').text(servico.nome).font('Helvetica');
      documento.text(`Status: ${servico.status}. Público: ${textoPlano(servico.publicoAlvo)}.`);
      documento.text(`Descrição: ${textoPlano(servico.descricao)}.`);
      documento.font('Helvetica-Bold').text('Vínculos:').font('Helvetica');
      if (servico.vinculos.length === 0) documento.text('Sem vínculo estratégico.', { indent: 8 });
      for (const vinculo of servico.vinculos) documento.text(`• ${vinculo.objetivoCodigo}: ${vinculo.contribuicao}% - ${vinculo.justificativaValor}. Indicador: ${vinculo.indicador ? `${vinculo.indicador.nome} (${vinculo.indicador.tipo}, ${vinculo.indicador.unidade})` : 'não associado'}.`, { indent: 8 });
      documento.font('Helvetica-Bold').text('Indicadores e medições:').font('Helvetica');
      if (servico.indicadores.length === 0) documento.text('Sem indicador configurado.', { indent: 8 });
      for (const indicador of servico.indicadores) {
        documento.text(`• ${indicador.nome} (${indicador.tipo}): meta ${indicador.meta} ${indicador.unidade}; sentido ${indicador.sentido}.`, { indent: 8 });
        if (indicador.medicoes.length === 0) documento.text('Sem medição.', { indent: 20 });
        for (const medicao of indicador.medicoes) documento.text(`Resultado ${medicao.valor} ${indicador.unidade}; período ${medicao.periodo}; origem ${medicao.origem}; denominador ${medicao.denominador}${medicao.cenario ? `; cenário ${medicao.cenario.id} (semente ${medicao.cenario.semente}, ${medicao.cenario.perfil}, gerador ${medicao.cenario.geradorVersao})` : ''}.`, { indent: 20 });
      }
    }

    const paginas = documento.bufferedPageRange();
    for (let indice = 0; indice < paginas.count; indice += 1) {
      documento.switchToPage(indice);
      documento.font('Helvetica').fontSize(8).fillColor('#555555').text(`Página ${indice + 1} de ${paginas.count}`, 48, documento.page.height - 32, { width: documento.page.width - 96, align: 'center' }).fillColor('#000000');
    }
    documento.end();
  });
}
