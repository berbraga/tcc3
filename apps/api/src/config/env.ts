import { z } from 'zod';
import { carregarAmbienteDaRaiz } from './root-env.js';

carregarAmbienteDaRaiz();

const urlComProtocolos = (protocolos: readonly string[]) => z.string().url().refine((valor) => protocolos.includes(new URL(valor).protocol));

const ambienteSchema = z.object({
  DATABASE_URL: urlComProtocolos(['postgres:', 'postgresql:']),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  API_PORT: z.coerce.number().int().positive().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  WEB_ORIGIN: urlComProtocolos(['http:', 'https:']).default('http://localhost:5173')
});

export function carregarAmbiente(ambiente: Record<string, string | undefined>) {
  const configuracao = ambienteSchema.parse(ambiente);
  return { ...configuracao, API_PORT: configuracao.PORT ?? configuracao.API_PORT ?? 3333 };
}

export const env = carregarAmbiente(process.env);
