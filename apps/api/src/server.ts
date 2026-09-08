import { criarApp } from './app.js';
import { env } from './config/env.js';
import { AuthService } from './modules/auth/auth.service.js';
import { OrganizacaoService } from './modules/organizacoes/organizacao.service.js';
import { AnaliseAmbienteService } from './modules/analises-ambiente/analise-ambiente.service.js';
import { prisma } from './infra/prisma.js';
import { PrismaAnaliseAmbienteRepository, PrismaAuthRepository, PrismaOrganizacaoRepository } from './infra/repositories.js';
import { JwtTokenService } from './infra/token.js';

const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN as import('jsonwebtoken').SignOptions['expiresIn'] & {});
const app = criarApp({
  authService: new AuthService(new PrismaAuthRepository(prisma), tokens),
  tokenService: tokens,
  organizacaoService: new OrganizacaoService(new PrismaOrganizacaoRepository(prisma)),
  analiseAmbienteService: new AnaliseAmbienteService(new PrismaAnaliseAmbienteRepository(prisma))
}, env.WEB_ORIGIN);

app.listen(env.API_PORT, () => console.log(`EduITSM API disponível na porta ${env.API_PORT}`));
