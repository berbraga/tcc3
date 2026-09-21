import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse } from '@eduitsm/shared';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../services/api.js';
import { authStorageKey, parseSession, readSession } from './session.js';

interface AuthContextValue {
  session: AuthResponse | null;
  login(session: AuthResponse): void;
  logout(): void;
  replaceSession(session: AuthResponse): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthResponse | null>(readSession);

  const logout = useCallback((tokenDaRequisicao?: string) => {
    const ativa = readSession();
    if (tokenDaRequisicao && ativa?.token !== tokenDaRequisicao) return;
    sessionStorage.removeItem(authStorageKey);
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const replaceSession = useCallback((next: AuthResponse) => {
    const valid = parseSession(JSON.stringify(next));
    if (!valid) {
      logout();
      return;
    }
    if (session?.usuario.id !== valid.usuario.id) queryClient.clear();
    sessionStorage.setItem(authStorageKey, JSON.stringify(valid));
    setSession(valid);
  }, [logout, queryClient, session?.usuario.id]);

  useEffect(() => setUnauthorizedHandler((tokenDaRequisicao) => logout(tokenDaRequisicao)), [logout, session?.token]);

  const value = useMemo<AuthContextValue>(() => ({ session, login: replaceSession, logout, replaceSession }), [logout, replaceSession, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
