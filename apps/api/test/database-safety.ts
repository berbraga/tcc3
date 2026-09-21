export function validarBancoDeTeste(rawUrl: string): void {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error('Testes de integração receberam uma DATABASE_URL inválida.'); }
  const banco = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const schema = url.searchParams.get('schema');
  const bancoPermitido = banco.endsWith('_test') || banco.endsWith('_verify');
  if (schema !== 'test' && !bancoPermitido) {
    throw new Error('Testes de integração recusaram um banco sem identificação exata de teste.');
  }
}
