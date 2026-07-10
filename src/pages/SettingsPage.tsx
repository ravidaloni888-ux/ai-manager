import { useState } from 'react'
import { IconGithub, IconGlobe, IconFolder, IconCopy, IconDatabase } from '../components/icons/NavIcons'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const LOCAL_PATH = '/Users/ra/Downloads/git/ai-manager'
const GITHUB_URL = 'https://github.com/ravidaloni888-ux/ai-manager'
const VERCEL_URL = 'https://vercel.com/info-11678597s-projects/ai-manager-new'
const SUPABASE_URL = 'https://supabase.com/dashboard/project/zvmujqhjqgzujmrvdxbr'
const LOCAL_URL = 'http://localhost:3002'
const LIVE_URL = 'https://ai-manager-new.vercel.app'

function LinkCard({
  icon,
  label,
  href,
  value,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  href?: string
  value: string
  iconBg: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
      <div className={`${iconBg} rounded-lg p-3 flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-700 font-mono truncate">{value}</p>
        )}
      </div>
      <button
        onClick={handleCopy}
        title="Copy to clipboard"
        className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <IconCopy />
        )}
      </button>
    </div>
  )
}

function ResetButton() {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')

  const handleReset = async () => {
    if (!user) return
    setStatus('loading')
    await supabase.from('ai_use_cases').delete().eq('user_id', user.id)
    await supabase.from('ai_strategy').delete().eq('user_id', user.id)
    localStorage.removeItem('ai_start_v1')
    setStatus('done')
    setTimeout(() => window.location.reload(), 800)
  }

  if (status === 'done') return <p className="text-xs text-green-600 font-medium">Zurückgesetzt — Seite lädt neu…</p>
  if (status === 'loading') return <p className="text-xs text-slate-500">Wird gelöscht…</p>
  if (status === 'confirm') return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-red-600 font-medium">Wirklich alle Daten löschen?</p>
      <button onClick={handleReset} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-700">Ja, löschen</button>
      <button onClick={() => setStatus('idle')} className="text-xs text-slate-500 hover:text-slate-700 underline">Abbrechen</button>
    </div>
  )
  return (
    <button onClick={() => setStatus('confirm')}
      className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors">
      Account zurücksetzen (leerer Zustand)
    </button>
  )
}

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Project links & configuration</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Project Links</h2>

        <LinkCard
          icon={<IconGlobe />}
          label="Live App"
          href={LIVE_URL}
          value={LIVE_URL}
          iconBg="bg-blue-50 text-blue-600"
        />

        <LinkCard
          icon={<IconGlobe />}
          label="Local Dev URL"
          href={LOCAL_URL}
          value={LOCAL_URL}
          iconBg="bg-violet-50 text-violet-600"
        />

        <LinkCard
          icon={<IconGithub />}
          label="GitHub Repository"
          href={GITHUB_URL}
          value={GITHUB_URL}
          iconBg="bg-slate-100 text-slate-700"
        />

        <LinkCard
          icon={<IconDatabase />}
          label="Supabase Database"
          href={SUPABASE_URL}
          value={SUPABASE_URL}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <LinkCard
          icon={<IconGlobe />}
          label="Vercel Dashboard"
          href={VERCEL_URL}
          value={VERCEL_URL}
          iconBg="bg-slate-100 text-slate-600"
        />

        <LinkCard
          icon={<IconFolder />}
          label="Local Folder"
          value={LOCAL_PATH}
          iconBg="bg-amber-50 text-amber-600"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tech Stack</h2>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
          {[
            { label: 'Sprache', value: 'TypeScript 5' },
            { label: 'Framework', value: 'React 18' },
            { label: 'Build Tool', value: 'Vite' },
            { label: 'Styling', value: 'Tailwind CSS v3' },
            { label: 'Routing', value: 'React Router v6' },
            { label: 'State', value: 'Zustand' },
            { label: 'Datenbank', value: 'Supabase (PostgreSQL)' },
            { label: 'Hosting', value: 'Vercel' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className="text-xs font-semibold text-slate-700 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Gefahrenzone</h2>
        <div className="bg-white rounded-xl shadow-sm px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Account zurücksetzen</p>
            <p className="text-xs text-slate-500 mt-0.5">Löscht alle Use Cases, Strategy-Daten und den Wizard-Fortschritt — sieht danach aus wie ein leerer Account.</p>
          </div>
          <ResetButton />
        </div>
      </section>

    </div>
  )
}
