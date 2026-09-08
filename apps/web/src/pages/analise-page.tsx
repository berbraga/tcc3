import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnaliseAmbienteInput, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface AnaliseResultado extends AnaliseAmbienteInput { id: string; organizacaoId: string }
const vazio: AnaliseAmbienteInput = { tipo: 'INTERNO', categoria: 'FORCA', descricao: '', impacto: null };
const categorias = { FORCA: 'Forças', FRAQUEZA: 'Fraquezas', OPORTUNIDADE: 'Oportunidades', AMEACA: 'Ameaças' } as const;

export function AnalisePage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['analises-ambiente'], queryFn: async () => (await api.get<AnaliseResultado[]>('/analises-ambiente')).data });
  const [rascunho, setRascunho] = useState<AnaliseAmbienteInput>(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string | null; input: AnaliseAmbienteInput }) => id ? (await api.put<AnaliseResultado>(`/analises-ambiente/${id}`, input)).data : (await api.post<AnaliseResultado>('/analises-ambiente', input)).data,
    onSuccess: (salvo, { id }) => {
      cache.setQueryData<AnaliseResultado[]>(['analises-ambiente'], (itens = []) => id ? itens.map((item) => item.id === salvo.id ? salvo : item) : [...itens, salvo]);
      setMensagem(id ? 'Item atualizado com sucesso.' : 'Item adicionado com sucesso.'); setEditandoId(null); setRascunho(vazio);
    }
  });
  const submit = (event: FormEvent) => { event.preventDefault(); setMensagem(''); mutation.mutate({ id: editandoId, input: rascunho }); };
  const editar = (item: AnaliseResultado) => { setEditandoId(item.id); setRascunho({ tipo: item.tipo, categoria: item.categoria, descricao: item.descricao, impacto: item.impacto ?? null }); setMensagem(''); };
  if (query.isLoading) return <Layout usuario={usuario}><main className="page"><p role="status" className="state">Carregando análise de ambiente…</p></main></Layout>;
  if (query.isError) return <Layout usuario={usuario}><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar a análise de ambiente. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  const itens = query.data ?? [];
  return <Layout usuario={usuario}><main className="page">
    <h1>Análise de ambiente <small className="tag">RF10</small></h1><p className="subtitle">Avalie o ambiente interno e externo que orienta a formulação da estratégia.</p>
    {mensagem && <p role="status" className="alert success">✓ {mensagem}</p>}{mutation.isError && <p role="alert" className="alert error">⚠ Não foi possível salvar o item. Verifique os dados e tente novamente.</p>}
    {itens.length === 0 ? <p className="state empty-state">Nenhum item de análise registrado.</p> : <section className="swot-grid" aria-label="Matriz SWOT">{(Object.keys(categorias) as Array<keyof typeof categorias>).map((categoria) => <article className="swot-card" key={categoria}><header><h2>{categorias[categoria]}</h2></header><ul>{itens.filter((item) => item.categoria === categoria).map((item) => <li key={item.id}><span>{item.descricao}</span><span className="row-actions"><small className="pill">{(item.impacto ?? 'sem impacto').toLowerCase()}</small><button type="button" onClick={() => editar(item)} aria-label={`Editar ${item.descricao}`}>Editar</button></span></li>)}</ul>{!itens.some((item) => item.categoria === categoria) && <p className="state">Sem itens nesta categoria.</p>}</article>)}</section>}
    <form className="domain-form" aria-label="Formulário de análise de ambiente" onSubmit={submit}><h2>{editandoId ? 'Editar item' : 'Registrar novo item'}</h2>
      <label>Tipo<select value={rascunho.tipo} onChange={(e) => setRascunho({ ...rascunho, tipo: e.target.value as AnaliseAmbienteInput['tipo'] })}><option value="INTERNO">Interno</option><option value="EXTERNO">Externo</option></select></label>
      <label>Categoria<select value={rascunho.categoria} onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value as AnaliseAmbienteInput['categoria'] })}><option value="FORCA">Força</option><option value="FRAQUEZA">Fraqueza</option><option value="OPORTUNIDADE">Oportunidade</option><option value="AMEACA">Ameaça</option></select></label>
      <label>Impacto<select value={rascunho.impacto ?? ''} onChange={(e) => setRascunho({ ...rascunho, impacto: (e.target.value || null) as AnaliseAmbienteInput['impacto'] })}><option value="">Não informado</option><option value="BAIXO">Baixo</option><option value="MEDIO">Médio</option><option value="ALTO">Alto</option></select></label>
      <label className="full-field">Descrição<textarea required maxLength={1000} value={rascunho.descricao} onChange={(e) => setRascunho({ ...rascunho, descricao: e.target.value })} /></label>
      <div className="form-actions">{editandoId && <button type="button" onClick={() => { setEditandoId(null); setRascunho(vazio); }}>Cancelar edição</button>}<button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : editandoId ? 'Salvar item' : 'Adicionar item'}</button></div>
    </form>
  </main></Layout>;
}
