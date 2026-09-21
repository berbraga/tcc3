import cors from 'cors';
import express from 'express';
import type { Dependencias } from './dependencies.js';
import { AppError } from './errors/app-error.js';
import { tratarErro } from './http/middlewares.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { organizacaoRoutes } from './modules/organizacoes/organizacao.routes.js';

export function criarApp(deps: Dependencias, webOrigin: string) {
  const app = express();
  app.use(cors({ origin: webOrigin }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auth', authRoutes(deps));
  app.use('/api/v1/organizacoes', organizacaoRoutes(deps));
  app.use((_req, _res, next) => next(new AppError(404, 'ROTA_NAO_ENCONTRADA', 'Rota não encontrada.')));
  app.use(tratarErro);
  return app;
}
