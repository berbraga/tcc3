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

let onUnauthorized: (() => void) | undefined;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void) | undefined): () => void {
  onUnauthorized = handler;
  handlingUnauthorized = false;
  return () => { if (onUnauthorized === handler) onUnauthorized = undefined; };
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error) ? error.response?.status : (error as { response?: { status?: number } })?.response?.status;
    if (status === 401 && onUnauthorized && !handlingUnauthorized) {
      handlingUnauthorized = true;
      onUnauthorized();
      queueMicrotask(() => { handlingUnauthorized = false; });
    }
    return Promise.reject(error);
  }
);
