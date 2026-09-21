import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelatorioPage } from '../pages/relatorio-page.js';
import { AmbientesPage } from '../pages/ambientes-page.js';
import { api } from '../services/api.js';
import { AuthProvider } from '../auth/auth-context.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn() }, setUnauthorizedHandler: vi.fn(() => () => {}) }));

const aluno = { id: 'u1', nome: 'Ana Silva', email: 'ana@example.com', perfil: 'ALUNO' as const };
const professor = { id: 'p1', nome: 'Rafael Professor', email: 'professor@example.com', perfil: 'PROFESSOR' as const };
const relatorio = {
  organizacao: { nome: 'TechNova Retail', setor: 'Varejo', descricao: 'Estudo de caso' },
  estrategia: { versao: 3, atualizadaEm: '2026-09-08T12:00:00.000Z', perspectiva: 'Expandir vendas B2B', posicao: 'Crédito automatizado', plano: 'Portal em seis meses', padrao: 'Automação recorrente' },
  objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: '2026-12-31', status: 'ATIVO' }],
  servicos: [{ nome: 'Portal B2B', descricao: 'Portal corporativo', publicoAlvo: 'Clientes corporativos', status: 'EM_OPERACAO', vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Amplia vendas', contribuicao: 100 }], indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR' }] }]
};
const ambientes = { items: [{ id: 'org-ana', aluno: { nome: 'Ana Silva' }, organizacao: { nome: 'TechNova Retail', setor: 'Varejo' }, progresso: { psCompletos: 4, servicos: 1, vinculos: 1, indicadores: 1, cenarioGerado: true } }], total: 1, pagina: 1, limite: 20 };
const ambientesPagina2 = { items: [{ id: 'org-bia', aluno: { nome: 'Bia Souza' }, organizacao: { nome: 'Inova Saúde', setor: 'Saúde' }, progresso: { psCompletos: 2, servicos: 1, vinculos: 0, indicadores: 0, cenarioGerado: false } }], total: 21, pagina: 2, limite: 20 };

function renderPage(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AuthProvider><MemoryRouter>{node}</MemoryRouter></AuthProvider></QueryClientProvider>);
}

function mockGet(respostas: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation(async (url: string, config?: unknown) => {
    if (url === '/organizacoes/minha') return { data: { nome: 'Ambiente do Professor' } };
    const pagina = typeof config === 'object' && config && 'params' in config && typeof config.params === 'object' && config.params && 'pagina' in config.params && typeof config.params.pagina === 'number' ? config.params.pagina : undefined;
    if (url === '/professor/ambientes' && pagina === 2) return { data: ambientesPagina2 };
    if (url in respostas) return { data: respostas[url] };
    throw new Error(`GET não preparado: ${url}`);
  });
}

describe('T14 e T14b relatório da estratégia', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:relatorio'), revokeObjectURL: vi.fn() }); });

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

  it('baixa o HTML exportado, revoga a URL temporária e confirma a conclusão', async () => {
    mockGet({ '/relatorios/estrategia': relatorio, '/relatorios/estrategia/exportacao': new Blob(['<h1>Relatório</h1>'], { type: 'text/html' }) });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage(<RelatorioPage usuario={aluno} />);

    await screen.findByText('Expandir vendas B2B');
    await userEvent.click(screen.getByRole('button', { name: 'Exportar relatório' }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/relatorios/estrategia/exportacao', { responseType: 'blob' }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:relatorio');
    expect(await screen.findByRole('status')).toHaveTextContent('Relatório exportado com sucesso.');
  });

  it('informa o bloqueio 422 retornado durante a exportação', async () => {
    mockGet({ '/relatorios/estrategia': relatorio });
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/relatorios/estrategia') return { data: relatorio };
      if (url === '/relatorios/estrategia/exportacao') throw { response: { status: 422, data: { code: 'ESTRATEGIA_INCOMPLETA' } } };
      throw new Error(`GET não preparado: ${url}`);
    });
    renderPage(<RelatorioPage usuario={aluno} />);

    await screen.findByText('Expandir vendas B2B');
    await userEvent.click(screen.getByRole('button', { name: 'Exportar relatório' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A exportação foi bloqueada');
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
    expect(api.get).toHaveBeenCalledWith('/professor/ambientes', { params: { pagina: 1, limite: 20 } });
  });

  it('consulta a próxima página com paginação explícita e permite retornar', async () => {
    mockGet({ '/professor/ambientes': { ...ambientes, total: 21 } });
    renderPage(<AmbientesPage usuario={professor} />);

    await screen.findByText('Ana Silva');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(await screen.findByText('Bia Souza')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/professor/ambientes', { params: { pagina: 2, limite: 20 } });
    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
  });

  it('não oferece o menu de professor para aluno', async () => {
    mockGet({ '/relatorios/estrategia': relatorio });
    renderPage(<RelatorioPage usuario={aluno} />);

    await screen.findByText('Expandir vendas B2B');
    expect(screen.queryByRole('link', { name: 'T15 · Acompanhamento de alunos' })).not.toBeInTheDocument();
  });
});
