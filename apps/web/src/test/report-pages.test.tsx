import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelatorioPage } from '../pages/relatorio-page.js';
import { AmbientesPage } from '../pages/ambientes-page.js';
import { api } from '../services/api.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn() } }));

const aluno = { id: 'u1', nome: 'Ana Silva', email: 'ana@example.com', perfil: 'ALUNO' as const };
const professor = { id: 'p1', nome: 'Rafael Professor', email: 'professor@example.com', perfil: 'PROFESSOR' as const };
const relatorio = {
  organizacao: { nome: 'TechNova Retail', setor: 'Varejo', descricao: 'Estudo de caso' },
  estrategia: { versao: 3, atualizadaEm: '2026-09-08T12:00:00.000Z', perspectiva: 'Expandir vendas B2B', posicao: 'Crédito automatizado', plano: 'Portal em seis meses', padrao: 'Automação recorrente' },
  objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: '2026-12-31', status: 'ATIVO' }],
  servicos: [{ nome: 'Portal B2B', descricao: 'Portal corporativo', publicoAlvo: 'Clientes corporativos', status: 'EM_OPERACAO', vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Amplia vendas', contribuicao: 100 }], indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR' }] }]
};
const ambientes = { items: [{ id: 'org-ana', aluno: { nome: 'Ana Silva' }, organizacao: { nome: 'TechNova Retail', setor: 'Varejo' }, progresso: { psCompletos: 4, servicos: 1, vinculos: 1, indicadores: 1, cenarioGerado: true } }], total: 1, pagina: 1, limite: 20 };

function renderPage(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}

function mockGet(respostas: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/organizacoes/minha') return { data: { nome: 'Ambiente do Professor' } };
    if (url in respostas) return { data: respostas[url] };
    throw new Error(`GET não preparado: ${url}`);
  });
}

describe('T14 e T14b relatório da estratégia', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('consolida a estratégia e o portfólio retornados pela API real', async () => {
    mockGet({ '/relatorios/estrategia': relatorio });
    renderPage(<RelatorioPage usuario={aluno} />);

    expect(await screen.findByText('Expandir vendas B2B')).toBeInTheDocument();
    expect(screen.getByText('Portal B2B')).toBeInTheDocument();
    expect(screen.getByText('OE-01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar relatório' })).toBeEnabled();
    expect(api.get).toHaveBeenCalledWith('/relatorios/estrategia');
  });

  it('explica e bloqueia a exportação com qualquer P incompleto', async () => {
    mockGet({ '/relatorios/estrategia': { ...relatorio, estrategia: { ...relatorio.estrategia, plano: '' } } });
    renderPage(<RelatorioPage usuario={aluno} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('A exportação está bloqueada');
    expect(screen.getByRole('button', { name: 'Exportar relatório' })).toBeDisabled();
  });
});

describe('T15 acompanhamento dos ambientes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('mostra ao professor somente o resumo paginado dos alunos e a navegação do perfil', async () => {
    mockGet({ '/professor/ambientes': ambientes });
    renderPage(<AmbientesPage usuario={professor} />);

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('4 de 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'T15 · Acompanhamento de alunos' })).toHaveAttribute('href', '/professor/ambientes');
    expect(screen.getAllByText(/somente leitura/)).not.toHaveLength(0);
    expect(api.get).toHaveBeenCalledWith('/professor/ambientes');
  });

  it('não oferece o menu de professor para aluno', async () => {
    mockGet({ '/relatorios/estrategia': relatorio });
    renderPage(<RelatorioPage usuario={aluno} />);

    await screen.findByText('Expandir vendas B2B');
    expect(screen.queryByRole('link', { name: 'T15 · Acompanhamento de alunos' })).not.toBeInTheDocument();
  });
});
