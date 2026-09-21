import { PrismaClient, PerfilUsuario } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { popularDadosDemonstracao } from '../src/modules/demo/seed.service.js';
import { validarBancoDeTeste } from '../src/config/database-safety.js';

const db = new PrismaClient();
const emails = ['aluno@eduitsm.local', 'professor@eduitsm.local'];

describe('seed de demonstração', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    await db.usuario.deleteMany({ where: { email: { in: emails } } });

    const aluno = await db.usuario.create({
      data: { nome: 'Aluno já existente', email: emails[0]!, senhaHash: 'hash-antigo', perfil: PerfilUsuario.ALUNO }
    });
    await db.organizacao.create({
      data: { id: randomUUID(), usuarioId: aluno.id, nome: 'Organização já existente' }
    });
  });

  afterAll(async () => {
    await db.usuario.deleteMany({ where: { email: { in: emails } } });
    await db.$disconnect();
  });

  it('é idempotente e mantém relações no ambiente retornado pelos upserts', async () => {
    await popularDadosDemonstracao(db, async () => 'hash-de-teste');
    await popularDadosDemonstracao(db, async () => 'hash-de-teste');

    const aluno = await db.usuario.findUniqueOrThrow({
      where: { email: emails[0]! },
      include: { organizacao: { include: { estrategias: true, objetivos: true, servicos: true } } }
    });

    expect(await db.usuario.count({ where: { email: { in: emails } } })).toBe(2);
    expect(aluno.organizacao?.nome).toBe('TechNova Retail');
    expect(aluno.organizacao?.estrategias).toHaveLength(1);
    expect(aluno.organizacao?.objetivos).toHaveLength(3);
    expect(aluno.organizacao?.servicos).toHaveLength(5);
  });
});
