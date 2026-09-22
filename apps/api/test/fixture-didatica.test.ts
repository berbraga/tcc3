import { describe, expect, it } from 'vitest';
import { avaliarMeta } from '../src/modules/simulacao/calculo.js';
import { calcularMediaAtendimentos, fixtureCincoAtendimentos } from '../src/modules/simulacao/fixture-didatica.js';

describe('fixture didática de cinco atendimentos', () => {
  it('mantém a amostra independente com soma 80, média 16 e meta de 15 minutos não atingida', () => {
    expect(fixtureCincoAtendimentos).toEqual([8, 12, 15, 20, 25]);
    expect(fixtureCincoAtendimentos.reduce((total, tempo) => total + tempo, 0)).toBe(80);
    expect(calcularMediaAtendimentos(fixtureCincoAtendimentos)).toBe(16);
    expect(avaliarMeta('MENOR_MELHOR', 15, calcularMediaAtendimentos(fixtureCincoAtendimentos))).toBe('ABAIXO_DA_META');
  });
});
