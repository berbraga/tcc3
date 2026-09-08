import { compare } from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { AuthService, type AuthRepository } from '../src/modules/auth/auth.service.js';

const base = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Ana Aluna',
  email: 'ana@example.com',
  perfil: 'ALUNO' as const,
  senhaHash: '',
  organizacaoId: '22222222-2222-4222-8222-222222222222'
};

function repository(existing = false): AuthRepository & { salvo?: Parameters<AuthRepository['criarAlunoComOrganizacao']>[0] } {
  return {
    async buscarPorEmail(email) { return existing && email === base.email ? { ...base, senhaHash: await import('bcryptjs').then(({ hash }) => hash('Senha123', 4)) } : null; },
    async criarAlunoComOrganizacao(input) {
      this.salvo = input;
      return { ...base, nome: input.nome, email: input.email, senhaHash: input.senhaHash };
    }
  };
}

describe('AuthService', () => {
  it('normaliza o e-mail, protege a senha e cria organização junto do aluno (RN01)', async () => {
    const repo = repository();
    const service = new AuthService(repo, { assinar: () => 'jwt' }, 4);

    const result = await service.registrar({
      nome: 'Ana Aluna', email: ' ANA@EXAMPLE.COM ', senha: 'Senha123',
      organizacao: { nome: 'Organização da Ana', setor: 'Educação' }
    });

    expect(repo.salvo?.email).toBe('ana@example.com');
    expect(repo.salvo?.perfil).toBe('ALUNO');
    expect(repo.salvo?.organizacao.nome).toBe('Organização da Ana');
    expect(await compare('Senha123', repo.salvo?.senhaHash ?? '')).toBe(true);
    expect(result).toEqual({ token: 'jwt', usuario: { id: base.id, nome: 'Ana Aluna', email: base.email, perfil: 'ALUNO' } });
    expect(result.usuario).not.toHaveProperty('senhaHash');
  });

  it('recusa e-mail já cadastrado sem criar uma segunda organização', async () => {
    const repo = repository(true);
    const service = new AuthService(repo, { assinar: () => 'jwt' }, 4);
    await expect(service.registrar({ nome: 'Outra', email: base.email, senha: 'Senha123', organizacao: { nome: 'Outra Org' } }))
      .rejects.toMatchObject({ status: 422, code: 'EMAIL_JA_CADASTRADO' });
    expect(repo.salvo).toBeUndefined();
  });

  it('autentica credenciais válidas e usa mensagem genérica nas inválidas', async () => {
    const repo = repository(true);
    const service = new AuthService(repo, { assinar: ({ sub }) => `token:${sub}` }, 4);
    await expect(service.login({ email: ' ANA@example.com ', senha: 'Senha123' })).resolves.toMatchObject({ token: `token:${base.id}` });
    await expect(service.login({ email: base.email, senha: 'errada' })).rejects.toMatchObject({ status: 401, code: 'CREDENCIAIS_INVALIDAS' });
    await expect(service.login({ email: 'ausente@example.com', senha: 'Senha123' })).rejects.toMatchObject({ status: 401, code: 'CREDENCIAIS_INVALIDAS' });
  });
});
