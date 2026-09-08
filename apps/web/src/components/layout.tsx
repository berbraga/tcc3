import type { ReactNode } from 'react';
import type { UsuarioPublico } from '@eduitsm/shared';
import { NavLink } from 'react-router-dom';
import { Logo } from '../pages/login-page.js';

const grupos = [
  ['ESTRATÉGIA', [['T02 · Painel inicial', '/painel'], ['T03 · Análise de ambiente', ''], ['T04 · Estratégia (4 Ps)', ''], ['T05 · Objetivos estratégicos', '']]],
  ['PORTFÓLIO', [['T06 · Serviços de TI', ''], ['T10 · Vínculo estratégico', ''], ['T11 · Indicadores', '']]],
  ['AVALIAÇÃO', [['T12 · Cenário de simulação', ''], ['T13 · Painel de indicadores', ''], ['T14 · Relatório da estratégia', '']]]
] as const;

export function Layout({ usuario, organizacao, children }: { usuario: UsuarioPublico; organizacao?: string; children: ReactNode }) {
  return <div className="app-shell">
    <aside><Logo />{grupos.map(([titulo, itens]) => <nav key={titulo} aria-label={titulo}><h2>{titulo}</h2>{itens.map(([label, href]) => href ? <NavLink key={label} to={href}>{label}</NavLink> : <span className="disabled-link" key={label} aria-disabled="true">{label}<small>próxima fase</small></span>)}</nav>)}</aside>
    <div className="workspace">
      <header><span>Organização: <strong>{organizacao ?? 'carregando…'}</strong></span><span>{usuario.nome} · {usuario.perfil === 'ALUNO' ? 'Aluno' : 'Professor'} <b className="avatar">{usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}</b></span></header>
      {children}
    </div>
  </div>;
}
