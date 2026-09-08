import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1', timeout: 2000 });
api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('eduitsm.auth');
  if (raw) config.headers.Authorization = `Bearer ${JSON.parse(raw).token as string}`;
  return config;
});
