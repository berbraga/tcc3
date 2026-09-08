import type { AtualizarOrganizacaoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ResumoOrganizacao { servicos: number; objetivos: number; versaoEstrategia: number | null; registrosOperacionais: number }
export interface OrganizacaoResultado { id: string; nome: string; setor: string | null; descricao: string | null; criadaEm: string; resumo: ResumoOrganizacao }
export interface OrganizacaoRepository {
  buscarPorUsuario(usuarioId: string): Promise<OrganizacaoResultado | null>;
  atualizarPorUsuario(usuarioId: string, input: AtualizarOrganizacaoInput): Promise<OrganizacaoResultado | null>;
}

export class OrganizacaoService {
  constructor(private repository: OrganizacaoRepository) {}
  async obterMinha(usuarioId: string) {
    const organizacao = await this.repository.buscarPorUsuario(usuarioId);
    if (!organizacao) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return organizacao;
  }
  async atualizarMinha(usuarioId: string, input: AtualizarOrganizacaoInput) {
    const organizacao = await this.repository.atualizarPorUsuario(usuarioId, input);
    if (!organizacao) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return organizacao;
  }
  async verificarAcesso(usuarioId: string, organizacaoId: string) {
    const organizacao = await this.obterMinha(usuarioId);
    if (organizacao.id !== organizacaoId) throw new AppError(403, 'ACESSO_NEGADO', 'Você não tem permissão para acessar esta organização.');
  }
}
