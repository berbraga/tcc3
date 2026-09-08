import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { atualizarOrganizacaoSchema, loginSchema, registroSchema, type Perfil } from '@eduitsm/shared';
import { ZodError, type ZodSchema } from 'zod';
import type { Dependencias } from './dependencies.js';
import { AppError } from './errors/app-error.js';

declare global {
  // A extensão é exigida pelo contrato tipado dos middlewares Express.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { auth?: { usuarioId: string; perfil: Perfil } } }
}

const validar = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  try { req.body = schema.parse(req.body); next(); } catch (error) { next(error); }
};

export function criarApp(deps: Dependencias, webOrigin: string) {
  const app = express();
  app.use(cors({ origin: webOrigin }));
  app.use(express.json({ limit: '32kb' }));

  const autenticar: RequestHandler = (req, _res, next) => {
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'NAO_AUTENTICADO', 'Autenticação necessária.'));
    try {
      const payload = deps.tokenService.verificar(token);
      req.auth = { usuarioId: payload.sub, perfil: payload.perfil };
      next();
    } catch { next(new AppError(401, 'NAO_AUTENTICADO', 'Autenticação necessária.')); }
  };

  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/api/v1/auth/registro', validar(registroSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.authService.registrar(req.body)); } catch (error) { next(error); }
  });
  app.post('/api/v1/auth/login', validar(loginSchema), async (req, res, next) => {
    try { res.json(await deps.authService.login(req.body)); } catch (error) { next(error); }
  });
  app.get('/api/v1/organizacoes/minha', autenticar, async (req, res, next) => {
    try {
      const alegada = req.header('x-organizacao-id');
      if (alegada) await deps.organizacaoService.verificarAcesso(req.auth!.usuarioId, alegada);
      res.json(await deps.organizacaoService.obterMinha(req.auth!.usuarioId));
    } catch (error) { next(error); }
  });
  app.put('/api/v1/organizacoes/minha', autenticar, validar(atualizarOrganizacaoSchema), async (req, res, next) => {
    try { res.json(await deps.organizacaoService.atualizarMinha(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });

  app.use((_req, _res, next) => next(new AppError(404, 'ROTA_NAO_ENCONTRADA', 'Rota não encontrada.')));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;
    if (error instanceof ZodError) return res.status(422).json({ code: 'DADOS_INVALIDOS', message: 'Verifique os dados informados.', details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) });
    if (error instanceof AppError || (typeof error === 'object' && error && 'status' in error && 'code' in error)) {
      const known = error as AppError;
      return res.status(known.status).json({ code: known.code, message: known.message, ...(known.details === undefined ? {} : { details: known.details }) });
    }
    return res.status(500).json({ code: 'ERRO_INTERNO', message: 'Não foi possível concluir a operação.' });
  };
  app.use(errorHandler);
  return app;
}
