import type { ServicoInput, VinculoEstrategicoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ServicoParaVinculo {
  id: string;
  organizacaoId: string;
  nome: string;
  status: ServicoInput['status'];
}

export interface VinculoResultado extends VinculoEstrategicoInput { id: string }

export interface IndicadorParaVinculo {
  id: string;
  organizacaoId: string;
  servicoId: string;
  objetivoId: string | null;
  nome: string;
  tipo: string;
  unidade: string;
}

export interface LimiteContribuicaoExcedido { saldoDisponivel: number }

export interface VinculoRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  buscarServico(organizacaoId: string, id: string): Promise<ServicoParaVinculo | null>;
  objetivoExiste(organizacaoId: string, id: string): Promise<boolean>;
  buscarIndicador(organizacaoId: string, id: string): Promise<IndicadorParaVinculo | null>;
  listar(organizacaoId: string): Promise<VinculoResultado[]>;
  criarComLimite(organizacaoId: string, input: VinculoEstrategicoInput): Promise<VinculoResultado | LimiteContribuicaoExcedido>;
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
    await this.validarIndicador(organizacaoId, input);
    try {
      const resultado = await this.repository.criarComLimite(organizacaoId, input);
      if ('saldoDisponivel' in resultado) {
        throw new AppError(422, 'CONTRIBUICAO_EXCEDE_LIMITE', `A contribuição excede 100%. Saldo disponível: ${resultado.saldoDisponivel}%.`, { saldoDisponivel: resultado.saldoDisponivel });
      }
      return resultado;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'INDICADOR_NAO_ENCONTRADO') {
        throw new AppError(404, 'INDICADOR_NAO_ENCONTRADO', 'Indicador não encontrado.');
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'INDICADOR_SERVICO_INCOMPATIVEL') {
        throw new AppError(422, 'INDICADOR_SERVICO_INCOMPATIVEL', 'O indicador selecionado pertence a outro serviço.');
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'INDICADOR_OBJETIVO_INCOMPATIVEL') {
        throw new AppError(422, 'INDICADOR_OBJETIVO_INCOMPATIVEL', 'O indicador selecionado está associado a outro objetivo.');
      }
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

  private async validarIndicador(organizacaoId: string, input: VinculoEstrategicoInput) {
    if (!input.indicadorId) return;
    const indicador = await this.repository.buscarIndicador(organizacaoId, input.indicadorId);
    if (!indicador) throw new AppError(404, 'INDICADOR_NAO_ENCONTRADO', 'Indicador não encontrado.');
    if (indicador.servicoId !== input.servicoId) {
      throw new AppError(422, 'INDICADOR_SERVICO_INCOMPATIVEL', 'O indicador selecionado pertence a outro serviço.');
    }
    if (indicador.objetivoId && indicador.objetivoId !== input.objetivoId) {
      throw new AppError(422, 'INDICADOR_OBJETIVO_INCOMPATIVEL', 'O indicador selecionado está associado a outro objetivo.');
    }
  }
}
