import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaProfessorRepository } from '../src/modules/professor/professor.repository.js';
import { PrismaRelatorioEstrategiaRepository } from '../src/modules/relatorios/relatorio.repository.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const emails = ['prof-paginacao@eduitsm.local', 'aluna-paginacao-ana@eduitsm.local', 'aluna-paginacao-bia@eduitsm.local', 'aluna-paginacao-caio@eduitsm.local'];
let bancoSeguro = false;

describe('repositório Prisma de acompanhamento do professor', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    await db.usuario.create({ data: { nome: 'ZZZ Professor Paginação', email: emails[0]!, senhaHash: 'hash-nao-exposto', perfil: 'PROFESSOR', organizacao: { create: { nome: 'Ambiente do professor' } } } });
    await Promise.all(([
      ['ZZZ Ana Paginação', emails[1]!, 'Org Ana'],
      ['ZZZ Bia Paginação', emails[2]!, 'Org Bia'],
      ['ZZZ Caio Paginação', emails[3]!, 'Org Caio']
    ] as [string, string, string][]).map(([nome, email, organizacao]) => db.usuario.create({ data: { nome, email, senhaHash: 'hash-nao-exposto', perfil: 'ALUNO', organizacao: { create: { nome: organizacao } } } })));
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email: { in: emails } } }); }
    finally { await db.$disconnect(); }
  });

  it('pagina somente alunos ordenados sem expor credenciais', async () => {
    const repository = new PrismaProfessorRepository(db);
    const todas = await repository.listarAmbientes(1, 100);
    const primeiraPagina = await repository.listarAmbientes(1, 1);
    const alunosDaTask = todas.items.filter((item) => item.aluno.nome.startsWith('ZZZ ') && item.aluno.nome !== 'ZZZ Professor Paginação');

    expect(alunosDaTask).toMatchObject([{ aluno: { nome: 'ZZZ Ana Paginação' }, organizacao: { nome: 'Org Ana' } }, { aluno: { nome: 'ZZZ Bia Paginação' }, organizacao: { nome: 'Org Bia' } }, { aluno: { nome: 'ZZZ Caio Paginação' }, organizacao: { nome: 'Org Caio' } }]);
    expect(primeiraPagina).toMatchObject({ total: expect.any(Number) });
    expect(primeiraPagina.items).toHaveLength(1);
    expect(todas.items.some((item) => item.aluno.nome === 'ZZZ Professor Paginação')).toBe(false);
    expect(JSON.stringify(todas.items)).not.toMatch(/senha|token/i);
  });

  it('seleciona para leitura somente uma organização que pertença a aluno', async () => {
    const ana = await db.organizacao.findFirstOrThrow({ where: { usuario: { email: emails[1]! } }, select: { id: true } });
    const professor = await db.organizacao.findFirstOrThrow({ where: { usuario: { email: emails[0]! } }, select: { id: true } });
    const repository = new PrismaRelatorioEstrategiaRepository(db);

    await expect(repository.buscarPorOrganizacaoAluno(ana.id)).resolves.toMatchObject({ organizacao: { nome: 'Org Ana' }, objetivos: [], servicos: [] });
    await expect(repository.buscarPorOrganizacaoAluno(professor.id)).resolves.toBeNull();
  });

  it('consolida SWOT, vínculo com indicador e medição persistidos no relatório do aluno', async () => {
    const ana = await db.usuario.findUniqueOrThrow({ where: { email: emails[1]! }, include: { organizacao: true } });
    const organizacaoId = ana.organizacao!.id;
    const objetivo = await db.objetivoEstrategico.create({ data: { organizacaoId, codigo: 'OE-PDF', descricao: 'Objetivo persistido para relatório', status: 'ATIVO' } });
    const servico = await db.servico.create({ data: { organizacaoId, nome: 'Serviço PDF', status: 'EM_OPERACAO' } });
    const indicador = await db.indicador.create({ data: { servicoId: servico.id, objetivoId: objetivo.id, nome: 'Tempo de suporte', tipo: 'TEMPO_ATENDIMENTO', unidade: 'minutos', meta: 15, sentido: 'MENOR_MELHOR' } });
    await db.$transaction([
      db.analiseAmbiente.create({ data: { organizacaoId, tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe com experiência B2B', impacto: 'ALTO' } }),
      db.estrategiaServico.create({ data: { organizacaoId, versao: 1, perspectiva: 'Perspectiva', posicao: 'Posição', plano: 'Plano', padrao: 'Padrão' } }),
      db.vinculoEstrategico.create({ data: { servicoId: servico.id, objetivoId: objetivo.id, indicadorId: indicador.id, justificativaValor: 'Evidência mensurável de contribuição.', contribuicao: 35 } }),
      db.medicao.create({ data: { indicadorId: indicador.id, periodoRef: new Date('2026-09-01T00:00:00.000Z'), valor: 16, denominador: 5, origem: 'SIMULADO' } })
    ]);

    const relatorio = await new PrismaRelatorioEstrategiaRepository(db).buscarPorUsuario(ana.id);

    expect(relatorio).toMatchObject({
      analises: [{ categoria: 'FORCA', descricao: 'Equipe com experiência B2B' }],
      servicos: [{
        nome: 'Serviço PDF',
        vinculos: [{ contribuicao: 35, indicador: { nome: 'Tempo de suporte' } }],
        indicadores: [{ medicoes: [{ valor: 16, denominador: 5, origem: 'SIMULADO' }] }]
      }]
    });
  });
});
