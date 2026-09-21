import { criarApp } from './app.js';
import { env } from './config/env.js';
import { AuthService } from './modules/auth/auth.service.js';
import { OrganizacaoService } from './modules/organizacoes/organizacao.service.js';
import { prisma } from './infra/prisma.js';
import { PrismaAuthRepository, PrismaOrganizacaoRepository } from './infra/repositories.js';
import { JwtTokenService } from './infra/token.js';

const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN as import('jsonwebtoken').SignOptions['expiresIn'] & {});
const app = criarApp({
  authService: new AuthService(new PrismaAuthRepository(prisma), tokens),
  tokenService: tokens,
  organizacaoService: new OrganizacaoService(new PrismaOrganizacaoRepository(prisma))
}, env.WEB_ORIGIN);

app.listen(env.API_PORT, () => console.log(`EduITSM API disponível na porta ${env.API_PORT}`));
