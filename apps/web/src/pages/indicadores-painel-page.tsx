import { useQuery } from '@tanstack/react-query';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface PainelIndicador { servicoId: string; nomeServico: string; indicadorId: string; nome: string; tipo: string; unidade: string; meta: number; sentido: 'MAIOR_MELHOR' | 'MENOR_MELHOR'; valor: number; situacao: 'ABAIXO_DA_META' | 'NA_META' | 'ACIMA_DA_META'; medicoes: number; }
const rotuloSituacao = (situacao: PainelIndicador['situacao']) => ({ ABAIXO_DA_META: 'Abaixo da meta', NA_META: 'Na meta', ACIMA_DA_META: 'Acima da meta' })[situacao];

export function IndicadoresPainelPage({ usuario }: { usuario: UsuarioPublico }) {
  const [servicoId, setServicoId] = useState(''); const [periodo, setPeriodo] = useState('');
  const painel = useQuery({ queryKey: ['painel-indicadores'], queryFn: async () => (await api.get<PainelIndicador[]>('/indicadores/painel')).data });
  if (painel.isLoading) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><p role="status" className="state">Carregando painel de indicadores…</p></main></Layout>;
  if (painel.isError) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar o painel. <button onClick={() => painel.refetch()}>Tentar novamente</button></div></main></Layout>;
  const todos = painel.data ?? []; const servicos = [...new Map(todos.map((item) => [item.servicoId, item.nomeServico])).entries()]; const itens = servicoId ? todos.filter((item) => item.servicoId === servicoId) : todos; const abaixo = itens.filter((item) => item.situacao === 'ABAIXO_DA_META').length;
  return <Layout usuario={usuario} carregarOrganizacao><main className="page"><h1>Painel de indicadores <small className="tag">T13 · RF07</small></h1><p className="subtitle">Acompanhe os resultados calculados a partir das medições geradas pela simulação.</p>
    {todos.length === 0 ? <div className="state empty-state">Nenhuma medição simulada disponível. <Link to="/cenarios">Criar cenário de simulação</Link>.</div> : <>
      <div className="portfolio-toolbar"><label>Filtrar por serviço<select value={servicoId} onChange={(event) => setServicoId(event.target.value)}><option value="">Todos os serviços</option>{servicos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</select></label><label>Período de referência<input type="month" value={periodo} onChange={(event) => setPeriodo(event.target.value)} /></label></div>
      <p role="status" className="alert attention" aria-live="polite">{abaixo} de {itens.length} {itens.length === 1 ? 'indicador abaixo' : 'indicadores abaixo'} da meta{periodo ? ` no período de referência ${periodo}` : ''}.</p>
      {itens.length === 0 ? <p className="state empty-state">Nenhum indicador corresponde aos filtros selecionados.</p> : <div className="table-card"><table><thead><tr><th>Serviço</th><th>Indicador</th><th>Resultado</th><th>Meta</th><th>Situação</th><th>Próximo passo</th></tr></thead><tbody>{itens.map((item) => <tr key={item.indicadorId}><td>{item.nomeServico}</td><td>{item.nome}<small>{item.tipo} · {item.medicoes} medições</small></td><td>{item.valor} {item.unidade}</td><td>{item.meta} {item.unidade} · {item.sentido === 'MAIOR_MELHOR' ? 'maior é melhor' : 'menor é melhor'}</td><td><span className="pill">{rotuloSituacao(item.situacao)}</span></td><td>{item.situacao === 'ABAIXO_DA_META' ? <Link to="/estrategia">Revisar estratégia</Link> : '—'}</td></tr>)}</tbody></table></div>}
    </>}
  </main></Layout>;
}
