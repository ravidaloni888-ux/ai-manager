import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import {
  AIUseCase, DEPARTMENTS, STATUSES, AI_APPROACHES, FEASIBILITIES,
  STATUS_BG, APPROACH_BG, FEASIBILITY_BG,
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

function SliderField({
  label, name, description, register, value,
}: {
  label: string
  name: string
  description: string
  register: any
  value: number
}) {
  const pct = ((value - 1) / 9) * 100
  const color = value >= 8 ? '#22c55e' : value >= 6 ? '#f59e0b' : value >= 4 ? '#f97316' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className={labelCls}>{label}</label>
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-[11px] text-slate-400 mb-2">{description}</p>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)` }}
        {...register(name, { valueAsNumber: true })}
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>1 — Low</span><span>10 — High</span>
      </div>
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
    businessProblem: '',
    successMetrics: '',
    dataRequirements: '',
    aiApproach: 'Supervised Learning',
    technicalFeasibility: 'Medium',
    teamCompetencies: '',
    timeline: '',
    estimatedCostK: 100,
    expectedBenefitK: 200,
    businessImpact: 7,
    feasibility: 7,
    strategicFit: 7,
    urgency: 5,
  }

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
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
                className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg"
              >
                🖨️ Print PDF
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
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg"
            >
              {existing ? 'Save Changes' : 'Create Use Case'}
            </button>
          </div>
        </div>

        {/* Live score bar */}
        <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-6 text-white">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Priority Score</p>
            <p className={`text-3xl font-bold ${scoreColor(liveScore)}`}>{liveScore}</p>
            <p className="text-[10px] text-slate-400">/ 10</p>
          </div>
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(liveScore / 10) * 100}%`,
                background: liveScore >= 8 ? '#22c55e' : liveScore >= 6 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">3-Year ROI</p>
            <p className={`text-2xl font-bold ${liveROI > 200 ? 'text-green-400' : liveROI > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {liveROI}%
            </p>
          </div>
          <div className="text-[10px] text-slate-500 max-w-[180px]">
            Score = Impact×40% + Feasibility×30% + Strategic Fit×20% + Urgency×10%
          </div>
        </div>

        {/* Section 1: Basic Info */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Case Information</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 md:col-span-1">
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
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex items-center gap-2">
                <select {...register('status')} className={inputCls}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BG[currentStatus as keyof typeof STATUS_BG]}`}>
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: AI Use Case Canvas */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
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

            <div>
              <label className={labelCls}>6 · Team Competencies Needed</label>
              <input
                {...register('teamCompetencies')}
                className={inputCls}
                placeholder="e.g. Data Scientist, ML Engineer, Business Analyst"
              />
            </div>

            <div>
              <label className={labelCls}>7 · Timeline</label>
              <input
                {...register('timeline')}
                className={inputCls}
                placeholder="e.g. 3-month pilot, 6-month full rollout"
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
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
            Portfolio Scoring
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Weighted model (Chapter 2.5): Impact 40% · Feasibility 30% · Strategic Fit 20% · Urgency 10%
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderField
              label="Business Impact"
              name="businessImpact"
              description="How significant is the value created for the organisation? (weight: 40%)"
              register={register}
              value={Number(watched.businessImpact ?? 7)}
            />
            <SliderField
              label="Feasibility"
              name="feasibility"
              description="How achievable is this given our data, tech, and team? (weight: 30%)"
              register={register}
              value={Number(watched.feasibility ?? 7)}
            />
            <SliderField
              label="Strategic Fit"
              name="strategicFit"
              description="How well does this align with our top strategic priorities? (weight: 20%)"
              register={register}
              value={Number(watched.strategicFit ?? 7)}
            />
            <SliderField
              label="Urgency"
              name="urgency"
              description="How time-sensitive is the opportunity or problem? (weight: 10%)"
              register={register}
              value={Number(watched.urgency ?? 5)}
            />
          </div>
        </section>

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
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg"
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
