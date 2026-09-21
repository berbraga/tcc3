import { criarPrng } from './prng.js';

export const MAXIMO_REGISTROS_SIMULADOS = 10_000;
export const GERADOR_VERSAO = '1';
export const TIMEZONE_SIMULACAO = 'UTC';

export type PerfilSimulacao = 'OTIMISTA' | 'REALISTA' | 'CRITICO';

export interface GerarRegistrosInput {
  seed: number;
  volume: number;
  periodoInicio: Date;
  periodoFim: Date;
  servicoIds: readonly string[];
  perfil: PerfilSimulacao;
}

export interface RegistroSimulado {
  servicoId: string;
  dataAbertura: Date;
  dataFechamento: Date;
  tempoAtendimentoMin: number;
  slaCumprido: boolean;
  notaSatisfacao: number;
}

const MILISSEGUNDOS_POR_MINUTO = 60_000;
const SEMENTE_MINIMA = -2_147_483_648;
const SEMENTE_MAXIMA = 2_147_483_647;
const perfisValidos = new Set<PerfilSimulacao>(['OTIMISTA', 'REALISTA', 'CRITICO']);

const perfis: Record<PerfilSimulacao, { sla: number; atendimentoMinimo: number; atendimentoMaximo: number; satisfacaoMinima: number }> = {
  OTIMISTA: { sla: 0.96, atendimentoMinimo: 15, atendimentoMaximo: 90, satisfacaoMinima: 4 },
  REALISTA: { sla: 0.85, atendimentoMinimo: 30, atendimentoMaximo: 240, satisfacaoMinima: 3 },
  CRITICO: { sla: 0.6, atendimentoMinimo: 60, atendimentoMaximo: 480, satisfacaoMinima: 1 }
};

export function gerarRegistros(input: GerarRegistrosInput): RegistroSimulado[] {
  validarEntrada(input);

  const inicio = input.periodoInicio.getTime();
  const fim = input.periodoFim.getTime();
  const perfil = perfis[input.perfil];
  const aleatorio = criarPrng(input.seed);
  const registros: RegistroSimulado[] = new Array(input.volume);

  for (let indice = 0; indice < input.volume; indice += 1) {
    const abertura = inicio + Math.floor(aleatorio() * (fim - inicio + 1));
    const tempoSorteado = inteiroAleatorio(aleatorio, perfil.atendimentoMinimo, perfil.atendimentoMaximo);
    const tempoAtendimentoMin = Math.min(tempoSorteado, Math.floor((fim - abertura) / MILISSEGUNDOS_POR_MINUTO));
    const slaCumprido = aleatorio() < perfil.sla;
    const notaSatisfacao = inteiroAleatorio(aleatorio, perfil.satisfacaoMinima, 5);

    registros[indice] = {
      servicoId: input.servicoIds[inteiroAleatorio(aleatorio, 0, input.servicoIds.length - 1)]!,
      dataAbertura: new Date(abertura),
      dataFechamento: new Date(abertura + tempoAtendimentoMin * MILISSEGUNDOS_POR_MINUTO),
      tempoAtendimentoMin,
      slaCumprido,
      notaSatisfacao
    };
  }

  return registros;
}

function inteiroAleatorio(aleatorio: () => number, minimo: number, maximo: number) {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

function validarEntrada(input: GerarRegistrosInput) {
  if (!Number.isInteger(input.seed) || input.seed < SEMENTE_MINIMA || input.seed > SEMENTE_MAXIMA) {
    throw new RangeError(`semente deve estar entre ${SEMENTE_MINIMA} e ${SEMENTE_MAXIMA}`);
  }
  if (!Number.isInteger(input.volume) || input.volume < 1 || input.volume > MAXIMO_REGISTROS_SIMULADOS) {
    throw new RangeError(`volume deve estar entre 1 e ${MAXIMO_REGISTROS_SIMULADOS}`);
  }
  if (input.servicoIds.length === 0) throw new RangeError('ao menos um serviço é obrigatório');
  if (!(input.periodoInicio instanceof Date) || !(input.periodoFim instanceof Date)
    || Number.isNaN(input.periodoInicio.getTime()) || Number.isNaN(input.periodoFim.getTime())
    || input.periodoInicio > input.periodoFim) {
    throw new RangeError('período de simulação é inválido');
  }
  if (!perfisValidos.has(input.perfil)) throw new RangeError('perfil de simulação é inválido');
}
