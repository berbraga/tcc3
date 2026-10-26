import { randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import type { AuthResponse, GoogleAuthInput, LoginInput, Perfil, RegistroInput } from '@eduitsm/shared';
import { AppError } from '../../errors/app-error.js';

export interface UsuarioAutenticavel {
  id: string; nome: string; email: string; perfil: Perfil; senhaHash: string; organizacaoId: string;
}

export interface AuthRepository {
  buscarPorEmail(email: string): Promise<UsuarioAutenticavel | null>;
  criarAlunoComOrganizacao(input: {
    nome: string; email: string; senhaHash: string; perfil: 'ALUNO';
    organizacao: { nome: string; setor?: string; descricao?: string };
  }): Promise<UsuarioAutenticavel>;
}

export interface TokenService {
  assinar(payload: { sub: string; perfil: Perfil }): string;
}

export interface GoogleIdentityVerifier {
  verificar(idToken: string): Promise<{ email: string; nome: string; emailVerificado: boolean }>;
}

export class AuthService {
  constructor(private repository: AuthRepository, private tokens: TokenService, private custoBcrypt = 12, private google?: GoogleIdentityVerifier) {}

  async registrar(input: RegistroInput): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    if (await this.repository.buscarPorEmail(email)) {
      throw new AppError(422, 'EMAIL_JA_CADASTRADO', 'Não foi possível concluir o cadastro com os dados informados.');
    }
    let usuario: UsuarioAutenticavel;
    try {
      usuario = await this.repository.criarAlunoComOrganizacao({
        nome: input.nome.trim(), email, senhaHash: await hash(input.senha, this.custoBcrypt), perfil: 'ALUNO',
        organizacao: {
          nome: input.organizacao.nome,
          ...(input.organizacao.setor === undefined ? {} : { setor: input.organizacao.setor }),
          ...(input.organizacao.descricao === undefined ? {} : { descricao: input.organizacao.descricao })
        }
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new AppError(422, 'EMAIL_JA_CADASTRADO', 'Não foi possível concluir o cadastro com os dados informados.');
      }
      throw error;
    }
    return this.resposta(usuario);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const usuario = await this.repository.buscarPorEmail(input.email.trim().toLowerCase());
    if (!usuario || !(await compare(input.senha, usuario.senhaHash))) {
      throw new AppError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');
    }
    return this.resposta(usuario);
  }

  async loginComGoogle(input: GoogleAuthInput): Promise<AuthResponse> {
    if (!this.google) throw new AppError(503, 'LOGIN_GOOGLE_INDISPONIVEL', 'O login com Google não está configurado.');
    let identidade: Awaited<ReturnType<GoogleIdentityVerifier['verificar']>>;
    try {
      identidade = await this.google.verificar(input.idToken);
    } catch {
      throw new AppError(401, 'TOKEN_GOOGLE_INVALIDO', 'Não foi possível validar a conta Google.');
    }
    if (!identidade.emailVerificado) throw new AppError(401, 'EMAIL_GOOGLE_NAO_VERIFICADO', 'A conta Google precisa ter e-mail verificado.');
    const email = identidade.email.trim().toLowerCase();
    if (!email) throw new AppError(401, 'TOKEN_GOOGLE_SEM_EMAIL', 'A conta Google não forneceu um e-mail válido.');
    const existente = await this.repository.buscarPorEmail(email);
    if (existente) {
      if (existente.perfil === 'PROFESSOR') throw new AppError(403, 'GOOGLE_PROFESSOR_NAO_PERMITIDO', 'A conta de professor deve usar as credenciais institucionais.');
      return this.resposta(existente);
    }
    const usuario = await this.repository.criarAlunoComOrganizacao({
      nome: identidade.nome.trim().slice(0, 120) || email.split('@')[0] || 'Aluno',
      email,
      senhaHash: await hash(randomBytes(32).toString('hex'), this.custoBcrypt),
      perfil: 'ALUNO',
      organizacao: { nome: input.organizacaoNome?.trim() || `Organização de ${identidade.nome.trim() || email.split('@')[0] || 'Aluno'}`.slice(0, 120) }
    });
    return this.resposta(usuario);
  }

  private resposta(usuario: UsuarioAutenticavel): AuthResponse {
    return {
      token: this.tokens.assinar({ sub: usuario.id, perfil: usuario.perfil }),
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    };
  }
}
