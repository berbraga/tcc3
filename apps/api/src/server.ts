import { criarApp } from './app.js';
import { env } from './config/env.js';
import { AuthService } from './modules/auth/auth.service.js';
import { OrganizacaoService } from './modules/organizacoes/organizacao.service.js';
import { AnaliseAmbienteService } from './modules/analises-ambiente/analise-ambiente.service.js';
import { EstrategiaService } from './modules/estrategia/estrategia.service.js';
import { PrismaEstrategiaRepository } from './modules/estrategia/estrategia.repository.js';
import { ObjetivoService } from './modules/objetivos/objetivo.service.js';
import { PrismaObjetivoRepository } from './modules/objetivos/objetivo.repository.js';
import { ServicoService } from './modules/servicos/servico.service.js';
import { PrismaServicoRepository } from './modules/servicos/servico.repository.js';
import { VinculoService } from './modules/vinculos/vinculo.service.js';
import { PrismaVinculoRepository } from './modules/vinculos/vinculo.repository.js';
import { IndicadorService } from './modules/indicadores/indicador.service.js';
import { PrismaIndicadorRepository } from './modules/indicadores/indicador.repository.js';
import { CenarioService } from './modules/simulacao/cenario.service.js';
import { PrismaCenarioRepository } from './modules/simulacao/cenario.repository.js';
import { RelatorioEstrategiaService } from './modules/relatorios/relatorio.service.js';
import { PrismaRelatorioEstrategiaRepository } from './modules/relatorios/relatorio.repository.js';
import { prisma } from './infra/prisma.js';
import { PrismaAnaliseAmbienteRepository, PrismaAuthRepository, PrismaOrganizacaoRepository } from './infra/repositories.js';
import { JwtTokenService } from './infra/token.js';

const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN as import('jsonwebtoken').SignOptions['expiresIn'] & {});
const app = criarApp({
  authService: new AuthService(new PrismaAuthRepository(prisma), tokens),
  tokenService: tokens,
  organizacaoService: new OrganizacaoService(new PrismaOrganizacaoRepository(prisma)),
  analiseAmbienteService: new AnaliseAmbienteService(new PrismaAnaliseAmbienteRepository(prisma)),
  estrategiaService: new EstrategiaService(new PrismaEstrategiaRepository(prisma)),
  objetivoService: new ObjetivoService(new PrismaObjetivoRepository(prisma)),
  servicoService: new ServicoService(new PrismaServicoRepository(prisma)),
  vinculoService: new VinculoService(new PrismaVinculoRepository(prisma)),
  indicadorService: new IndicadorService(new PrismaIndicadorRepository(prisma)),
  cenarioService: new CenarioService(new PrismaCenarioRepository(prisma)),
  relatorioEstrategiaService: new RelatorioEstrategiaService(new PrismaRelatorioEstrategiaRepository(prisma))
}, env.WEB_ORIGIN);

app.listen(env.API_PORT, () => console.log(`EduITSM API disponível na porta ${env.API_PORT}`));
