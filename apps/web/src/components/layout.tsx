import type { ReactNode } from 'react';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { Logo } from '../pages/login-page.js';
import { api } from '../services/api.js';

const grupos = [
  ['ESTRATÉGIA', [['T02 · Painel inicial', '/painel'], ['T03 · Análise de ambiente', '/analise'], ['T04 · Estratégia (4 Ps)', '/estrategia'], ['T05 · Objetivos estratégicos', '/objetivos']]],
  ['PORTFÓLIO', [['T06 · Serviços de TI', '/servicos'], ['T10 · Vínculo estratégico', '/vinculos'], ['T11 · Indicadores', '/indicadores']]],
  ['AVALIAÇÃO', [['T12 · Cenário de simulação', '/cenarios'], ['T13 · Painel de indicadores', '/indicadores/painel'], ['T14 · Relatório da estratégia', '/relatorios/estrategia']]]
] as const;

export function Layout({ usuario, organizacao, carregarOrganizacao = false, children }: { usuario: UsuarioPublico; organizacao?: string; carregarOrganizacao?: boolean; children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const organizacaoQuery = useQuery({
    queryKey: ['organizacao'],
    queryFn: async () => (await api.get<{ nome: string }>('/organizacoes/minha')).data,
    enabled: carregarOrganizacao && !organizacao
  });
  const nomeOrganizacao = organizacao ?? organizacaoQuery.data?.nome ?? (carregarOrganizacao && organizacaoQuery.isLoading ? 'carregando…' : 'indisponível');
  return <div className="app-shell">
    <aside><Logo />{grupos.map(([titulo, itens]) => <nav key={titulo} aria-label={titulo}><h2>{titulo}</h2>{itens.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}</nav>)}{usuario.perfil === 'PROFESSOR' && <nav aria-label="TURMA"><h2>TURMA</h2><NavLink to="/professor/ambientes">T15 · Acompanhamento de alunos</NavLink></nav>}</aside>
    <div className="workspace">
      <header><span>Organização: <strong>{nomeOrganizacao}</strong></span><span>{usuario.nome} · {usuario.perfil === 'ALUNO' ? 'Aluno' : 'Professor'} <b className="avatar">{usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}</b> <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sair</button></span></header>
      {children}
    </div>
  </div>;
}
