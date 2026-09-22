import { spawnSync } from 'node:child_process';
import { validarBancoDeTeste, resolverUrlBancoDeTeste } from '../src/config/database-safety.js';

export type ExecutarComando = (comando: string, ambiente: Record<string, string | undefined>) => void;

// As suítes de integração compartilham o schema descartável. Arquivos paralelos
// podem limpar os dados de outro arquivo durante uma consulta Prisma.
const comandosDeTeste = ['prisma generate', 'prisma migrate deploy', 'vitest run --no-file-parallelism'];

function executarNoShell(comando: string, ambiente: Record<string, string | undefined>): void {
  const resultado = spawnSync(comando, {
    shell: true,
    stdio: 'inherit',
    env: ambiente
  });

  if (resultado.status !== 0) {
    throw new Error(`Comando de teste falhou: ${comando}`);
  }
}

export function executarComandosDeTeste(
  ambiente: Record<string, string | undefined>,
  executar: ExecutarComando = executarNoShell
): void {
  const databaseUrl = resolverUrlBancoDeTeste(ambiente);
  validarBancoDeTeste(databaseUrl);

  const ambienteTeste = { ...ambiente, DATABASE_URL: databaseUrl, NODE_ENV: 'test' };
  for (const comando of comandosDeTeste) {
    executar(comando, ambienteTeste);
  }
}
