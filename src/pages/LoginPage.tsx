import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { IconBrain } from '../components/icons/NavIcons'

export default function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Ask the browser password manager for saved credentials on mount
  useEffect(() => {
    if (!('credentials' in navigator)) return
    navigator.credentials
      .get({ password: true, mediation: 'optional' } as CredentialRequestOptions)
      .then((cred) => {
        if (!cred || cred.type !== 'password') return
        const pc = cred as unknown as { id: string; password?: string }
        setEmail(pc.id)
        if (pc.password) setPassword(pc.password)
      })
      .catch(() => {})
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      // Tell the browser to save/update these credentials
      if ('credentials' in navigator && 'PasswordCredential' in window) {
        try {
          const PCtor = (window as unknown as Record<string, new (o: { id: string; password: string }) => Credential>).PasswordCredential
          const cred = new PCtor({ id: email, password })
          navigator.credentials.store(cred).catch(() => {})
        } catch { /* unsupported browser */ }
      }
      navigate('/dashboard')
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#e8eff7' }}>
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <IconBrain />
          </div>
          <div>
            <p className="font-semibold text-slate-800">AI Manager</p>
            <p className="text-xs text-slate-400">
              {forgotMode ? 'Passwort zurücksetzen' : 'Anmelden zur Verwaltung Ihrer Anwendungsfälle'}
            </p>
          </div>
        </div>

        {resetSent ? (
          <div className="space-y-4">
            <p className="text-sm text-green-600">
              Reset-Link gesendet an <strong>{email}</strong>. Bitte prüfen Sie Ihren Posteingang.
            </p>
            <button
              onClick={() => { setForgotMode(false); setResetSent(false) }}
              className="text-sm text-blue-600 hover:underline"
            >
              Zurück zum Login
            </button>
          </div>
        ) : forgotMode ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setError('') }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Zurück zum Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600">Passwort</label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError('') }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Passwort vergessen?
                </button>
              </div>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
