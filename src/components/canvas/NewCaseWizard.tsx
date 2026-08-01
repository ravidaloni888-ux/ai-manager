import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { AIUseCase, DEPARTMENTS, STATUSES, Department, Status, EuAiActRisk } from '../../types'
import { computePriorityScore } from '../../lib/scoring'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useProfil, useProfilStore } from '../../store/mandantProfil'
import type { Rolle, IsoZiel } from '../../store/mandantProfil'
import RiskClassCheck, { EMPTY_RISK_CLASS, TREE_NODES } from '../assessments/RiskClassCheck'
import type { RiskClassState } from '../assessments/RiskClassCheck'
import { EMPTY_CHECKS, saveChecks } from '../compliance/CaseComplianceChecks'

// ─────────────────────────────────────────────────────────────────────────
// Fall-Anlage-Wizard: fragt beim Anlegen alles ab, was der To-do-Plan
// braucht — Rolle, Risikoklasse, Rahmenfragen, ISO 42001 — statt den
// Nutzer erst später über die Prüfungen zu schicken. Aus den Antworten
// entsteht direkt der Compliance-Projektplan im Fall.
// ─────────────────────────────────────────────────────────────────────────

type WStep = 'basics' | 'rolle' | 'risk' | 'iso' | 'score' | 'summary'
const ORDER: WStep[] = ['basics', 'rolle', 'risk', 'iso', 'score', 'summary']
const STEP_LABEL: Record<WStep, string> = {
  basics: 'Grunddaten',
  rolle: 'Rolle & Rahmen',
  risk: 'Risikoklasse',
  iso: 'ISO 42001',
  score: 'Bewertung',
  summary: 'Anlegen',
}

const RESULT_TO_RISK: Record<string, EuAiActRisk> = {
  r1: 'Unacceptable Risk',
  r2: 'High Risk',
  r3: 'Limited Risk',
  r4: 'Minimal Risk',
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

function JaNein({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            value === v
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {v ? 'Ja' : 'Nein'}
        </button>
      ))}
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={labelCls}>{label}</span>
        <span className="text-xs font-bold text-blue-600">{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  )
}

export default function NewCaseWizard() {
  const navigate = useNavigate()
  const addUseCase = useUseCasesStore((s) => s.addUseCase)
  const profil = useProfil()
  const setProfil = useProfilStore((p) => p.set)

  const [step, setStep] = useState<WStep>('basics')
  const [saving, setSaving] = useState(false)

  // Grunddaten
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState<Department>('IT')
  const [status, setStatus] = useState<Status>('Idea')
  const [problem, setProblem] = useState('')

  // Rolle & Rahmen
  const [rolle, setRolle] = useState<Rolle | null>(profil.rolle ?? null)
  const [personalData, setPersonalData] = useState<boolean | null>(null)
  const [externalProvider, setExternalProvider] = useState<boolean | null>(null)
  const [hrContext, setHrContext] = useState<boolean | null>(null)

  // Risikoklasse
  const [riskClass, setRiskClass] = useState<RiskClassState>(EMPTY_RISK_CLASS)

  // ISO 42001
  const [iso, setIso] = useState<IsoZiel | null>(profil.iso42001 ?? null)

  // Bewertung
  const [businessImpact, setBusinessImpact] = useState(5)
  const [feasibility, setFeasibility] = useState(5)
  const [strategicFit, setStrategicFit] = useState(5)
  const [urgency, setUrgency] = useState(5)

  const idx = ORDER.indexOf(step)
  const euRisk: EuAiActRisk | undefined = riskClass.resultId ? RESULT_TO_RISK[riskClass.resultId] : undefined
  const riskResult = riskClass.resultId ? TREE_NODES[riskClass.resultId].result : null

  const kannWeiter: Record<WStep, boolean> = {
    basics: title.trim().length > 0,
    rolle: rolle !== null && personalData !== null && externalProvider !== null && hrContext !== null,
    risk: riskClass.done,
    iso: iso !== null,
    score: true,
    summary: true,
  }

  const anlegen = async () => {
    if (saving) return
    setSaving(true)

    // Neu beantwortete Firmenfragen wandern ins Mandanten-Profil
    if (profil.rolle === undefined && rolle) setProfil({ rolle })
    if (profil.iso42001 === undefined && iso) setProfil({ iso42001: iso })

    const now = new Date().toISOString()
    const uc: AIUseCase = {
      id: nanoid(),
      title: title.trim(),
      department,
      status,
      businessProblem: problem.trim(),
      successMetrics: '',
      dataRequirements: '',
      aiApproach: 'Generative AI',
      technicalFeasibility: 'Medium',
      teamCompetencies: '',
      timeline: '3–6 Months',
      estimatedCostK: 0,
      expectedBenefitK: 0,
      businessImpact,
      feasibility,
      strategicFit,
      urgency,
      priorityScore: computePriorityScore(businessImpact, feasibility, strategicFit, urgency),
      euAiActRisk: euRisk,
      compliancePersonalData: personalData ?? undefined,
      createdAt: now,
      updatedAt: now,
    }
    addUseCase(uc)

    // Antworten als Fall-Prüfungen sichern, damit der Plan sie vorbelegt
    await saveChecks(uc.id, {
      ...EMPTY_CHECKS,
      riskClass,
      avv: { external: externalProvider, personalData, avvExists: null },
      dsfa: hrContext !== null ? { employees: hrContext } : {},
    })

    navigate(`/canvas/${uc.id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Neuen Anwendungsfall anlegen</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Sechs kurze Schritte — aus Ihren Antworten entsteht direkt der To-do-Plan für diesen Fall.
        </p>
      </div>

      {/* Schritt-Leiste */}
      <div className="flex items-center gap-1 flex-wrap">
        {ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              type="button"
              disabled={i > idx}
              onClick={() => i < idx && setStep(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                s === step ? 'bg-blue-600 text-white'
                : i < idx ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{i < idx ? '✓' : i + 1}</span>
              {STEP_LABEL[s]}
            </button>
            {i < ORDER.length - 1 && <span className="text-slate-300 text-xs">·</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        {step === 'basics' && (
          <>
            <div>
              <label className={labelCls}>Titel *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Chatbot für den Kundenservice" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Abteilung</label>
                <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Welches Problem soll gelöst werden?</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Kurz beschreiben, was heute schlecht läuft und was das System verbessern soll." />
            </div>
          </>
        )}

        {step === 'rolle' && (
          <>
            <div>
              <label className={labelCls}>Welche Rolle nimmt Ihr Haus bei diesem System ein?</label>
              <p className="text-[11px] text-slate-400 mb-2">
                Anbieter entwickeln oder vertreiben das System unter eigenem Namen; Betreiber setzen es nur ein.
                Händler und Importeure haben eigene, schmalere Pflichten — im Zweifel wie Betreiber starten.
              </p>
              <div className="flex gap-2">
                {([['betreiber', 'Betreiber — wir setzen es ein'], ['anbieter', 'Anbieter — wir entwickeln/vertreiben es']] as [Rolle, string][]).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setRolle(v)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                      rolle === v ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
              {profil.rolle === undefined && rolle && (
                <p className="text-[11px] text-slate-400 mt-1.5">Wird als Standard für dieses Mandat gemerkt.</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Werden personenbezogene Daten verarbeitet?</label>
              <p className="text-[11px] text-slate-400 mb-2">Namen, E-Mails, Mitarbeiter- oder Kundendaten, IP-Adressen.</p>
              <JaNein value={personalData} onChange={setPersonalData} />
            </div>
            <div>
              <label className={labelCls}>Kommt ein externer Anbieter zum Einsatz (Cloud/API)?</label>
              <JaNein value={externalProvider} onChange={setExternalProvider} />
            </div>
            <div>
              <label className={labelCls}>Wird das System im HR-Kontext eingesetzt?</label>
              <p className="text-[11px] text-slate-400 mb-2">Bewerbung, Leistungsbewertung, Personalentscheidungen — dann greifen §26 BDSG und meist die DSFA-Pflicht.</p>
              <JaNein value={hrContext} onChange={setHrContext} />
            </div>
          </>
        )}

        {step === 'risk' && (
          <RiskClassCheck value={riskClass} onChange={(fn) => setRiskClass(fn)} />
        )}

        {step === 'iso' && (
          <>
            <div>
              <label className={labelCls}>Strebt das Unternehmen eine ISO-42001-Zertifizierung an?</label>
              <p className="text-[11px] text-slate-400 mb-2">
                Das ist eine Entscheidung je Firma, nicht je Fall. Bei „Ja“ nimmt der Plan die AIMS-Vorgaben
                (Managementsystem, interne Audits, Managementbewertung) als Aufgaben mit auf.
              </p>
              <div className="flex gap-2">
                {([['ja', 'Ja'], ['nein', 'Nein'], ['spaeter', 'Später entscheiden']] as [IsoZiel, string][]).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setIso(v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      iso === v ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
              {profil.iso42001 !== undefined && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Aus dem Mandanten-Profil vorbelegt — hier ändern wirkt nur, wenn das Profil noch leer war.
                </p>
              )}
            </div>
          </>
        )}

        {step === 'score' && (
          <>
            <p className="text-xs text-slate-500">
              Grobe Ersteinschätzung für das Prioritätsranking — lässt sich später im Canvas verfeinern.
            </p>
            <Slider label="Geschäftsnutzen" value={businessImpact} onChange={setBusinessImpact} />
            <Slider label="Machbarkeit" value={feasibility} onChange={setFeasibility} />
            <Slider label="Strategische Passung" value={strategicFit} onChange={setStrategicFit} />
            <Slider label="Dringlichkeit" value={urgency} onChange={setUrgency} />
            <p className="text-sm text-slate-600">
              Prioritätsscore: <strong className="text-blue-600">{computePriorityScore(businessImpact, feasibility, strategicFit, urgency)}</strong>
            </p>
          </>
        )}

        {step === 'summary' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">{title || '—'}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
              <p><span className="text-slate-400">Abteilung:</span> {department}</p>
              <p><span className="text-slate-400">Status:</span> {status}</p>
              <p><span className="text-slate-400">Rolle:</span> {rolle === 'anbieter' ? 'Anbieter' : 'Betreiber'}</p>
              <p><span className="text-slate-400">Risikoklasse:</span> {riskResult ? riskResult.name : '—'}</p>
              <p><span className="text-slate-400">Personendaten:</span> {personalData ? 'Ja' : 'Nein'}</p>
              <p><span className="text-slate-400">Externer Anbieter:</span> {externalProvider ? 'Ja' : 'Nein'}</p>
              <p><span className="text-slate-400">HR-Kontext:</span> {hrContext ? 'Ja' : 'Nein'}</p>
              <p><span className="text-slate-400">ISO 42001:</span> {iso === 'ja' ? 'Ja' : iso === 'nein' ? 'Nein' : 'Später'}</p>
            </div>
            {euRisk === 'Unacceptable Risk' && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Achtung: Nach Ihren Antworten fällt das System unter die verbotenen Praktiken (Art. 5).
                Der Fall wird angelegt, damit die Entscheidung dokumentiert ist — umsetzen dürfen Sie ihn so nicht.
              </p>
            )}
            <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Beim Anlegen entsteht aus diesen Antworten automatisch der Compliance-Projektplan mit allen To-dos —
              Sie landen direkt im Fall.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (idx > 0 ? setStep(ORDER[idx - 1]) : navigate('/use-cases'))}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2"
        >
          ← {idx > 0 ? 'Zurück' : 'Abbrechen'}
        </button>
        <div className="ml-auto">
          {step !== 'summary' ? (
            <button
              type="button"
              disabled={!kannWeiter[step]}
              onClick={() => setStep(ORDER[idx + 1])}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Weiter →
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void anlegen()}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:bg-slate-300 transition-colors"
            >
              {saving ? 'Wird angelegt…' : 'Fall anlegen & To-do-Plan erzeugen ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
