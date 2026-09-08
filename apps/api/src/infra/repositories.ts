import type { PrismaClient } from '@prisma/client';
import type { AuthRepository } from '../modules/auth/auth.service.js';
import type { OrganizacaoRepository } from '../modules/organizacoes/organizacao.service.js';
import type { AnaliseAmbienteRepository } from '../modules/analises-ambiente/analise-ambiente.service.js';
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

export class PrismaAnaliseAmbienteRepository implements AnaliseAmbienteRepository {
  constructor(private db: PrismaClient) {}

  async buscarOrganizacaoId(usuarioId: string) {
    const organizacao = await this.db.organizacao.findUnique({ where: { usuarioId }, select: { id: true } });
    return organizacao?.id ?? null;
  }

  async listar(organizacaoId: string) {
    return this.db.analiseAmbiente.findMany({ where: { organizacaoId }, orderBy: [{ categoria: 'asc' }, { id: 'asc' }] });
  }

  async criar(organizacaoId: string, input: Parameters<AnaliseAmbienteRepository['criar']>[1]) {
    return this.db.analiseAmbiente.create({ data: { organizacaoId, ...input, impacto: input.impacto ?? null } });
  }

  async atualizar(organizacaoId: string, id: string, input: Parameters<AnaliseAmbienteRepository['atualizar']>[2]) {
    const result = await this.db.analiseAmbiente.updateMany({ where: { id, organizacaoId }, data: { ...input, impacto: input.impacto ?? null } });
    if (result.count === 0) return null;
    return this.db.analiseAmbiente.findFirst({ where: { id, organizacaoId } });
  }

  async remover(organizacaoId: string, id: string) {
    const result = await this.db.analiseAmbiente.deleteMany({ where: { id, organizacaoId } });
    return result.count > 0;
  }
}
