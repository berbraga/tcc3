import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../pages/login-page.js';
import { PainelPage } from '../pages/painel-page.js';
import { App } from '../app.js';
import { api } from '../services/api.js';

vi.mock('../services/api.js', () => ({ api: { post: vi.fn(), get: vi.fn(), put: vi.fn() } }));
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;

describe('T01 login', () => {
  beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
  it('navega do login ao painel com respostas de API controladas', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { token: 'jwt-real', usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' } } });
    vi.mocked(api.get).mockResolvedValue({ data: { id: 'org1', nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'Empresa fictícia', criadaEm: '2026-09-12T00:00:00Z', resumo: { servicos: 5, objetivos: 3, versaoEstrategia: 1, registrosOperacionais: 0 } } });
    render(<App />, { wrapper });
    await userEvent.type(screen.getByLabelText('E-mail institucional'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@example.com', senha: 'Senha123' });
    expect(JSON.parse(sessionStorage.getItem('eduitsm.auth') ?? '{}')).toMatchObject({ token: 'jwt-real' });
    expect(await screen.findByRole('heading', { name: /Painel inicial da organização/ })).toBeInTheDocument();
    expect(screen.getAllByText('TechNova Retail')).toHaveLength(2);
  });

  it('apresenta erro de credenciais sem apagar os campos', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { data: { message: 'E-mail ou senha inválidos.' } } });
    render(<LoginPage />, { wrapper });
    await userEvent.type(screen.getByLabelText('E-mail institucional'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(screen.getByLabelText('E-mail institucional')).toHaveValue('ana@example.com');
  });
});

describe('T02 painel', () => {
  beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

  it('exibe estados de carregamento, erro e ausência de dados', async () => {
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(() => {}));
    const loading = render(<PainelPage usuario={{ id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' }} />, { wrapper });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando organização');
    loading.unmount();

    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
    const failed = render(<PainelPage usuario={{ id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' }} />, { wrapper });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    failed.unmount();

    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    render(<PainelPage usuario={{ id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' }} />, { wrapper });
    expect(await screen.findByText('Nenhuma organização disponível.')).toBeInTheDocument();
  });

  it('carrega dados reais da organização e permite editá-los', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 'org1', nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'Empresa fictícia', criadaEm: '2026-09-12T00:00:00Z', resumo: { servicos: 5, objetivos: 3, versaoEstrategia: 1, registrosOperacionais: 0 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'org1', nome: 'TechNova Educação', setor: 'Educação', descricao: 'Atualizada', criadaEm: '2026-09-12T00:00:00Z', resumo: { servicos: 5, objetivos: 3, versaoEstrategia: 1, registrosOperacionais: 0 } } });
    render(<PainelPage usuario={{ id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' }} />, { wrapper });
    expect(await screen.findByRole('heading', { name: /TechNova Retail/ })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Editar organização' }));
    await userEvent.clear(screen.getByLabelText('Nome da organização'));
    await userEvent.type(screen.getByLabelText('Nome da organização'), 'TechNova Educação');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(api.put).toHaveBeenCalledWith('/organizacoes/minha', expect.objectContaining({ nome: 'TechNova Educação' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Organização atualizada com sucesso.');
  });
});

describe('rotas protegidas', () => {
  it('redireciona visitante sem sessão para o login', async () => {
    sessionStorage.clear();
    render(<App />, { wrapper });
    expect(await screen.findByRole('heading', { name: 'Entrar na ferramenta' })).toBeInTheDocument();
  });
});
