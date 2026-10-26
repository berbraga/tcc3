import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { GoogleIdentityVerifier } from '../modules/auth/auth.service.js';

export class FirebaseGoogleIdentityVerifier implements GoogleIdentityVerifier {
  private readonly keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

  constructor(private readonly projectId: string) {}

  async verificar(idToken: string) {
    const { payload } = await jwtVerify(idToken, this.keys, {
      issuer: `https://securetoken.google.com/${this.projectId}`,
      audience: this.projectId
    });
    const email = typeof payload.email === 'string' ? payload.email : '';
    const nome = typeof payload.name === 'string' ? payload.name : email.split('@')[0] ?? 'Aluno';
    return {
      email,
      nome,
      emailVerificado: payload.email_verified === true
    };
  }
}
