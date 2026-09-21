import type { PrismaClient } from '@prisma/client';
import type { AuthRepository } from '../modules/auth/auth.service.js';
import type { OrganizacaoRepository } from '../modules/organizacoes/organizacao.service.js';
import type { AtualizarOrganizacaoInput } from '@eduitsm/shared';

const authSelect = { id: true, nome: true, email: true, perfil: true, senhaHash: true, organizacao: { select: { id: true } } } as const;

export class PrismaAuthRepository implements AuthRepository {
  constructor(private db: PrismaClient) {}
  async buscarPorEmail(email: string) {
    const user = await this.db.usuario.findUnique({ where: { email }, select: authSelect });
    return user?.organizacao ? { ...user, organizacaoId: user.organizacao.id } : null;
  }
  async criarAlunoComOrganizacao(input: Parameters<AuthRepository['criarAlunoComOrganizacao']>[0]) {
    const user = await this.db.usuario.create({ data: { nome: input.nome, email: input.email, senhaHash: input.senhaHash, perfil: input.perfil, organizacao: { create: input.organizacao } }, select: authSelect });
    if (!user.organizacao) throw new Error('RN01 violada');
    return { ...user, organizacaoId: user.organizacao.id };
  }
}

export class PrismaOrganizacaoRepository implements OrganizacaoRepository {
  constructor(private db: PrismaClient) {}
  async buscarPorUsuario(usuarioId: string) {
    const org = await this.db.organizacao.findUnique({ where: { usuarioId }, include: { _count: { select: { servicos: true, objetivos: true } }, estrategias: { orderBy: { versao: 'desc' }, take: 1, select: { versao: true } }, cenarios: { select: { _count: { select: { registros: true } } } } } });
    return org ? this.map(org) : null;
  }
  async atualizarPorUsuario(usuarioId: string, input: AtualizarOrganizacaoInput) {
    const exists = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    if (!exists) return null;
    await this.db.organizacao.update({ where: { usuarioId }, data: input });
    return this.buscarPorUsuario(usuarioId);
  }
  private map(org: Awaited<ReturnType<PrismaClient['organizacao']['findUnique']>> & { _count: { servicos: number; objetivos: number }; estrategias: { versao: number }[]; cenarios: { _count: { registros: number } }[] }) {
    return { id: org!.id, nome: org!.nome, setor: org!.setor, descricao: org!.descricao, criadaEm: org!.criadaEm.toISOString(), resumo: { servicos: org!._count.servicos, objetivos: org!._count.objetivos, versaoEstrategia: org!.estrategias[0]?.versao ?? null, registrosOperacionais: org!.cenarios.reduce((sum, c) => sum + c._count.registros, 0) } };
  }
}
