import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Perfil } from '@eduitsm/shared';

export class JwtTokenService {
  constructor(private secret: string, private expiresIn: NonNullable<SignOptions['expiresIn']>) {}
  assinar(payload: { sub: string; perfil: Perfil }) { return jwt.sign({ perfil: payload.perfil }, this.secret, { subject: payload.sub, expiresIn: this.expiresIn }); }
  verificar(token: string) {
    const payload = jwt.verify(token, this.secret);
    if (typeof payload === 'string' || !payload.sub || (payload.perfil !== 'ALUNO' && payload.perfil !== 'PROFESSOR')) throw new Error('token inválido');
    return { sub: payload.sub, perfil: payload.perfil };
  }
}
