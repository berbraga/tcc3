import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { criarApp } from '../src/app.js';
import { PrismaAnaliseAmbienteRepository, PrismaAuthRepository, PrismaOrganizacaoRepository } from '../src/infra/repositories.js';
import { JwtTokenService } from '../src/infra/token.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { OrganizacaoService } from '../src/modules/organizacoes/organizacao.service.js';
import { AnaliseAmbienteService } from '../src/modules/analises-ambiente/analise-ambiente.service.js';
import { validarBancoDeTeste } from './database-safety.js';

const db = new PrismaClient();
const email = 'integracao@eduitsm.local';
const secret = 'segredo-de-integracao-com-mais-de-32-caracteres';
const tokens = new JwtTokenService(secret, '1h');
const organizacoes = new OrganizacaoService(new PrismaOrganizacaoRepository(db));
const app = criarApp({
  authService: new AuthService(new PrismaAuthRepository(db), tokens, 4),
  tokenService: tokens,
  organizacaoService: organizacoes,
  analiseAmbienteService: new AnaliseAmbienteService(new PrismaAnaliseAmbienteRepository(db)),
  estrategiaService: {
    obterAtual: async () => null,
    salvarNovaVersao: async () => { throw new Error('fora do escopo'); },
    listarVersoes: async () => []
  },
  objetivoService: {
    listar: async () => [],
    criar: async () => { throw new Error('fora do escopo'); },
    obterCobertura: async () => { throw new Error('fora do escopo'); }
  }
}, 'http://localhost:5173');
let bancoSeguro = false;

describe('fluxo real de autenticação e isolamento', () => {
  beforeAll(async () => {
    validarBancoDeTeste(process.env.DATABASE_URL ?? '');
    bancoSeguro = true;
    await db.usuario.deleteMany({ where: { email } });
  });
  afterAll(async () => {
    try { if (bancoSeguro) await db.usuario.deleteMany({ where: { email } }); }
    finally { await db.$disconnect(); }
  });

  it('registra aluno e organização atomicamente e permite login', async () => {
    const registro = await request(app).post('/api/v1/auth/registro').send({ nome: 'Teste Integração', email: email.toUpperCase(), senha: 'Senha123', organizacao: { nome: 'Org Integração' } });
    expect(registro.status).toBe(201);
    expect(registro.body.usuario).toMatchObject({ email, perfil: 'ALUNO' });
    expect(registro.body.usuario).not.toHaveProperty('senhaHash');
    const persisted = await db.usuario.findUnique({ where: { email }, include: { organizacao: true } });
    expect(persisted?.organizacao?.nome).toBe('Org Integração');
    expect(persisted?.senhaHash).not.toBe('Senha123');

    const login = await request(app).post('/api/v1/auth/login').send({ email, senha: 'Senha123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  it('recusa token expirado e o serviço bloqueia outra organização com status 403', async () => {
    const user = await db.usuario.findUniqueOrThrow({ where: { email }, include: { organizacao: true } });
    const expired = new JwtTokenService(secret, -1).assinar({ sub: user.id, perfil: 'ALUNO' });
    const expiredResponse = await request(app).get('/api/v1/organizacoes/minha').set('authorization', `Bearer ${expired}`);
    expect(expiredResponse.status).toBe(401);

    await expect(organizacoes.verificarAcesso(user.id, '00000000-0000-4000-8000-000000000011')).rejects.toMatchObject({ status: 403, code: 'ACESSO_NEGADO' });
  });
});
