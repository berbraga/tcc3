import type { IndicadorInput, ServicoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ServicoParaIndicador {
  id: string;
  organizacaoId: string;
  status: ServicoInput['status'];
}

export interface IndicadorResultado extends Omit<IndicadorInput, 'objetivoId'> {
  id: string;
  servicoId: string;
  objetivoId: string | null;
}

export interface IndicadorRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  buscarServico(organizacaoId: string, id: string): Promise<ServicoParaIndicador | null>;
  objetivoExiste(organizacaoId: string, id: string): Promise<boolean>;
  listarPorServico(organizacaoId: string, servicoId: string): Promise<IndicadorResultado[] | null>;
  criar(organizacaoId: string, servicoId: string, input: IndicadorInput): Promise<IndicadorResultado>;
  atualizar(organizacaoId: string, id: string, input: IndicadorInput): Promise<IndicadorResultado | null>;
  remover(organizacaoId: string, id: string): Promise<boolean>;
}

export class IndicadorService {
  constructor(private repository: IndicadorRepository) {}

  async listarPorServico(usuarioId: string, servicoId: string) {
    const indicadores = await this.repository.listarPorServico(await this.organizacaoId(usuarioId), servicoId);
    if (!indicadores) throw this.servicoNaoEncontrado();
    return indicadores;
  }

  async criar(usuarioId: string, servicoId: string, input: IndicadorInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    const servico = await this.repository.buscarServico(organizacaoId, servicoId);
    if (!servico) throw this.servicoNaoEncontrado();
    if (servico.status === 'DESCONTINUADO') {
      throw new AppError(422, 'SERVICO_DESCONTINUADO', 'Serviço descontinuado não pode receber indicadores.');
    }
    await this.validarObjetivo(organizacaoId, input.objetivoId);
    return this.repository.criar(organizacaoId, servicoId, input);
  }

  async atualizar(usuarioId: string, id: string, input: IndicadorInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    await this.validarObjetivo(organizacaoId, input.objetivoId);
    const indicador = await this.repository.atualizar(organizacaoId, id, input);
    if (!indicador) throw this.indicadorNaoEncontrado();
    return indicador;
  }

  async remover(usuarioId: string, id: string) {
    if (!await this.repository.remover(await this.organizacaoId(usuarioId), id)) throw this.indicadorNaoEncontrado();
  }

  private async validarObjetivo(organizacaoId: string, objetivoId: string | null | undefined) {
    if (objetivoId && !await this.repository.objetivoExiste(organizacaoId, objetivoId)) {
      throw new AppError(404, 'OBJETIVO_NAO_ENCONTRADO', 'Objetivo estratégico não encontrado.');
    }
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }

  private servicoNaoEncontrado() { return new AppError(404, 'SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado.'); }
  private indicadorNaoEncontrado() { return new AppError(404, 'INDICADOR_NAO_ENCONTRADO', 'Indicador não encontrado.'); }
}
