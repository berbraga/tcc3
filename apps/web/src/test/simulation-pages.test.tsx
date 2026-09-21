import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CenarioPage } from '../pages/cenario-page.js';
import { IndicadoresPainelPage } from '../pages/indicadores-painel-page.js';
import { api } from '../services/api.js';
import { AuthProvider } from '../auth/auth-context.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn() }, setUnauthorizedHandler: vi.fn(() => () => {}) }));

const usuario = { id: 'u1', nome: 'Ana Silva', email: 'ana@example.com', perfil: 'ALUNO' as const };
const servicos = [
  { id: 's1', nome: 'Portal B2B', status: 'EM_OPERACAO' },
  { id: 's2', nome: 'Central de atendimento', status: 'EM_OPERACAO' }
];
const painel = [
  { servicoId: 's1', nomeServico: 'Portal B2B', indicadorId: 'i1', nome: 'Disponibilidade de janeiro', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR', valor: 98.2, situacao: 'ABAIXO_DA_META', medicoes: 1, denominador: 12, evolucao: null, periodo: '2026-01', cenarioId: 'c1', cenario: { semente: 20260908, perfil: 'REALISTA', periodoInicio: '2026-01-01', periodoFim: '2026-01-31', geradorVersao: '1' } },
  { servicoId: 's2', nomeServico: 'Central de atendimento', indicadorId: 'i2', nome: 'Tempo médio de janeiro', tipo: 'TEMPO_ATENDIMENTO', unidade: 'h', meta: 4, sentido: 'MENOR_MELHOR', valor: 3.2, situacao: 'ACIMA_DA_META', medicoes: 1, denominador: 10, evolucao: 1.5, periodo: '2026-01', cenarioId: 'c1', cenario: { semente: 20260908, perfil: 'REALISTA', periodoInicio: '2026-01-01', periodoFim: '2026-01-31', geradorVersao: '1' } }
];
const painelFevereiro = [{ servicoId: 's1', nomeServico: 'Portal B2B', indicadorId: 'i1', nome: 'Disponibilidade de fevereiro', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR', valor: 99.95, situacao: 'ACIMA_DA_META', medicoes: 1, denominador: 12, evolucao: 1.75, periodo: '2026-02', cenarioId: 'c2', cenario: { semente: 20260909, perfil: 'REALISTA', periodoInicio: '2026-02-01', periodoFim: '2026-02-28', geradorVersao: '1' } }];

function renderPage(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter>{node}</MemoryRouter></AuthProvider></QueryClientProvider>);
}

function mockGet(respostas: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation(async (url: string, config?: unknown) => {
    const periodo = typeof config === 'object' && config !== null && 'params' in config && typeof config.params === 'object' && config.params !== null && 'periodo' in config.params && typeof config.params.periodo === 'string' ? config.params.periodo : undefined;
    if (url === '/organizacoes/minha') return { data: { nome: 'TechNova Retail' } };
    if (url === '/indicadores/painel' && periodo === '2026-02') return { data: painelFevereiro };
    if (url in respostas) return { data: respostas[url] };
    throw new Error(`GET não preparado: ${url}`);
  });
}

function adiar<T>() { let resolver!: (value: T) => void; return { promise: new Promise<T>((resolve) => { resolver = resolve; }), resolver }; }

describe('T12 cenário de simulação', () => {
  beforeEach(() => { vi.clearAllMocks(); mockGet({ '/servicos': servicos }); });

  it('envia o cenário real e comunica execução e conclusão', async () => {
    const execucao = adiar<{ data: { id: string; registrosGerados: number; medicoesGeradas: number } }>();
    vi.mocked(api.post).mockImplementation(() => execucao.promise);
    renderPage(<CenarioPage usuario={usuario} />);

    await screen.findByRole('checkbox', { name: 'Portal B2B' });
    await userEvent.clear(screen.getByLabelText('Semente'));
    await userEvent.type(screen.getByLabelText('Semente'), '42');
    await userEvent.type(screen.getByLabelText('Início do período'), '2026-09-01');
    await userEvent.type(screen.getByLabelText('Fim do período'), '2026-09-30');
    await userEvent.clear(screen.getByLabelText('Volume de registros'));
    await userEvent.type(screen.getByLabelText('Volume de registros'), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Executar simulação' }));

    expect(screen.getByRole('status')).toHaveTextContent('Executando simulação');
    expect(screen.getByRole('button', { name: 'Executando simulação…' })).toBeDisabled();
    expect(api.post).toHaveBeenCalledWith('/cenarios', { semente: 42, periodoInicio: '2026-09-01', periodoFim: '2026-09-30', volumeRegistros: 100, perfil: 'REALISTA', servicoIds: ['s1'] });

    execucao.resolver({ data: { id: 'c1', registrosGerados: 100, medicoesGeradas: 1 } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('100 registros e 1 medição'));
    expect(screen.getByRole('link', { name: 'Ver painel de indicadores' })).toHaveAttribute('href', '/indicadores/painel');
  });

  it('exige ao menos um serviço em operação antes de executar', async () => {
    renderPage(<CenarioPage usuario={usuario} />);

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Portal B2B' }));
    expect(screen.getByRole('button', { name: 'Executar simulação' })).toBeDisabled();
  });
});

describe('T13 painel de indicadores', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('orienta quando ainda não existem medições', async () => {
    mockGet({ '/indicadores/painel': [] });
    renderPage(<IndicadoresPainelPage usuario={usuario} />);

    expect(await screen.findByText(/Nenhuma medição simulada disponível/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar cenário de simulação' })).toHaveAttribute('href', '/cenarios');
  });

  it('mostra dados reais, filtra por serviço e conduz a revisão abaixo da meta', async () => {
    mockGet({ '/indicadores/painel': painel });
    renderPage(<IndicadoresPainelPage usuario={usuario} />);

    expect(await screen.findByText('Disponibilidade de janeiro')).toBeInTheDocument();
    expect(screen.getByText('Abaixo da meta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revisar estratégia' })).toHaveAttribute('href', '/estrategia');
    expect(screen.getByRole('status')).toHaveTextContent('1 de 2 indicadores abaixo da meta');
    expect(screen.getAllByText(/Semente 20260908/).length).toBeGreaterThan(1);
    expect(screen.getByText(/12 registros válidos/)).toBeInTheDocument();
    expect(screen.getByText(/Evolução: \+1.5/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por serviço'), 's1');
    expect(screen.queryByText('Tempo médio de janeiro')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Período de referência'), '2026-02');
    expect(await screen.findByText('Disponibilidade de fevereiro')).toBeInTheDocument();
    expect(screen.queryByText('Disponibilidade de janeiro')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('período de referência 2026-02');
    expect(api.get).toHaveBeenCalledWith('/indicadores/painel');
    expect(api.get).toHaveBeenCalledWith('/indicadores/painel', { params: { periodo: '2026-02' } });
  });
});
