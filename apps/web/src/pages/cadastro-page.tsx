import { useMutation } from '@tanstack/react-query';
import type { ApiError, AuthResponse } from '@eduitsm/shared';
import axios from 'axios';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { api } from '../services/api.js';
import { Logo } from './login-page.js';

export function CadastroPage() {
  const navigate = useNavigate();
  const { login: salvarSessao } = useAuth();
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '', organizacao: '', setor: '', descricao: '' });
  const cadastro = useMutation({
    mutationFn: async () => (await api.post<AuthResponse>('/auth/registro', {
      nome: formulario.nome,
      email: formulario.email,
      senha: formulario.senha,
      organizacao: { nome: formulario.organizacao, setor: formulario.setor || undefined, descricao: formulario.descricao || undefined }
    })).data,
    onSuccess: (data) => { salvarSessao(data); navigate('/painel'); }
  });
  const submit = (event: FormEvent) => { event.preventDefault(); cadastro.mutate(); };
  const message = axios.isAxiosError<ApiError>(cadastro.error) ? cadastro.error.response?.data.message : 'Não foi possível concluir o cadastro. Tente novamente.';
  const alterar = (campo: keyof typeof formulario, valor: string) => setFormulario((atual) => ({ ...atual, [campo]: valor }));

  return <main className="login-shell"><section className="login-card" aria-labelledby="cadastro-title"><div className="login-about"><Logo /><p>Crie seu ambiente individual para praticar o Gerenciamento da Estratégia <em>(Strategy Management)</em>.</p><ol><li>Uma conta por aluno</li><li>Uma organização isolada</li><li>Acompanhamento pelo professor</li></ol><small>Seu perfil será criado como Aluno.</small></div><form className="login-form" onSubmit={submit}><h1 id="cadastro-title">Cadastro de aluno</h1><p>Use seu e-mail institucional. O professor verá seu ambiente, mas não poderá editá-lo.</p><label htmlFor="cadastro-nome">Nome completo</label><input id="cadastro-nome" required minLength={2} maxLength={120} value={formulario.nome} onChange={(event) => alterar('nome', event.target.value)} autoComplete="name" /><label htmlFor="cadastro-email">E-mail institucional</label><input id="cadastro-email" type="email" required maxLength={160} value={formulario.email} onChange={(event) => alterar('email', event.target.value)} autoComplete="email" /><label htmlFor="cadastro-senha">Senha</label><input id="cadastro-senha" type="password" required minLength={8} maxLength={72} value={formulario.senha} onChange={(event) => alterar('senha', event.target.value)} autoComplete="new-password" /><label htmlFor="cadastro-organizacao">Nome da organização do exercício</label><input id="cadastro-organizacao" required minLength={2} maxLength={120} value={formulario.organizacao} onChange={(event) => alterar('organizacao', event.target.value)} placeholder="Ex.: Minha empresa" /><label htmlFor="cadastro-setor">Setor (opcional)</label><input id="cadastro-setor" maxLength={80} value={formulario.setor} onChange={(event) => alterar('setor', event.target.value)} /><label htmlFor="cadastro-descricao">Descrição (opcional)</label><textarea id="cadastro-descricao" maxLength={1000} value={formulario.descricao} onChange={(event) => alterar('descricao', event.target.value)} /><p className="signup-help">Seu cadastro não pode escolher o perfil Professor.</p>{cadastro.isError && <p className="alert error" role="alert">⚠ {message}</p>}<button className="primary" disabled={cadastro.isPending}>{cadastro.isPending ? 'Criando conta…' : 'Criar conta de aluno'}</button><p className="signup"><Link to="/login">Já tenho uma conta</Link></p></form></section></main>;
}
