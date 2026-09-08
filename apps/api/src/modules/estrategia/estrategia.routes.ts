import { Router } from 'express';
import { estrategiaSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function estrategiaRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/versoes', async (req, res, next) => {
    try { res.json(await deps.estrategiaService.listarVersoes(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.estrategiaService.obterAtual(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.post('/', validar(estrategiaSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.estrategiaService.salvarNovaVersao(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  return routes;
}
