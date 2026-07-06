import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UseCaseTable from '../components/list/UseCaseTable'
import PipelineView from '../components/list/PipelineView'
import { useUseCasesStore } from '../store/useCasesStore'
import { AIUseCase } from '../types'

type View = 'table' | 'pipeline'

function IconTable() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-9.75 0h9.75" />
    </svg>
  )
}

function IconPipeline() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

// ── ISO 42001 Use Case Register panel ─────────────────────────────────────

const ISO_REGISTER_REQUIREMENTS = [
  {
    clause: '§6.1.2',
    title: 'AI Risk Assessment',
    description: 'The organisation must identify, analyse and evaluate AI risks for each system. Every use case in the register must have a documented risk level before deployment.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => c.euAiActRisk),
    gap: (cases: AIUseCase[]) => {
      const missing = cases.filter((c) => !c.euAiActRisk).length
      return missing > 0 ? `${missing} use case${missing > 1 ? 's' : ''} without EU AI Act risk level` : null
    },
  },
  {
    clause: '§8.2',
    title: 'AI Risk Assessment Process',
    description: 'A repeatable process must exist for assessing AI risks — not ad hoc. Each use case should document likelihood, impact and mitigation, not just a risk label.',
    check: (cases: AIUseCase[]) => cases.length > 0,
    gap: (_cases: AIUseCase[]) => null,
  },
  {
    clause: '§8.4',
    title: 'AI System Impact Assessment',
    description: 'Before deploying or significantly changing an AI system, the potential impacts on individuals, groups and society must be assessed and documented.',
    check: (cases: AIUseCase[]) => cases.filter((c) => c.euAiActRisk === 'High Risk').every((c) => c.compliancePersonalData !== undefined && c.complianceDocumentation !== undefined),
    gap: (cases: AIUseCase[]) => {
      const highRisk = cases.filter((c) => c.euAiActRisk === 'High Risk')
      const missing = highRisk.filter((c) => c.compliancePersonalData === undefined).length
      return missing > 0 ? `${missing} high-risk use case${missing > 1 ? 's' : ''} missing compliance checklist` : null
    },
  },
  {
    clause: 'A.6.1',
    title: 'AI System Documentation (Annex A)',
    description: 'Each AI system must be documented with its purpose, intended use, data sources, model type, owner, and known limitations — the AI Canvas fulfils this requirement.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => c.businessProblem && c.department),
    gap: (cases: AIUseCase[]) => {
      const incomplete = cases.filter((c) => !c.businessProblem || !c.department).length
      return incomplete > 0 ? `${incomplete} use case${incomplete > 1 ? 's' : ''} with incomplete documentation` : null
    },
  },
  {
    clause: 'A.7.1',
    title: 'AI System Lifecycle Management (Annex A)',
    description: 'The register must reflect the current lifecycle status of each AI system — from idea through production and retirement — to ensure governance applies at every phase.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => !!c.status),
    gap: (_cases: AIUseCase[]) => null,
  },
]

function Iso42001RegisterPanel({ useCases }: { useCases: AIUseCase[] }) {
  const [open, setOpen] = useState(false)
  const passed = ISO_REGISTER_REQUIREMENTS.filter((r) => r.check(useCases)).length

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">ISO 42001 · Use Case Register Requirements</p>
            <p className="text-xs text-slate-500 mt-0.5">§6.1.2 · §8.2 · §8.4 · Annex A.6 & A.7 — documentation and risk assessment obligations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            passed === ISO_REGISTER_REQUIREMENTS.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {passed}/{ISO_REGISTER_REQUIREMENTS.length} met
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          <div className="px-5 py-3 bg-indigo-50">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">ISO 42001:2023</span> requires organisations to maintain a register of AI systems with documented risk assessments, impact evaluations, and lifecycle status. The checks below are derived from the standard and evaluated live against your current use case portfolio.
            </p>
          </div>

          {ISO_REGISTER_REQUIREMENTS.map((req) => {
            const ok  = req.check(useCases)
            const gap = req.gap(useCases)
            return (
              <div key={req.clause} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {ok ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{req.clause}</span>
                    <p className="text-xs font-semibold text-slate-700">{req.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{req.description}</p>
                  {gap && (
                    <p className="text-[10px] text-amber-600 font-medium">⚠ {gap}</p>
                  )}
                  {ok && !gap && (
                    <p className="text-[10px] text-green-600 font-medium">✓ Requirement met based on current portfolio</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function ListPage() {
  const navigate = useNavigate()
  const { useCases } = useUseCasesStore()
  const [view, setView] = useState<View>('table')

  const handleEdit = (id: string) => navigate(`/canvas/${id}`)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Use Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sort, filter, group and manage your AI portfolio.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconTable /> Table
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'pipeline'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconPipeline /> Pipeline
          </button>
        </div>
      </div>

      <Iso42001RegisterPanel useCases={useCases} />

      {view === 'table' && <UseCaseTable />}
      {view === 'pipeline' && <PipelineView useCases={useCases} onEdit={handleEdit} />}
    </div>
  )
}
