import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AtualizarOrganizacaoInput, OrganizacaoPublica, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useState } from 'react';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface OrganizacaoPainel extends OrganizacaoPublica { resumo: { servicos: number; objetivos: number; versaoEstrategia: number | null; registrosOperacionais: number } }

export function PainelPage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['organizacao'], queryFn: async () => (await api.get<OrganizacaoPainel>('/organizacoes/minha')).data });
  const [editando, setEditando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const mutation = useMutation({ mutationFn: async (input: AtualizarOrganizacaoInput) => (await api.put<OrganizacaoPainel>('/organizacoes/minha', input)).data, onSuccess: (data) => { cache.setQueryData(['organizacao'], data); setEditando(false); setSucesso(true); } });
  if (query.isLoading) return <Layout usuario={usuario}><main className="page"><p role="status" className="state">Carregando organização…</p></main></Layout>;
  if (query.isError) return <Layout usuario={usuario}><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar sua organização. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  if (!query.data) return <Layout usuario={usuario}><main className="page"><p className="state">Nenhuma organização disponível.</p></main></Layout>;
  const org = query.data;
  return <Layout usuario={usuario} organizacao={org.nome}>
    <main className="page">
      <h1>Painel inicial da organização <small className="tag">RF09</small></h1>
      <p className="subtitle">Ponto de partida do ciclo estratégico. Acompanhe em que etapa sua organização está e retome de onde parou.</p>
      {sucesso && <p role="status" className="alert success">✓ Organização atualizada com sucesso.</p>}
      <section className="organization-card"><div><small>MINHA ORGANIZAÇÃO</small><h2>{org.nome} <span>· {org.setor || 'Setor não informado'}</span></h2><p>{org.descricao || 'Adicione uma descrição para contextualizar o ambiente fictício.'}</p></div><button onClick={() => setEditando(true)}>Editar organização</button></section>
      {editando && <EditForm org={org} saving={mutation.isPending} onCancel={() => setEditando(false)} onSave={(data) => { setSucesso(false); mutation.mutate(data); }} />}
      {mutation.isError && <p role="alert" className="alert error">⚠ Não foi possível salvar. Verifique os campos e tente novamente.</p>}
      <section className="metrics" aria-label="Resumo da organização">
        <Metric label="SERVIÇOS NO PORTFÓLIO" value={org.resumo.servicos} note="dados reais da organização" />
        <Metric label="OBJETIVOS ESTRATÉGICOS" value={org.resumo.objetivos} note="direção estratégica" />
        <Metric label="VERSÃO DA ESTRATÉGIA" value={org.resumo.versaoEstrategia ? `v${org.resumo.versaoEstrategia}` : '—'} note="histórico preservado" />
        <Metric label="REGISTROS OPERACIONAIS" value={org.resumo.registrosOperacionais.toLocaleString('pt-BR')} note="gerados por simulação" />
      </section>
      <h2>Ciclo contínuo da estratégia de serviço</h2>
      <section className="cycle">{['Analisar o ambiente', 'Definir a direção', 'Desenhar os serviços', 'Operar (simulação)', 'Medir e avaliar', 'Decidir melhoria'].map((title, i) => <article key={title}><small>ETAPA {i + 1}</small><h3>{title}</h3><p>{i === 0 ? 'Próximo passo recomendado' : 'Disponível nas próximas fases'}</p></article>)}</section>
      <div className="alert attention">ⓘ <strong>Próximo passo sugerido:</strong> inicie pela análise do ambiente para formular a estratégia da organização.</div>
    </main>
  </Layout>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <article><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }

function EditForm({ org, saving, onSave, onCancel }: { org: OrganizacaoPainel; saving: boolean; onSave: (data: AtualizarOrganizacaoInput) => void; onCancel: () => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ nome: String(form.get('nome')), setor: String(form.get('setor')), descricao: String(form.get('descricao')) }); };
  return <form className="edit-form" onSubmit={submit}><h2>Editar organização</h2><label htmlFor="org-nome">Nome da organização</label><input id="org-nome" name="nome" minLength={2} maxLength={120} required defaultValue={org.nome} /><label htmlFor="org-setor">Setor</label><input id="org-setor" name="setor" maxLength={80} defaultValue={org.setor ?? ''} /><label htmlFor="org-descricao">Descrição</label><textarea id="org-descricao" name="descricao" maxLength={1000} defaultValue={org.descricao ?? ''} /><div><button type="button" onClick={onCancel}>Cancelar</button><button className="primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div></form>;
}
