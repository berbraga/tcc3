import { expect, it } from 'vitest';
import { gerarRegistros } from '../src/modules/simulacao/gerador.js';

it('gera 10.000 registros em até dez segundos (TS12)', () => {
  const inicio = performance.now();
  const registros = gerarRegistros({
    seed: 20260908,
    volume: 10_000,
    periodoInicio: new Date('2026-01-01T00:00:00.000Z'),
    periodoFim: new Date('2026-12-31T23:59:59.999Z'),
    servicoIds: ['servico-a', 'servico-b', 'servico-c'],
    perfil: 'REALISTA'
  });

  expect(registros).toHaveLength(10_000);
  expect(performance.now() - inicio).toBeLessThan(10_000);
});
