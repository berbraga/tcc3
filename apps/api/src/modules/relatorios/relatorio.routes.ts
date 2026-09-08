import { Router } from 'express';
import type { Dependencias } from '../../dependencies.js';
import { autenticar } from '../../http/middlewares.js';

export function relatorioRoutes(deps: Dependencias) {
  const routes = Router();
  routes.use(autenticar(deps));
  routes.get('/estrategia/exportacao', async (req, res, next) => {
    try {
      const exportacao = await deps.relatorioEstrategiaService.exportar(req.auth!.usuarioId);
      res.type(exportacao.contentType).attachment(exportacao.nomeArquivo).send(exportacao.conteudo);
    } catch (error) { next(error); }
  });
  routes.get('/estrategia', async (req, res, next) => {
    try { res.json(await deps.relatorioEstrategiaService.obter(req.auth!.usuarioId)); } catch (error) { next(error); }
  });
  return routes;
}
