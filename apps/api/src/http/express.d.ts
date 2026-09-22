import type { Perfil } from '@eduitsm/shared';

declare global {
  namespace Express {
    interface Request { auth?: { usuarioId: string; perfil: Perfil } }
  }
}

export {};
