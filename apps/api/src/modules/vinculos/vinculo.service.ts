import type { ServicoInput, VinculoEstrategicoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ServicoParaVinculo {
  id: string;
  organizacaoId: string;
  nome: string;
  status: ServicoInput['status'];
}

export interface VinculoResultado extends VinculoEstrategicoInput { id: string }

export interface VinculoRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  buscarServico(organizacaoId: string, id: string): Promise<ServicoParaVinculo | null>;
  objetivoExiste(organizacaoId: string, id: string): Promise<boolean>;
  somarContribuicoes(organizacaoId: string, objetivoId: string): Promise<number>;
  listar(organizacaoId: string): Promise<VinculoResultado[]>;
  criar(organizacaoId: string, input: VinculoEstrategicoInput): Promise<VinculoResultado>;
  remover(organizacaoId: string, id: string): Promise<boolean>;
  listarPendencias(organizacaoId: string): Promise<ServicoParaVinculo[]>;
}

export class VinculoService {
  constructor(private repository: VinculoRepository) {}

  async listar(usuarioId: string) {
    return this.repository.listar(await this.organizacaoId(usuarioId));
  }

  async criar(usuarioId: string, input: VinculoEstrategicoInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    if (!await this.repository.buscarServico(organizacaoId, input.servicoId)) {
      throw new AppError(404, 'SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado.');
    }
    if (!await this.repository.objetivoExiste(organizacaoId, input.objetivoId)) {
      throw new AppError(404, 'OBJETIVO_NAO_ENCONTRADO', 'Objetivo estratégico não encontrado.');
    }
    const total = await this.repository.somarContribuicoes(organizacaoId, input.objetivoId);
    const saldoDisponivel = Number((100 - total).toFixed(2));
    if (input.contribuicao > saldoDisponivel) {
      throw new AppError(422, 'CONTRIBUICAO_EXCEDE_LIMITE', `A contribuição excede 100%. Saldo disponível: ${saldoDisponivel}%.`, { saldoDisponivel });
    }
    try {
      return await this.repository.criar(organizacaoId, input);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new AppError(422, 'VINCULO_DUPLICADO', 'Este serviço já está vinculado ao objetivo.');
      }
      throw error;
    }
  }

  async remover(usuarioId: string, id: string) {
    if (!await this.repository.remover(await this.organizacaoId(usuarioId), id)) {
      throw new AppError(404, 'VINCULO_NAO_ENCONTRADO', 'Vínculo estratégico não encontrado.');
    }
  }

  async listarPendencias(usuarioId: string) {
    return this.repository.listarPendencias(await this.organizacaoId(usuarioId));
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }
}
