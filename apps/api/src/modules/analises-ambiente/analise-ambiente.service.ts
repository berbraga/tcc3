import type { AnaliseAmbienteInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface AnaliseAmbienteResultado {
  id: string;
  organizacaoId: string;
  tipo: AnaliseAmbienteInput['tipo'];
  categoria: AnaliseAmbienteInput['categoria'];
  descricao: string;
  impacto: NonNullable<AnaliseAmbienteInput['impacto']> | null;
}

export interface AnaliseAmbienteRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  listar(organizacaoId: string): Promise<AnaliseAmbienteResultado[]>;
  criar(organizacaoId: string, input: AnaliseAmbienteInput): Promise<AnaliseAmbienteResultado>;
  atualizar(organizacaoId: string, id: string, input: AnaliseAmbienteInput): Promise<AnaliseAmbienteResultado | null>;
  remover(organizacaoId: string, id: string): Promise<boolean>;
}

export class AnaliseAmbienteService {
  constructor(private repository: AnaliseAmbienteRepository) {}

  async listar(usuarioId: string) {
    return this.repository.listar(await this.organizacaoId(usuarioId));
  }

  async criar(usuarioId: string, input: AnaliseAmbienteInput) {
    return this.repository.criar(await this.organizacaoId(usuarioId), input);
  }

  async atualizar(usuarioId: string, id: string, input: AnaliseAmbienteInput) {
    const item = await this.repository.atualizar(await this.organizacaoId(usuarioId), id, input);
    if (!item) throw this.naoEncontrada();
    return item;
  }

  async remover(usuarioId: string, id: string) {
    const removida = await this.repository.remover(await this.organizacaoId(usuarioId), id);
    if (!removida) throw this.naoEncontrada();
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }

  private naoEncontrada() {
    return new AppError(404, 'ANALISE_NAO_ENCONTRADA', 'Análise de ambiente não encontrada.');
  }
}
