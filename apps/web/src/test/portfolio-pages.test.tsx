import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicosPage } from '../pages/servicos-page.js';
import { CustosPage } from '../pages/custos-page.js';
import { DemandaPage } from '../pages/demanda-page.js';
import { VinculosPage } from '../pages/vinculos-page.js';
import { IndicadoresPage } from '../pages/indicadores-page.js';
import { api } from '../services/api.js';
import { AuthProvider } from '../auth/auth-context.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }, setUnauthorizedHandler: vi.fn(() => () => {}) }));

const usuario = { id: 'u1', nome: 'Ana Silva', email: 'ana@example.com', perfil: 'ALUNO' as const };
const servico = { id: 's1', organizacaoId: 'org1', nome: 'Portal B2B', descricao: 'Vendas corporativas', publicoAlvo: 'Clientes', status: 'EM_OPERACAO', criadoEm: '2026-09-08T00:00:00.000Z' };
const objetivo = { id: 'o1', organizacaoId: 'org1', codigo: 'OE-01', descricao: 'Crescer receita', prazo: null, status: 'ATIVO' };
const vinculo = { id: 'v1', servicoId: 's1', objetivoId: 'o1', indicadorId: 'i1', indicador: { id: 'i1', nome: 'Disponibilidade', tipo: 'SLA', unidade: '%' }, justificativaValor: 'Gera receita recorrente.', contribuicao: 35 };
const indicador = { id: 'i1', servicoId: 's1', objetivoId: 'o1', nome: 'Disponibilidade', tipo: 'SLA' as const, unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR' as const };

function renderPage(node: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AuthProvider></QueryClientProvider>);
}

function mockBase(extra: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/organizacoes/minha') return { data: { nome: 'TechNova Retail' } };
    if (url === '/servicos') return { data: [servico] };
    if (url === '/objetivos') return { data: [objetivo] };
    if (url in extra) return { data: extra[url] };
    throw new Error(`GET não preparado: ${url}`);
  });
}

function adiar<T>() { let resolver!: (value: T) => void; return { promise: new Promise<T>((resolve) => { resolver = resolve; }), resolver }; }

describe('T06 serviços e T07 cadastro', () => {
  beforeEach(() => { vi.clearAllMocks(); mockBase(); });

  it('cria, edita e exclui um serviço usando a API do portfólio', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ...servico, id: 's2', nome: 'Central de atendimento' } });
    vi.mocked(api.put).mockResolvedValue({ data: { ...servico, nome: 'Portal corporativo' } });
    vi.mocked(api.delete).mockResolvedValue({});
    renderPage(<ServicosPage usuario={usuario} />);

    expect((await screen.findByRole('link', { name: 'Custos de Portal B2B' }))).toHaveAttribute('href', '/servicos/s1/custos');
    expect(screen.getByRole('link', { name: 'Demanda de Portal B2B' })).toHaveAttribute('href', '/servicos/s1/demanda');

    await userEvent.click(await screen.findByRole('button', { name: 'Novo serviço' }));
    await userEvent.type(screen.getByLabelText('Nome do serviço'), 'Central de atendimento');
    await userEvent.selectOptions(screen.getByLabelText('Status no ciclo de vida'), 'EM_OPERACAO');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
    expect(api.post).toHaveBeenCalledWith('/servicos', { nome: 'Central de atendimento', descricao: null, publicoAlvo: null, status: 'EM_OPERACAO' });

    await userEvent.click(screen.getByRole('button', { name: 'Editar Portal B2B' }));
    await userEvent.clear(screen.getByLabelText('Nome do serviço'));
    await userEvent.type(screen.getByLabelText('Nome do serviço'), 'Portal corporativo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
    expect(api.put).toHaveBeenCalledWith('/servicos/s1', { nome: 'Portal corporativo', descricao: 'Vendas corporativas', publicoAlvo: 'Clientes', status: 'EM_OPERACAO' });

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Portal corporativo' }));
    expect(api.delete).toHaveBeenCalledWith('/servicos/s1');
    expect(await screen.findByRole('status')).toHaveTextContent('Serviço excluído com sucesso.');
  });

  it('mantém o serviço e mostra a orientação da API quando a exclusão retorna 422', async () => {
    vi.mocked(api.delete).mockRejectedValue({ response: { status: 422, data: { message: 'O serviço possui histórico relacionado e não pode ser excluído. Descontinue-o para preservá-lo.' } } });
    renderPage(<ServicosPage usuario={usuario} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Portal B2B' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Descontinue-o para preservá-lo');
    expect(screen.getByText('Portal B2B')).toBeInTheDocument();
  });
});

describe('T08 custos e T09 demanda', () => {
  beforeEach(() => { vi.clearAllMocks(); mockBase({ '/servicos/s1/custos': [], '/servicos/s1/demanda': [] }); });

  it('registra custo mensal previsto e realizado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'c1', servicoId: 's1', tipo: 'OPEX', periodo: '2026-09', valorPrevisto: 1500, valorRealizado: 1400 } });
    renderPage(<CustosPage usuario={usuario} servicoId="s1" />);
    await screen.findByText('Nenhum lançamento de custo registrado.');
    await userEvent.type(screen.getByLabelText('Período'), '2026-09');
    await userEvent.type(screen.getByLabelText('Valor previsto'), '1500');
    await userEvent.type(screen.getByLabelText('Valor realizado'), '1400');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar lançamento' }));
    expect(api.post).toHaveBeenCalledWith('/servicos/s1/custos', { tipo: 'OPEX', periodo: '2026-09', valorPrevisto: 1500, valorRealizado: 1400 });
    expect(await screen.findByRole('status')).toHaveTextContent('Lançamento adicionado com sucesso.');
  });

  it('separa CAPEX de OPEX em vez de somar grandezas diferentes', async () => {
    mockBase({ '/servicos/s1/custos': [
      { id: 'c-capex', servicoId: 's1', tipo: 'CAPEX', periodo: '2026-09', valorPrevisto: 150000, valorRealizado: null },
      { id: 'c-opex', servicoId: 's1', tipo: 'OPEX', periodo: '2026-09', valorPrevisto: 15000, valorRealizado: 14000 }
    ], '/servicos/s1/demanda': [] });
    renderPage(<CustosPage usuario={usuario} servicoId="s1" />);

    expect(await screen.findByText('CAPEX PREVISTO')).toBeInTheDocument();
    expect(screen.getByText('OPEX PREVISTO')).toBeInTheDocument();
    expect(screen.queryByText('PREVISTO ACUMULADO')).not.toBeInTheDocument();
  });

  it('registra demanda e identifica capacidade excedida', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'd1', servicoId: 's1', periodo: '2026-09', demandaPrevista: 120, capacidadeInstalada: 100, unidade: 'chamados' } });
    renderPage(<DemandaPage usuario={usuario} servicoId="s1" />);
    await screen.findByText('Nenhum período de demanda registrado.');
    await userEvent.type(screen.getByLabelText('Período'), '2026-09');
    await userEvent.type(screen.getByLabelText('Demanda prevista'), '120');
    await userEvent.type(screen.getByLabelText('Capacidade instalada'), '100');
    await userEvent.type(screen.getByLabelText('Unidade'), 'chamados');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar período' }));
    expect(api.post).toHaveBeenCalledWith('/servicos/s1/demanda', { periodo: '2026-09', demandaPrevista: 120, capacidadeInstalada: 100, unidade: 'chamados' });
    expect(await screen.findByText('Capacidade excedida')).toBeInTheDocument();
  });

  it('explicita ausência de capacidade em vez de apresentar utilização zero enganosa', async () => {
    mockBase({ '/servicos/s1/custos': [], '/servicos/s1/demanda': [{ id: 'd-sem-capacidade', servicoId: 's1', periodo: '2026-10', demandaPrevista: 10, capacidadeInstalada: 0, unidade: 'chamados' }] });
    renderPage(<DemandaPage usuario={usuario} servicoId="s1" />);

    expect(await screen.findByText('Sem capacidade instalada')).toBeInTheDocument();
    expect(screen.getByText('não calculável')).toBeInTheDocument();
  });
});

describe('T10 vínculos e T11 indicadores', () => {
  beforeEach(() => { vi.clearAllMocks(); mockBase({ '/vinculos': [], '/vinculos/pendencias': [servico], '/servicos/s1/indicadores': [] }); });

  it('mostra o serviço sem vínculo e explica o limite 422 de contribuição', async () => {
    mockBase({ '/vinculos': [], '/vinculos/pendencias': [servico], '/servicos/s1/indicadores': [indicador] });
    vi.mocked(api.post).mockRejectedValue({ response: { status: 422, data: { message: 'A contribuição excede 100%. Saldo disponível: 15%.' } } });
    renderPage(<VinculosPage usuario={usuario} />);
    expect(await screen.findByText('Portal B2B')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Indicador que demonstra a contribuição'), 'i1');
    await userEvent.type(screen.getByLabelText('Justificativa de valor'), 'Gera receita recorrente.');
    await userEvent.clear(screen.getByLabelText('Contribuição estimada'));
    await userEvent.type(screen.getByLabelText('Contribuição estimada'), '90');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saldo disponível: 15%');
  });

  it('cria e exclui vínculo, desabilitando a remoção enquanto a API responde', async () => {
    const exclusao = adiar<unknown>();
    mockBase({ '/vinculos': [], '/vinculos/pendencias': [servico], '/servicos/s1/indicadores': [indicador] });
    vi.mocked(api.post).mockResolvedValue({ data: vinculo });
    vi.mocked(api.delete).mockImplementation(() => exclusao.promise);
    renderPage(<VinculosPage usuario={usuario} />);
    await screen.findByText('Portal B2B');
    await userEvent.type(screen.getByLabelText('Justificativa de valor'), vinculo.justificativaValor);
    await userEvent.type(screen.getByLabelText('Contribuição estimada'), '35');
    await userEvent.selectOptions(screen.getByLabelText('Indicador que demonstra a contribuição'), 'i1');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }));
    expect(api.post).toHaveBeenCalledWith('/vinculos', expect.objectContaining({ servicoId: 's1', objetivoId: 'o1', indicadorId: 'i1', contribuicao: 35 }));
    await userEvent.click(await screen.findByRole('button', { name: 'Remover vínculo' }));
    expect(screen.getByRole('button', { name: 'Remover vínculo' })).toBeDisabled();
    exclusao.resolver({});
    expect(await screen.findByRole('status')).toHaveTextContent('Vínculo removido com sucesso.');
    expect(screen.queryByRole('button', { name: 'Remover vínculo' })).not.toBeInTheDocument();
  });

  it('mantém o indicador selecionado após erro e o mostra após recarregar vínculos', async () => {
    mockBase({ '/vinculos': [vinculo], '/vinculos/pendencias': [], '/servicos/s1/indicadores': [indicador] });
    vi.mocked(api.post).mockRejectedValue({ response: { data: { message: 'A contribuição excede 100%.' } } });
    renderPage(<VinculosPage usuario={usuario} />);

    await screen.findByRole('option', { name: 'Disponibilidade (SLA)' });
    expect(screen.getByText('Indicador: Disponibilidade (SLA)')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Indicador que demonstra a contribuição'), 'i1');
    await userEvent.type(screen.getByLabelText('Justificativa de valor'), 'Justificativa válida.');
    await userEvent.type(screen.getByLabelText('Contribuição estimada'), '35');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A contribuição excede 100%');
    expect(screen.getByLabelText('Indicador que demonstra a contribuição')).toHaveValue('i1');
  });

  it('não oferece vínculo novo sem indicador e orienta sua criação contextual', async () => {
    mockBase({ '/vinculos': [], '/vinculos/pendencias': [servico], '/servicos/s1/indicadores': [] });
    renderPage(<VinculosPage usuario={usuario} />);

    expect(await screen.findByRole('link', { name: 'Criar indicador para este serviço' })).toHaveAttribute('href', '/indicadores');
    expect(screen.getByRole('button', { name: 'Salvar vínculo' })).toBeDisabled();
  });

  it('mantém o vínculo e mostra a mensagem da API quando a exclusão falha', async () => {
    mockBase({ '/vinculos': [vinculo], '/vinculos/pendencias': [], '/servicos/s1/indicadores': [] });
    vi.mocked(api.delete).mockRejectedValue({ response: { data: { message: 'Vínculo estratégico não encontrado.' } } });
    renderPage(<VinculosPage usuario={usuario} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Remover vínculo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Vínculo estratégico não encontrado.');
    expect(screen.getByRole('button', { name: 'Remover vínculo' })).toBeInTheDocument();
  });

  it('cadastra indicador com meta e sentido para um serviço', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'i1', servicoId: 's1', objetivoId: 'o1', nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR' } });
    renderPage(<IndicadoresPage usuario={usuario} />);
    await screen.findByText('Nenhum indicador definido.');
    await userEvent.type(screen.getByLabelText('Nome do indicador'), 'Disponibilidade');
    await userEvent.selectOptions(screen.getByLabelText('Objetivo vinculado'), 'o1');
    await userEvent.type(screen.getByLabelText('Unidade'), '%');
    await userEvent.type(screen.getByLabelText('Meta'), '99.9');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar indicador' }));
    expect(api.post).toHaveBeenCalledWith('/servicos/s1/indicadores', { nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.9, sentido: 'MAIOR_MELHOR', objetivoId: 'o1' });
    expect(await screen.findByText('Disponibilidade')).toBeInTheDocument();
  });

  it('edita e exclui indicador, desabilitando a remoção enquanto a API responde', async () => {
    const exclusao = adiar<unknown>();
    mockBase({ '/vinculos': [], '/vinculos/pendencias': [], '/servicos/s1/indicadores': [indicador] });
    vi.mocked(api.put).mockResolvedValue({ data: { ...indicador, nome: 'Disponibilidade mensal', meta: 99 } });
    vi.mocked(api.delete).mockImplementation(() => exclusao.promise);
    renderPage(<IndicadoresPage usuario={usuario} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Disponibilidade' }));
    await userEvent.clear(screen.getByLabelText('Nome do indicador'));
    await userEvent.type(screen.getByLabelText('Nome do indicador'), 'Disponibilidade mensal');
    await userEvent.clear(screen.getByLabelText('Meta'));
    await userEvent.type(screen.getByLabelText('Meta'), '99');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar indicador' }));
    expect(api.put).toHaveBeenCalledWith('/indicadores/i1', { nome: 'Disponibilidade mensal', tipo: 'SLA', unidade: '%', meta: 99, sentido: 'MAIOR_MELHOR', objetivoId: 'o1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Disponibilidade mensal' }));
    expect(screen.getByRole('button', { name: 'Excluir Disponibilidade mensal' })).toBeDisabled();
    exclusao.resolver({});
    expect(await screen.findByRole('status')).toHaveTextContent('Indicador removido com sucesso.');
    expect(screen.queryByRole('button', { name: 'Excluir Disponibilidade mensal' })).not.toBeInTheDocument();
  });

  it('mantém o indicador e mostra a mensagem da API quando a exclusão falha', async () => {
    mockBase({ '/vinculos': [], '/vinculos/pendencias': [], '/servicos/s1/indicadores': [indicador] });
    vi.mocked(api.delete).mockRejectedValue({ response: { data: { message: 'Indicador não encontrado.' } } });
    renderPage(<IndicadoresPage usuario={usuario} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Disponibilidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Indicador não encontrado.');
    expect(screen.getByRole('button', { name: 'Excluir Disponibilidade' })).toBeInTheDocument();
  });
});
