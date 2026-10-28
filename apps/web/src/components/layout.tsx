import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { Logo } from '../pages/login-page.js';
import { api } from '../services/api.js';
import { concluirMissao, lerMissao, missoes } from '../services/missions.js';

const grupos = [
  ['ESTRATÉGIA', [['Painel inicial', '/painel'], ['Análise de ambiente', '/analise'], ['Estratégia (4 Ps)', '/estrategia'], ['Objetivos estratégicos', '/objetivos']]],
  ['PORTFÓLIO', [['Serviços de TI', '/servicos'], ['Vínculo estratégico', '/vinculos'], ['Indicadores', '/indicadores']]],
  ['AVALIAÇÃO', [['Cenário de simulação', '/cenarios'], ['Painel de indicadores', '/indicadores/painel'], ['Relatório da estratégia', '/relatorios/estrategia']]]
] as const;

export function Layout({ usuario, organizacao, carregarOrganizacao = false, children }: { usuario: UsuarioPublico; organizacao?: string; carregarOrganizacao?: boolean; children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [missaoAtual, setMissaoAtual] = useState(() => usuario.perfil === 'ALUNO' ? lerMissao(usuario.id) : missoes.length);
  useEffect(() => { const atualizar = () => setMissaoAtual(usuario.perfil === 'ALUNO' ? lerMissao(usuario.id) : missoes.length); window.addEventListener('eduitsm:missao-atualizada', atualizar); return () => window.removeEventListener('eduitsm:missao-atualizada', atualizar); }, [usuario.id, usuario.perfil]);
  const organizacaoQuery = useQuery({
    queryKey: ['organizacao'],
    queryFn: async () => (await api.get<{ nome: string }>('/organizacoes/minha')).data,
    enabled: carregarOrganizacao && !organizacao
  });
  const nomeOrganizacao = organizacao ?? organizacaoQuery.data?.nome ?? (carregarOrganizacao && organizacaoQuery.isLoading ? 'carregando…' : 'indisponível');
  const missao = missoes[missaoAtual];
  const alunoEmMissao = usuario.perfil === 'ALUNO' && Boolean(missao);
  const navegarMissao = () => navigate(missao?.href ?? '/painel');
  const finalizarMissao = () => { concluirMissao(usuario.id); navigate('/painel'); };
  useEffect(() => {
    let ativo = true;
    const enviarPresenca = () => {
      if (!ativo) return;
      const post = (api as typeof api & { post?: typeof api.post }).post;
      if (!post) return;
      void Promise.resolve(post('/atividade/presenca', { pagina: location.pathname, missao: usuario.perfil === 'ALUNO' ? lerMissao(usuario.id) : null, acao: 'navegou' })).catch(() => undefined);
    };
    enviarPresenca();
    const intervalo = window.setInterval(enviarPresenca, 10_000);
    return () => { ativo = false; window.clearInterval(intervalo); };
  }, [location.pathname, usuario.id, usuario.perfil]);
  return <div className="app-shell">
    <aside><Logo />{grupos.map(([titulo, itens]) => <nav key={titulo} aria-label={titulo}><h2>{titulo}</h2>{itens.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}</nav>)}{usuario.perfil === 'PROFESSOR' && <nav aria-label="TURMA"><h2>TURMA</h2><NavLink to="/professor/ambientes">Acompanhamento de alunos</NavLink></nav>}</aside>
    <div className="workspace">
      <header><span>Organização: <strong>{nomeOrganizacao}</strong></span><span>{usuario.nome} · {usuario.perfil === 'ALUNO' ? 'Aluno' : 'Professor'} <b className="avatar">{usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}</b> <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sair</button></span></header>
      {alunoEmMissao && missao && <section className="mission-bar" aria-label="Missão atual"><div><small>MISSÃO {missaoAtual + 1} DE {missoes.length}</small><strong>{missao.titulo}</strong><span>{missao.descricao}</span></div><div className="mission-actions"><button type="button" onClick={navegarMissao}>{location.pathname === missao.href ? 'Continuar nesta missão' : 'Abrir missão'}</button><button type="button" className="primary" onClick={finalizarMissao}>Concluir missão</button></div></section>}
      {children}
    </div>
  </div>;
}
