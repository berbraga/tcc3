import { useQuery } from '@tanstack/react-query';
import { estrategiaCompleta, type RelatorioEstrategia, type UsuarioPublico } from '@eduitsm/shared';
import { useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

export function RelatorioPage({ usuario, endpoint = '/relatorios/estrategia', somenteLeitura = false }: { usuario: UsuarioPublico; endpoint?: string; somenteLeitura?: boolean }) {
  const query = useQuery({ queryKey: ['relatorio-estrategia', endpoint], queryFn: async () => (await api.get<RelatorioEstrategia>(endpoint)).data });
  const [exportando, setExportando] = useState(false); const [sucesso, setSucesso] = useState(false); const [erroExportacao, setErroExportacao] = useState('');
  if (query.isLoading) return <Layout usuario={usuario}><main className="page"><p role="status" className="state">Carregando relatório da estratégia…</p></main></Layout>;
  if (query.isError || !query.data) return <Layout usuario={usuario}><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar o relatório. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const relatorio = query.data; const podeExportar = Boolean(relatorio.estrategia && estrategiaCompleta(relatorio.estrategia));
  const exportar = async () => {
    setExportando(true); setSucesso(false); setErroExportacao('');
    try {
      const resposta = await api.get<Blob>('/relatorios/estrategia/exportacao', { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data); const link = document.createElement('a');
      link.href = url; link.download = 'relatorio-estrategia.pdf'; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setSucesso(true);
    } catch (error) {
      const status = typeof error === 'object' && error && 'response' in error && typeof error.response === 'object' && error.response && 'status' in error.response ? error.response.status : undefined;
      setErroExportacao(status === 422 ? 'A exportação foi bloqueada. Preencha os quatro Ps e tente novamente.' : 'Não foi possível exportar o relatório. Tente novamente.');
    } finally { setExportando(false); }
  };
  return <Layout usuario={usuario} organizacao={relatorio.organizacao.nome}><main className="page">
    <h1>{somenteLeitura ? 'Ambiente do aluno' : 'Relatório da estratégia'} <small className="tag">{somenteLeitura ? 'T15 · RF12' : 'T14 · RF13'}</small></h1>
    <p className="subtitle">{somenteLeitura ? 'Consulta autorizada em modo somente leitura. O token e o ambiente editável do professor permanecem inalterados.' : 'Consolida os 4 Ps, objetivos, portfólio, vínculos e indicadores do estudo de caso em um documento único.'}</p>
    {!podeExportar && <p role="alert" className="alert attention"><strong>A exportação está bloqueada.</strong> Preencha os quatro Ps da estratégia antes de gerar o documento (RN02).</p>}
    {sucesso && <p role="status" className="alert success">✓ Relatório exportado com sucesso.</p>}
    {erroExportacao && <p role="alert" className="alert error">⚠ {erroExportacao}</p>}
    <section className="table-card"><h2>Estratégia de serviço · {relatorio.organizacao.nome}</h2>
      {!relatorio.estrategia ? <p className="state empty-state">Nenhuma estratégia cadastrada. Defina os 4 Ps para consolidar o relatório.</p> : <><p><small>Versão {relatorio.estrategia.versao} · atualizada em {new Date(relatorio.estrategia.atualizadaEm).toLocaleDateString('pt-BR')}</small></p><div className="report-ps">{[['Perspectiva', relatorio.estrategia.perspectiva], ['Posição', relatorio.estrategia.posicao], ['Plano', relatorio.estrategia.plano], ['Padrão', relatorio.estrategia.padrao]].map(([titulo, valor]) => <article key={titulo}><h3>{titulo}</h3><p>{valor || 'Não preenchido'}</p></article>)}</div></>}
    </section>
    <section className="table-card"><h2>Análise de ambiente (SWOT)</h2>{(relatorio.analises ?? []).length === 0 ? <p className="state empty-state">Nenhum item SWOT cadastrado.</p> : <ul>{(relatorio.analises ?? []).map((analise) => <li key={`${analise.categoria}-${analise.descricao}`}><strong>{analise.categoria}</strong> ({analise.tipo}): {analise.descricao}{analise.impacto ? ` · impacto ${analise.impacto}` : ''}</li>)}</ul>}</section>
    <section className="table-card"><h2>Objetivos estratégicos</h2>{relatorio.objetivos.length === 0 ? <p className="state empty-state">Nenhum objetivo cadastrado.</p> : <table><thead><tr><th>Código</th><th>Descrição</th><th>Prazo</th><th>Status</th></tr></thead><tbody>{relatorio.objetivos.map((objetivo) => <tr key={objetivo.codigo}><td>{objetivo.codigo}</td><td>{objetivo.descricao}</td><td>{objetivo.prazo ?? 'Não informado'}</td><td>{objetivo.status}</td></tr>)}</tbody></table>}</section>
    <section className="table-card"><h2>Portfólio, vínculos e indicadores</h2>{relatorio.servicos.length === 0 ? <p className="state empty-state">Nenhum serviço cadastrado.</p> : <table><thead><tr><th>Serviço</th><th>Status</th><th>Vínculos</th><th>Indicadores e resultados</th></tr></thead><tbody>{relatorio.servicos.map((servico) => <tr key={servico.nome}><td><strong>{servico.nome}</strong><small>{servico.descricao ?? 'Sem descrição'}</small></td><td>{servico.status}</td><td>{servico.vinculos.map((v) => `${v.objetivoCodigo} (${v.contribuicao}%)${v.indicador ? ` · ${v.indicador.nome}` : ' · sem indicador'}`).join(', ') || 'Nenhum'}</td><td>{servico.indicadores.length === 0 ? 'Nenhum' : <ul className="report-results">{servico.indicadores.map((indicador) => <li key={indicador.nome}><strong>{indicador.nome}</strong>: meta {indicador.meta} {indicador.unidade}<ul>{(indicador.medicoes ?? []).length === 0 ? <li>Sem medição</li> : (indicador.medicoes ?? []).map((medicao) => <li key={`${indicador.nome}-${medicao.periodo}-${medicao.cenario?.id ?? medicao.origem}`}>Resultado {medicao.valor} {indicador.unidade} · período {medicao.periodo} · origem {medicao.origem}{medicao.cenario ? ` · cenário ${medicao.cenario.id}` : ''}</li>)}</ul></li>)}</ul>}</td></tr>)}</tbody></table>}</section>
    {somenteLeitura ? <p className="alert attention">ⓘ Ambiente do aluno em modo somente leitura.</p> : <div className="report-actions"><button className="primary" disabled={!podeExportar || exportando} onClick={() => { void exportar(); }}>{exportando ? 'Exportando relatório…' : 'Exportar relatório'}</button></div>}
  </main></Layout>;
}
