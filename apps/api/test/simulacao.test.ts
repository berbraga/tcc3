import { describe, expect, it } from 'vitest';
import { gerarRegistros, MAXIMO_REGISTROS_SIMULADOS } from '../src/modules/simulacao/gerador.js';

const entrada = {
  seed: 20260908,
  volume: 12,
  periodoInicio: new Date('2026-01-01T00:00:00.000Z'),
  periodoFim: new Date('2026-01-31T23:59:59.999Z'),
  servicoIds: ['servico-a', 'servico-b'],
  perfil: 'REALISTA' as const
};

describe('Gerador determinístico de registros operacionais', () => {
  it('TS04 — produz bytes idênticos para a mesma semente e parâmetros', () => {
    const primeiro = gerarRegistros(entrada);
    const segundo = gerarRegistros(entrada);

    expect(JSON.stringify(primeiro)).toBe(JSON.stringify(segundo));
    expect(primeiro).toHaveLength(12);
  });

  it('produz uma sequência diferente quando a semente muda', () => {
    const original = gerarRegistros(entrada);
    const comOutraSemente = gerarRegistros({ ...entrada, seed: 20260909 });

    expect(JSON.stringify(comOutraSemente)).not.toBe(JSON.stringify(original));
  });

  it('mantém abertura e fechamento dentro do período solicitado', () => {
    const registros = gerarRegistros(entrada);

    for (const registro of registros) {
      expect(registro.servicoId).toBeOneOf(entrada.servicoIds);
      expect(registro.dataAbertura.getTime()).toBeGreaterThanOrEqual(entrada.periodoInicio.getTime());
      expect(registro.dataFechamento?.getTime()).toBeLessThanOrEqual(entrada.periodoFim.getTime());
      expect(registro.tempoAtendimentoMin).toBeGreaterThanOrEqual(0);
      expect(registro.notaSatisfacao).toBeGreaterThanOrEqual(1);
      expect(registro.notaSatisfacao).toBeLessThanOrEqual(5);
    }
  });

  it('rejeita período invertido, lista de serviços vazia e volume fora do limite', () => {
    expect(() => gerarRegistros({ ...entrada, periodoInicio: entrada.periodoFim, periodoFim: entrada.periodoInicio }))
      .toThrow('período de simulação é inválido');
    expect(() => gerarRegistros({ ...entrada, servicoIds: [] })).toThrow('ao menos um serviço é obrigatório');
    expect(() => gerarRegistros({ ...entrada, volume: 0 })).toThrow('volume deve estar entre 1');
    expect(() => gerarRegistros({ ...entrada, volume: MAXIMO_REGISTROS_SIMULADOS + 1 })).toThrow(`volume deve estar entre 1 e ${MAXIMO_REGISTROS_SIMULADOS}`);
  });

  it('aceita os limites do inteiro Prisma e rejeita a colisão anterior do PRNG', () => {
    expect(gerarRegistros({ ...entrada, seed: -2_147_483_648 })).toHaveLength(12);
    expect(gerarRegistros({ ...entrada, seed: 2_147_483_647 })).toHaveLength(12);
    expect(() => gerarRegistros({ ...entrada, seed: -2_147_483_649 })).toThrow('semente deve estar entre -2147483648 e 2147483647');
    expect(() => gerarRegistros({ ...entrada, seed: 4_294_967_295 })).toThrow('semente deve estar entre -2147483648 e 2147483647');
  });

  it('rejeita nomes herdados e perfis desconhecidos', () => {
    for (const perfil of ['toString', 'constructor', 'DESCONHECIDO']) {
      expect(() => gerarRegistros({ ...entrada, perfil: perfil as unknown as 'REALISTA' })).toThrow('perfil de simulação é inválido');
    }
  });
});
