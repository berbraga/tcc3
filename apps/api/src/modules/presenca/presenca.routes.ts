import { Router } from 'express';
import { presencaSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar } from '../../http/middlewares.js';

export function presencaRoutes(deps: Dependencias) {
  const routes = Router();
  routes.post('/', autenticar(deps), async (req, res, next) => {
    try {
      if (!deps.presencaService) return res.status(204).end();
      await deps.presencaService.registrar(req.auth!.usuarioId, presencaSchema.parse(req.body));
      res.status(204).end();
    } catch (error) { next(error); }
  });
  return routes;
}
