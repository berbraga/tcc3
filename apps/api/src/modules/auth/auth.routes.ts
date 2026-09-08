import { Router } from 'express';
import { loginSchema, registroSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { validar } from '../../http/middlewares.js';

export function authRoutes(deps: Dependencias) {
  const routes = Router();
  routes.post('/registro', validar(registroSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.authService.registrar(req.body)); } catch (error) { next(error); }
  });
  routes.post('/login', validar(loginSchema), async (req, res, next) => {
    try { res.json(await deps.authService.login(req.body)); } catch (error) { next(error); }
  });
  return routes;
}
