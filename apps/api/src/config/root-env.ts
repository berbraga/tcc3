import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

const caminhoEnvRaiz = fileURLToPath(new URL('../../../../.env', import.meta.url));

export function carregarAmbienteDaRaiz(ambiente: Record<string, string | undefined> = process.env): Record<string, string | undefined> {
  const resultado = config({ path: caminhoEnvRaiz, processEnv: {}, quiet: true });
  for (const [chave, valor] of Object.entries(resultado.parsed ?? {})) {
    ambiente[chave] ??= valor;
  }
  return ambiente;
}
