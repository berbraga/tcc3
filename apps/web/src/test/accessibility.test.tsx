import axe from 'axe-core';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AmbientesPage } from '../pages/ambientes-page.js';
import { LoginPage } from '../pages/login-page.js';
import { api } from '../services/api.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const professor = { id: 'p1', nome: 'Rafael Professor', email: 'professor@eduitsm.local', perfil: 'PROFESSOR' as const };
const ambientes = {
  items: [{ id: 'org-ana', aluno: { nome: 'Ana Silva' }, organizacao: { nome: 'TechNova Retail', setor: 'Varejo' }, progresso: { psCompletos: 4, servicos: 1, vinculos: 1, indicadores: 1, cenarioGerado: true } }],
  total: 1,
  pagina: 1,
  limite: 20
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
}

describe('acessibilidade de formulários, tabelas e mensagens', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('associa os campos de login a rótulos e mantém foco alcançável por teclado', async () => {
    const teclado = userEvent.setup();
    render(<LoginPage />, { wrapper });

    await teclado.tab();
    expect(screen.getByLabelText('E-mail institucional')).toHaveFocus();
    await teclado.tab();
    expect(screen.getByLabelText('Senha')).toHaveFocus();
    await teclado.tab();
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveFocus();
  });

  it('expõe erro de login por papel semântico, além da apresentação visual', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { data: { message: 'E-mail ou senha inválidos.' } } });
    render(<LoginPage />, { wrapper });

    await userEvent.type(screen.getByLabelText('E-mail institucional'), 'ana@eduitsm.local');
    await userEvent.type(screen.getByLabelText('Senha'), 'incorreta');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });

  it('mantém cabeçalhos de tabela legíveis para o acompanhamento do professor', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/professor/ambientes') return { data: ambientes };
      if (url === '/organizacoes/minha') return { data: { nome: 'Ambiente do Professor' } };
      throw new Error(`GET não preparado: ${url}`);
    });
    render(<AmbientesPage usuario={professor} />, { wrapper });

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Aluno', 'Organização', '4 Ps', 'Serviços', 'Vínculos', 'Indicadores', 'Simulação']);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  });

  it('não encontra violações axe automatizáveis no documento inicial', async () => {
    const html = await readFile('index.html', 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    dom.window.eval(axe.source);
    const resultado = await (dom.window as unknown as { axe: typeof axe }).axe.run(dom.window.document, { rules: { 'color-contrast': { enabled: false } } });
    dom.window.close();
    expect(resultado.violations).toEqual([]);
  });
});
