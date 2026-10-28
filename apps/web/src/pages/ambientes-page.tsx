import { useQuery } from '@tanstack/react-query';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface Ambiente { id: string; aluno: { nome: string }; organizacao: { nome: string; setor: string | null }; progresso: { psCompletos: number; servicos: number; vinculos: number; indicadores: number; cenarioGerado: boolean }; atividade?: { online: boolean; ultimaAtividade: string | null; paginaAtual: string | null; missaoAtual: number | null; ultimaAcao: string | null } }
interface PaginaAmbientes { items: Ambiente[]; total: number; pagina: number; limite: number }

export function AmbientesPage({ usuario }: { usuario: UsuarioPublico }) {
  const limite = 20; const [paginaAtual, setPaginaAtual] = useState(1);
  const query = useQuery({ queryKey: ['professor-ambientes', paginaAtual, limite], queryFn: async () => (await api.get<PaginaAmbientes>('/professor/ambientes', { params: { pagina: paginaAtual, limite } })).data, refetchInterval: 10_000 });
  if (query.isLoading) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><p role="status" className="state">Carregando ambientes dos alunos…</p></main></Layout>;
  if (query.isError || !query.data) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar os ambientes. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const pagina = query.data; const totalPaginas = Math.max(1, Math.ceil(pagina.total / pagina.limite)); const completos = pagina.items.filter((item) => item.progresso.psCompletos === 4).length; const cenarios = pagina.items.filter((item) => item.progresso.cenarioGerado).length;
  return <Layout usuario={usuario} carregarOrganizacao><main className="page">
    <h1>Acompanhamento dos ambientes dos alunos</h1>
    <p className="subtitle">Visão do professor em modo somente leitura. A lista atualiza automaticamente a cada 10 segundos.</p>
    <section className="metrics" aria-label="Resumo dos alunos"><Metric label="ALUNOS NESTA PÁGINA" value={pagina.items.length} note={`${pagina.total} no total`} /><Metric label="4 PS COMPLETOS" value={completos} note="estratégias completas" /><Metric label="COM VÍNCULO" value={pagina.items.filter((item) => item.progresso.vinculos > 0).length} note="alinhamento registrado" /><Metric label="CENÁRIO GERADO" value={cenarios} note="simulações disponíveis" /></section>
    {pagina.items.length === 0 ? <p className="state empty-state">Nenhum ambiente de aluno disponível.</p> : <section className="table-card"><h2>Ambientes de alunos</h2><table><thead><tr><th>Aluno</th><th>Organização</th><th>Status</th><th>Atividade atual</th><th>Missão</th><th>4 Ps</th><th>Serviços</th><th>Vínculos</th><th>Indicadores</th><th>Simulação</th><th>Leitura</th></tr></thead><tbody>{pagina.items.map((item) => { const atividade = item.atividade; const online = atividade?.online ?? false; const missao = atividade?.missaoAtual; return <tr key={item.id}><td>{item.aluno.nome}</td><td>{item.organizacao.nome}<small>{item.organizacao.setor ?? 'Setor não informado'}</small></td><td><span className="pill">{online ? 'Online agora' : atividade?.ultimaAtividade ? `Visto ${formatarData(atividade.ultimaAtividade)}` : 'Ainda não acessou'}</span></td><td>{atividade?.paginaAtual ?? 'Sem atividade registrada'}<small>{atividade?.ultimaAcao ?? ''}</small></td><td>{missao === null || (missao !== undefined && missao >= 5) ? 'Concluída' : missao === undefined ? '—' : `Missão ${missao + 1}`}</td><td><span className="pill">{item.progresso.psCompletos} de 4</span></td><td>{item.progresso.servicos}</td><td>{item.progresso.vinculos}</td><td>{item.progresso.indicadores}</td><td>{item.progresso.cenarioGerado ? 'Gerado' : 'Pendente'}</td><td><Link to={`/professor/ambientes/${item.id}`} aria-label={`Abrir ambiente de ${item.aluno.nome}`}>Abrir</Link></td></tr>; })}</tbody></table></section>}
    <div className="report-actions"><button disabled={pagina.pagina === 1 || query.isFetching} onClick={() => setPaginaAtual((atual) => atual - 1)}>Página anterior</button><span>Página {pagina.pagina} de {totalPaginas}</span><button disabled={pagina.pagina >= totalPaginas || query.isFetching} onClick={() => setPaginaAtual((atual) => atual + 1)}>Próxima página</button></div>
    <p className="alert attention">ⓘ Acompanhamento somente leitura. O professor nunca altera o ambiente de um aluno.</p>
  </main></Layout>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) { return <article><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }
function formatarData(valor: string) { return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
