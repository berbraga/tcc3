import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });

const ambienteSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173')
});

export function carregarAmbiente(ambiente: Record<string, string | undefined>) {
  return ambienteSchema.parse(ambiente);
}

export const env = carregarAmbiente(process.env);
