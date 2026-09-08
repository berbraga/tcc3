import { Navigate, Route, Routes } from 'react-router-dom';
import type { AuthResponse } from '@eduitsm/shared';
import { LoginPage } from './pages/login-page.js';
import { PainelPage } from './pages/painel-page.js';

function sessao(): AuthResponse | null { try { return JSON.parse(sessionStorage.getItem('eduitsm.auth') ?? 'null') as AuthResponse | null; } catch { return null; } }
export function App() {
  const auth = sessao();
  return <Routes><Route path="/login" element={auth ? <Navigate to="/painel" replace /> : <LoginPage />} /><Route path="/painel" element={auth ? <PainelPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="*" element={<Navigate to={auth ? '/painel' : '/login'} replace />} /></Routes>;
}
