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
        indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR' }]
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
        indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR' }]
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
});
