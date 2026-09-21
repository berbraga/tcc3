import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';

const deps = {
  authService: {
    registrar: async () => ({ token: 'token', usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' as const } }),
    login: async () => ({ token: 'token', usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' as const } })
  },
  tokenService: {
    verificar: (token: string) => {
      if (token === 'valido') return { sub: 'u1', perfil: 'ALUNO' as const };
      if (token === 'outro') return { sub: 'u2', perfil: 'ALUNO' as const };
      throw new Error('token inválido');
    }
  },
  organizacaoService: {
    obterMinha: async (usuarioId: string) => ({ id: usuarioId === 'u1' ? 'org1' : 'org2', nome: 'TechNova', setor: 'Varejo', descricao: null, criadaEm: new Date().toISOString(), resumo: { servicos: 0, objetivos: 0, versaoEstrategia: null, registrosOperacionais: 0 } }),
    atualizarMinha: async (usuarioId: string, input: { nome: string; setor: string; descricao: string }) => ({ id: usuarioId === 'u1' ? 'org1' : 'org2', ...input, criadaEm: new Date().toISOString(), resumo: { servicos: 0, objetivos: 0, versaoEstrategia: null, registrosOperacionais: 0 } }),
    verificarAcesso: async (usuarioId: string, organizacaoId: string) => {
      if ((usuarioId === 'u1' ? 'org1' : 'org2') !== organizacaoId) throw Object.assign(new Error('Você não tem permissão para acessar esta organização.'), { status: 403, code: 'ACESSO_NEGADO' });
    }
  },
  analiseAmbienteService: {
    listar: async () => [],
    criar: async () => { throw new Error('fora do escopo'); },
    atualizar: async () => { throw new Error('fora do escopo'); },
    remover: async () => { throw new Error('fora do escopo'); }
  },
  estrategiaService: {
    obterAtual: async () => null,
    salvarNovaVersao: async () => { throw new Error('fora do escopo'); },
    listarVersoes: async () => []
  },
  objetivoService: {
    listar: async () => [],
    criar: async () => { throw new Error('fora do escopo'); },
    obterCobertura: async () => { throw new Error('fora do escopo'); },
    obterResumoCobertura: async () => ({ objetivosAlinhados: 0 })
  },
  servicoService: {
    listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
    atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); },
    listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); },
    listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); }
  },
  vinculoService: {
    listar: async () => [], criar: async () => { throw new Error('fora do escopo'); },
    remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => []
  },
  indicadorService: {
    listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); },
    atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }
  },
  cenarioService: { criar: async () => { throw new Error('fora do escopo'); }, obterPainel: async () => [] },
  relatorioEstrategiaService: { obter: async () => { throw new Error('fora do escopo'); }, exportar: async () => { throw new Error('fora do escopo'); } }
} satisfies Dependencias;

const app = criarApp(deps, 'http://localhost:5173');

describe('API', () => {
  it('expõe health check', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it.each([undefined, 'Bearer quebrado', 'Basic valido'])('responde 401 para token ausente ou inválido', async (authorization) => {
    const response = await request(app).get('/api/v1/organizacoes/minha').set(authorization ? { authorization } : {});
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'NAO_AUTENTICADO' });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('valida payload e padroniza detalhes', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'inválido', senha: '' });
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'DADOS_INVALIDOS', message: 'Verifique os dados informados.' });
    expect(response.body.details).toBeInstanceOf(Array);
  });

  it('não permite elevar o perfil pelo payload do cadastro público', async () => {
    const response = await request(app).post('/api/v1/auth/registro').send({
      nome: 'Aluno', email: 'aluno@example.com', senha: 'Senha123', organizacao: { nome: 'Organização' }, perfil: 'PROFESSOR'
    });
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'DADOS_INVALIDOS' });
  });

  it('recusa payload acima do limite configurado sem expor detalhes internos', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ preenchimento: 'x'.repeat(33 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ code: 'PAYLOAD_EXCEDIDO', message: 'O conteúdo enviado excede o limite permitido.' });
  });

  it('usa somente o usuário do token para ler e editar a organização', async () => {
    const get = await request(app).get('/api/v1/organizacoes/minha?organizacaoId=org2').set('authorization', 'Bearer valido');
    expect(get.status).toBe(200);
    expect(get.body.id).toBe('org1');

    const put = await request(app).put('/api/v1/organizacoes/minha').set('authorization', 'Bearer valido').send({ nome: 'Nova', setor: '', descricao: '', organizacaoId: 'org2' });
    expect(put.status).toBe(422);
  });

});
