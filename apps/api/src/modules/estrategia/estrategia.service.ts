import { normalizarEstrategia, type EstrategiaInput } from '@eduitsm/shared';
export { estrategiaCompleta } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface EstrategiaResultado extends EstrategiaInput {
  id: string;
  organizacaoId: string;
  versao: number;
  atualizadaEm: Date;
}

export interface EstrategiaRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  obterAtual(organizacaoId: string): Promise<EstrategiaResultado | null>;
  listarVersoes(organizacaoId: string): Promise<EstrategiaResultado[]>;
  salvarNovaVersao(organizacaoId: string, input: EstrategiaInput): Promise<EstrategiaResultado>;
}

export class EstrategiaService {
  constructor(private repository: EstrategiaRepository) {}

  async obterAtual(usuarioId: string) {
    return this.repository.obterAtual(await this.organizacaoId(usuarioId));
  }

  async listarVersoes(usuarioId: string) {
    return this.repository.listarVersoes(await this.organizacaoId(usuarioId));
  }

  async salvarNovaVersao(usuarioId: string, input: EstrategiaInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    const estrategia = normalizarEstrategia(input);
    const atual = await this.repository.obterAtual(organizacaoId);
    if (atual && this.igual(atual, estrategia)) return atual;
    try {
      return await this.repository.salvarNovaVersao(organizacaoId, estrategia);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new AppError(422, 'CONFLITO_VERSAO_ESTRATEGIA', 'A estratégia foi alterada simultaneamente. Recarregue e tente novamente.');
      }
      throw error;
    }
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }

  private igual(atual: EstrategiaResultado, entrada: EstrategiaInput) {
    return atual.perspectiva === entrada.perspectiva
      && atual.posicao === entrada.posicao
      && atual.plano === entrada.plano
      && atual.padrao === entrada.padrao;
  }
}
