import axe from 'axe-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AmbientesPage } from '../pages/ambientes-page.js';
import { LoginPage } from '../pages/login-page.js';
import { RelatorioPage } from '../pages/relatorio-page.js';
import { api } from '../services/api.js';
import { AuthProvider } from '../auth/auth-context.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn() }, setUnauthorizedHandler: vi.fn(() => () => {}) }));

const professor = { id: 'p1', nome: 'Rafael Professor', email: 'professor@eduitsm.local', perfil: 'PROFESSOR' as const };
const aluno = { id: 'u1', nome: 'Ana Silva', email: 'ana@eduitsm.local', perfil: 'ALUNO' as const };
const ambientes = {
  items: [{ id: 'org-ana', aluno: { nome: 'Ana Silva' }, organizacao: { nome: 'TechNova Retail', setor: 'Varejo' }, progresso: { psCompletos: 4, servicos: 1, vinculos: 1, indicadores: 1, cenarioGerado: true } }],
  total: 1,
  pagina: 1,
  limite: 20
};
const relatorioIncompleto = {
  organizacao: { nome: 'TechNova Retail', setor: 'Varejo', descricao: 'Estudo de caso' },
  estrategia: { versao: 1, atualizadaEm: '2026-09-08T12:00:00.000Z', perspectiva: 'Expandir vendas', posicao: 'Diferenciação', plano: '', padrao: 'Automação' },
  objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: '2026-12-31', status: 'ATIVO' }],
  servicos: [{ nome: 'Portal B2B', descricao: 'Canal corporativo', publicoAlvo: 'Lojistas', status: 'EM_OPERACAO', vinculos: [], indicadores: [] }]
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AuthProvider><MemoryRouter>{children}</MemoryRouter></AuthProvider></QueryClientProvider>;
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

  it('não encontra violações axe automatizáveis no formulário de login renderizado', async () => {
    const { container } = render(<LoginPage />, { wrapper });

    const resultado = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(resultado.violations).toEqual([]);
  });

  it('não encontra violações axe automatizáveis na tabela e alerta do relatório renderizado', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: relatorioIncompleto });
    const { container } = render(<RelatorioPage usuario={aluno} />, { wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('A exportação está bloqueada');
    expect(screen.getAllByRole('table')).toHaveLength(2);
    const resultado = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(resultado.violations).toEqual([]);
  });
});
