import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';

const relatorioCompleto = {
  organizacao: { nome: 'TechNova Ana', setor: 'Varejo', descricao: null },
  estrategia: { versao: 1, atualizadaEm: '2026-09-08T12:00:00.000Z', perspectiva: 'Perspectiva', posicao: 'Posição', plano: 'Plano', padrao: 'Padrão' },
  objetivos: [],
  servicos: []
};

const deps = {
  authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
  tokenService: { verificar: () => ({ sub: 'u1', perfil: 'ALUNO' as const }) },
  organizacaoService: { obterMinha: async () => { throw new Error('fora do escopo'); }, atualizarMinha: async () => { throw new Error('fora do escopo'); }, verificarAcesso: async () => { throw new Error('fora do escopo'); } },
  analiseAmbienteService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
  estrategiaService: { obterAtual: async () => null, salvarNovaVersao: async () => { throw new Error('fora do escopo'); }, listarVersoes: async () => [] },
  objetivoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, obterCobertura: async () => { throw new Error('fora do escopo'); }, obterResumoCobertura: async () => ({ objetivosAlinhados: 0 }) },
  servicoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarCustos: async () => [], adicionarCusto: async () => { throw new Error('fora do escopo'); }, listarDemanda: async () => [], adicionarDemanda: async () => { throw new Error('fora do escopo'); } },
  vinculoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => [] },
  indicadorService: { listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
  cenarioService: { criar: async () => { throw new Error('fora do escopo'); }, obterPainel: async () => [] },
  relatorioEstrategiaService: {
    obter: async () => relatorioCompleto,
    exportar: async () => ({ nomeArquivo: 'relatorio-estrategia.html', contentType: 'text/html; charset=utf-8', conteudo: '<h1>TechNova Ana</h1>' })
  }
} satisfies Dependencias;

describe('API de relatório da estratégia', () => {
  it('expõe relatório estruturado e exportação HTML somente para o usuário autenticado', async () => {
    const app = criarApp(deps, 'http://localhost:5173');

    const relatorio = await request(app).get('/api/v1/relatorios/estrategia?organizacaoId=org2').set('authorization', 'Bearer valido');
    expect(relatorio.status).toBe(200);
    expect(relatorio.body).toEqual(relatorioCompleto);

    const exportacao = await request(app).get('/api/v1/relatorios/estrategia/exportacao').set('authorization', 'Bearer valido');
    expect(exportacao.status).toBe(200);
    expect(exportacao.headers['content-type']).toContain('text/html');
    expect(exportacao.headers['content-disposition']).toContain('attachment; filename="relatorio-estrategia.html"');
    expect(exportacao.text).toContain('TechNova Ana');
  });
});
