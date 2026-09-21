import { describe, expect, it } from 'vitest';
import { avaliarCarga, resolverUrlBancoDeBenchmark, resumirAmostras } from '../src/benchmark/load-benchmark.js';

describe('contrato do benchmark de carga', () => {
  it('aceita exclusivamente alvo descartável verify antes de qualquer escrita', () => {
    expect(resolverUrlBancoDeBenchmark({ BENCHMARK_DATABASE_URL: 'postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=verify' }))
      .toBe('postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=verify');
    expect(() => resolverUrlBancoDeBenchmark({ BENCHMARK_DATABASE_URL: 'postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=test' }))
      .toThrow(/verify/);
    expect(() => resolverUrlBancoDeBenchmark({ BENCHMARK_DATABASE_URL: 'postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=public' }))
      .toThrow(/recusaram/);
  });

  it('calcula p50, p95 e falhas da carga concorrente sem ocultar erros', () => {
    const resumo = resumirAmostras([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 1);

    expect(resumo).toEqual({ amostras: 10, erros: 1, minimoMs: 10, p50Ms: 50, p95Ms: 100, maximoMs: 100 });
    expect(avaliarCarga(resumo)).toEqual({ aprovada: false, motivo: '1 requisição(ões) falharam' });
  });

  it('aceita 40 respostas sem erro quando o p95 está no limite de dois segundos', () => {
    const resumo = resumirAmostras(Array.from({ length: 40 }, () => 2_000), 0);

    expect(avaliarCarga(resumo)).toEqual({ aprovada: true, motivo: null });
  });
});
