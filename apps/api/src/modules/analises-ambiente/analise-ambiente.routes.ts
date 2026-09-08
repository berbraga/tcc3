import { Router } from 'express';
import { analiseAmbienteSchema, uuidSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function analiseAmbienteRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.analiseAmbienteService.listar(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.post('/', validar(analiseAmbienteSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.analiseAmbienteService.criar(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  routes.put('/:id', validar(analiseAmbienteSchema), async (req, res, next) => {
    try { res.json(await deps.analiseAmbienteService.atualizar(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  routes.delete('/:id', async (req, res, next) => {
    try { await deps.analiseAmbienteService.remover(req.auth!.usuarioId, uuidSchema.parse(req.params.id)); res.status(204).end(); } catch (error) { next(error); }
  });
  return routes;
}
