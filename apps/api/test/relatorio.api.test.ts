import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import type { Dependencias } from '../src/dependencies.js';
import { AppError } from '../src/errors/app-error.js';

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
    exportar: async () => ({ nomeArquivo: 'relatorio-estrategia.pdf', contentType: 'application/pdf' as const, conteudo: Buffer.from('%PDF-1.7') })
  }
} satisfies Dependencias;

describe('API de relatório da estratégia', () => {
  it('expõe relatório estruturado e exportação PDF somente para o usuário autenticado', async () => {
    const app = criarApp(deps, 'http://localhost:5173');

    const relatorio = await request(app).get('/api/v1/relatorios/estrategia?organizacaoId=org2').set('authorization', 'Bearer valido');
    expect(relatorio.status).toBe(200);
    expect(relatorio.body).toEqual(relatorioCompleto);

    const exportacao = await request(app).get('/api/v1/relatorios/estrategia/exportacao').set('authorization', 'Bearer valido');
    expect(exportacao.status).toBe(200);
    expect(exportacao.headers['content-type']).toContain('application/pdf');
    expect(exportacao.headers['content-disposition']).toContain('attachment; filename="relatorio-estrategia.pdf"');
    expect(exportacao.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('mantém o bloqueio 422 da exportação quando a estratégia está incompleta', async () => {
    const app = criarApp({
      ...deps,
      relatorioEstrategiaService: {
        ...deps.relatorioEstrategiaService,
        exportar: async () => { throw new AppError(422, 'ESTRATEGIA_INCOMPLETA', 'A exportação foi bloqueada porque faltam: Posição, Plano.', { camposFaltantes: ['Posição', 'Plano'] }); }
      }
    }, 'http://localhost:5173');

    const resposta = await request(app).get('/api/v1/relatorios/estrategia/exportacao').set('authorization', 'Bearer valido');
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ code: 'ESTRATEGIA_INCOMPLETA', message: 'A exportação foi bloqueada porque faltam: Posição, Plano.', details: { camposFaltantes: ['Posição', 'Plano'] } });
  });
});
