import { Router } from 'express';
import { custoServicoSchema, demandaCapacidadeSchema, servicoSchema, uuidSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { autenticar, validar } from '../../http/middlewares.js';

export function servicoRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/', async (req, res, next) => {
    try { res.json(await deps.servicoService.listar(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  routes.post('/', validar(servicoSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.servicoService.criar(req.auth!.usuarioId, req.body)); } catch (error) { next(error); }
  });
  routes.put('/:id', validar(servicoSchema), async (req, res, next) => {
    try { res.json(await deps.servicoService.atualizar(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  routes.delete('/:id', async (req, res, next) => {
    try { await deps.servicoService.remover(req.auth!.usuarioId, uuidSchema.parse(req.params.id)); res.status(204).end(); } catch (error) { next(error); }
  });
  routes.get('/:id/custos', async (req, res, next) => {
    try { res.json(await deps.servicoService.listarCustos(req.auth!.usuarioId, uuidSchema.parse(req.params.id))); } catch (error) { next(error); }
  });
  routes.post('/:id/custos', validar(custoServicoSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.servicoService.adicionarCusto(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  routes.get('/:id/demanda', async (req, res, next) => {
    try { res.json(await deps.servicoService.listarDemanda(req.auth!.usuarioId, uuidSchema.parse(req.params.id))); } catch (error) { next(error); }
  });
  routes.post('/:id/demanda', validar(demandaCapacidadeSchema), async (req, res, next) => {
    try { res.status(201).json(await deps.servicoService.adicionarDemanda(req.auth!.usuarioId, uuidSchema.parse(req.params.id), req.body)); } catch (error) { next(error); }
  });
  return routes;
}
