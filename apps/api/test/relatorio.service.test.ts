import { describe, expect, it } from 'vitest';
import { estrategiaCompleta } from '@eduitsm/shared';
import {
  RelatorioEstrategiaService,
  type RelatorioEstrategiaRepository,
  type RelatorioEstrategiaResultado
} from '../src/modules/relatorios/relatorio.service.js';

const estrategiaCompletaDaAna = {
  versao: 2,
  atualizadaEm: new Date('2026-09-08T12:00:00.000Z'),
  perspectiva: 'Ser referência no varejo digital.',
  posicao: 'Diferenciação por agilidade.',
  plano: 'Entregar portal B2B em seis meses.',
  padrao: 'Automatizar decisões recorrentes.'
};

class RepositorioEmMemoria implements RelatorioEstrategiaRepository {
  relatorios: Record<string, RelatorioEstrategiaResultado> = {
    u1: {
      organizacao: { nome: 'TechNova Ana', setor: 'Varejo', descricao: 'Ambiente de Ana' },
      estrategia: estrategiaCompletaDaAna,
      objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: new Date('2027-06-30'), status: 'ATIVO' }],
      servicos: [{
        nome: 'Portal B2B', descricao: 'Compras corporativas', publicoAlvo: 'Lojistas', status: 'EM_OPERACAO',
        vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Reduz atrito de compra.', contribuicao: 80 }],
        indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR', medicoes: [{ periodoRef: new Date('2026-09-01T00:00:00.000Z'), valor: 97.5, denominador: 40, origem: 'SIMULADO', cenario: { id: 'cenario-ana', semente: 42, perfil: 'REALISTA', geradorVersao: '1' } }] }]
      }]
    },
    u2: {
      organizacao: { nome: 'Segredo da Bia', setor: 'Saúde', descricao: 'Não pode vazar' },
      estrategia: { ...estrategiaCompletaDaAna, perspectiva: '   ' },
      objetivos: [{ codigo: 'OE-99', descricao: 'Dado de outra organização', prazo: null, status: 'ATIVO' }],
      servicos: []
    }
  };

  async buscarPorUsuario(usuarioId: string) {
    return this.relatorios[usuarioId] ?? null;
  }

  async buscarPorOrganizacaoAluno(organizacaoId: string) {
    return organizacaoId === 'org-ana' ? this.relatorios.u1 ?? null : null;
  }
}

describe('relatório consolidado da estratégia', () => {
  it.each([
    ['perspectiva', { ...estrategiaCompletaDaAna, perspectiva: null }],
    ['posição', { ...estrategiaCompletaDaAna, posicao: '' }],
    ['plano', { ...estrategiaCompletaDaAna, plano: '  ' }],
    ['padrão', { ...estrategiaCompletaDaAna, padrao: null }]
  ])('TS06 — bloqueia exportação com 422 quando %s está vazio', async (_campo, estrategia) => {
    const repository = new RepositorioEmMemoria();
    repository.relatorios.u1 = { ...repository.relatorios.u1!, estrategia };
    const service = new RelatorioEstrategiaService(repository);

    expect(estrategiaCompleta(estrategia)).toBe(false);
    await expect(service.exportar('u1')).rejects.toMatchObject({ status: 422, code: 'ESTRATEGIA_INCOMPLETA' });
  });

  it('retorna relatório consolidado e exportação HTML para estratégia completa', async () => {
    const service = new RelatorioEstrategiaService(new RepositorioEmMemoria());

    await expect(service.obter('u1')).resolves.toEqual({
      organizacao: { nome: 'TechNova Ana', setor: 'Varejo', descricao: 'Ambiente de Ana' },
      estrategia: { ...estrategiaCompletaDaAna, atualizadaEm: '2026-09-08T12:00:00.000Z' },
      objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: '2027-06-30', status: 'ATIVO' }],
      servicos: [{
        nome: 'Portal B2B', descricao: 'Compras corporativas', publicoAlvo: 'Lojistas', status: 'EM_OPERACAO',
        vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Reduz atrito de compra.', contribuicao: 80 }],
        indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR', medicoes: [{ periodo: '2026-09-01', valor: 97.5, denominador: 40, origem: 'SIMULADO', cenario: { id: 'cenario-ana', semente: 42, perfil: 'REALISTA', geradorVersao: '1' } }] }]
      }]
    });
    await expect(service.exportar('u1')).resolves.toMatchObject({
      nomeArquivo: 'relatorio-estrategia.html',
      contentType: 'text/html; charset=utf-8'
    });
  });

  it('nunca mistura o conteúdo de outra organização', async () => {
    const service = new RelatorioEstrategiaService(new RepositorioEmMemoria());

    const relatorio = await service.obter('u1');
    expect(JSON.stringify(relatorio)).not.toContain('Bia');
    expect(JSON.stringify(relatorio)).not.toContain('OE-99');
  });

  it('exporta versão, atualização, denominador e conteúdo escapado no HTML imprimível', async () => {
    const repository = new RepositorioEmMemoria();
    repository.relatorios.u1 = {
      ...repository.relatorios.u1!,
      organizacao: { ...repository.relatorios.u1!.organizacao, nome: '<img src=x onerror=alert(1)>' },
      estrategia: { ...estrategiaCompletaDaAna, perspectiva: '<script>alert(1)</script>' }
    };
    const exportacao = await new RelatorioEstrategiaService(repository).exportar('u1');

    expect(exportacao.conteudo).toContain('Versão 2');
    expect(exportacao.conteudo).toContain('Atualizada em 2026-09-08T12:00:00.000Z');
    expect(exportacao.conteudo).toContain('denominador 40');
    expect(exportacao.conteudo).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(exportacao.conteudo).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(exportacao.conteudo).not.toContain('<script>alert(1)</script>');
  });

  it('permite ao professor consultar somente o relatório consolidado do aluno selecionado', async () => {
    const service = new RelatorioEstrategiaService(new RepositorioEmMemoria());

    await expect(service.obterParaProfessor('org-ana')).resolves.toMatchObject({
      organizacao: { nome: 'TechNova Ana' },
      estrategia: { versao: 2 },
      servicos: [{ nome: 'Portal B2B' }]
    });
    await expect(service.obterParaProfessor('org-professor')).rejects.toMatchObject({ status: 404, code: 'AMBIENTE_ALUNO_NAO_ENCONTRADO' });
  });
});
