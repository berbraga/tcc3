import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { estrategiaCompleta } from '@eduitsm/shared';
import {
  RelatorioEstrategiaService,
  type RelatorioEstrategiaRepository,
  type RelatorioEstrategiaResultado
} from '../src/modules/relatorios/relatorio.service.js';

const execFileAsync = promisify(execFile);

async function extrairTextoDoPdf(pdf: Buffer) {
  const diretorio = await mkdtemp(join(tmpdir(), 'eduitsm-relatorio-'));
  const arquivo = join(diretorio, 'relatorio.pdf');
  try {
    await writeFile(arquivo, pdf);
    const [{ stdout: informacoes }, { stdout: textoExtraido }] = await Promise.all([
      execFileAsync('pdfinfo', [arquivo]),
      execFileAsync('pdftotext', ['-enc', 'UTF-8', arquivo, '-'])
    ]);
    return { informacoes, textoExtraido };
  } finally {
    await rm(diretorio, { recursive: true, force: true });
  }
}

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
      analises: [{ tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Time com domínio B2B', impacto: 'ALTO' }],
      estrategia: estrategiaCompletaDaAna,
      objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: new Date('2027-06-30'), status: 'ATIVO' }],
      servicos: [{
        nome: 'Portal B2B', descricao: 'Compras corporativas', publicoAlvo: 'Lojistas', status: 'EM_OPERACAO',
        vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Reduz atrito de compra.', contribuicao: 80, indicador: { nome: 'Tempo de suporte', tipo: 'TEMPO_ATENDIMENTO', unidade: 'minutos' } }],
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
    ['Perspectiva', { ...estrategiaCompletaDaAna, perspectiva: null }],
    ['Posição', { ...estrategiaCompletaDaAna, posicao: '' }],
    ['Plano', { ...estrategiaCompletaDaAna, plano: '  ' }],
    ['Padrão', { ...estrategiaCompletaDaAna, padrao: null }]
  ])('TS06 — bloqueia exportação com 422 quando %s está vazio', async (_campo, estrategia) => {
    const repository = new RepositorioEmMemoria();
    repository.relatorios.u1 = { ...repository.relatorios.u1!, estrategia };
    const service = new RelatorioEstrategiaService(repository);

    expect(estrategiaCompleta(estrategia)).toBe(false);
    await expect(service.exportar('u1')).rejects.toMatchObject({ status: 422, code: 'ESTRATEGIA_INCOMPLETA', details: { camposFaltantes: [_campo] } });
  });

  it('lista todos os Ps ausentes após trim para orientar a correção do relatório', async () => {
    const repository = new RepositorioEmMemoria();
    repository.relatorios.u1 = {
      ...repository.relatorios.u1!,
      estrategia: { ...estrategiaCompletaDaAna, perspectiva: ' ', plano: null, padrao: '' }
    };

    await expect(new RelatorioEstrategiaService(repository).exportar('u1')).rejects.toMatchObject({
      status: 422,
      code: 'ESTRATEGIA_INCOMPLETA',
      message: 'A exportação foi bloqueada porque faltam: Perspectiva, Plano, Padrão.',
      details: { camposFaltantes: ['Perspectiva', 'Plano', 'Padrão'] }
    });
  });

  it('retorna relatório consolidado e exportação PDF para estratégia completa', async () => {
    const service = new RelatorioEstrategiaService(new RepositorioEmMemoria());

    await expect(service.obter('u1')).resolves.toEqual({
      organizacao: { nome: 'TechNova Ana', setor: 'Varejo', descricao: 'Ambiente de Ana' },
      analises: [{ tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Time com domínio B2B', impacto: 'ALTO' }],
      estrategia: { ...estrategiaCompletaDaAna, atualizadaEm: '2026-09-08T12:00:00.000Z' },
      objetivos: [{ codigo: 'OE-01', descricao: 'Aumentar receita', prazo: '2027-06-30', status: 'ATIVO' }],
      servicos: [{
        nome: 'Portal B2B', descricao: 'Compras corporativas', publicoAlvo: 'Lojistas', status: 'EM_OPERACAO',
        vinculos: [{ objetivoCodigo: 'OE-01', justificativaValor: 'Reduz atrito de compra.', contribuicao: 80, indicador: { nome: 'Tempo de suporte', tipo: 'TEMPO_ATENDIMENTO', unidade: 'minutos' } }],
        indicadores: [{ nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR', medicoes: [{ periodo: '2026-09-01', valor: 97.5, denominador: 40, origem: 'SIMULADO', cenario: { id: 'cenario-ana', semente: 42, perfil: 'REALISTA', geradorVersao: '1' } }] }]
      }]
    });
    await expect(service.exportar('u1')).resolves.toMatchObject({
      nomeArquivo: 'relatorio-estrategia.pdf',
      contentType: 'application/pdf'
    });
  });

  it('nunca mistura o conteúdo de outra organização', async () => {
    const service = new RelatorioEstrategiaService(new RepositorioEmMemoria());

    const relatorio = await service.obter('u1');
    expect(JSON.stringify(relatorio)).not.toContain('Bia');
    expect(JSON.stringify(relatorio)).not.toContain('OE-99');
  });

  it('exporta um PDF abrível, com texto extraível, acentos e conteúdo persistido', async () => {
    const repository = new RepositorioEmMemoria();
    repository.relatorios.u1 = {
      ...repository.relatorios.u1!,
      organizacao: { ...repository.relatorios.u1!.organizacao, nome: '<img src=x onerror=alert(1)>' },
      estrategia: { ...estrategiaCompletaDaAna, perspectiva: '<script>alert(1)</script>' }
    };
    const service = new RelatorioEstrategiaService(repository);
    const exportacao = await service.exportar('u1');
    const { informacoes, textoExtraido } = await extrairTextoDoPdf(exportacao.conteudo);

    expect(informacoes).toContain('Pages:');
    expect(textoExtraido).toContain('Relatório da estratégia');
    expect(textoExtraido).toContain('Versão 2');
    expect(textoExtraido).toContain('Atualizada em 2026-09-08T12:00:00.000Z');
    expect(textoExtraido).toContain('denominador 40');
    expect(textoExtraido).toContain('Tempo de suporte');
    expect(textoExtraido).toContain('<img src=x onerror=alert(1)>');
    expect(textoExtraido).toContain('<script>alert(1)</script>');
    await expect(service.renderizarHtml('u1')).resolves.toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('pagina conteúdo longo e numera as páginas no PDF', async () => {
    const repository = new RepositorioEmMemoria();
    const servicoBase = repository.relatorios.u1!.servicos[0]!;
    repository.relatorios.u1 = {
      ...repository.relatorios.u1!,
      servicos: Array.from({ length: 28 }, (_, indice) => ({
        ...servicoBase,
        nome: `Portal B2B ${indice + 1}`,
        descricao: 'Descrição extensa para validar quebra de linhas e paginação do documento exportado. '.repeat(3)
      }))
    };

    const exportacao = await new RelatorioEstrategiaService(repository).exportar('u1');
    const { informacoes, textoExtraido } = await extrairTextoDoPdf(exportacao.conteudo);

    expect(Number(informacoes.match(/Pages:\s+(\d+)/)?.[1])).toBeGreaterThan(1);
    expect(textoExtraido).toContain('Página 1 de');
    expect(textoExtraido).toContain('Página 2 de');
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
