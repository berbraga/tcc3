import { Router } from 'express';
import { uuidSchema, vinculoEstrategicoSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function vinculoRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.vinculoService.listar(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.post('/', validar(vinculoEstrategicoSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.vinculoService.criar(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  routes.get('/pendencias', async (req, res, next) => {
    try { res.json(await deps.vinculoService.listarPendencias(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.delete('/:id', async (req, res, next) => {
    try { await deps.vinculoService.remover(req.auth!.usuarioId, uuidSchema.parse(req.params.id)); res.status(204).end(); } catch (error) { next(error); }
  });
  return routes;
}
