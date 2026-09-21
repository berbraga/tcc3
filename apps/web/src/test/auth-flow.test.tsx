import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthResponse } from '@eduitsm/shared';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app.js';
import { AuthProvider, useAuth } from '../auth/auth-context.js';
import { parseSession } from '../auth/session.js';
import { api, setUnauthorizedHandler } from '../services/api.js';

const agora = Math.floor(Date.now() / 1000);
const token = (exp = agora + 3600) => `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify({ exp }))}.assinatura`;
const ana: AuthResponse = { token: token(), usuario: { id: 'u-ana', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' } };
const bia: AuthResponse = { token: token(), usuario: { id: 'u-bia', nome: 'Bia', email: 'bia@example.com', perfil: 'ALUNO' } };
const organizacao = { id: 'org-ana', nome: 'TechNova Retail', setor: 'Varejo', descricao: null, criadaEm: '2026-01-01T00:00:00Z', resumo: { servicos: 0, objetivos: 0, versaoEstrategia: null, registrosOperacionais: 0 } };

function renderApp(path = '/login', client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })) {
  return { client, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter></QueryClientProvider>) };
}

function TrocaUsuario() {
  const { replaceSession } = useAuth();
  return <button onClick={() => replaceSession(bia)}>Trocar usuário</button>;
}

describe('sessão reativa', () => {
  const adapterOriginal = api.defaults.adapter;

  beforeEach(() => {
    sessionStorage.clear();
    api.defaults.adapter = async (config) => {
      if (config.url === '/auth/login') return { data: ana, status: 200, statusText: 'OK', headers: {}, config };
      return { data: organizacao, status: 200, statusText: 'OK', headers: {}, config };
    };
  });

  afterEach(() => {
    if (adapterOriginal === undefined) delete api.defaults.adapter;
    else api.defaults.adapter = adapterOriginal;
    vi.restoreAllMocks();
  });

  it('reidrata somente uma sessão JWT válida e descarta JSON corrompido ou expirado', async () => {
    expect(parseSession(JSON.stringify(ana))).toEqual(ana);
    expect(parseSession('{quebrado')).toBeNull();
    expect(parseSession(JSON.stringify({ ...ana, token: token(agora - 1) }))).toBeNull();

    sessionStorage.setItem('eduitsm.auth', JSON.stringify({ ...ana, token: token(agora - 1) }));
    renderApp('/painel');
    expect(await screen.findByRole('heading', { name: 'Entrar na ferramenta' })).toBeInTheDocument();
    expect(sessionStorage.getItem('eduitsm.auth')).toBeNull();
  });

  it('entra no painel sem recarregar a página', async () => {
    renderApp();
    await userEvent.type(screen.getByLabelText('E-mail institucional'), ana.usuario.email);
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: /Painel inicial da organização/ })).toBeInTheDocument();
    expect(parseSession(sessionStorage.getItem('eduitsm.auth'))).toMatchObject({ usuario: ana.usuario });
  });

  it('preserva a sessão válida após refresh lógico', async () => {
    sessionStorage.setItem('eduitsm.auth', JSON.stringify(ana));
    renderApp('/painel');
    expect(await screen.findByRole('heading', { name: /Painel inicial da organização/ })).toBeInTheDocument();
    expect(screen.getByText('Ana · Aluno')).toBeInTheDocument();
  });

  it('sai, limpa o cache privado e retorna ao login', async () => {
    sessionStorage.setItem('eduitsm.auth', JSON.stringify(ana));
    const { client } = renderApp('/painel');
    await screen.findByRole('heading', { name: /Painel inicial da organização/ });
    client.setQueryData(['organizacao'], organizacao);

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('heading', { name: 'Entrar na ferramenta' })).toBeInTheDocument();
    expect(sessionStorage.getItem('eduitsm.auth')).toBeNull();
    expect(client.getQueryData(['organizacao'])).toBeUndefined();
  });

  it('limpa o cache ao trocar de usuário', () => {
    sessionStorage.setItem('eduitsm.auth', JSON.stringify(ana));
    const client = new QueryClient();
    client.setQueryData(['organizacao'], organizacao);
    render(<QueryClientProvider client={client}><AuthProvider><TrocaUsuario /></AuthProvider></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Trocar usuário' }));
    expect(parseSession(sessionStorage.getItem('eduitsm.auth'))).toMatchObject({ usuario: bia.usuario });
    expect(client.getQueryData(['organizacao'])).toBeUndefined();
  });

  it('trata 401 da API limpando sessão e cache privado', async () => {
    sessionStorage.setItem('eduitsm.auth', JSON.stringify(ana));
    const client = new QueryClient();
    client.setQueryData(['organizacao'], organizacao);
    render(<QueryClientProvider client={client}><AuthProvider><TrocaUsuario /></AuthProvider></QueryClientProvider>);
    api.defaults.adapter = async (config) => Promise.reject({ config, response: { status: 401, data: { code: 'NAO_AUTENTICADO' } } });

    await expect(api.get('/organizacoes/minha')).rejects.toMatchObject({ response: { status: 401 } });
    await waitFor(() => expect(sessionStorage.getItem('eduitsm.auth')).toBeNull());
    expect(client.getQueryData(['organizacao'])).toBeUndefined();
  });

  it('trata respostas 401 paralelas uma vez e volta a tratar uma nova sessão', async () => {
    let chamadas = 0;
    const remover = setUnauthorizedHandler(() => { chamadas += 1; });
    api.defaults.adapter = async (config) => Promise.reject({ config, response: { status: 401 } });

    await Promise.allSettled([api.get('/primeira'), api.get('/segunda')]);
    expect(chamadas).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(api.get('/terceira')).rejects.toMatchObject({ response: { status: 401 } });
    expect(chamadas).toBe(2);
    remover();
  });
});
