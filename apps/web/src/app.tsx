import { Navigate, Route, Routes } from 'react-router-dom';
import type { AuthResponse } from '@eduitsm/shared';
import { LoginPage } from './pages/login-page.js';
import { PainelPage } from './pages/painel-page.js';
import { AnalisePage } from './pages/analise-page.js';
import { EstrategiaPage } from './pages/estrategia-page.js';
import { ObjetivosPage } from './pages/objetivos-page.js';

function sessao(): AuthResponse | null { try { return JSON.parse(sessionStorage.getItem('eduitsm.auth') ?? 'null') as AuthResponse | null; } catch { return null; } }
export function App() {
  const auth = sessao();
  return <Routes><Route path="/login" element={auth ? <Navigate to="/painel" replace /> : <LoginPage />} /><Route path="/painel" element={auth ? <PainelPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/analise" element={auth ? <AnalisePage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/estrategia" element={auth ? <EstrategiaPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/objetivos" element={auth ? <ObjetivosPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="*" element={<Navigate to={auth ? '/painel' : '/login'} replace />} /></Routes>;
}
