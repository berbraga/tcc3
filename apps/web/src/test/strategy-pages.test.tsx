import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app.js';
import { AnalisePage } from '../pages/analise-page.js';
import { EstrategiaPage } from '../pages/estrategia-page.js';
import { ObjetivosPage } from '../pages/objetivos-page.js';
import { api } from '../services/api.js';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const usuario = { id: 'u1', nome: 'Ana Silva', email: 'ana@example.com', perfil: 'ALUNO' as const };

function renderPage(node: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></QueryClientProvider>
  );
}

function mockOrganizacao() {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/organizacoes/minha') return { data: { nome: 'TechNova Retail' } };
    throw new Error(`GET não preparado: ${url}`);
  });
}

describe('estados comuns das telas T03–T05', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); mockOrganizacao(); });

  it.each([
    ['T03', <AnalisePage usuario={usuario} />, '/analises-ambiente', 'Carregando análise de ambiente'],
    ['T04', <EstrategiaPage usuario={usuario} />, '/estrategia', 'Carregando estratégia'],
    ['T05', <ObjetivosPage usuario={usuario} />, '/objetivos', 'Carregando objetivos']
  ])('%s apresenta carregamento e erro recuperável', async (_tela, page, endpoint, loadingText) => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/organizacoes/minha') return Promise.resolve({ data: { nome: 'TechNova Retail' } });
      if (url === endpoint) return new Promise(() => {});
      return Promise.reject(new Error(`GET não preparado: ${url}`));
    });
    const loading = renderPage(page);
    expect(screen.getByRole('status')).toHaveTextContent(loadingText);
    loading.unmount();

    vi.mocked(api.get).mockImplementation((url: string) => url === '/organizacoes/minha'
      ? Promise.resolve({ data: { nome: 'TechNova Retail' } })
      : Promise.reject(new Error('offline')));
    renderPage(page);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it.each([
    [<AnalisePage usuario={usuario} />, '/analises-ambiente', 'Nenhum item de análise registrado.'],
    [<EstrategiaPage usuario={usuario} />, '/estrategia', 'Nenhuma estratégia registrada.'],
    [<ObjetivosPage usuario={usuario} />, '/objetivos', 'Nenhum objetivo estratégico cadastrado.']
  ])('apresenta o estado vazio sem ocultar o formulário', async (page, endpoint, emptyText) => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/organizacoes/minha') return { data: { id: 'org1', nome: 'TechNova Retail', setor: 'Varejo', descricao: null, criadaEm: '2026-09-08T00:00:00.000Z', resumo: { servicos: 0, objetivos: 0, versaoEstrategia: null, registrosOperacionais: 0 } } };
      if (url === endpoint) return { data: endpoint === '/estrategia' ? null : [] };
      throw new Error(`GET não preparado: ${url}`);
    });
    renderPage(page);
    expect(await screen.findByText(emptyText)).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});

describe('T03 análise de ambiente', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

  it('edita um item existente e apresenta confirmação de sucesso', async () => {
    const item = { id: 'a1', organizacaoId: 'org1', tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe experiente', impacto: 'ALTO' };
    vi.mocked(api.get).mockImplementation(async (url: string) => ({ data: url === '/organizacoes/minha' ? { nome: 'TechNova Retail' } : [item] }));
    vi.mocked(api.put).mockResolvedValue({ data: { ...item, descricao: 'Equipe multidisciplinar' } });
    renderPage(<AnalisePage usuario={usuario} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Equipe experiente' }));
    await userEvent.clear(screen.getByLabelText('Descrição'));
    await userEvent.type(screen.getByLabelText('Descrição'), 'Equipe multidisciplinar');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar item' }));

    expect(api.put).toHaveBeenCalledWith('/analises-ambiente/a1', {
      tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe multidisciplinar', impacto: 'ALTO'
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Item atualizado com sucesso.');
    expect(screen.getByText('Equipe multidisciplinar')).toBeInTheDocument();
  });
});

describe('T04 estratégia de serviço', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

  it('carrega os quatro Ps e salva uma nova versão', async () => {
    const atual = {
      id: 'e1', organizacaoId: 'org1', versao: 2, atualizadaEm: '2026-09-08T12:00:00.000Z',
      perspectiva: 'Ser referência digital', posicao: 'Agilidade no varejo', plano: 'Lançar portal B2B', padrao: 'Automatizar processos'
    };
    vi.mocked(api.get).mockImplementation(async (url: string) => ({ data: url === '/organizacoes/minha' ? { nome: 'TechNova Retail' } : atual }));
    vi.mocked(api.post).mockResolvedValue({ data: { ...atual, versao: 3, plano: 'Lançar portal B2B em seis meses' } });
    renderPage(<EstrategiaPage usuario={usuario} />);

    expect(await screen.findByLabelText('Perspectiva — visão e propósito')).toHaveValue('Ser referência digital');
    await userEvent.clear(screen.getByLabelText('Plano — como a visão será executada'));
    await userEvent.type(screen.getByLabelText('Plano — como a visão será executada'), 'Lançar portal B2B em seis meses');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar estratégia' }));

    expect(api.post).toHaveBeenCalledWith('/estrategia', expect.objectContaining({ plano: 'Lançar portal B2B em seis meses' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Estratégia salva como versão 3.');
  });
});

describe('T05 objetivos estratégicos', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

  it('mostra cobertura sem vínculos e adiciona objetivo com status válido', async () => {
    const atual = { id: '00000000-0000-4000-8000-000000000001', organizacaoId: 'org1', codigo: 'OE-01', descricao: 'Expandir mercado corporativo', prazo: '2027-06-30T00:00:00.000Z', status: 'ATIVO' };
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/organizacoes/minha') return { data: { nome: 'TechNova Retail' } };
      if (url === '/objetivos') return { data: [atual] };
      if (url === `/objetivos/${atual.id}/cobertura`) return { data: { objetivoId: atual.id, servicosVinculados: 0, cobertura: 0 } };
      throw new Error(`GET não preparado: ${url}`);
    });
    vi.mocked(api.post).mockResolvedValue({ data: { ...atual, id: 'o2', codigo: 'OE-02', descricao: 'Reduzir custos', prazo: null, status: 'ATINGIDO' } });
    renderPage(<ObjetivosPage usuario={usuario} />);

    expect(await screen.findByLabelText('Cobertura de OE-01')).toHaveAttribute('value', '0');
    expect(screen.getByText('0 serviços')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Código'), 'OE-02');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ATINGIDO');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Reduzir custos');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar objetivo' }));

    expect(api.post).toHaveBeenCalledWith('/objetivos', { codigo: 'OE-02', descricao: 'Reduzir custos', prazo: null, status: 'ATINGIDO' });
    expect(await screen.findByRole('status')).toHaveTextContent('Objetivo adicionado com sucesso.');
  });
});

describe('navegação da Fase 2', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

  it('habilita somente T03–T05 e permite abrir T03 pelo teclado', async () => {
    sessionStorage.setItem('eduitsm.auth', JSON.stringify({ token: 'jwt', usuario }));
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/organizacoes/minha') return { data: { id: 'org1', nome: 'TechNova Retail', setor: 'Varejo', descricao: null, criadaEm: '2026-09-08T00:00:00.000Z', resumo: { servicos: 0, objetivos: 0, versaoEstrategia: null, registrosOperacionais: 0 } } };
      if (url === '/analises-ambiente') return { data: [] };
      throw new Error(`GET não preparado: ${url}`);
    });
    const user = userEvent.setup();
    renderPage(<App />, '/painel');

    await user.tab();
    expect(screen.getByRole('link', { name: 'T02 · Painel inicial' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'T03 · Análise de ambiente' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: /Análise de ambiente/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'T04 · Estratégia (4 Ps)' })).toHaveAttribute('href', '/estrategia');
    expect(screen.getByRole('link', { name: 'T05 · Objetivos estratégicos' })).toHaveAttribute('href', '/objetivos');
    expect(screen.getByText('T06 · Serviços de TI')).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/analises-ambiente'));
  });
});
