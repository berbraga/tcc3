import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AtualizarOrganizacaoInput, OrganizacaoPublica, UsuarioPublico } from '@eduitsm/shared';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout.js';
import { api } from '../services/api.js';

interface OrganizacaoPainel extends OrganizacaoPublica { resumo: { servicos: number; objetivos: number; versaoEstrategia: number | null; registrosOperacionais: number } }

const roteiro = [
  { numero: 1, titulo: 'Analisar o ambiente', texto: 'Observe o contexto da organização e registre forças, fraquezas, oportunidades e ameaças.', exemplo: 'Ex.: equipe técnica experiente e pouca automação para clientes corporativos.', href: '/analise', acao: 'Registrar análise' },
  { numero: 2, titulo: 'Definir a direção', texto: 'Transforme a análise em uma estratégia usando Perspectiva, Posição, Plano e Padrão.', exemplo: 'Ex.: lançar o portal B2B em até seis meses.', href: '/estrategia', acao: 'Definir os quatro Ps' },
  { numero: 3, titulo: 'Organizar os serviços', texto: 'Crie objetivos e serviços, registre custos e demanda e explique como eles apoiam o negócio.', exemplo: 'Ex.: vincular o Portal B2B ao objetivo de ampliar a atuação corporativa.', href: '/objetivos', acao: 'Criar objetivos' },
  { numero: 4, titulo: 'Operar e medir', texto: 'Configure indicadores, coloque um serviço em operação e execute uma simulação com dados fictícios.', exemplo: 'Ex.: acompanhar o tempo médio de atendimento em minutos.', href: '/servicos', acao: 'Abrir portfólio' },
  { numero: 5, titulo: 'Avaliar e melhorar', texto: 'Compare os resultados com as metas, identifique lacunas e revise a estratégia criando uma nova versão.', exemplo: 'Ex.: uma média de 16 minutos não atinge uma meta de até 15 minutos.', href: '/indicadores/painel', acao: 'Ver indicadores' }
] as const;

export function PainelPage({ usuario }: { usuario: UsuarioPublico }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['organizacao'], queryFn: async () => (await api.get<OrganizacaoPainel | null>('/organizacoes/minha')).data });
  const [editando, setEditando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [tutorialAberto, setTutorialAberto] = useState(() => usuario.perfil === 'ALUNO' && localStorage.getItem(`eduitsm.tutorial.${usuario.id}`) !== 'concluido');
  const mutation = useMutation({ mutationFn: async (input: AtualizarOrganizacaoInput) => (await api.put<OrganizacaoPainel>('/organizacoes/minha', input)).data, onSuccess: (data) => { cache.setQueryData(['organizacao'], data); setEditando(false); setSucesso(true); } });
  if (query.isLoading) return <Layout usuario={usuario}><main className="page"><p role="status" className="state">Carregando organização…</p></main></Layout>;
  if (query.isError) return <Layout usuario={usuario}><main className="page"><div role="alert" className="alert error">⚠ Não foi possível carregar sua organização. <button onClick={() => query.refetch()}>Tentar novamente</button></div></main></Layout>;
  if (!query.data) return <Layout usuario={usuario}><main className="page"><p className="state">Nenhuma organização disponível.</p></main></Layout>;
  const org = query.data;
  return <Layout usuario={usuario} organizacao={org.nome}>
    <main className="page">
      <h1>Painel inicial da organização</h1>
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
      <section className="learning-guide" aria-labelledby="learning-guide-title">
        <div className="learning-guide-heading"><div><small>ROTEIRO DE APRENDIZAGEM</small><h2 id="learning-guide-title">Como fazer gestão da estratégia?</h2><p>Você vai decidir quais serviços oferecer, para quem, com quais recursos e como medir se eles apoiam os objetivos do negócio.</p></div><span className="learning-badge">5 etapas</span></div>
        <div className="learning-steps">{roteiro.map((etapa) => <article className="learning-step" key={etapa.numero}><div className="learning-step-number" aria-hidden="true">{etapa.numero}</div><div><h3>{etapa.titulo}</h3><p>{etapa.texto}</p><p className="learning-example"><strong>Exemplo:</strong> {etapa.exemplo.replace('Ex.: ', '')}</p><Link className="secondary-action" to={etapa.href}>{etapa.acao} <span aria-hidden="true">→</span></Link></div></article>)}</div>
      </section>
      <h2>Ciclo contínuo da estratégia de serviço</h2>
      <section className="cycle">{['Analisar o ambiente', 'Definir a direção', 'Desenhar os serviços', 'Operar (simulação)', 'Medir e avaliar', 'Decidir melhoria'].map((title, i) => <article key={title}><small>ETAPA {i + 1}</small><h3>{title}</h3><p>{i === 0 ? 'Próximo passo recomendado' : 'Disponível nas próximas fases'}</p></article>)}</section>
      <div className="alert attention">ⓘ <strong>Próximo passo sugerido:</strong> inicie pela análise do ambiente para formular a estratégia da organização.</div>
      {tutorialAberto && <MentorIntro usuario={usuario} onClose={() => { localStorage.setItem(`eduitsm.tutorial.${usuario.id}`, 'concluido'); setTutorialAberto(false); }} />}
    </main>
  </Layout>;
}

function MentorIntro({ usuario, onClose }: { usuario: UsuarioPublico; onClose: () => void }) {
  const [passo, setPasso] = useState(0);
  const etapa = roteiro[passo] ?? roteiro[0];
  const ultimo = passo === roteiro.length - 1;
  const iniciar = () => { onClose(); window.location.assign(etapa.href); };
  return <div className="mentor-overlay" role="dialog" aria-modal="true" aria-labelledby="mentor-title">
    <div className="mentor-card">
      <button className="mentor-close" type="button" aria-label="Pular tutorial" onClick={onClose}>×</button>
      <div className="mentor-character" aria-hidden="true"><span>🧭</span></div>
      <div className="mentor-content"><p className="mentor-eyebrow">GUIA DE PRIMEIRA MISSÃO</p><h2 id="mentor-title">Olá, {usuario.nome.split(' ')[0]}! Eu sou a Nina.</h2><p>Vou acompanhar você nesta missão: transformar uma ideia de negócio em uma estratégia de serviços de TI que pode ser testada e melhorada.</p><div className="mentor-progress" aria-label={`Passo ${passo + 1} de ${roteiro.length}`}><span style={{ width: `${((passo + 1) / roteiro.length) * 100}%` }} /></div><p className="mentor-step-label">Passo {passo + 1} de {roteiro.length}</p><h3>{etapa.titulo}</h3><p>{etapa.texto}</p><p className="mentor-speech">“{etapa.exemplo}”</p><div className="mentor-actions"><button type="button" onClick={onClose}>Pular tutorial</button>{ultimo ? <button type="button" className="primary" onClick={iniciar}>Começar missão</button> : <button type="button" className="primary" onClick={() => setPasso((atual) => atual + 1)}>Próximo passo</button>}</div></div>
    </div>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <article><small>{label}</small><strong aria-label={String(value)}>{value}</strong><span>{note}</span></article>; }

function EditForm({ org, saving, onSave, onCancel }: { org: OrganizacaoPainel; saving: boolean; onSave: (data: AtualizarOrganizacaoInput) => void; onCancel: () => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ nome: String(form.get('nome')), setor: String(form.get('setor')), descricao: String(form.get('descricao')) }); };
  return <form className="edit-form" onSubmit={submit}><h2>Editar organização</h2><label htmlFor="org-nome">Nome da organização</label><input id="org-nome" name="nome" minLength={2} maxLength={120} required defaultValue={org.nome} /><label htmlFor="org-setor">Setor</label><input id="org-setor" name="setor" maxLength={80} defaultValue={org.setor ?? ''} /><label htmlFor="org-descricao">Descrição</label><textarea id="org-descricao" name="descricao" maxLength={1000} defaultValue={org.descricao ?? ''} /><div><button type="button" onClick={onCancel}>Cancelar</button><button className="primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div></form>;
}
