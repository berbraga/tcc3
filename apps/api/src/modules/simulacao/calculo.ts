export type SentidoMeta = 'MAIOR_MELHOR' | 'MENOR_MELHOR';
export type SituacaoMeta = 'ACIMA_DA_META' | 'NA_META' | 'ABAIXO_DA_META';

export interface ServicoParaCalculo {
  id: string;
  status: string;
}

export interface IndicadorParaCalculo {
  id: string;
  servicoId: string;
  tipo: string;
}

export interface RegistroParaCalculo {
  servicoId: string;
  slaCumprido: boolean;
  notaSatisfacao: number | null;
  tempoAtendimentoMin: number | null;
}

export interface MedicaoCalculada {
  indicadorId: string;
  valor: number;
  denominador: number;
}

export function calcularMedicoes(servicos: readonly ServicoParaCalculo[], indicadores: readonly IndicadorParaCalculo[], registros: readonly RegistroParaCalculo[]): MedicaoCalculada[] {
  const ativos = new Set(servicos.filter((servico) => servico.status === 'EM_OPERACAO').map((servico) => servico.id));

  return indicadores.flatMap((indicador) => {
    if (!ativos.has(indicador.servicoId)) return [];
    const registrosDoServico = registros.filter((registro) => registro.servicoId === indicador.servicoId);
    const resultado = calcularValor(indicador.tipo, registrosDoServico);
    return resultado === null ? [] : [{ indicadorId: indicador.id, ...resultado }];
  });
}

export function avaliarMeta(sentido: SentidoMeta, meta: number, valor: number): SituacaoMeta {
  if (valor === meta) return 'NA_META';
  return (sentido === 'MAIOR_MELHOR') === (valor > meta) ? 'ACIMA_DA_META' : 'ABAIXO_DA_META';
}

function calcularValor(tipo: string, registros: readonly RegistroParaCalculo[]): { valor: number; denominador: number } | null {
  if (registros.length === 0) return null;
  if (tipo === 'SLA') return { valor: arredondar(registros.filter((registro) => registro.slaCumprido).length / registros.length * 100), denominador: registros.length };
  if (tipo === 'SATISFACAO') return media(registros.map((registro) => registro.notaSatisfacao));
  if (tipo === 'TEMPO_ATENDIMENTO') return media(registros.map((registro) => registro.tempoAtendimentoMin));
  return null;
}

function media(valores: readonly (number | null)[]): { valor: number; denominador: number } | null {
  const definidos = valores.filter((valor): valor is number => valor !== null);
  return definidos.length === 0 ? null : { valor: arredondar(definidos.reduce((total, valor) => total + valor, 0) / definidos.length), denominador: definidos.length };
}

function arredondar(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
