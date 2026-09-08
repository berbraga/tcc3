import type { CustoServicoInput, DemandaCapacidadeInput, ServicoInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface ServicoResultado {
  id: string;
  organizacaoId: string;
  nome: string;
  descricao: string | null;
  publicoAlvo: string | null;
  status: ServicoInput['status'];
  criadoEm: Date;
}

export interface CustoServicoResultado {
  id: string;
  servicoId: string;
  tipo: CustoServicoInput['tipo'];
  valorPrevisto: number;
  valorRealizado: number | null;
  periodo: string;
}

export interface DemandaCapacidadeResultado {
  id: string;
  servicoId: string;
  periodo: string;
  demandaPrevista: number;
  capacidadeInstalada: number;
  unidade: string;
}

export type ResultadoRemocaoServico = 'REMOVIDO' | 'NAO_ENCONTRADO' | 'POSSUI_RELACOES';

export interface ServicoRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  listar(organizacaoId: string): Promise<ServicoResultado[]>;
  criar(organizacaoId: string, input: ServicoInput): Promise<ServicoResultado>;
  atualizar(organizacaoId: string, id: string, input: ServicoInput): Promise<ServicoResultado | null>;
  remover(organizacaoId: string, id: string): Promise<ResultadoRemocaoServico>;
  listarCustos(organizacaoId: string, servicoId: string): Promise<CustoServicoResultado[] | null>;
  adicionarCusto(organizacaoId: string, servicoId: string, input: CustoServicoInput): Promise<CustoServicoResultado | null>;
  listarDemanda(organizacaoId: string, servicoId: string): Promise<DemandaCapacidadeResultado[] | null>;
  adicionarDemanda(organizacaoId: string, servicoId: string, input: DemandaCapacidadeInput): Promise<DemandaCapacidadeResultado | null>;
}

export class ServicoService {
  constructor(private repository: ServicoRepository) {}

  async listar(usuarioId: string) {
    return this.repository.listar(await this.organizacaoId(usuarioId));
  }

  async criar(usuarioId: string, input: ServicoInput) {
    return this.repository.criar(await this.organizacaoId(usuarioId), input);
  }

  async atualizar(usuarioId: string, id: string, input: ServicoInput) {
    const servico = await this.repository.atualizar(await this.organizacaoId(usuarioId), id, input);
    if (!servico) throw this.naoEncontrado();
    return servico;
  }

  async remover(usuarioId: string, id: string) {
    const resultado = await this.repository.remover(await this.organizacaoId(usuarioId), id);
    if (resultado === 'NAO_ENCONTRADO') throw this.naoEncontrado();
    if (resultado === 'POSSUI_RELACOES') {
      throw new AppError(422, 'SERVICO_POSSUI_RELACOES', 'O serviço possui histórico relacionado e não pode ser excluído. Descontinue-o para preservá-lo.');
    }
  }

  async listarCustos(usuarioId: string, servicoId: string) {
    const custos = await this.repository.listarCustos(await this.organizacaoId(usuarioId), servicoId);
    if (!custos) throw this.naoEncontrado();
    return custos;
  }

  async adicionarCusto(usuarioId: string, servicoId: string, input: CustoServicoInput) {
    const custo = await this.repository.adicionarCusto(await this.organizacaoId(usuarioId), servicoId, input);
    if (!custo) throw this.naoEncontrado();
    return custo;
  }

  async listarDemanda(usuarioId: string, servicoId: string) {
    const demandas = await this.repository.listarDemanda(await this.organizacaoId(usuarioId), servicoId);
    if (!demandas) throw this.naoEncontrado();
    return demandas;
  }

  async adicionarDemanda(usuarioId: string, servicoId: string, input: DemandaCapacidadeInput) {
    const demanda = await this.repository.adicionarDemanda(await this.organizacaoId(usuarioId), servicoId, input);
    if (!demanda) throw this.naoEncontrado();
    return demanda;
  }

  private async organizacaoId(usuarioId: string) {
    const id = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!id) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return id;
  }

  private naoEncontrado() {
    return new AppError(404, 'SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado.');
  }
}
