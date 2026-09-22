/**
 * Amostra conhecida do roteiro TechNova. Ela não é usada pelo gerador,
 * persistência ou painel; serve somente para explicar e testar a média.
 */
export const fixtureCincoAtendimentos = [8, 12, 15, 20, 25] as const;

export function calcularMediaAtendimentos(tempos: readonly number[]): number {
  if (tempos.length === 0 || tempos.some((tempo) => !Number.isFinite(tempo) || tempo < 0)) {
    throw new RangeError('Informe ao menos um tempo de atendimento finito e não negativo.');
  }

  return tempos.reduce((total, tempo) => total + tempo, 0) / tempos.length;
}
