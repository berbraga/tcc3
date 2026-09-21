import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1', timeout: 2000 });
api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('eduitsm.auth');
  if (raw) {
    try { config.headers.Authorization = `Bearer ${JSON.parse(raw).token as string}`; }
    catch { sessionStorage.removeItem('eduitsm.auth'); }
  }
  return config;
});

let onUnauthorized: ((token: string) => void) | undefined;
let ultimoTokenNaoAutorizado: string | undefined;

export function setUnauthorizedHandler(handler: ((token: string) => void) | undefined): () => void {
  onUnauthorized = handler;
  ultimoTokenNaoAutorizado = undefined;
  return () => { if (onUnauthorized === handler) onUnauthorized = undefined; };
}

function tokenDaRequisicao(config: unknown): string | null {
  const headers = (config as { headers?: Record<string, unknown> & { get?: (name: string) => unknown } } | undefined)?.headers;
  const authorization = headers?.get?.('Authorization') ?? headers?.Authorization ?? headers?.authorization;
  return typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error) ? error.response?.status : (error as { response?: { status?: number } })?.response?.status;
    const token = tokenDaRequisicao((error as { config?: unknown }).config);
    if (status === 401 && token && onUnauthorized && ultimoTokenNaoAutorizado !== token) {
      ultimoTokenNaoAutorizado = token;
      onUnauthorized(token);
    }
    return Promise.reject(error);
  }
);
