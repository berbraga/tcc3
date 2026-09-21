import type { AuthResponse, Perfil } from '@eduitsm/shared';

export const authStorageKey = 'eduitsm.auth';

type TokenPayload = { exp?: unknown };

function decodePayload(token: string): TokenPayload | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const payloadCodificado = partes[1];
    if (!payloadCodificado) return null;
    const json = atob(payloadCodificado.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as TokenPayload;
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

function usuarioValido(usuario: unknown): usuario is AuthResponse['usuario'] {
  if (!usuario || typeof usuario !== 'object') return false;
  const value = usuario as Record<string, unknown>;
  return typeof value.id === 'string'
    && typeof value.nome === 'string'
    && typeof value.email === 'string'
    && (value.perfil === 'ALUNO' || value.perfil === 'PROFESSOR');
}

export function parseSession(raw: string | null, now = Date.now()): AuthResponse | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { token?: unknown; usuario?: unknown };
    if (typeof value.token !== 'string' || !usuarioValido(value.usuario)) return null;
    const payload = decodePayload(value.token);
    if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return null;
    return { token: value.token, usuario: value.usuario as { id: string; nome: string; email: string; perfil: Perfil } };
  } catch {
    return null;
  }
}

export function readSession(): AuthResponse | null {
  const session = parseSession(sessionStorage.getItem(authStorageKey));
  if (!session) sessionStorage.removeItem(authStorageKey);
  return session;
}
