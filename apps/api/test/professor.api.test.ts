import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';

const ambientes = {
  items: [{ id: 'org-aluna', aluno: { nome: 'Ana Luísa' }, organizacao: { nome: 'TechNova Retail', setor: 'Varejo' }, progresso: { psCompletos: 4, servicos: 1, vinculos: 1, indicadores: 1, cenarioGerado: true } }],
  total: 1,
  pagina: 1,
  limite: 10
};

const deps = {
  authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
  tokenService: { verificar: (token: string) => token === 'professor' ? { sub: 'prof-1', perfil: 'PROFESSOR' as const } : token === 'aluno' ? { sub: 'aluno-1', perfil: 'ALUNO' as const } : (() => { throw new Error('token inválido'); })() },
  organizacaoService: { obterMinha: async () => { throw new Error('fora do escopo'); }, atualizarMinha: async () => { throw new Error('fora do escopo'); }, verificarAcesso: async () => { throw new Error('fora do escopo'); } },
  analiseAmbienteService: { listar: async () => [], criar: async () => ({ id: 'analise-professor', organizacaoId: 'org-professor', tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Ambiente próprio', impacto: 'ALTO' }), atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
  estrategiaService: { obterAtual: async () => null, salvarNovaVersao: async () => { throw new Error('fora do escopo'); }, listarVersoes: async () => [] },
  objetivoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, obterCobertura: async () => { throw new Error('fora do escopo'); }, obterResumoCobertura: async () => ({ objetivosAlinhados: 0 }) },
  servicoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); }, listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); } },
  vinculoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => [] },
  indicadorService: { listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
  cenarioService: { criar: async () => { throw new Error('fora do escopo'); }, obterPainel: async () => [] },
  relatorioEstrategiaService: { obter: async () => { throw new Error('fora do escopo'); }, exportar: async () => { throw new Error('fora do escopo'); }, obterParaProfessor: async (organizacaoId: string) => ({ organizacao: { nome: `Aluno ${organizacaoId}`, setor: 'Varejo', descricao: null }, estrategia: null, objetivos: [], servicos: [] }) },
  professorService: { listarAmbientes: async () => ambientes }
} satisfies Dependencias;

describe('API de acompanhamento do professor', () => {
  it('entrega ao professor uma página resumida dos ambientes de alunos sem segredos', async () => {
    const response = await request(criarApp(deps, 'http://localhost:5173')).get('/api/v1/professor/ambientes?pagina=1&limite=10').set('authorization', 'Bearer professor');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(ambientes);
    expect(JSON.stringify(response.body)).not.toMatch(/senha|token/i);
  });

  it('recusa aluno tentando consultar ambientes de outros alunos', async () => {
    const response = await request(criarApp(deps, 'http://localhost:5173')).get('/api/v1/professor/ambientes').set('authorization', 'Bearer aluno');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ code: 'ACESSO_NEGADO' });
  });

  it('permite ao professor ler o ambiente-alvo sem trocar seu token', async () => {
    const response = await request(criarApp(deps, 'http://localhost:5173')).get('/api/v1/professor/ambientes/org-aluna/relatorio').set('authorization', 'Bearer professor');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ organizacao: { nome: 'Aluno org-aluna' } });
  });

  it('TS11 — recusa escrita direta no ambiente-alvo do aluno com 403', async () => {
    const response = await request(criarApp(deps, 'http://localhost:5173')).post('/api/v1/professor/ambientes/org-aluna').set('authorization', 'Bearer professor').send({ nome: 'Tentativa de alteração' });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ code: 'ACESSO_NEGADO' });
  });

  it('mantém a edição do ambiente próprio do professor', async () => {
    const response = await request(criarApp(deps, 'http://localhost:5173')).post('/api/v1/analises-ambiente').set('authorization', 'Bearer professor').send({ tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Alteração bloqueada', impacto: 'ALTO' });

    expect(response.status).toBe(201);
  });
});
