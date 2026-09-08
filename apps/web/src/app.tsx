import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import type { AuthResponse } from '@eduitsm/shared';
import { LoginPage } from './pages/login-page.js';
import { PainelPage } from './pages/painel-page.js';
import { AnalisePage } from './pages/analise-page.js';
import { EstrategiaPage } from './pages/estrategia-page.js';
import { ObjetivosPage } from './pages/objetivos-page.js';
import { ServicosPage } from './pages/servicos-page.js';
import { CustosPage } from './pages/custos-page.js';
import { DemandaPage } from './pages/demanda-page.js';
import { VinculosPage } from './pages/vinculos-page.js';
import { IndicadoresPage } from './pages/indicadores-page.js';
import { CenarioPage } from './pages/cenario-page.js';
import { IndicadoresPainelPage } from './pages/indicadores-painel-page.js';

function sessao(): AuthResponse | null { try { return JSON.parse(sessionStorage.getItem('eduitsm.auth') ?? 'null') as AuthResponse | null; } catch { return null; } }
function CustosRoute({ usuario }: { usuario: NonNullable<AuthResponse>['usuario'] }) { return <CustosPage usuario={usuario} servicoId={useParams().id ?? ''} />; }
function DemandaRoute({ usuario }: { usuario: NonNullable<AuthResponse>['usuario'] }) { return <DemandaPage usuario={usuario} servicoId={useParams().id ?? ''} />; }
export function App() {
  const auth = sessao();
  return <Routes><Route path="/login" element={auth ? <Navigate to="/painel" replace /> : <LoginPage />} /><Route path="/painel" element={auth ? <PainelPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/analise" element={auth ? <AnalisePage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/estrategia" element={auth ? <EstrategiaPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/objetivos" element={auth ? <ObjetivosPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/servicos" element={auth ? <ServicosPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/servicos/:id/custos" element={auth ? <CustosRoute usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/servicos/:id/demanda" element={auth ? <DemandaRoute usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/vinculos" element={auth ? <VinculosPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/indicadores" element={auth ? <IndicadoresPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/cenarios" element={auth ? <CenarioPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="/indicadores/painel" element={auth ? <IndicadoresPainelPage usuario={auth.usuario} /> : <Navigate to="/login" replace />} /><Route path="*" element={<Navigate to={auth ? '/painel' : '/login'} replace />} /></Routes>;
}
