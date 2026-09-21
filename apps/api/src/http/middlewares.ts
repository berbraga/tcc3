import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import type { Dependencias } from '../dependencies.js';
import { AppError } from '../errors/app-error.js';

export const validar = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  try { req.body = schema.parse(req.body); next(); } catch (error) { next(error); }
};

export const autenticar = (deps: Dependencias): RequestHandler => (req, _res, next) => {
  const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
  if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'NAO_AUTENTICADO', 'Autenticação necessária.'));
  try {
    const payload = deps.tokenService.verificar(token);
    req.auth = { usuarioId: payload.sub, perfil: payload.perfil };
    next();
  } catch { next(new AppError(401, 'NAO_AUTENTICADO', 'Autenticação necessária.')); }
};

export const exigirProfessor: RequestHandler = (req, _res, next) => {
  if (req.auth?.perfil !== 'PROFESSOR') return next(new AppError(403, 'ACESSO_NEGADO', 'Acesso restrito ao professor.'));
  next();
};

export const tratarErro: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;
  if (typeof error === 'object' && error && 'type' in error && error.type === 'entity.too.large') {
    return res.status(413).json({ code: 'PAYLOAD_EXCEDIDO', message: 'O conteúdo enviado excede o limite permitido.' });
  }
  if (error instanceof ZodError) return res.status(422).json({ code: 'DADOS_INVALIDOS', message: 'Verifique os dados informados.', details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) });
  if (error instanceof AppError || (typeof error === 'object' && error && 'status' in error && 'code' in error)) {
    const known = error as AppError;
    return res.status(known.status).json({ code: known.code, message: known.message, ...(known.details === undefined ? {} : { details: known.details }) });
  }
  return res.status(500).json({ code: 'ERRO_INTERNO', message: 'Não foi possível concluir a operação.' });
};
