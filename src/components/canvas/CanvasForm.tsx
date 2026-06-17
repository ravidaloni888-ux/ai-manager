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
  const { addUseCase, updateUseCase } = useUseCasesStore()

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
    } else {
      addUseCase(uc)
    }
    navigate('/use-cases')
  }

  const currentStatus = watched.status ?? 'Idea'
  const currentApproach = watched.aiApproach ?? 'Supervised Learning'
  const currentFeas = watched.technicalFeasibility ?? 'Medium'

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
              AI Use Case Canvas — based on the K7.0069 KI-Management methodology
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
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Case Information</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Row 1: Title + Department */}
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className={inputCls}
                placeholder="e.g. Customer Churn Prediction"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <select {...register('department')} className={inputCls}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Row 2: Motivation */}
            <div className="col-span-2">
              <label className={labelCls}>Trigger / Motivation</label>
              <MotivationSelect
                value={watched.motivation ?? ''}
                onChange={(v) => setValue('motivation', v)}
              />
            </div>
            <div />

            {/* Row 3: Stage + Health */}
            <div className="col-span-2">
              <label className={labelCls}>Project Stage</label>
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
              <label className={labelCls}>Health</label>
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
                <label className={labelCls}>Reason for Cancellation</label>
                <textarea
                  {...register('cancellationReason')}
                  rows={2}
                  className={`${textareaCls} border-red-200 focus:ring-red-400`}
                  placeholder="Why was this use case cancelled? (e.g. budget cut, strategic pivot, technical blocker…)"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 2: AI Use Case Canvas */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            AI Use Case Canvas <span className="text-slate-400 font-normal normal-case">(9 elements)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>1 · Business Problem *</label>
              <textarea
                {...register('businessProblem', { required: true })}
                rows={3}
                className={textareaCls}
                placeholder="What specific business problem exists? What does it cost the organisation?"
              />
            </div>

            <div>
              <label className={labelCls}>2 · Success Metrics (KPIs)</label>
              <textarea
                {...register('successMetrics')}
                rows={3}
                className={textareaCls}
                placeholder="How will success be measured? SMART targets."
              />
            </div>

            <div>
              <label className={labelCls}>3 · Data Requirements</label>
              <textarea
                {...register('dataRequirements')}
                rows={3}
                className={textareaCls}
                placeholder="What data is needed? Where does it live? What is the quality?"
              />
            </div>

            <div>
              <label className={labelCls}>4 · AI Approach</label>
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
              <label className={labelCls}>5 · Technical Feasibility</label>
              <div className="flex items-center gap-2">
                <select {...register('technicalFeasibility')} className={inputCls}>
                  {FEASIBILITIES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${FEASIBILITY_BG[currentFeas as keyof typeof FEASIBILITY_BG]}`}>
                  {currentFeas === 'High' ? 'Easily doable' : currentFeas === 'Medium' ? 'Moderate effort' : 'Complex'}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>6 · Team Competencies Needed</label>
              <CompetencySelect
                value={watched.teamCompetencies ?? ''}
                onChange={(v) => setValue('teamCompetencies', v)}
              />
            </div>

            <div>
              <label className={labelCls}>7 · Timeline</label>
              <input
                {...register('timeline')}
                className={inputCls}
                placeholder="e.g. 3–6 Months"
                list="timeline-options"
                autoComplete="off"
              />
              <datalist id="timeline-options">
                {TIMELINE_OPTIONS.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>8 · Estimated Cost (€k)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min={0}
                  {...register('estimatedCostK', { valueAsNumber: true })}
                  className={`${inputCls} pl-7`}
                  placeholder="e.g. 180"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">k</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>9 · Expected Annual Benefit (€k/yr)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min={0}
                  {...register('expectedBenefitK', { valueAsNumber: true })}
                  className={`${inputCls} pl-7`}
                  placeholder="e.g. 450"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">k/yr</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Portfolio Scoring */}
        <section className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
            Portfolio Scoring
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Weighted model (Chapter 2.5): Impact 40% · Feasibility 30% · Strategic Fit 20% · Urgency 10%
          </p>
          <div className="space-y-3">
            <SliderField label="Business Impact" name="businessImpact" weight="40%" register={register} value={Number(watched.businessImpact ?? 7)} />
            <SliderField label="Feasibility"     name="feasibility"    weight="30%" register={register} value={Number(watched.feasibility ?? 7)} />
            <SliderField label="Strategic Fit"   name="strategicFit"   weight="20%" register={register} value={Number(watched.strategicFit ?? 7)} />
            <SliderField label="Urgency"         name="urgency"        weight="10%" register={register} value={Number(watched.urgency ?? 5)} />
          </div>
        </section>

        {/* Section 4: Governance & Compliance */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Governance & Compliance</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>EU AI Act Risikostufe</label>
              <div className="flex items-center gap-2">
                <select {...register('euAiActRisk')} className={inputCls}>
                  {EU_AI_ACT_RISKS.map((r) => <option key={r}>{r}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${EU_AI_ACT_BG[(watched.euAiActRisk ?? 'Minimal Risk') as EuAiActRisk]}`}>
                  {watched.euAiActRisk ?? 'Minimal Risk'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Datenschutz-Checkliste</label>
            <div className="space-y-2">
              {[
                { name: 'complianceLegal',         label: 'Einhaltung gesetzlicher Vorgaben (DSGVO, EU AI Act) geklärt' },
                { name: 'compliancePersonalData',  label: 'Personenbezogene Daten & Rechtsgrundlage dokumentiert' },
                { name: 'complianceDataMin',       label: 'Datenminimierung & Zweckbindung sichergestellt' },
                { name: 'complianceDocumentation', label: 'Dokumentation & Nachweispflichten erfüllt' },
                { name: 'complianceLiability',     label: 'Haftung & Verantwortlichkeit geregelt' },
              ].map((item) => (
                <label key={item.name} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register(item.name as keyof FormData)}
                    className="w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Dokumentation (Step 9) */}
        <section className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dokumentation</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Step 9 · 9-Schritte-Framework</span>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Formale Nachweisdokumentation für Compliance und Audit. Alle Felder optional.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>1 · Zielsetzung & Anwendungsbereich</label>
              <p className="text-xs text-slate-400 mb-1.5">Wofür wird die KI eingesetzt? Welche Modelle, Datenquellen und Technologien kommen zum Einsatz?</p>
              <textarea {...register('docGoal')} rows={3} className={textareaCls} placeholder="Beschreibung des KI-Systems, unterstützte Prozesse und Entscheidungen…" />
            </div>

            <div>
              <label className={labelCls}>2 · Datenbasis & Datenflüsse</label>
              <p className="text-xs text-slate-400 mb-1.5">Welche Daten werden verwendet, woher stammen sie und wie werden sie verarbeitet?</p>
              <textarea {...register('docDataBasis')} rows={3} className={textareaCls} placeholder="Datenquellen, Verarbeitungsschritte, Qualitätssicherung…" />
            </div>

            <div>
              <label className={labelCls}>3 · Risikobewertung & Maßnahmen</label>
              <p className="text-xs text-slate-400 mb-1.5">Welche Risiken wurden identifiziert und wie werden diese reduziert oder kontrolliert?</p>
              <textarea {...register('docRiskMitigation')} rows={3} className={textareaCls} placeholder="Identifizierte Risiken, Gegenmaßnahmen, Restrisiko…" />
            </div>

            <div>
              <label className={labelCls}>4 · Erklärbarkeit & Entscheidungslogik</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie lassen sich Ergebnisse der KI nachvollziehen und interpretieren?</p>
              <textarea {...register('docExplainability')} rows={3} className={textareaCls} placeholder="Erklärbarkeitsansatz, Interpretierbarkeit für Endanwender…" />
            </div>

            <div>
              <label className={labelCls}>5 · Betriebs- & Überwachungskonzept</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie wird die KI im laufenden Betrieb überwacht, gewartet und verbessert?</p>
              <textarea {...register('docOperations')} rows={3} className={textareaCls} placeholder="Monitoring, Wartungsintervalle, Verbesserungszyklus…" />
            </div>

            <div>
              <label className={labelCls}>6 · Compliance & regulatorische Nachweise</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie wird die Einhaltung von Gesetzen und internen Richtlinien dokumentiert?</p>
              <textarea {...register('docRegulatory')} rows={3} className={textareaCls} placeholder="Nachweisführung, Prüfpfade, zuständige Stelle…" />
            </div>

            <div>
              <label className={labelCls}>7 · Änderungs- & Versionsmanagement</label>
              <p className="text-xs text-slate-400 mb-1.5">Wie werden Anpassungen am Modell oder an den Daten nachvollziehbar festgehalten?</p>
              <textarea {...register('docVersioning')} rows={3} className={textareaCls} placeholder="Versionierung, Änderungsprotokoll, Release-Prozess…" />
            </div>
          </div>
        </section>

        {/* Priority Score — below portfolio scoring */}
        <div className="bg-[#1a2538] rounded-xl p-5 flex items-center gap-6 text-white">
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Priority Score</p>
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
              Impact×40% + Feasibility×30% + Strategic Fit×20% + Urgency×10%
            </p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">3-Year ROI</p>
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
            Cancel
          </button>
          <button
            type="submit"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {existing ? 'Save Changes' : 'Create Use Case'}
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
