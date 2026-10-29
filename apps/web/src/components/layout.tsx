import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { UsuarioPublico } from '@eduitsm/shared';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { Logo } from '../pages/login-page.js';
import { InfoTooltip } from './info-tooltip.js';
import { api } from '../services/api.js';
import { concluirMissao, lerMissao, missoes } from '../services/missions.js';

const grupos = [
  ['ESTRATÉGIA', [['Painel inicial', '/painel'], ['Análise de ambiente', '/analise'], ['Estratégia (4 Ps)', '/estrategia'], ['Objetivos estratégicos', '/objetivos']]],
  ['PORTFÓLIO', [['Serviços de TI', '/servicos'], ['Vínculo estratégico', '/vinculos'], ['Indicadores', '/indicadores']]],
  ['AVALIAÇÃO', [['Cenário de simulação', '/cenarios'], ['Painel de indicadores', '/indicadores/painel'], ['Relatório da estratégia', '/relatorios/estrategia']]]
] as const;

const ajudaPorRota: Array<[string, string, string]> = [
  ['/analise', 'Análise de ambiente', 'Registre fatos do caso como força, fraqueza, oportunidade ou ameaça.'],
  ['/estrategia', 'Estratégia (4 Ps)', 'Escreva Perspectiva, Posição, Plano e Padrão usando as falas e o histórico da TechNova.'],
  ['/objetivos', 'Objetivos estratégicos', 'Cadastre OBJ-01 e OBJ-02 exatamente como aparecem no caso de negócio.'],
  ['/servicos', 'Serviços de TI', 'Cadastre o Portal de Vendas Corporativas e depois complete custos, demanda e indicadores.'],
  ['/vinculos', 'Vínculo estratégico', 'Crie o indicador antes do vínculo e explique como o serviço apoia o objetivo.'],
  ['/indicadores', 'Indicadores', 'Defina nome, unidade, meta e sentido para cada indicador que será medido.'],
  ['/cenarios', 'Cenário de simulação', 'Use semente 2026, período de janeiro/2027, volume 500 e perfil Realista.'],
  ['/indicadores/painel', 'Painel de indicadores', 'Compare os resultados com as metas e decida se o Plano deve ser mantido ou revisado.'],
  ['/relatorios/estrategia', 'Relatório da estratégia', 'Use o relatório para organizar a recomendação final à diretoria.'],
  ['/professor/ambientes', 'Acompanhamento do professor', 'Consulte o progresso e a atividade dos alunos em modo somente leitura.']
];

export function Layout({ usuario, organizacao, carregarOrganizacao = false, children }: { usuario: UsuarioPublico; organizacao?: string; carregarOrganizacao?: boolean; children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [missaoAtual, setMissaoAtual] = useState(() => usuario.perfil === 'ALUNO' ? lerMissao(usuario.id) : missoes.length);
  const [menuAberto, setMenuAberto] = useState(false);
  useEffect(() => { const atualizar = () => setMissaoAtual(usuario.perfil === 'ALUNO' ? lerMissao(usuario.id) : missoes.length); window.addEventListener('eduitsm:missao-atualizada', atualizar); return () => window.removeEventListener('eduitsm:missao-atualizada', atualizar); }, [usuario.id, usuario.perfil]);
  const organizacaoQuery = useQuery({
    queryKey: ['organizacao'],
    queryFn: async () => (await api.get<{ nome: string }>('/organizacoes/minha')).data,
    enabled: carregarOrganizacao && !organizacao
  });
  const nomeOrganizacao = organizacao ?? organizacaoQuery.data?.nome ?? (carregarOrganizacao && organizacaoQuery.isLoading ? 'carregando…' : 'indisponível');
  const ajuda = ajudaPorRota.find(([rota]) => location.pathname === rota || location.pathname.startsWith(`${rota}/`));
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
  const fecharMenu = () => setMenuAberto(false);
  return <div className="app-shell">
    {menuAberto && <button className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={fecharMenu} />}
    <aside className={menuAberto ? 'menu-aberto' : ''}><div className="mobile-menu-heading"><Logo /><button type="button" aria-label="Fechar menu" tabIndex={menuAberto ? 0 : -1} onClick={fecharMenu}>×</button></div>{!menuAberto && <div className="desktop-menu-logo"><Logo /></div>}{grupos.map(([titulo, itens]) => <nav key={titulo} aria-label={titulo}><h2>{titulo}</h2>{itens.map(([label, href]) => <NavLink key={label} to={href} onClick={fecharMenu}>{label}</NavLink>)}</nav>)}{usuario.perfil === 'PROFESSOR' && <nav aria-label="TURMA"><h2>TURMA</h2><NavLink to="/professor/ambientes" onClick={fecharMenu}>Acompanhamento de alunos</NavLink></nav>}</aside>
    <div className="workspace">
      <header><button className="mobile-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded={menuAberto} onClick={() => setMenuAberto(true)}>☰ <span>Menu</span></button><span className="organization-label">Organização: <strong>{nomeOrganizacao}</strong></span><span className="user-actions"><span className="user-name">{usuario.nome} · {usuario.perfil === 'ALUNO' ? 'Aluno' : 'Professor'}</span><b className="avatar">{usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}</b> <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sair</button></span></header>
      {ajuda && <div className="screen-help"><strong>{ajuda[1]}</strong><InfoTooltip text={ajuda[2]} label={`Ver orientação de ${ajuda[1]}`} /></div>}
      {alunoEmMissao && missao && <section className="mission-bar" aria-label="Missão atual"><div><small>MISSÃO {missaoAtual + 1} DE {missoes.length}</small><strong>{missao.titulo}</strong><span>{missao.descricao}</span></div><div className="mission-actions"><button type="button" onClick={navegarMissao}>{location.pathname === missao.href ? 'Continuar nesta missão' : 'Abrir missão'}</button><button type="button" className="primary" onClick={finalizarMissao}>Concluir missão</button></div></section>}
      {children}
    </div>
  </div>;
}
