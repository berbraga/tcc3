import { useQuery } from '@tanstack/react-query';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface Ambiente { id: string; aluno: { nome: string }; organizacao: { nome: string; setor: string | null }; progresso: { psCompletos: number; servicos: number; vinculos: number; indicadores: number; cenarioGerado: boolean } }
interface PaginaAmbientes { items: Ambiente[]; total: number; pagina: number; limite: number }

export function AmbientesPage({ usuario }: { usuario: UsuarioPublico }) {
  const limite = 20; const [paginaAtual, setPaginaAtual] = useState(1);
  const query = useQuery({ queryKey: ['professor-ambientes', paginaAtual, limite], queryFn: async () => (await api.get<PaginaAmbientes>('/professor/ambientes', { params: { pagina: paginaAtual, limite } })).data });
  if (query.isLoading) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><p role="status" className="state">Carregando ambientes dos alunos…</p></main></Layout>;
  if (query.isError || !query.data) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar os ambientes. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const pagina = query.data; const totalPaginas = Math.max(1, Math.ceil(pagina.total / pagina.limite)); const completos = pagina.items.filter((item) => item.progresso.psCompletos === 4).length; const cenarios = pagina.items.filter((item) => item.progresso.cenarioGerado).length;
  return <Layout usuario={usuario} carregarOrganizacao><main className="page">
    <h1>Acompanhamento dos ambientes dos alunos <small className="tag">T15 · RF12</small></h1>
    <p className="subtitle">Visão do professor em modo somente leitura: nenhuma informação pode ser alterada a partir desta tela (RN11).</p>
    <section className="metrics" aria-label="Resumo dos alunos"><Metric label="ALUNOS NESTA PÁGINA" value={pagina.items.length} note={`${pagina.total} no total`} /><Metric label="4 PS COMPLETOS" value={completos} note="estratégias completas" /><Metric label="COM VÍNCULO" value={pagina.items.filter((item) => item.progresso.vinculos > 0).length} note="alinhamento registrado" /><Metric label="CENÁRIO GERADO" value={cenarios} note="simulações disponíveis" /></section>
    {pagina.items.length === 0 ? <p className="state empty-state">Nenhum ambiente de aluno disponível.</p> : <section className="table-card"><h2>Ambientes de alunos</h2><table><thead><tr><th>Aluno</th><th>Organização</th><th>4 Ps</th><th>Serviços</th><th>Vínculos</th><th>Indicadores</th><th>Simulação</th></tr></thead><tbody>{pagina.items.map((item) => <tr key={item.id}><td>{item.aluno.nome}</td><td>{item.organizacao.nome}<small>{item.organizacao.setor ?? 'Setor não informado'}</small></td><td><span className="pill">{item.progresso.psCompletos} de 4</span></td><td>{item.progresso.servicos}</td><td>{item.progresso.vinculos}</td><td>{item.progresso.indicadores}</td><td>{item.progresso.cenarioGerado ? 'Gerado' : 'Pendente'}</td></tr>)}</tbody></table></section>}
    <div className="report-actions"><button disabled={pagina.pagina === 1 || query.isFetching} onClick={() => setPaginaAtual((atual) => atual - 1)}>Página anterior</button><span>Página {pagina.pagina} de {totalPaginas}</span><button disabled={pagina.pagina >= totalPaginas || query.isFetching} onClick={() => setPaginaAtual((atual) => atual + 1)}>Próxima página</button></div>
    <p className="alert attention">ⓘ Acompanhamento somente leitura. O professor nunca altera o ambiente de um aluno (RN11 · TS11).</p>
  </main></Layout>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) { return <article><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }
