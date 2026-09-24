import { describe, expect, it } from 'vitest';

process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';
const { carregarAmbiente } = await import('../src/config/env.js');

const ambienteValido = {
  DATABASE_URL: 'postgresql://eduitsm:senha@localhost:5432/eduitsm?schema=public',
  JWT_SECRET: 'segredo-local-com-mais-de-trinta-e-dois-caracteres',
  WEB_ORIGIN: 'http://localhost:5173'
};

describe('configuração de inicialização', () => {
  it('recusa variáveis obrigatórias ausentes ou segredo JWT curto', () => {
    expect(() => carregarAmbiente({ ...ambienteValido, DATABASE_URL: undefined })).toThrow();
    expect(() => carregarAmbiente({ ...ambienteValido, JWT_SECRET: 'curto' })).toThrow();
  });

  it('aceita somente PostgreSQL e origens HTTP(S)', () => {
    expect(() => carregarAmbiente({ ...ambienteValido, DATABASE_URL: 'mysql://localhost/eduitsm' })).toThrow();
    expect(() => carregarAmbiente({ ...ambienteValido, WEB_ORIGIN: 'ftp://localhost:5173' })).toThrow();
  });

  it('aplica portas e expiração padrão a uma configuração válida', () => {
    expect(carregarAmbiente(ambienteValido)).toMatchObject({ API_PORT: 3333, JWT_EXPIRES_IN: '1h' });
  });

  it('prioriza PORT fornecida pelo Cloud Run', () => {
    expect(carregarAmbiente({ ...ambienteValido, PORT: '8080' })).toMatchObject({ API_PORT: 8080, PORT: 8080 });
  });
});
