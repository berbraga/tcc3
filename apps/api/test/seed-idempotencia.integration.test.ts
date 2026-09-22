import { PrismaClient, PerfilUsuario } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { popularDadosDemonstracao } from '../src/modules/demo/seed.service.js';
import { validarBancoDeTeste } from '../src/config/database-safety.js';

const db = new PrismaClient();
const emails = ['aluno@eduitsm.local', 'professor@eduitsm.local'];
let bancoSeguro = false;

describe('seed de demonstração', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email: { in: emails } } });

    const aluno = await db.usuario.create({
      data: { nome: 'Aluno já existente', email: emails[0]!, senhaHash: 'hash-antigo', perfil: PerfilUsuario.ALUNO }
    });
    await db.organizacao.create({
      data: { id: randomUUID(), usuarioId: aluno.id, nome: 'Organização já existente' }
    });
  });

  afterAll(async () => {
    try {
      if (bancoSeguro) {
        await db.usuario.deleteMany({ where: { email: { in: emails } } });
      }
    } finally {
      await db.$disconnect();
    }
  });

  it('é idempotente e mantém relações no ambiente retornado pelos upserts', async () => {
    await popularDadosDemonstracao(db, async () => 'hash-de-teste');
    await popularDadosDemonstracao(db, async () => 'hash-de-teste');

    const aluno = await db.usuario.findUniqueOrThrow({
      where: { email: emails[0]! },
      include: {
        organizacao: {
          include: {
            estrategias: true,
            objetivos: true,
            servicos: { include: { custos: true, demandas: true, vinculos: true, indicadores: true } },
            cenarios: true
          }
        }
      }
    });

    expect(await db.usuario.count({ where: { email: { in: emails } } })).toBe(2);
    expect(aluno.organizacao?.nome).toBe('TechNova Retail');
    const organizacao = aluno.organizacao!;
    expect(organizacao.estrategias).toHaveLength(1);
    expect(organizacao.estrategias[0]).toMatchObject({
      perspectiva: expect.stringContaining('vendas B2B automatizadas'),
      posicao: expect.stringContaining('autonomia e agilidade'),
      plano: expect.stringContaining('R$ 150.000,00'),
      padrao: expect.stringContaining('segundo projeto consecutivo')
    });
    expect(organizacao.objetivos).toHaveLength(3);
    expect(organizacao.objetivos.find((objetivo) => objetivo.codigo === 'OE-01')?.descricao).toContain('20% no próximo ano fiscal');
    expect(organizacao.servicos).toHaveLength(5);

    const portal = organizacao.servicos.find((servico) => servico.nome === 'Portal de Vendas Corporativas (B2B)');
    expect(portal).toMatchObject({ status: 'EM_DESENHO' });
    expect(portal?.custos.map((custo) => [custo.tipo, Number(custo.valorPrevisto), custo.valorRealizado, custo.periodo])).toEqual(expect.arrayContaining([
      ['CAPEX', 150000, null, '2026-01'],
      ['OPEX', 15000, null, '2026-01']
    ]));
    expect(portal?.demandas.map((demanda) => [demanda.demandaPrevista, demanda.capacidadeInstalada, demanda.unidade, demanda.periodo])).toEqual(expect.arrayContaining([
      [500, 600, 'clientes (1º semestre)', '2026-06'],
      [10000, 11500, 'transações/mês', '2026-01']
    ]));
    expect(portal?.vinculos).toEqual([expect.objectContaining({ indicadorId: expect.any(String) })]);
    expect(Number(portal?.vinculos[0]?.contribuicao)).toBe(35);
    expect(portal?.indicadores).toEqual(expect.arrayContaining([
      expect.objectContaining({ nome: 'Tempo médio de atendimento', tipo: 'TEMPO_ATENDIMENTO', unidade: 'minutos', sentido: 'MENOR_MELHOR' })
    ]));
    expect(Number(portal?.indicadores.find((indicador) => indicador.nome === 'Tempo médio de atendimento')?.meta)).toBe(15);
    expect(organizacao.cenarios).toHaveLength(0);
    expect(await db.medicao.count({ where: { indicador: { servico: { organizacaoId: organizacao.id } } } })).toBe(0);
  });
});
