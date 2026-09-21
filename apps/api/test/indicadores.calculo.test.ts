import { describe, expect, it } from 'vitest';
import { avaliarMeta, calcularMedicoes, type IndicadorParaCalculo, type RegistroParaCalculo, type ServicoParaCalculo } from '../src/modules/simulacao/calculo.js';

const servicos: ServicoParaCalculo[] = [
  { id: 'portal', status: 'EM_OPERACAO' },
  { id: 'legado', status: 'DESCONTINUADO' }
];

const indicadores: IndicadorParaCalculo[] = [
  { id: 'sla', servicoId: 'portal', tipo: 'SLA' },
  { id: 'satisfacao', servicoId: 'portal', tipo: 'SATISFACAO' },
  { id: 'tempo', servicoId: 'portal', tipo: 'TEMPO_ATENDIMENTO' },
  { id: 'legado-sla', servicoId: 'legado', tipo: 'SLA' }
];

const registros: RegistroParaCalculo[] = [
  { servicoId: 'portal', slaCumprido: true, notaSatisfacao: 2, tempoAtendimentoMin: 20 },
  { servicoId: 'portal', slaCumprido: true, notaSatisfacao: 4, tempoAtendimentoMin: 40 },
  { servicoId: 'portal', slaCumprido: false, notaSatisfacao: 5, tempoAtendimentoMin: 60 },
  { servicoId: 'legado', slaCumprido: true, notaSatisfacao: 5, tempoAtendimentoMin: 5 }
];

describe('cálculo de medições dos indicadores', () => {
  it('TS01 — calcula cumprimento de SLA com tolerância de 0,01 ponto percentual', () => {
    const medicoes = calcularMedicoes(servicos, indicadores, registros);

    expect(medicoes).toHaveLength(3);
    expect(Math.abs(medicoes.find((medicao) => medicao.indicadorId === 'sla')!.valor - 66.67)).toBeLessThanOrEqual(0.01);
    expect(medicoes.find((medicao) => medicao.indicadorId === 'sla')!.denominador).toBe(3);
  });

  it('TS02 — calcula tempo médio pela média aritmética dos registros do período', () => {
    const medicoes = calcularMedicoes(servicos, indicadores, registros);

    expect(medicoes.find((medicao) => medicao.indicadorId === 'satisfacao')!.valor).toBeCloseTo(3.67, 2);
    expect(medicoes.find((medicao) => medicao.indicadorId === 'tempo')!.valor).toBe(40);
  });

  it.each([
    ['MAIOR_MELHOR', 100, 101, 'ACIMA_DA_META'],
    ['MAIOR_MELHOR', 100, 100, 'NA_META'],
    ['MAIOR_MELHOR', 100, 99, 'ABAIXO_DA_META'],
    ['MENOR_MELHOR', 100, 99, 'ACIMA_DA_META'],
    ['MENOR_MELHOR', 100, 100, 'NA_META'],
    ['MENOR_MELHOR', 100, 101, 'ABAIXO_DA_META']
  ] as const)('TS03 — avalia %s com valor %d contra meta %d como %s', (sentido, meta, valor, situacao) => {
    expect(avaliarMeta(sentido, meta, valor)).toBe(situacao);
  });

  it('TS07 — ignora serviço descontinuado e seus registros', () => {
    const medicoes = calcularMedicoes(servicos, indicadores, registros);

    expect(medicoes).not.toContainEqual(expect.objectContaining({ indicadorId: 'legado-sla' }));
  });
});
