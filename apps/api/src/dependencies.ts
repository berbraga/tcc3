import type { LoginInput, RegistroInput, AtualizarOrganizacaoInput, AuthResponse, Perfil } from '@eduitsm/shared';
import type { OrganizacaoResultado } from './modules/organizacoes/organizacao.service.js';
import type { AnaliseAmbienteService } from './modules/analises-ambiente/analise-ambiente.service.js';
import type { EstrategiaService } from './modules/estrategia/estrategia.service.js';

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
}
