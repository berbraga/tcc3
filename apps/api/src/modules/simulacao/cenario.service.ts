import type { CenarioInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';
import { calcularMedicoes, avaliarMeta, type SentidoMeta } from './calculo.js';
import { gerarRegistros } from './gerador.js';

export interface ServicoDoCenario {
  id: string;
  status: string;
  indicadores: { id: string; tipo: string }[];
}

export interface PainelIndicador {
  servicoId: string;
  nomeServico: string;
  indicadorId: string;
  nome: string;
  tipo: string;
  unidade: string;
  meta: number;
  sentido: SentidoMeta;
  valor: number;
  situacao: ReturnType<typeof avaliarMeta>;
  medicoes: number;
}

export interface CenarioRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  buscarServicos(organizacaoId: string, ids: readonly string[]): Promise<ServicoDoCenario[]>;
  persistir(organizacaoId: string, input: CenarioInput, registros: ReturnType<typeof gerarRegistros>, medicoes: { indicadorId: string; valor: number }[]): Promise<{ id: string; semente: number; periodoInicio: Date; periodoFim: Date; volumeRegistros: number; perfil: string }>;
  obterPainel(organizacaoId: string): Promise<(Omit<PainelIndicador, 'valor' | 'situacao' | 'medicoes'> & { valores: number[] })[]>;
}

export class CenarioService {
  constructor(private repository: CenarioRepository) {}

  async criar(usuarioId: string, input: CenarioInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    const servicos = await this.repository.buscarServicos(organizacaoId, input.servicoIds);
    if (servicos.length !== input.servicoIds.length) throw new AppError(404, 'SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado.');
    const ativos = servicos.filter((servico) => servico.status === 'EM_OPERACAO');
    if (ativos.length === 0) throw new AppError(422, 'SEM_SERVICOS_EM_OPERACAO', 'Selecione ao menos um serviço em operação.');
    const registros = gerarRegistros({
      seed: input.semente,
      volume: input.volumeRegistros,
      periodoInicio: new Date(`${input.periodoInicio}T00:00:00.000Z`),
      periodoFim: new Date(`${input.periodoFim}T23:59:59.999Z`),
      servicoIds: ativos.map((servico) => servico.id),
      perfil: input.perfil
    });
    const medicoes = calcularMedicoes(servicos, servicos.flatMap((servico) => servico.indicadores.map((indicador) => ({ ...indicador, servicoId: servico.id }))), registros);
    const cenario = await this.repository.persistir(organizacaoId, input, registros, medicoes);
    return { ...cenario, registrosGerados: registros.length, medicoesGeradas: medicoes.length };
  }

  async obterPainel(usuarioId: string): Promise<PainelIndicador[]> {
    const itens = await this.repository.obterPainel(await this.organizacaoId(usuarioId));
    return itens.map(({ valores, ...indicador }) => {
      const valor = Math.round((valores.reduce((total, medicao) => total + medicao, 0) / valores.length + Number.EPSILON) * 100) / 100;
      return { ...indicador, valor, situacao: avaliarMeta(indicador.sentido, indicador.meta, valor), medicoes: valores.length };
    });
  }

  private async organizacaoId(usuarioId: string) {
    const organizacaoId = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!organizacaoId) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return organizacaoId;
  }
}
