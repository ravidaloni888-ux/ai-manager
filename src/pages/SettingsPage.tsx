import { useState } from 'react'
import { IconGithub, IconGlobe, IconFolder, IconCopy, IconDatabase } from '../components/icons/NavIcons'

const LOCAL_PATH = '/Users/ra/Downloads/git/ai-manager'
const GITHUB_URL = 'https://github.com/ravidaloni888-ux/ai-manager'
const VERCEL_URL = 'https://vercel.com/info-11678597s-projects/ai-manager-new'
const SUPABASE_URL = 'https://supabase.com/dashboard/project/zvmujqhjqgzujmrvdxbr'
const LOCAL_URL = 'http://localhost:3001'
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

      <section className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">App Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Release', value: 'Release 1' },
            { label: 'Framework', value: 'Vite + React 18' },
            { label: 'Methodology', value: 'velpTEC K7.0069' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="font-medium text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">About AI Manager</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Full-stack web application for managing an enterprise AI portfolio — from use case intake to governance and team enablement.
          Built on the <span className="font-medium text-slate-700">velpTEC K7.0069</span> methodology.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              icon: '📋',
              title: 'AI Use Case Portfolio',
              desc: 'Capture, score and prioritise AI projects using a weighted model — Impact 40% · Feasibility 30% · Strategic Fit 20% · Urgency 10%.',
            },
            {
              icon: '🖼️',
              title: 'AI Canvas',
              desc: '9-element project documentation including ROI calculation, EU AI Act risk classification and a per-use-case compliance checklist.',
            },
            {
              icon: '📊',
              title: 'Management Dashboard',
              desc: 'Live KPIs, Impact / Feasibility bubble matrix, phase and department distribution, and a top-5 priority ranking.',
            },
            {
              icon: '🎯',
              title: 'Maturity Assessment',
              desc: '18 questions across 6 AI dimensions (Strategy, People, Technology, Data, Governance, Adoption) with a live radar chart.',
            },
            {
              icon: '⚖️',
              title: 'AI Governance',
              desc: '9-step strategic planning tracker, AI policy editor (7 dimensions), per-use-case privacy checklist and role assignment.',
            },
            {
              icon: '🎓',
              title: 'Enablement & Coaching',
              desc: 'Training progress map for 7 core AI topics across all departments, with a topic library based on the K7.0069 framework.',
            },
            {
              icon: '📅',
              title: 'Regular Meetings',
              desc: 'Configure and visualise recurring AI meetings (week and month view) — from Trend Scouting to quarterly Strategy sessions.',
            },
            {
              icon: '👥',
              title: 'Team & Roles',
              desc: '7 AI Center of Excellence role cards with person assignment, activity lists and interim governance tracking.',
            },
            {
              icon: '🔐',
              title: 'Auth & Multi-User',
              desc: 'Supabase Auth with Row-Level Security — read access without login, write access for authenticated users only.',
            },
            {
              icon: '📤',
              title: 'Export & Print',
              desc: 'CSV export for management presentations and a print-optimised PDF canvas view for each use case.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-500">Tech stack:</span> React 18 · TypeScript · Vite · Tailwind CSS · Recharts · TanStack Table · Zustand · Supabase · Vercel
          </p>
        </div>
      </section>
    </div>
  )
}
