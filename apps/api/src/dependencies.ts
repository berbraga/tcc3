import type { LoginInput, RegistroInput, AtualizarOrganizacaoInput, AuthResponse, Perfil } from '@eduitsm/shared';
import type { OrganizacaoResultado } from './modules/organizacoes/organizacao.service.js';
import type { AnaliseAmbienteService } from './modules/analises-ambiente/analise-ambiente.service.js';
import type { EstrategiaService } from './modules/estrategia/estrategia.service.js';
import type { ObjetivoService } from './modules/objetivos/objetivo.service.js';
import type { ServicoService } from './modules/servicos/servico.service.js';
import type { VinculoService } from './modules/vinculos/vinculo.service.js';
import type { IndicadorService } from './modules/indicadores/indicador.service.js';
import type { CenarioService } from './modules/simulacao/cenario.service.js';
import type { RelatorioEstrategiaService } from './modules/relatorios/relatorio.service.js';
import type { ProfessorService } from './modules/professor/professor.service.js';

export interface Dependencias {
  authService: { registrar(input: RegistroInput): Promise<AuthResponse>; login(input: LoginInput): Promise<AuthResponse> };
  tokenService: { verificar(token: string): { sub: string; perfil: Perfil } };
  organizacaoService: {
    obterMinha(usuarioId: string): Promise<OrganizacaoResultado>;
    atualizarMinha(usuarioId: string, input: AtualizarOrganizacaoInput): Promise<OrganizacaoResultado>;
    verificarAcesso(usuarioId: string, organizacaoId: string): Promise<void>;
  };
  analiseAmbienteService: Pick<AnaliseAmbienteService, 'listar' | 'criar' | 'atualizar' | 'remover'>;
  estrategiaService: Pick<EstrategiaService, 'obterAtual' | 'salvarNovaVersao' | 'listarVersoes'>;
  objetivoService: Pick<ObjetivoService, 'listar' | 'criar' | 'obterCobertura' | 'obterResumoCobertura'>;
  servicoService: Pick<ServicoService, 'listar' | 'criar' | 'atualizar' | 'remover' | 'listarCustos' | 'adicionarCusto' | 'listarDemanda' | 'adicionarDemanda'>;
  vinculoService: Pick<VinculoService, 'listar' | 'criar' | 'remover' | 'listarPendencias'>;
  indicadorService: Pick<IndicadorService, 'listarPorServico' | 'criar' | 'atualizar' | 'remover'>;
  cenarioService: Pick<CenarioService, 'criar' | 'obterPainel'>;
  relatorioEstrategiaService: Pick<RelatorioEstrategiaService, 'obter' | 'exportar'>;
  professorService?: Pick<ProfessorService, 'listarAmbientes'>;
}
