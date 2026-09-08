type AmbienteSeed = Record<string, string | undefined>;

export function validarAmbienteSeedDemo(ambiente: AmbienteSeed): void {
  if (ambiente.NODE_ENV === 'production') {
    throw new Error('Seed de demonstração é proibido em produção.');
  }

  if (ambiente.NODE_ENV !== 'development' && ambiente.NODE_ENV !== 'test') {
    throw new Error('Seed de demonstração exige NODE_ENV=development ou NODE_ENV=test.');
  }

  if (ambiente.EDUITSM_DEMO_SEED !== 'true') {
    throw new Error('Seed de demonstração exige EDUITSM_DEMO_SEED=true.');
  }
}
