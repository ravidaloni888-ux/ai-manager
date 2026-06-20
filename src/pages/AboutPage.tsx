export default function AboutPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">About AI Manager</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Full-stack AI portfolio management · velpTEC K7.0069
        </p>
      </div>

      {/* Version info */}
      <section className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Version</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Version',     value: '1.0.0' },
            { label: 'Release',     value: 'Release 1' },
            { label: 'Framework',   value: 'Vite + React 18' },
            { label: 'Methodology', value: 'velpTEC K7.0069' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="font-medium text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">What it does</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          AI Manager gives an AI Center of Excellence a single place to capture, score and govern every
          AI initiative — from the first idea to production and beyond. Built on the{' '}
          <span className="font-medium text-slate-700">velpTEC K7.0069</span> methodology.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          It's a <span className="font-medium text-slate-700">TypeScript/React</span> project built with{' '}
          <span className="font-medium text-slate-700">Vite</span> and{' '}
          <span className="font-medium text-slate-700">Tailwind CSS</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map((t) => (
            <span key={t} className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

const FEATURES = [
  {
    icon: '📋',
    title: 'AI Use Case Portfolio',
    desc: 'Score and prioritise AI projects using a weighted model — Impact 40% · Feasibility 30% · Strategic Fit 20% · Urgency 10%.',
  },
  {
    icon: '🖼️',
    title: 'AI Canvas',
    desc: '9-element project documentation with ROI calculation, EU AI Act risk classification and a per-use-case compliance checklist.',
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
    desc: 'Configure and visualise 6 recurring AI meetings in week and month calendar view — from Trend Scouting to quarterly Strategy sessions.',
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
    desc: 'CSV export for management presentations and a print-optimised PDF canvas view per use case.',
  },
]

const STACK = [
  'React 18', 'TypeScript', 'Vite', 'Tailwind CSS',
  'Recharts', 'TanStack Table', 'Zustand', 'Supabase', 'Vercel',
]
