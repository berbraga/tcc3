import type { ObjetivoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ObjetivoResultado {
  id: string;
  organizacaoId: string;
  codigo: string;
  descricao: string;
  prazo: Date | null;
  status: ObjetivoInput['status'];
}

export interface CoberturaObjetivoResultado {
  objetivoId: string;
  servicosVinculados: number;
  cobertura: number;
}

export interface ObjetivoRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  listar(organizacaoId: string): Promise<ObjetivoResultado[]>;
  criar(organizacaoId: string, input: ObjetivoInput): Promise<ObjetivoResultado>;
  obterCobertura(organizacaoId: string, id: string): Promise<CoberturaObjetivoResultado | null>;
}

export class ObjetivoService {
  constructor(private repository: ObjetivoRepository) {}

  async listar(usuarioId: string) {
    return this.repository.listar(await this.organizacaoId(usuarioId));
  }

  async criar(usuarioId: string, input: ObjetivoInput) {
    try {
      return await this.repository.criar(await this.organizacaoId(usuarioId), input);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new AppError(422, 'CODIGO_OBJETIVO_DUPLICADO', 'Já existe um objetivo com este código.');
      }
      throw error;
    }
  }

  async obterCobertura(usuarioId: string, id: string) {
    const cobertura = await this.repository.obterCobertura(await this.organizacaoId(usuarioId), id);
    if (!cobertura) throw new AppError(404, 'OBJETIVO_NAO_ENCONTRADO', 'Objetivo estratégico não encontrado.');
    return cobertura;
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }
}
