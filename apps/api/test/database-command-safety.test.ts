import { describe, expect, it } from 'vitest';
import { executarComandosDeTeste } from '../scripts/test-runner.js';

describe('comando de testes da API', () => {
  it('recusa URL insegura antes de executar Prisma, migração ou suíte', () => {
    const comandos: string[] = [];

    expect(() => executarComandosDeTeste(
      { TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/eduitsm?schema=public' },
      (comando) => comandos.push(comando)
    )).toThrow(/recusaram/);

    expect(comandos).toEqual([]);
  });

  it('usa apenas uma URL de teste validada para todos os comandos subsequentes', () => {
    const comandos: Array<{ comando: string; databaseUrl: string }> = [];

    executarComandosDeTeste(
      { TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/eduitsm?schema=test' },
      (comando, ambiente) => comandos.push({ comando, databaseUrl: ambiente.DATABASE_URL ?? '' })
    );

    expect(comandos).toEqual([
      { comando: 'prisma generate', databaseUrl: 'postgresql://user:pass@localhost:5432/eduitsm?schema=test' },
      { comando: 'prisma migrate deploy', databaseUrl: 'postgresql://user:pass@localhost:5432/eduitsm?schema=test' },
      { comando: 'vitest run', databaseUrl: 'postgresql://user:pass@localhost:5432/eduitsm?schema=test' }
    ]);
  });
});
