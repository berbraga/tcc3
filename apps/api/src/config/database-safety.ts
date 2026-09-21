const SCHEMAS_DE_TESTE = new Set(['test', 'verify']);

export function validarBancoDeTeste(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Testes de integração receberam uma DATABASE_URL inválida.');
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Testes de integração receberam uma DATABASE_URL sem PostgreSQL.');
  }

  const banco = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const schema = url.searchParams.get('schema');
  const bancoPermitido = banco.endsWith('_test') || banco.endsWith('_verify');

  if (!SCHEMAS_DE_TESTE.has(schema ?? '') && !bancoPermitido) {
    throw new Error('Testes de integração recusaram um banco sem identificação exata de teste.');
  }
}

export function resolverUrlBancoDeTeste(ambiente: Record<string, string | undefined>): string {
  return ambiente.TEST_DATABASE_URL ?? 'postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=test';
}
