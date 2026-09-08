import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ObjetivoInput, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface ObjetivoResultado { id: string; organizacaoId: string; codigo: string; descricao: string; prazo: string | null; status: ObjetivoInput['status'] }
interface ObjetivoComCobertura extends ObjetivoResultado { servicosVinculados: number; cobertura: number }
const statusLabel = { ATIVO: 'Ativo', ATINGIDO: 'Atingido', CANCELADO: 'Cancelado' } as const;

export function ObjetivosPage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient(); const [mensagem, setMensagem] = useState('');
  const query = useQuery({ queryKey: ['objetivos'], queryFn: async () => {
    const objetivos = (await api.get<ObjetivoResultado[]>('/objetivos')).data;
    return Promise.all(objetivos.map(async (objetivo) => ({ ...objetivo, ...(await api.get<{ servicosVinculados: number; cobertura: number }>(`/objetivos/${objetivo.id}/cobertura`)).data })));
  } });
  const mutation = useMutation({ mutationFn: async (input: ObjetivoInput) => (await api.post<ObjetivoResultado>('/objetivos', input)).data, onSuccess: (criado) => { cache.setQueryData<ObjetivoComCobertura[]>(['objetivos'], (objetivos = []) => [...objetivos, { ...criado, servicosVinculados: 0, cobertura: 0 }]); setMensagem('Objetivo adicionado com sucesso.'); } });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setMensagem(''); const form = new FormData(event.currentTarget); mutation.mutate({ codigo: String(form.get('codigo')), descricao: String(form.get('descricao')), prazo: String(form.get('prazo')) || null, status: String(form.get('status')) as ObjetivoInput['status'] }); event.currentTarget.reset(); };
  if (query.isLoading) return <Layout usuario={usuario}><main className="page"><p role="status" className="state">Carregando objetivos…</p></main></Layout>;
  if (query.isError) return <Layout usuario={usuario}><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar os objetivos. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const objetivos = query.data ?? [];
  return <Layout usuario={usuario}><main className="page"><h1>Objetivos estratégicos do negócio <small className="tag">RF04</small></h1><p className="subtitle">A cobertura soma as contribuições dos serviços vinculados e nunca ultrapassa 100%.</p>
    {mensagem && <p role="status" className="alert success">✓ {mensagem}</p>}{mutation.isError && <p role="alert" className="alert error">⚠ Não foi possível adicionar o objetivo. Verifique o código e os demais campos.</p>}
    {objetivos.length === 0 ? <p className="state empty-state">Nenhum objetivo estratégico cadastrado.</p> : <div className="table-card"><table><thead><tr><th>Código</th><th>Descrição do objetivo</th><th>Prazo</th><th>Status</th><th>Serviços</th><th>Cobertura</th></tr></thead><tbody>{objetivos.map((objetivo) => <tr key={objetivo.id}><td><strong>{objetivo.codigo}</strong></td><td>{objetivo.descricao}</td><td>{objetivo.prazo ? new Date(objetivo.prazo).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'}</td><td><span className="pill">{statusLabel[objetivo.status]}</span></td><td>{objetivo.servicosVinculados} {objetivo.servicosVinculados === 1 ? 'serviço' : 'serviços'}</td><td><progress aria-label={`Cobertura de ${objetivo.codigo}`} max="100" value={objetivo.cobertura} /> <strong>{objetivo.cobertura}%</strong></td></tr>)}</tbody></table></div>}
    <form className="domain-form" aria-label="Formulário de objetivo estratégico" onSubmit={submit}><h2>Novo objetivo estratégico</h2><label>Código<input name="codigo" maxLength={20} required /></label><label>Status<select name="status" defaultValue="ATIVO"><option value="ATIVO">Ativo</option><option value="ATINGIDO">Atingido</option><option value="CANCELADO">Cancelado</option></select></label><label>Prazo<input name="prazo" type="date" /></label><label className="full-field">Descrição<textarea name="descricao" maxLength={1000} required /></label><div className="form-actions"><button type="reset">Limpar</button><button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Adicionando…' : 'Adicionar objetivo'}</button></div></form>
  </main></Layout>;
}
