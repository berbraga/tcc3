import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EstrategiaInput, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface EstrategiaResultado extends EstrategiaInput { id: string; organizacaoId: string; versao: number; atualizadaEm: string }
interface ResumoCobertura { objetivosAlinhados: number }
const vazia: EstrategiaInput = { perspectiva: null, posicao: null, plano: null, padrao: null };

export function EstrategiaPage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient(); const [rascunho, setRascunho] = useState<EstrategiaInput>(vazia); const [mensagem, setMensagem] = useState('');
  const query = useQuery({ queryKey: ['estrategia'], queryFn: async () => {
    const [atual, versoes, cobertura] = await Promise.all([api.get<EstrategiaResultado | null>('/estrategia'), api.get<EstrategiaResultado[]>('/estrategia/versoes'), api.get<ResumoCobertura>('/objetivos/cobertura')]);
    return { atual: atual.data, versoes: versoes.data, objetivosAlinhados: cobertura.data.objetivosAlinhados };
  } });
  useEffect(() => { if (query.data?.atual) setRascunho({ perspectiva: query.data.atual.perspectiva, posicao: query.data.atual.posicao, plano: query.data.atual.plano, padrao: query.data.atual.padrao }); }, [query.data]);
  const mutation = useMutation({ mutationFn: async (input: EstrategiaInput) => (await api.post<EstrategiaResultado>('/estrategia', input)).data, onSuccess: (salva) => { cache.setQueryData<{ atual: EstrategiaResultado | null; versoes: EstrategiaResultado[]; objetivosAlinhados: number }>(['estrategia'], (data) => ({ atual: salva, versoes: [salva, ...(data?.versoes ?? []).filter((versao) => versao.id !== salva.id)], objetivosAlinhados: data?.objetivosAlinhados ?? 0 })); setMensagem(`Estratégia salva como versão ${salva.versao}.`); } });
  const alterar = (campo: keyof EstrategiaInput, valor: string) => setRascunho({ ...rascunho, [campo]: valor.length ? valor : null });
  if (query.isLoading) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><p role="status" className="state">Carregando estratégia…</p></main></Layout>;
  if (query.isError) return <Layout usuario={usuario} carregarOrganizacao><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar a estratégia. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const objetivosAlinhados = query.data?.objetivosAlinhados;
  const resumoAlinhamento = objetivosAlinhados === undefined ? 'Objetivos alinhados indisponíveis' : `${objetivosAlinhados} ${objetivosAlinhados === 1 ? 'objetivo alinhado' : 'objetivos alinhados'}`;
  return <Layout usuario={usuario} carregarOrganizacao><main className="page"><h1>Estratégia de serviço — os 4 Ps <small className="tag">RF05</small></h1><p className="subtitle">Cada alteração salva gera uma nova versão e preserva o histórico de decisão.</p>
    {!query.data?.atual && <p className="state empty-state">Nenhuma estratégia registrada.</p>}{mensagem && <p role="status" className="alert success">✓ {mensagem}</p>}{mutation.isError && <p role="alert" className="alert error">⚠ Não foi possível salvar a estratégia. Tente novamente.</p>}
    <form className="strategy-form" aria-label="Formulário dos quatro Ps" onSubmit={(event: FormEvent) => { event.preventDefault(); setMensagem(''); mutation.mutate(rascunho); }}>
      <Campo label="Perspectiva — visão e propósito" value={rascunho.perspectiva} onChange={(v) => alterar('perspectiva', v)} /><Campo label="Posição — diferenciação competitiva" value={rascunho.posicao} onChange={(v) => alterar('posicao', v)} /><Campo label="Plano — como a visão será executada" value={rascunho.plano} onChange={(v) => alterar('plano', v)} /><Campo label="Padrão — comportamento recorrente" value={rascunho.padrao} onChange={(v) => alterar('padrao', v)} />
      <footer><span>{query.data?.atual ? `Versão ${query.data.atual.versao}` : 'Ainda sem versão'} · {resumoAlinhamento}</span><button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar estratégia'}</button></footer>
    </form>
    <section className="table-card" aria-labelledby="historico-title"><h2 id="historico-title">Histórico de versões</h2>{query.data?.versoes.length ? <table><thead><tr><th>Versão</th><th>Atualizada em</th></tr></thead><tbody>{query.data.versoes.map((versao) => <tr key={versao.id}><td>Versão {versao.versao}</td><td>{new Date(versao.atualizadaEm).toLocaleString('pt-BR')}</td></tr>)}</tbody></table> : <p className="state">Nenhuma versão anterior.</p>}</section>
  </main></Layout>;
}
function Campo({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string) => void }) { return <label>{label}<textarea maxLength={4000} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label>; }
