import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ListPage from './pages/ListPage'
import CanvasPage from './pages/CanvasPage'
import SettingsPage from './pages/SettingsPage'
import GovernancePage from './pages/GovernancePage'
import EnablementPage from './pages/EnablementPage'
import MeetingsPage from './pages/MeetingsPage'
import RolesPage from './pages/RolesPage'
import MaturityPage from './pages/MaturityPage'
import AboutPage from './pages/AboutPage'
import StrategyPage from './pages/StrategyPage'
import RiskPage from './pages/RiskPage'
import RoiPage from './pages/RoiPage'
import RoadmapPage from './pages/RoadmapPage'
import VendorPage from './pages/VendorPage'
import StartPage from './pages/StartPage'
import QAPage from './pages/QAPage'
import GlossaryPage from './pages/GlossaryPage'
import PromptLibraryPage from './pages/PromptLibraryPage'
import DsgvoPage from './pages/DsgvoPage'
import EthikPage from './pages/EthikPage'
import EuAiActPage from './pages/EuAiActPage'
import ProjectPlanPage from './pages/ProjectPlanPage'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { useUseCasesStore } from './store/useCasesStore'
import { useAuthStore } from './store/authStore'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: '#e8eff7' }}>
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading AI Manager…</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  if (authLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const initData = useUseCasesStore((s) => s.init)
  const dataLoading = useUseCasesStore((s) => s.loading)
  const initAuth = useAuthStore((s) => s.init)
  const authLoading = useAuthStore((s) => s.loading)

  useEffect(() => {
    const unsub = initAuth()
    return unsub
  }, [initAuth])

  useEffect(() => { initData() }, [initData])

  if (authLoading || dataLoading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/use-cases" element={<ListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/enablement" element={<EnablementPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/maturity" element={<MaturityPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/strategy" element={<StrategyPage />} />
              <Route path="/risk" element={<RiskPage />} />
              <Route path="/roi" element={<RoiPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/vendors" element={<VendorPage />} />
              <Route path="/start" element={<StartPage />} />
              <Route path="/qa" element={<QAPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/prompts" element={<PromptLibraryPage />} />
              <Route path="/dsgvo" element={<DsgvoPage />} />
              <Route path="/ethik" element={<EthikPage />} />
              <Route path="/eu-ai-act" element={<EuAiActPage />} />
              <Route path="/project-plan" element={<ProjectPlanPage />} />
              <Route path="/canvas/new" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
              <Route path="/canvas/:id" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
