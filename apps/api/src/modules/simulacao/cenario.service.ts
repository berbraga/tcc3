import { createHash } from 'node:crypto';
import type { CenarioInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';
import { calcularMedicoes, avaliarMeta, type SentidoMeta } from './calculo.js';
import { GERADOR_VERSAO, gerarRegistros, type RegistroSimulado } from './gerador.js';

export interface ServicoDoCenario { id: string; nome: string; status: string; indicadores: { id: string; tipo: string }[]; }
export interface CenarioPersistido { id: string; semente: number; periodoInicio: Date; periodoFim: Date; volumeRegistros: number; perfil: string; geradorVersao: string; }
export interface PainelIndicador {
  periodo: string; cenarioId: string; cenario: { semente: number; perfil: string; periodoInicio: string; periodoFim: string; geradorVersao: string };
  servicoId: string; nomeServico: string; indicadorId: string; nome: string; tipo: string; unidade: string; meta: number; sentido: SentidoMeta; valor: number | null; denominador: number;
  situacao: ReturnType<typeof avaliarMeta> | null; medicoes: number; evolucao: number | null;
}
export type PainelItemPersistido = Omit<PainelIndicador, 'situacao' | 'medicoes' | 'evolucao'>;

export interface CenarioRepository {
  buscarOrganizacaoId(usuarioId: string): Promise<string | null>;
  buscarServicos(organizacaoId: string, ids: readonly string[]): Promise<ServicoDoCenario[]>;
  persistir(organizacaoId: string, input: CenarioInput, chaveReproducao: string, servicoIdsEmOperacao: readonly string[], registros: readonly RegistroSimulado[], medicoes: readonly { indicadorId: string; valor: number; denominador: number }[]): Promise<{ cenario: CenarioPersistido; reutilizado: boolean; registrosGerados: number; medicoesGeradas: number }>;
  obterPainel(organizacaoId: string, periodo?: string, cenarioId?: string): Promise<PainelItemPersistido[]>;
}

export class CenarioService {
  constructor(private repository: CenarioRepository) {}

  async criar(usuarioId: string, input: CenarioInput) {
    const organizacaoId = await this.organizacaoId(usuarioId);
    const servicos = await this.repository.buscarServicos(organizacaoId, input.servicoIds);
    if (servicos.length !== input.servicoIds.length) throw new AppError(404, 'SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado.');
    const ativos = servicos.filter((servico) => servico.status === 'EM_OPERACAO').sort(ordenarServicos);
    if (ativos.length === 0) throw new AppError(422, 'SEM_SERVICOS_EM_OPERACAO', 'Selecione ao menos um serviço em operação.');
    const indicadores = ativos.flatMap((servico) => servico.indicadores.map((indicador) => ({ ...indicador, servicoId: servico.id })));
    if (indicadores.length === 0) throw new AppError(422, 'SEM_INDICADORES', 'Defina ao menos um indicador para os serviços em operação selecionados.');

    const registros = gerarRegistros({ seed: input.semente, volume: input.volumeRegistros, periodoInicio: dataUtcInicial(input.periodoInicio), periodoFim: dataUtcFinal(input.periodoFim), servicoIds: ativos.map((servico) => servico.id), perfil: input.perfil });
    const medicoes = calcularMedicoes(ativos, indicadores, registros);
    const resultado = await this.repository.persistir(organizacaoId, input, chaveDeReproducao(input, ativos), ativos.map((servico) => servico.id), registros, medicoes);
    return { ...resultado.cenario, reutilizado: resultado.reutilizado, registrosGerados: resultado.registrosGerados, medicoesGeradas: resultado.medicoesGeradas };
  }

  async obterPainel(usuarioId: string, periodo?: string, cenarioId?: string): Promise<PainelIndicador[]> {
    const itens = await this.repository.obterPainel(await this.organizacaoId(usuarioId), periodo, cenarioId);
    const anteriores = new Map<string, number>();
    return itens.map((indicador) => {
      if (indicador.valor === null) return { ...indicador, situacao: null, medicoes: 0, evolucao: null };
      const anterior = anteriores.get(indicador.indicadorId);
      anteriores.set(indicador.indicadorId, indicador.valor);
      return { ...indicador, situacao: avaliarMeta(indicador.sentido, indicador.meta, indicador.valor), medicoes: 1, evolucao: anterior === undefined ? null : arredondar(indicador.valor - anterior) };
    });
  }

  private async organizacaoId(usuarioId: string) {
    const organizacaoId = await this.repository.buscarOrganizacaoId(usuarioId);
    if (!organizacaoId) throw new AppError(404, 'ORGANIZACAO_NAO_ENCONTRADA', 'Organização não encontrada.');
    return organizacaoId;
  }
}

export function dataUtcInicial(data: string) { return new Date(`${data}T00:00:00.000Z`); }
export function dataUtcFinal(data: string) { return new Date(`${data}T23:59:59.999Z`); }

function chaveDeReproducao(input: CenarioInput, servicos: readonly ServicoDoCenario[]) {
  const canonical = JSON.stringify({ versao: GERADOR_VERSAO, semente: input.semente, periodoInicio: input.periodoInicio, periodoFim: input.periodoFim, volumeRegistros: input.volumeRegistros, perfil: input.perfil, servicos: servicos.map((servico) => ({ id: servico.id, nome: normalizarNome(servico.nome) })) });
  return createHash('sha256').update(canonical).digest('hex');
}

function ordenarServicos(a: ServicoDoCenario, b: ServicoDoCenario) { return normalizarNome(a.nome).localeCompare(normalizarNome(b.nome), 'pt-BR') || a.id.localeCompare(b.id); }
function normalizarNome(nome: string) { return nome.trim().normalize('NFKC').toLocaleLowerCase('pt-BR'); }
function arredondar(valor: number) { return Math.round((valor + Number.EPSILON) * 100) / 100; }
