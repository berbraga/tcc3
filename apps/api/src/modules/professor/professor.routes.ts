import { Router, type RequestHandler } from 'express';
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
  routes.get('/ambientes/:organizacaoId/relatorio', async (req, res, next) => {
    try {
      const obterParaProfessor = deps.relatorioEstrategiaService.obterParaProfessor;
      if (!obterParaProfessor) throw new AppError(500, 'DEPENDENCIA_AUSENTE', 'Consulta de ambiente indisponível.');
      res.json(await obterParaProfessor.call(deps.relatorioEstrategiaService, req.params.organizacaoId));
    } catch (error) { next(error); }
  });
  const bloquearEscritaNoAluno: RequestHandler = (_req, _res, next) => next(new AppError(403, 'ACESSO_NEGADO', 'O ambiente do aluno é somente leitura para o professor.'));
  routes.post('/ambientes/:organizacaoId', bloquearEscritaNoAluno);
  routes.put('/ambientes/:organizacaoId', bloquearEscritaNoAluno);
  routes.patch('/ambientes/:organizacaoId', bloquearEscritaNoAluno);
  routes.delete('/ambientes/:organizacaoId', bloquearEscritaNoAluno);
  return routes;
}
