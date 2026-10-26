import { Router } from 'express';
import { googleAuthSchema, loginSchema, registroSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { validar } from '../../http/middlewares.js';
import { AppError } from '../../errors/app-error.js';

export function authRoutes(deps: Dependencias) {
  const routes = Router();
  routes.post('/registro', validar(registroSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.authService.registrar(req.body)); } catch (error) { next(error); }
  });
  routes.post('/login', validar(loginSchema), async (req, res, next) => {
    try { res.json(await deps.authService.login(req.body)); } catch (error) { next(error); }
  });
  routes.post('/google', validar(googleAuthSchema), async (req, res, next) => {
    try {
      if (!deps.authService.loginComGoogle) throw new AppError(503, 'LOGIN_GOOGLE_INDISPONIVEL', 'O login com Google não está configurado.');
      res.json(await deps.authService.loginComGoogle(req.body));
    } catch (error) { next(error); }
  });
  return routes;
}
