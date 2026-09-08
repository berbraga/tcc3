import { Router } from 'express';
import { paginacaoSchema } from '@eduitsm/shared';
import type { Dependencias } from '../../dependencies.js';
import { AppError } from '../../errors/app-error.js';
import { autenticar, exigirProfessor } from '../../http/middlewares.js';

export function professorRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps), exigirProfessor);
  routes.get('/ambientes', async (req, res, next) => {
    try {
      if (!deps.professorService) throw new AppError(500, 'DEPENDENCIA_AUSENTE', 'Acompanhamento indisponível.');
      res.json(await deps.professorService.listarAmbientes(paginacaoSchema.parse(req.query)));
    } catch (error) { next(error); }
  });
  return routes;
}
