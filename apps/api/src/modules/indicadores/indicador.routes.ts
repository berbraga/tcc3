import { Router } from 'express';
import { indicadorSchema, uuidSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function indicadorPorServicoRoutes(deps: Dependencias) {
  const routes = Router({ mergeParams: true });
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.indicadorService.listarPorServico(req.auth!.usuarioId, uuidSchema.parse((req.params as { id: string }).id))); } catch (error) { next(error); }
  });
  routes.post('/', validar(indicadorSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.indicadorService.criar(req.auth!.usuarioId, uuidSchema.parse((req.params as { id: string }).id), req.body)); } catch (error) { next(error); }
  });
  return routes;
}

export function indicadorRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.put('/:id', validar(indicadorSchema), async (req, res, next) => {
    try { res.json(await deps.indicadorService.atualizar(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  routes.delete('/:id', async (req, res, next) => {
    try { await deps.indicadorService.remover(req.auth!.usuarioId, uuidSchema.parse(req.params.id)); res.status(204).end(); } catch (error) { next(error); }
  });
  return routes;
}
