import { Router } from 'express';
import { atualizarOrganizacaoSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function organizacaoRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/minha', async (req, res, next) => {
    try { res.json(await deps.organizacaoService.obterMinha(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.put('/minha', validar(atualizarOrganizacaoSchema), async (req, res, next) => {
    try { res.json(await deps.organizacaoService.atualizarMinha(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  return routes;
}
