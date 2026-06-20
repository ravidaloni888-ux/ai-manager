import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDemoMode, useDemoStore } from '../store/demoStore'

// ── Step definitions ───────────────────────────────────────────────────────
export type StepId =
  | 'vision' | 'maturity' | 'governance' | 'roles'
  | 'usecases' | 'score' | 'eu-act'
  | 'risks' | 'roadmap' | 'roi'
  | 'enablement' | 'meetings'

interface Step {
  id: StepId
  phase: string
  num: number
  title: string
  description: string
  detail: string
  effort: string
  to: string
  cta: string
}

const STEPS: Step[] = [
  // ── Phase 1 ──
  {
    id: 'vision',
    phase: 'Strategy & Governance',
    num: 1,
    title: 'Define your AI Vision',
    description: 'Set the strategic direction — your time horizon, 3 key objectives, and the competitive challenge driving AI adoption.',
    detail: 'A clear vision aligns the organisation and gives every use case decision a "north star." Without it, AI efforts fragment into isolated experiments that never compound.',
    effort: '~30 min',
    to: '/strategy',
    cta: 'Open Strategy Wizard',
  },
  {
    id: 'maturity',
    phase: 'Strategy & Governance',
    num: 2,
    title: 'Assess your AI Maturity',
    description: 'Complete the maturity assessment to understand where your organisation stands across data, talent, tooling, and governance.',
    detail: 'The maturity score tells you which use cases are realistic today and where you need to invest before scaling. It prevents over-promising to stakeholders.',
    effort: '~45 min',
    to: '/maturity',
    cta: 'Start Assessment',
  },
  {
    id: 'governance',
    phase: 'Strategy & Governance',
    num: 3,
    title: 'Set up your AI Governance Policy',
    description: 'Document your organisation-wide AI policy across 7 dimensions: purpose, data, transparency, responsibility, risk, ethics, and training.',
    detail: 'A written AI policy is required under the EU AI Act and expected by enterprise customers and regulators. It also prevents rogue AI initiatives from creating legal or reputational risk.',
    effort: '~1 hour',
    to: '/governance',
    cta: 'Open AI Governance',
  },
  {
    id: 'roles',
    phase: 'Strategy & Governance',
    num: 4,
    title: 'Assign Roles & Responsibilities',
    description: 'Name the AI Owner, Data Protection Officer, Ethics Reviewer, and other key roles. Document who is accountable for what.',
    detail: 'The EU AI Act requires named accountability. Without assigned roles, decisions stall and incidents have no clear owner.',
    effort: '~20 min',
    to: '/governance',
    cta: 'Assign Roles',
  },

  // ── Phase 2 ──
  {
    id: 'usecases',
    phase: 'Portfolio Management',
    num: 5,
    title: 'Inventory your AI Use Cases',
    description: 'Add every AI initiative — live, in evaluation, or just an idea — to the portfolio. Include department, status, and a brief problem statement.',
    detail: 'You can only manage what you can see. Many organisations discover shadow AI projects at this stage — initiatives running without governance or risk review.',
    effort: '~1–2 hours',
    to: '/use-cases',
    cta: 'Open Use Cases',
  },
  {
    id: 'score',
    phase: 'Portfolio Management',
    num: 6,
    title: 'Score & Prioritise the Portfolio',
    description: 'Complete the AI Canvas for each case — fill in business impact, feasibility, strategic fit, and urgency scores to compute a priority ranking.',
    detail: 'Prioritisation removes the "loudest stakeholder wins" problem. The weighted score model gives leadership an objective basis for investment decisions.',
    effort: '~30 min per case',
    to: '/use-cases',
    cta: 'Score Use Cases',
  },
  {
    id: 'eu-act',
    phase: 'Portfolio Management',
    num: 7,
    title: 'Classify EU AI Act Risk per Case',
    description: 'Set the EU AI Act risk level (Minimal / Limited / High / Unacceptable) for each use case and complete the privacy checklist for high-risk cases.',
    detail: 'High-risk AI systems require a DPIA and additional documentation under the EU AI Act. Identifying them early avoids costly remediation later.',
    effort: '~15 min per case',
    to: '/use-cases',
    cta: 'Review Risk Levels',
  },

  // ── Phase 3 ──
  {
    id: 'risks',
    phase: 'Risk & Investment',
    num: 8,
    title: 'Register & Assess AI Risks',
    description: 'Log technical, ethical, and operational risks for your portfolio. Score likelihood and impact, assign owners, and track mitigation status.',
    detail: 'AI risks (bias, model drift, vendor lock-in) are often invisible until they cause an incident. A risk register makes them visible and manageable before they escalate.',
    effort: '~1 hour',
    to: '/risk',
    cta: 'Open Risk Manager',
  },
  {
    id: 'roadmap',
    phase: 'Risk & Investment',
    num: 9,
    title: 'Generate a Delivery Roadmap',
    description: 'Auto-sequence use cases into quarters based on priority score and budget cap. Adjust by dragging cards between quarters.',
    detail: 'A roadmap converts the priority ranking into a delivery commitment. It answers the question stakeholders always ask: "When will we see results?"',
    effort: '~30 min',
    to: '/roadmap',
    cta: 'Open Roadmap Generator',
  },
  {
    id: 'roi',
    phase: 'Risk & Investment',
    num: 10,
    title: 'Calculate ROI for Key Cases',
    description: 'For your highest-priority use cases, model the investment cost, annual benefit, payback period, and break-even point.',
    detail: 'Finance and leadership will ask for ROI numbers before approving budgets. Having these ready — even as estimates — dramatically accelerates sign-off.',
    effort: '~15 min per case',
    to: '/roi',
    cta: 'Open ROI Calculator',
  },

  // ── Phase 4 ──
  {
    id: 'enablement',
    phase: 'Operations & People',
    num: 11,
    title: 'Plan Team Enablement',
    description: 'Define your AI training curriculum, identify skill gaps, and schedule coaching sessions for teams working with AI systems.',
    detail: 'The most common reason AI initiatives stall after launch is that employees don\'t know how to use or trust the new system. Enablement is not optional.',
    effort: '~45 min',
    to: '/enablement',
    cta: 'Open Enablement',
  },
  {
    id: 'meetings',
    phase: 'Operations & People',
    num: 12,
    title: 'Set Up Governance Meetings',
    description: 'Establish a recurring AI Steering Committee, monthly portfolio review, and quarterly strategy check-in. Document agenda and attendees.',
    detail: 'Sustained AI progress requires a governance rhythm. Without scheduled check-ins, the portfolio drifts and accountability fades within 3–6 months.',
    effort: '~20 min',
    to: '/meetings',
    cta: 'Open Meetings',
  },
]

const PHASES = [...new Set(STEPS.map((s) => s.phase))]

const PHASE_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Strategy & Governance': { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  badge: 'bg-blue-100 text-blue-700' },
  'Portfolio Management':  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  'Risk & Investment':     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  'Operations & People':   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700' },
}

// ── localStorage ───────────────────────────────────────────────────────────
const LS_KEY = 'ai_start_v1'

const ALL_STEP_IDS: StepId[] = [
  'vision', 'maturity', 'governance', 'roles',
  'usecases', 'score', 'eu-act',
  'risks', 'roadmap', 'roi',
  'enablement', 'meetings',
]

export function loadProgress(): Set<StepId> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return new Set<StepId>(JSON.parse(raw))
    return getDemoMode() ? new Set(ALL_STEP_IDS) : new Set()
  } catch { return new Set() }
}

function saveProgress(done: Set<StepId>) {
  if (getDemoMode()) return
  try { localStorage.setItem(LS_KEY, JSON.stringify([...done])) } catch {}
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StartPage() {
  const navigate = useNavigate()
  const demoMode = useDemoStore((s) => s.demoMode)
  const [done, setDone] = useState<Set<StepId>>(loadProgress)
  const [expanded, setExpanded] = useState<StepId | null>(null)

  useEffect(() => {
    const fresh = loadProgress()
    setDone(fresh)
  }, [demoMode])

  const toggle = (id: StepId) => {
    setDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveProgress(next)
      return next
    })
  }

  const completedCount = done.size
  const totalCount     = STEPS.length
  const pct            = Math.round((completedCount / totalCount) * 100)

  // first incomplete step id
  const nextStep = STEPS.find((s) => !done.has(s.id))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Getting Started</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your AI Manager Playbook — follow these steps in order to build a solid AI programme.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">
            {completedCount === totalCount
              ? '🎉 All steps complete!'
              : `${completedCount} of ${totalCount} steps complete`}
          </p>
          <span className="text-sm font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextStep && (
          <p className="text-xs text-slate-400 mt-2">
            Next up: <span className="font-semibold text-slate-600">Step {nextStep.num} — {nextStep.title}</span>
          </p>
        )}
      </div>

      {/* Steps by phase */}
      {PHASES.map((phase) => {
        const phaseSteps  = STEPS.filter((s) => s.phase === phase)
        const phaseDone   = phaseSteps.filter((s) => done.has(s.id)).length
        const style       = PHASE_STYLE[phase]

        return (
          <div key={phase} className="space-y-2">
            {/* Phase header */}
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{phase}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {phaseDone}/{phaseSteps.length}
              </span>
            </div>

            {/* Step cards */}
            <div className="space-y-2">
              {phaseSteps.map((step) => {
                const isComplete = done.has(step.id)
                const isNext     = nextStep?.id === step.id
                const isExpanded = expanded === step.id

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl border-2 transition-all ${
                      isComplete
                        ? 'border-slate-100 opacity-70'
                        : isNext
                        ? 'border-blue-400 shadow-md'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggle(step.id)}
                        className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                          isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : isNext
                            ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
                            : 'border-slate-300 text-slate-300 hover:border-slate-400'
                        }`}
                        title={isComplete ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isComplete ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{step.num}</span>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {step.title}
                              </p>
                              {isNext && (
                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Next</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {step.effort}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className={`mt-3 p-3 rounded-lg text-xs text-slate-600 leading-relaxed border ${style.bg} ${style.border}`}>
                            <p className={`font-semibold mb-1 ${style.text}`}>Why this step matters</p>
                            {step.detail}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2.5">
                          <button
                            onClick={() => navigate(`${step.to}?from=wizard`)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isComplete
                                ? 'text-slate-500 bg-slate-50 hover:bg-slate-100'
                                : 'text-white bg-blue-600 hover:bg-blue-500'
                            }`}
                          >
                            {step.cta} →
                          </button>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : step.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? 'Hide detail' : 'Why this?'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Footer note */}
      <p className="text-xs text-slate-400 pb-2">
        Steps can be completed in any order — the sequence above reflects the recommended approach for new AI Managers.
        Progress is saved automatically in your browser.
      </p>
    </div>
  )
}
