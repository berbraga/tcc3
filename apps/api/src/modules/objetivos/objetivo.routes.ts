import { Router } from 'express';
import { objetivoSchema, uuidSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function objetivoRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.objetivoService.listar(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.post('/', validar(objetivoSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.objetivoService.criar(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  routes.put('/:id', validar(objetivoSchema), async (req, res, next) => {
    try { res.json(await deps.objetivoService.atualizar!(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  routes.delete('/:id', async (req, res, next) => {
    try { await deps.objetivoService.remover!(req.auth!.usuarioId, uuidSchema.parse(req.params.id)); res.status(204).end(); } catch (error) { next(error); }
  });
  routes.get('/cobertura', async (req, res, next) => {
    try { res.json(await deps.objetivoService.obterResumoCobertura(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.get('/:id/cobertura', async (req, res, next) => {
    try { res.json(await deps.objetivoService.obterCobertura(req.auth!.usuarioId, uuidSchema.parse(req.params.id))); } catch (error) { next(error); }
  });
  return routes;
}
