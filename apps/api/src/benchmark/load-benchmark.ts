import { validarBancoDeTeste } from '../config/database-safety.js';

export const USUARIOS_CONCORRENTES = 40;
export const LIMITE_OPERACAO_HTTP_MS = 2_000;

export interface ResumoAmostras {
  amostras: number;
  erros: number;
  minimoMs: number;
  p50Ms: number;
  p95Ms: number;
  maximoMs: number;
}

export function resolverUrlBancoDeBenchmark(ambiente: Record<string, string | undefined>): string {
  const url = ambiente.BENCHMARK_DATABASE_URL;
  if (!url) throw new Error('Defina BENCHMARK_DATABASE_URL para um schema ou banco verify descartável.');
  validarBancoDeTeste(url);

  const destino = new URL(url);
  const banco = decodeURIComponent(destino.pathname.replace(/^\//, ''));
  if (destino.searchParams.get('schema') !== 'verify' && !banco.endsWith('_verify')) {
    throw new Error('O benchmark aceita somente schema=verify ou banco com sufixo _verify.');
  }
  return url;
}

export function resumirAmostras(amostras: readonly number[], erros: number): ResumoAmostras {
  if (amostras.length === 0) throw new RangeError('O benchmark exige ao menos uma amostra.');
  if (!Number.isInteger(erros) || erros < 0) throw new RangeError('O número de erros é inválido.');
  if (amostras.some((amostra) => !Number.isFinite(amostra) || amostra < 0)) throw new RangeError('As durações do benchmark devem ser números finitos não negativos.');

  const ordenadas = [...amostras].sort((a, b) => a - b);
  return {
    amostras: ordenadas.length,
    erros,
    minimoMs: ordenadas[0]!,
    p50Ms: percentil(ordenadas, 0.5),
    p95Ms: percentil(ordenadas, 0.95),
    maximoMs: ordenadas.at(-1)!
  };
}

export function avaliarCarga(resumo: ResumoAmostras, limiteP95Ms = LIMITE_OPERACAO_HTTP_MS): { aprovada: boolean; motivo: string | null } {
  if (resumo.erros > 0) return { aprovada: false, motivo: `${resumo.erros} requisição(ões) falharam` };
  if (resumo.p95Ms > limiteP95Ms) return { aprovada: false, motivo: `p95 de ${resumo.p95Ms.toFixed(2)} ms excede ${limiteP95Ms} ms` };
  return { aprovada: true, motivo: null };
}

function percentil(ordenadas: readonly number[], proporcao: number): number {
  return ordenadas[Math.ceil(ordenadas.length * proporcao) - 1]!;
}
