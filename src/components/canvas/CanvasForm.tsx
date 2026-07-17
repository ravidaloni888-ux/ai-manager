import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import {
  AIUseCase, DEPARTMENTS, STATUSES, AI_APPROACHES, FEASIBILITIES,
  STATUS_BG, APPROACH_BG, FEASIBILITY_BG, MOTIVATION_BG,
  PROJECT_HEALTH_OPTIONS, MOTIVATIONS, ProjectHealth,
  EU_AI_ACT_RISKS, EU_AI_ACT_BG, EuAiActRisk,
} from '../../types'
import { computePriorityScore, computeROI, scoreColor } from '../../lib/scoring'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useRiskStore } from '../../store/riskStore'
import { deriveAIRisks } from '../../lib/deriveRisks'

interface Props {
  existing?: AIUseCase
}

type FormData = Omit<AIUseCase, 'id' | 'priorityScore' | 'createdAt' | 'updatedAt'>

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'
const textareaCls = `${inputCls} resize-none`

const COMPETENCY_OPTIONS = [
  'Data Science', 'Machine Learning Engineering', 'Data Engineering',
  'Software Engineering', 'MLOps / DevOps', 'Business Analysis',
  'Domain Expertise', 'Project Management', 'UX / Design',
  'Data Governance', 'Legal / Compliance', 'Change Management',
]

const TIMELINE_OPTIONS = [
  '< 1 Month', '1–3 Months', '3–6 Months',
  '6–12 Months', '1–2 Years', '2+ Years',
]

function CompetencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []

  const toggle = (comp: string) => {
    const next = selected.includes(comp)
      ? selected.filter((s) => s !== comp)
      : [...selected, comp]
    onChange(next.join(', '))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputCls} flex items-center justify-between text-left gap-2`}
      >
        <span className={`truncate ${selected.length ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected.length ? selected.join(', ') : 'Select competencies…'}
        </span>
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white rounded-xl shadow-xl border border-slate-100 max-h-56 overflow-y-auto">
          {COMPETENCY_OPTIONS.map((comp) => (
            <label
              key={comp}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(comp)}
                onChange={() => toggle(comp)}
                className="accent-blue-600 w-4 h-4 flex-shrink-0"
              />
              {comp}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function MotivationSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []

  const toggle = (m: string) => {
    const next = selected.includes(m) ? selected.filter((s) => s !== m) : [...selected, m]
    onChange(next.join(', '))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputCls} flex items-center justify-between text-left gap-2`}
      >
        {selected.length ? (
          <span className="flex flex-wrap gap-1 py-0.5">
            {selected.map((m) => (
              <span key={m} className={`text-xs font-medium px-2 py-0.5 rounded-full ${MOTIVATION_BG[m as keyof typeof MOTIVATION_BG] ?? 'bg-slate-100 text-slate-600'}`}>
                {m}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-slate-400">Select motivations…</span>
        )}
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white rounded-xl shadow-xl border border-slate-100 max-h-56 overflow-y-auto">
          {MOTIVATIONS.map((m) => (
            <label key={m} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(m)}
                onChange={() => toggle(m)}
                className="accent-blue-600 w-4 h-4 flex-shrink-0"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MOTIVATION_BG[m]}`}>{m}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function SliderField({
  label, name, weight, register, value,
}: {
  label: string
  name: string
  weight: string
  register: any
  value: number
}) {
  const pct = ((value - 1) / 9) * 100
  const color = value >= 8 ? '#22c55e' : value >= 6 ? '#f59e0b' : value >= 4 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-400 w-10 flex-shrink-0 text-right">{weight}</span>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)` }}
        {...register(name, { valueAsNumber: true })}
      />
      <span className="w-6 text-right text-base font-bold flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  )
}

export default function CanvasForm({ existing }: Props) {
  const navigate = useNavigate()
  const { addUseCase, updateUseCase, deleteUseCase } = useUseCasesStore()
  const { add: addRisk } = useRiskStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const defaultValues: FormData = existing ?? {
    title: '',
    department: 'Sales',
    status: 'Idea',
    projectHealth: 'On Track',
    motivation: '',
    euAiActRisk: 'Minimal Risk',
    complianceLegal: false,
    compliancePersonalData: false,
    complianceDataMin: false,
    complianceDocumentation: false,
    complianceLiability: false,
    businessProblem: '',
    successMetrics: '',
    dataRequirements: '',
    aiApproach: 'Supervised Learning',
    technicalFeasibility: 'Medium',
    teamCompetencies: '',
    timeline: '',
    startDate: '',
    cancellationReason: '',
    estimatedCostK: 100,
    expectedBenefitK: 200,
    businessImpact: 7,
    feasibility: 7,
    strategicFit: 7,
    urgency: 5,
    docGoal: '',
    docDataBasis: '',
    docRiskMitigation: '',
    docExplainability: '',
    docOperations: '',
    docRegulatory: '',
    docVersioning: '',
  }

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues,
  })

  useEffect(() => {
    if (existing) reset(existing)
  }, [existing, reset])

  const watched = useWatch({ control })
  const liveScore = computePriorityScore(
    Number(watched.businessImpact ?? 7),
    Number(watched.feasibility ?? 7),
    Number(watched.strategicFit ?? 7),
    Number(watched.urgency ?? 5),
  )
  const liveROI = computeROI(
    Number(watched.estimatedCostK ?? 0),
    Number(watched.expectedBenefitK ?? 0),
  )

  const onSubmit = (data: FormData) => {
    const now = new Date().toISOString()
    const uc: AIUseCase = {
      ...data,
      estimatedCostK: Number(data.estimatedCostK),
      expectedBenefitK: Number(data.expectedBenefitK),
      businessImpact: Number(data.businessImpact),
      feasibility: Number(data.feasibility),
      strategicFit: Number(data.strategicFit),
      urgency: Number(data.urgency),
      id: existing?.id ?? nanoid(),
      priorityScore: computePriorityScore(
        Number(data.businessImpact),
        Number(data.feasibility),
        Number(data.strategicFit),
        Number(data.urgency),
      ),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    if (existing) {
      updateUseCase(uc)
      navigate('/use-cases')
    } else {
      addUseCase(uc)
      deriveAIRisks(uc).forEach((r) => addRisk(r))
      setSavedId(uc.id)
    }
  }

  const currentStatus = watched.status ?? 'Idea'
  const currentApproach = watched.aiApproach ?? 'Supervised Learning'
  const currentFeas = watched.technicalFeasibility ?? 'Medium'

  if (savedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-800">Use Case erstellt</p>
          <p className="text-sm text-slate-500 mt-1">Möchtest du direkt einen Compliance-Projektplan dafür erstellen?</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/use-cases')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Zur Use-Case-Liste
          </button>
          <button
            onClick={() => navigate(`/project-plan?ucid=${savedId}`)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            Projektplan erstellen
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Screen form */}
      <form onSubmit={handleSubmit(onSubmit)} className="no-print space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {existing ? 'Edit Use Case' : 'New AI Use Case'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              KI Use Case Canvas — basierend auf der K7.0069 KI-Management-Methodik
            </p>
          </div>
          <div className="flex items-center gap-2">
            {existing && (
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-sm border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                Print PDF
              </button>
            )}
            {existing && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Löschen
              </button>
            )}
            {existing && confirmDelete && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-red-700 font-medium">Wirklich löschen?</span>
                <button
                  type="button"
                  onClick={() => { deleteUseCase(existing.id); navigate('/use-cases') }}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded font-semibold hover:bg-red-700 transition-colors"
                >
                  Ja, löschen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-1"
                >
                  Abbrechen
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {existing ? 'Save Changes' : 'Create Use Case'}
            </button>
          </div>
        </div>

        {/* Section 1: Basic Info */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Basic Information</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Row 1: Title + Department */}
            <div className="col-span-2">
              <label className={labelCls}>Titel *</label>
              <input
                {...register('title', { required: 'Titel ist erforderlich' })}
                className={inputCls}
                placeholder="z.B. Kundenabwanderungsvorhersage"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Abteilung</label>
              <select {...register('department')} className={inputCls}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Row 2: Motivation */}
            <div className="col-span-2">
              <label className={labelCls}>Auslöser / Motivation</label>
              <MotivationSelect
                value={watched.motivation ?? ''}
                onChange={(v) => setValue('motivation', v)}
              />
            </div>
            <div />

            {/* Row 3: Stage + Health */}
            <div className="col-span-2">
              <label className={labelCls}>Projektphase</label>
              <div className="flex items-center gap-2">
                <select {...register('status')} className={inputCls}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BG[currentStatus as keyof typeof STATUS_BG]}`}>
                  {currentStatus}
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Projektstatus</label>
              <input type="hidden" {...register('projectHealth')} />
              <div className="flex gap-1.5 h-[38px]">
                {PROJECT_HEALTH_OPTIONS.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setValue('projectHealth', h.value as ProjectHealth)}
                    className={`flex-1 text-xs font-medium rounded-lg border transition-colors ${
                      (watched.projectHealth ?? 'On Track') === h.value
                        ? `${h.activeCls} border-transparent`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancellation reason — only shown when status is Cancelled */}
            {watched.status === 'Cancelled' && (
              <div className="col-span-3">
                <label className={labelCls}>Grund für Stornierung</label>
                <textarea
                  {...register('cancellationReason')}
                  rows={2}
                  className={`${textareaCls} border-red-200 focus:ring-red-400`}
                  placeholder="Warum wurde dieser Anwendungsfall gestoppt? (z.B. Budget, strategischer Schwenk, technische Hürde…)"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 2: AI Use Case Canvas */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            KI-Anwendungsfall-Canvas <span className="text-slate-400 font-normal normal-case">(9 Elemente)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>1 · Geschäftsproblem *</label>
              <textarea
                {...register('businessProblem', { required: true })}
                rows={3}
                className={textareaCls}
                placeholder="Welches konkrete Geschäftsproblem besteht? Was kostet es das Unternehmen?"
              />
            </div>

            <div>
              <label className={labelCls}>2 · Erfolgskennzahlen (KPIs)</label>
              <textarea
                {...register('successMetrics')}
                rows={3}
                className={textareaCls}
                placeholder="Wie wird Erfolg gemessen? SMART-Ziele."
              />
            </div>

            <div>
              <label className={labelCls}>3 · Datenanforderungen</label>
              <textarea
                {...register('dataRequirements')}
                rows={3}
                className={textareaCls}
                placeholder="Welche Daten werden benötigt? Wo liegen sie? Was ist die Qualität?"
              />
            </div>

            <div>
              <label className={labelCls}>4 · KI-Ansatz</label>
              <div className="flex items-center gap-2">
                <select {...register('aiApproach')} className={inputCls}>
                  {AI_APPROACHES.map((a) => <option key={a}>{a}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${APPROACH_BG[currentApproach as keyof typeof APPROACH_BG]}`}>
                  {currentApproach.split(' ')[0]}
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>5 · Technische Machbarkeit</label>
              <div className="flex items-center gap-2">
                <select {...register('technicalFeasibility')} className={inputCls}>
                  {FEASIBILITIES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${FEASIBILITY_BG[currentFeas as keyof typeof FEASIBILITY_BG]}`}>
                  {currentFeas}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>6 · Benötigte Teamkompetenzen</label>
              <CompetencySelect
                value={watched.teamCompetencies ?? ''}
                onChange={(v) => setValue('teamCompetencies', v)}
              />
            </div>

            <div>
              <label className={labelCls}>7 · Zeitplan</label>
              <input
                {...register('timeline')}
                className={inputCls}
                placeholder="z.B. 3–6 Monate"
                list="timeline-options"
                autoComplete="off"
              />
              <datalist id="timeline-options">
                {TIMELINE_OPTIONS.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>Startdatum</label>
              <input
                type="date"
                {...register('startDate')}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>8 · Geschätzte Kosten (€k)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min={0}
                  {...register('estimatedCostK', { valueAsNumber: true })}
                  className={`${inputCls} pl-7`}
                  placeholder="z.B. 180"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">k</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>9 · Erwarteter Jahresnutzen (€k/J.)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min={0}
                  {...register('expectedBenefitK', { valueAsNumber: true })}
                  className={`${inputCls} pl-7`}
                  placeholder="z.B. 450"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">k/J.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Portfolio Scoring */}
        <section className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
            Portfolio-Bewertung
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Gewichtetes Modell (Kap. 2.5): Nutzen 40% · Machbarkeit 30% · Strategische Passung 20% · Dringlichkeit 10%
          </p>
          <div className="space-y-3">
            <SliderField label="Geschäftsnutzen"      name="businessImpact" weight="40%" register={register} value={Number(watched.businessImpact ?? 7)} />
            <SliderField label="Machbarkeit"           name="feasibility"    weight="30%" register={register} value={Number(watched.feasibility ?? 7)} />
            <SliderField label="Strategische Passung"  name="strategicFit"   weight="20%" register={register} value={Number(watched.strategicFit ?? 7)} />
            <SliderField label="Dringlichkeit"         name="urgency"        weight="10%" register={register} value={Number(watched.urgency ?? 5)} />
          </div>
        </section>

        {/* Section 5: Privacy & Compliance Checklist */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Datenschutz &amp; Compliance-Checkliste</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Governance</span>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Haken setzen, sobald geprüft. Ergebnisse erscheinen unter Governance → Datenschutz-Checkliste.</p>
          <div className="space-y-3">
            {([
              { key: 'complianceLegal',         label: 'Rechtsgrundlage bestätigt', desc: 'DSGVO-Rechtsgrundlage (Art. 6 / Art. 9) und EU AI Act-Klassifizierung dokumentiert' },
              { key: 'compliancePersonalData',  label: 'Personendaten & Rechtsgrundlage dokumentiert', desc: 'Alle Personendatenflüsse identifiziert, DSFA durchgeführt wenn erforderlich' },
              { key: 'complianceDataMin',       label: 'Datensparsamkeit & Zweckbindung sichergestellt', desc: 'Nur für den angegebenen Zweck unbedingt notwendige Daten werden verarbeitet' },
              { key: 'complianceDocumentation', label: 'Dokumentations- & Nachweispflichten erfüllt', desc: 'Technische Dokumentation, Audit-Trail und Verarbeitungsverzeichnis vorhanden' },
              { key: 'complianceLiability',     label: 'Haftung & Verantwortung definiert', desc: 'Rollen für KI-Owner, DSB und Business-Sponsor dokumentiert und abgezeichnet' },
            ] as { key: string; label: string; desc: string }[]).map(({ key, label, desc }) => {
              const checked = !!(watched[key as keyof typeof watched])
              return (
                <label key={key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    {...register(key as keyof FormData)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                  <div>
                    <p className={`text-sm font-medium ${checked ? 'text-emerald-700' : 'text-slate-700'}`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </section>

        {/* Section 6: Documentation (Step 9) */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dokumentation</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Schritt 9 · 9-Schritte-Framework</span>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Formelle Compliance- und Audit-Dokumentation. Alle Felder optional.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>1 · Ziel & Umfang</label>
              <p className="text-xs text-slate-400 mb-1.5">Wofür wird dieses KI-System eingesetzt? Welche Modelle, Datenquellen und Technologien sind beteiligt?</p>
              <textarea {...register('docGoal')} rows={3} className={textareaCls} placeholder="Beschreibung des KI-Systems, unterstützte Prozesse und Entscheidungen…" />
            </div>

            <div>
              <label className={labelCls}>2 · Datenbasis & Datenflüsse</label>
              <p className="text-xs text-slate-400 mb-1.5">Welche Daten werden verwendet, woher stammen sie und wie werden sie verarbeitet?</p>
              <textarea {...register('docDataBasis')} rows={3} className={textareaCls} placeholder="Datenquellen, Verarbeitungsschritte, Qualitätssicherung…" />
            </div>

            <div>
              <label className={labelCls}>3 · Risikobewertung & Maßnahmen</label>
              <p className="text-xs text-slate-400 mb-1.5">Welche Risiken wurden identifiziert und wie werden sie reduziert oder kontrolliert?</p>
              <textarea {...register('docRiskMitigation')} rows={3} className={textareaCls} placeholder="Identifizierte Risiken, Gegenmaßnahmen, Restrisiko…" />
            </div>

            <div>
              <label className={labelCls}>4 · Erklärbarkeit & Entscheidungslogik</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie können KI-Ergebnisse von Endnutzenden verstanden und interpretiert werden?</p>
              <textarea {...register('docExplainability')} rows={3} className={textareaCls} placeholder="Erklärbarkeitsstrategie, Interpretierbarkeit für Nutzende…" />
            </div>

            <div>
              <label className={labelCls}>5 · Betrieb & Monitoring</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie wird die KI im Betrieb überwacht, gewartet und verbessert?</p>
              <textarea {...register('docOperations')} rows={3} className={textareaCls} placeholder="Monitoring, Wartungsintervalle, Verbesserungszyklus…" />
            </div>

            <div>
              <label className={labelCls}>6 · Compliance & Regulatorischer Nachweis</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie wird die Einhaltung von Gesetzen und internen Richtlinien dokumentiert?</p>
              <textarea {...register('docRegulatory')} rows={3} className={textareaCls} placeholder="Audit-Trail, Nachweisdokumente, verantwortliche Person…" />
            </div>

            <div>
              <label className={labelCls}>7 · Änderungs- & Versionsmanagement</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie werden Änderungen am Modell oder an Daten nachvollziehbar erfasst?</p>
              <textarea {...register('docVersioning')} rows={3} className={textareaCls} placeholder="Versionierung, Änderungsprotokoll, Release-Prozess…" />
            </div>
          </div>
        </section>

        {/* Priority Score — below portfolio scoring */}
        <div className="bg-[#1a2538] rounded-xl p-5 flex items-center gap-6 text-white">
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Prioritätsscore</p>
            <p className={`text-4xl font-bold ${scoreColor(liveScore)}`}>{liveScore}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">/ 10</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(liveScore / 10) * 100}%`,
                  background: liveScore >= 8 ? '#22c55e' : liveScore >= 6 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Nutzen×40% + Machbarkeit×30% + Strateg. Passung×20% + Dringlichkeit×10%
            </p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">3-J. ROI</p>
            <p className={`text-3xl font-bold ${liveROI > 200 ? 'text-green-400' : liveROI > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {liveROI}%
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end gap-2 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {existing ? 'Änderungen speichern' : 'Anwendungsfall erstellen'}
          </button>
        </div>
      </form>

      {/* Print-only canvas layout */}
      {existing && (
        <div className="print-only text-black">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{existing.title}</h1>
            <p className="text-sm text-gray-500">
              {existing.department} · {existing.status} · {existing.aiApproach}
            </p>
          </div>
          <div className="print-canvas-grid grid grid-cols-3 gap-px bg-gray-300 border border-gray-300 text-sm">
            {[
              { label: '1 · Business Problem', value: existing.businessProblem },
              { label: '2 · Success Metrics', value: existing.successMetrics },
              { label: '3 · Data Requirements', value: existing.dataRequirements },
              { label: '4 · AI Approach', value: existing.aiApproach },
              { label: '5 · Technical Feasibility', value: existing.technicalFeasibility },
              { label: '6 · Team Competencies', value: existing.teamCompetencies },
              { label: '7 · Timeline', value: existing.timeline },
              { label: '8 · Estimated Cost', value: `€${existing.estimatedCostK}k` },
              { label: '9 · Expected Annual Benefit', value: `€${existing.expectedBenefitK}k/yr` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white p-3">
                <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide mb-1">{label}</p>
                <p className="text-gray-800">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center border border-gray-300 p-3 text-sm">
            <div><p className="text-gray-400 text-xs">Business Impact</p><p className="text-xl font-bold">{existing.businessImpact}/10</p></div>
            <div><p className="text-gray-400 text-xs">Feasibility</p><p className="text-xl font-bold">{existing.feasibility}/10</p></div>
            <div><p className="text-gray-400 text-xs">Strategic Fit</p><p className="text-xl font-bold">{existing.strategicFit}/10</p></div>
            <div><p className="text-gray-400 text-xs">Priority Score</p><p className="text-xl font-bold">{existing.priorityScore}/10</p></div>
          </div>
        </div>
      )}
    </>
  )
}
