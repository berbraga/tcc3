import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const email = 'medicao-integridade@eduitsm.local';
let indicadorId = '';
let bancoSeguro = false;

describe('integridade de medições sem cenário', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email } });
    const usuario = await db.usuario.create({
      data: {
        nome: 'Teste Integridade', email, senhaHash: 'não-usada-no-teste', perfil: 'ALUNO',
        organizacao: {
          create: {
            nome: 'Organização de integridade',
            servicos: {
              create: {
                nome: 'Serviço de integridade', status: 'EM_OPERACAO',
                indicadores: { create: { nome: 'Indicador de integridade', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' } }
              }
            }
          }
        }
      },
      include: { organizacao: { include: { servicos: { include: { indicadores: true } } } } }
    });
    indicadorId = usuario.organizacao!.servicos[0]!.indicadores[0]!.id;
  });

  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email } }); }
    finally { await db.$disconnect(); }
  });

  it('mantém unicidade de indicador/período para a medição legada sem cenário', async () => {
    const periodoRef = new Date('2026-09-30T00:00:00.000Z');
    await db.medicao.create({ data: { indicadorId, periodoRef, valor: 90, origem: 'MANUAL' } });

    await expect(db.medicao.create({ data: { indicadorId, periodoRef, valor: 91, origem: 'MANUAL' } })).rejects.toMatchObject({ code: 'P2002' satisfies Prisma.PrismaClientKnownRequestError['code'] });
  });
});
