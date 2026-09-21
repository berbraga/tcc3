import { describe, expect, it } from 'vitest';
import { validarBancoDeTeste } from './database-safety.js';

describe('proteção do banco de integração', () => {
  it('aceita somente schema ou nome de banco explicitamente de teste', () => {
    expect(() => validarBancoDeTeste('postgresql://user:pass@localhost/producao?schema=test')).not.toThrow();
    expect(() => validarBancoDeTeste('postgresql://user:pass@localhost/eduitsm_verify?schema=public')).not.toThrow();
  });

  it('recusa marcadores colocados em senha ou parâmetros irrelevantes', () => {
    expect(() => validarBancoDeTeste('postgresql://user:schema=test@localhost/producao?schema=public')).toThrow(/recusaram/);
    expect(() => validarBancoDeTeste('postgresql://user:pass@localhost/producao?nota=_verify')).toThrow(/recusaram/);
    expect(() => validarBancoDeTeste('não-é-url')).toThrow(/inválida/);
  });
});
