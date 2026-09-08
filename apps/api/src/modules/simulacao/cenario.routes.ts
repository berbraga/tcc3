import { Router } from 'express';
import { cenarioSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function cenarioRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.post('/', validar(cenarioSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.cenarioService.criar(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  return routes;
}

export function painelIndicadoresRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.cenarioService.obterPainel(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  return routes;
}
