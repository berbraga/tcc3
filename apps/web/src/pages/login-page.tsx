import { useMutation } from '@tanstack/react-query';
import type { ApiError, AuthResponse } from '@eduitsm/shared';
import axios from 'axios';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const login = useMutation({
    mutationFn: async () => (await api.post<AuthResponse>('/auth/login', { email, senha })).data,
    onSuccess: (data) => { sessionStorage.setItem('eduitsm.auth', JSON.stringify(data)); navigate('/painel'); }
  });
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate(); };
  const message = axios.isAxiosError<ApiError>(login.error) ? login.error.response?.data.message : (login.error as { response?: { data?: ApiError } } | null)?.response?.data?.message;

  return <main className="login-shell">
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-about">
        <Logo />
        <p>Ferramenta educacional para praticar o Gerenciamento da Estratégia <em>(Strategy Management)</em> da ITIL 4 em uma organização fictícia.</p>
        <ol><li>Analisar o ambiente</li><li>Definir a direção estratégica</li><li>Desenhar e operar os serviços</li><li>Medir, avaliar e revisar</li></ol>
        <small>UNIVALI · Escola Politécnica<br />Ciência da Computação</small>
      </div>
      <form className="login-form" onSubmit={submit}>
        <h1 id="login-title">Entrar na ferramenta</h1>
        <p>Use as credenciais locais de demonstração ou as entregues pelo professor.</p>
        <label htmlFor="email">E-mail institucional</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        {login.isError && <p className="alert error" role="alert">⚠ {message ?? 'Não foi possível entrar. Tente novamente.'}</p>}
        <div className="unavailable"><span>Manter conectado</span><span>Recuperação de senha indisponível nesta fase</span></div>
        <button className="primary" disabled={login.isPending}>{login.isPending ? 'Entrando…' : 'Entrar'}</button>
        <p className="signup">Ainda não tem conta? <span>Cadastro de aluno disponível pela API.</span></p>
      </form>
    </section>
  </main>;
}

export function Logo() { return <div className="logo"><strong>EduITSM</strong><span>Estratégia de Serviço · ITIL 4</span></div>; }
