import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ListPage from './pages/ListPage'
import CanvasPage from './pages/CanvasPage'
import SettingsPage from './pages/SettingsPage'
import { useUseCasesStore } from './store/useCasesStore'

function AppRoutes() {
  const init = useUseCasesStore((s) => s.init)
  const loading = useUseCasesStore((s) => s.loading)

  useEffect(() => { init() }, [init])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#e8eff7' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading AI Manager…</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/use-cases" element={<ListPage />} />
        <Route path="/canvas/new" element={<CanvasPage />} />
        <Route path="/canvas/:id" element={<CanvasPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
