import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CenarioInput, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface Servico { id: string; nome: string; status: string; }
const erroDaApi = (error: unknown) => typeof error === 'object' && error !== null && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'Não foi possível executar a simulação.';

export function CenarioPage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient(); const [rascunho, setRascunho] = useState<Omit<CenarioInput, 'servicoIds'>>({ semente: 1, periodoInicio: '', periodoFim: '', volumeRegistros: 100, perfil: 'REALISTA' }); const [servicoIds, setServicoIds] = useState<string[] | null>(null); const [resultado, setResultado] = useState<{ registrosGerados: number; medicoesGeradas: number; reutilizado?: boolean } | null>(null);
  const servicos = useQuery({ queryKey: ['servicos'], queryFn: async () => (await api.get<Servico[]>('/servicos')).data });
  const executar = useMutation({
    mutationFn: async (input: CenarioInput) => (await api.post<{ registrosGerados: number; medicoesGeradas: number; reutilizado?: boolean }>('/cenarios', input)).data,
    onMutate: () => setResultado(null),
    onSuccess: (cenario) => { setResultado(cenario); cache.invalidateQueries({ queryKey: ['painel-indicadores'] }); }
  });
  if (servicos.isLoading) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><p role="status" className="state">Carregando serviços para simulação…</p></main></Layout>;
  if (servicos.isError) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar os serviços. <button onClick={() => servicos.refetch()}>Tentar novamente</button></div></main></Layout>;
  const ativos = (servicos.data ?? []).filter((servico) => servico.status === 'EM_OPERACAO'); const selecionados = servicoIds ?? ativos.slice(0, 1).map((servico) => servico.id);
  const alternarServico = (id: string) => setServicoIds((itens) => { const atuais = itens ?? selecionados; return atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]; });
  return <Layout usuario={usuario} carregarOrganizacao><main className="page"><h1>Cenário de simulação <small className="tag">T12 · RF11</small></h1><p className="subtitle">Gere registros operacionais reprodutíveis para avaliar os indicadores dos serviços em operação.</p>
    {executar.isPending && <p role="status" className="alert attention" aria-live="polite">Executando simulação…</p>}{executar.isError && <p role="alert" className="alert error">⚠ {erroDaApi(executar.error)}</p>}{resultado && <p role="status" className="alert success">✓ {resultado.reutilizado ? 'Cenário idêntico já existente; os resultados foram reutilizados' : 'Simulação concluída'}: {resultado.registrosGerados} registros e {resultado.medicoesGeradas} {resultado.medicoesGeradas === 1 ? 'medição' : 'medições'} gerados. <Link to="/indicadores/painel">Ver painel de indicadores</Link></p>}
    {ativos.length === 0 ? <div className="alert attention">Nenhum serviço em operação está disponível. Cadastre ou reative um serviço antes de simular.</div> : <form className="domain-form" onSubmit={(event: FormEvent) => { event.preventDefault(); executar.mutate({ ...rascunho, servicoIds: selecionados }); }}><h2>Configurar cenário</h2><label>Semente<input required type="number" step="1" value={rascunho.semente} onChange={(event) => setRascunho({ ...rascunho, semente: Number(event.target.value) })} /></label><label>Início do período<input required type="date" value={rascunho.periodoInicio} onChange={(event) => setRascunho({ ...rascunho, periodoInicio: event.target.value })} /></label><label>Fim do período<input required type="date" value={rascunho.periodoFim} onChange={(event) => setRascunho({ ...rascunho, periodoFim: event.target.value })} /></label><label>Volume de registros<input required type="number" min="1" max="10000" step="1" value={rascunho.volumeRegistros} onChange={(event) => setRascunho({ ...rascunho, volumeRegistros: Number(event.target.value) })} /></label><label>Perfil do cenário<select value={rascunho.perfil} onChange={(event) => setRascunho({ ...rascunho, perfil: event.target.value as CenarioInput['perfil'] })}><option value="OTIMISTA">Otimista</option><option value="REALISTA">Realista</option><option value="CRITICO">Crítico</option></select></label><fieldset className="full-field"><legend>Serviços em operação</legend>{ativos.map((servico) => <label key={servico.id}><input type="checkbox" checked={selecionados.includes(servico.id)} onChange={() => alternarServico(servico.id)} /> {servico.nome}</label>)}</fieldset><div className="form-actions"><button className="primary" disabled={executar.isPending || selecionados.length === 0}>{executar.isPending ? 'Executando simulação…' : 'Executar simulação'}</button></div></form>}
  </main></Layout>;
}
