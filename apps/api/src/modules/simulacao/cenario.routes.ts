import { Router } from 'express';
import { cenarioSchema, painelIndicadoresQuerySchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function cenarioRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.post('/', validar(cenarioSchema), async (req, res, next) => {
    try {
      const cenario = await deps.cenarioService.criar(req.auth!.usuarioId, req.body);
      res.status(cenario.reutilizado ? 200 : 201).json(cenario);
    } catch (error) { next(error); }
  });
  return routes;
}

export function painelIndicadoresRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try {
      const query = painelIndicadoresQuerySchema.parse(req.query);
      res.json(await deps.cenarioService.obterPainel(req.auth!.usuarioId, query.periodo, query.cenarioId));
    } catch (error) { next(error); }
  });
  return routes;
}
