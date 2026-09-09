import { describe, expect, it } from 'vitest';
import { validarAmbienteSeedDemo } from '../src/config/seed-demo.js';

describe('proteção do seed de demonstração', () => {
  it('aceita um alvo de desenvolvimento com autorização explícita', () => {
    expect(() => validarAmbienteSeedDemo({
      NODE_ENV: 'development',
      EDUITSM_DEMO_SEED: 'true'
    })).not.toThrow();
  });

  it('recusa seed sem autorização explícita', () => {
    expect(() => validarAmbienteSeedDemo({ NODE_ENV: 'development' })).toThrow(/EDUITSM_DEMO_SEED=true/);
  });

  it('recusa seed de demonstração em produção mesmo com autorização explícita', () => {
    expect(() => validarAmbienteSeedDemo({
      NODE_ENV: 'production',
      EDUITSM_DEMO_SEED: 'true'
    })).toThrow(/produção/);
  });
});
