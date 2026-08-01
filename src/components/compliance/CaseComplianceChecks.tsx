import { useState, useEffect } from 'react'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'
import { loadCaseChecks, saveCaseChecks } from '../../lib/supabase'
import DataQualityCheck, { EMPTY_DATA_QUALITY } from '../assessments/DataQualityCheck'
import type { DataQualityState } from '../assessments/DataQualityCheck'
import FairCheck, { EMPTY_FAIR } from '../assessments/FairCheck'
import type { FairState } from '../assessments/FairCheck'
import EthicsCheck, { EMPTY_ETHICS } from '../assessments/EthicsCheck'
import RiskClassCheck, { EMPTY_RISK_CLASS, TREE_NODES } from '../assessments/RiskClassCheck'
import type { RiskClassState } from '../assessments/RiskClassCheck'
import type { EthicsState } from '../assessments/EthicsCheck'
import { ProjectPlanContent } from '../../pages/ProjectPlanPage'

// ─────────────────────────────────────────────────────────────────────────
// Datenschutz-Checks je Anwendungsfall.
//
// Diese drei Prüfungen brauchen immer ein konkretes System — welche Daten,
// welcher Anbieter, welche Entscheidungen. Sie gehören deshalb an den
// Anwendungsfall und nicht auf die allgemeine DSGVO-Seite.
// ─────────────────────────────────────────────────────────────────────────

interface AvvState {
  external: boolean | null
  personalData: boolean | null
  avvExists: boolean | null
}

export interface CaseChecks {
  dsfa: Record<string, boolean>
  avv: AvvState
  art22: Record<number, boolean>
  dataQuality: DataQualityState
  fair: FairState
  ethics: EthicsState
  riskClass: RiskClassState
}

export const EMPTY_CHECKS: CaseChecks = {
  dsfa: {},
  avv: { external: null, personalData: null, avvExists: null },
  art22: {},
  dataQuality: EMPTY_DATA_QUALITY,
  fair: EMPTY_FAIR,
  ethics: EMPTY_ETHICS,
  riskClass: EMPTY_RISK_CLASS,
}

// Antworten liegen je Mandant unter einem Schlüssel, darin je Anwendungsfall.
const BUCKET = 'casechecks'

function loadLocal(ucId: string): CaseChecks {
  const all = scopedGet<Record<string, CaseChecks>>(BUCKET, {})
  return { ...EMPTY_CHECKS, ...(all[ucId] ?? {}) }
}

function saveLocal(ucId: string, checks: CaseChecks) {
  const all = scopedGet<Record<string, CaseChecks>>(BUCKET, {})
  scopedSet(BUCKET, { ...all, [ucId]: checks })
}

/** Beim eigenen Haus liegt der Stand in Supabase, bei Kundenmandaten lokal. */
async function loadChecks(ucId: string): Promise<CaseChecks> {
  if (getMandantType() === 'internal') {
    const remote = await loadCaseChecks(ucId)
    if (remote) return { ...EMPTY_CHECKS, ...(remote as Partial<CaseChecks>) }
    // Tabelle fehlt oder noch kein Eintrag — lokaler Stand als Ausgangspunkt
  }
  return loadLocal(ucId)
}

export async function saveChecks(ucId: string, checks: CaseChecks) {
  if (getMandantType() === 'internal') {
    const ok = await saveCaseChecks(ucId, checks)
    if (ok) return
    // Migration noch nicht eingespielt — nicht verlieren, lokal sichern
  }
  saveLocal(ucId, checks)
}

const DSFA_TRIGGERS = [
  { id: 'employees', label: 'Mitarbeiterdaten werden systematisch verarbeitet', risk: true },
  { id: 'profiling', label: 'KI-gestütztes Profiling von Personen findet statt', risk: true },
  { id: 'new', label: 'Das System wird neu eingesetzt (kein geringfügiges Update)', risk: true },
  { id: 'decisions', label: 'Das System trifft oder beeinflusst erhebliche Entscheidungen über Personen', risk: true },
  { id: 'sensitive', label: 'Es werden besondere Kategorien (Gesundheit, Herkunft etc.) verarbeitet', risk: true },
]

const ART22_CHECKS = [
  'Der Mensch erhält alle relevanten Informationen — nicht nur das KI-Ergebnis',
  'Der Mensch kann die Empfehlung der KI tatsächlich überstimmen (kein sozialer/technischer Druck)',
  'Die Entscheidung des Menschen wird dokumentiert — nicht nur das KI-Ergebnis',
  'Es gibt Fälle, in denen Menschen tatsächlich abweichend von der KI entschieden haben',
  'Die Zeit für die menschliche Prüfung ist ausreichend — kein "Fließband-Nicken"',
]

function DsfaChecker({ checked, setChecked }: {
  checked: Record<string, boolean>
  setChecked: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void
}) {
  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const triggersActive = DSFA_TRIGGERS.filter((t) => checked[t.id]).length
  const required = triggersActive >= 1

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">DSFA-Trigger-Check (Art. 35)</p>
            <p className="text-xs text-slate-500">Prüfe ob eine Datenschutz-Folgenabschätzung erforderlich ist</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {DSFA_TRIGGERS.map((trigger) => (
          <label key={trigger.id} className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              checked[trigger.id] ? 'bg-purple-600 border-purple-600' : 'border-slate-300 group-hover:border-purple-400'
            }`} onClick={() => toggle(trigger.id)}>
              {checked[trigger.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700 leading-relaxed" onClick={() => toggle(trigger.id)}>{trigger.label}</span>
          </label>
        ))}
      </div>
      {triggersActive > 0 && (
        <div className={`mx-5 mb-5 px-4 py-3 rounded-lg ${required ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm font-semibold ${required ? 'text-red-700' : 'text-green-700'}`}>
            {required ? '⚠ DSFA erforderlich' : '✓ DSFA wahrscheinlich nicht erforderlich'}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${required ? 'text-red-600' : 'text-green-600'}`}>
            {required
              ? `${triggersActive} Auslöser aktiv. Die DSFA muss VOR dem Systemeinsatz durchgeführt werden. Einbeziehung des DSB empfohlen (Dreistufenmodell Stufe 2).`
              : 'Kein Auslöser aktiv. Beachte: Eine DSFA kann auch bei nicht aufgelisteten Szenarien erforderlich sein.'}
          </p>
        </div>
      )}
    </div>
  )
}

function AvvChecker({ value, onChange }: { value: AvvState; onChange: (next: AvvState) => void }) {
  const { external, personalData, avvExists } = value
  const setExternal     = (v: boolean | null) => onChange({ ...value, external: v })
  const setPersonalData = (v: boolean | null) => onChange({ ...value, personalData: v })
  const setAvvExists    = (v: boolean | null) => onChange({ ...value, avvExists: v })

  const showAvvQuestion = external === true && personalData === true
  const result = showAvvQuestion && avvExists !== null
    ? avvExists
      ? { ok: true, text: 'Rechtmäßig. AVV vorhanden — Voraussetzung für die Verarbeitung ist erfüllt.' }
      : { ok: false, text: 'Rechtswidrig. Ohne AVV ist die gesamte Verarbeitung rechtswidrig — auch bei namhaften Anbietern.' }
    : external === false || personalData === false
      ? { ok: true, text: external === false ? 'Kein externer Anbieter — kein AVV erforderlich.' : 'Keine personenbezogenen Daten — kein AVV erforderlich.' }
      : null

  const reset = () => onChange({ external: null, personalData: null, avvExists: null })

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">AVV-Pflicht-Check (Art. 28)</p>
            <p className="text-xs text-slate-500">Prüfe ob ein Auftragsverarbeitungsvertrag erforderlich ist</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {/* Q1 */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Läuft das KI-System auf Servern eines externen Anbieters?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((v) => (
              <button type="button" key={String(v)} onClick={() => onChange({ external: v, personalData: null, avvExists: null })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${external === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {v ? 'Ja' : 'Nein'}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        {external === true && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Werden dabei personenbezogene Daten verarbeitet?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button type="button" key={String(v)} onClick={() => onChange({ ...value, personalData: v, avvExists: null })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${personalData === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Ja' : 'Nein'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q3 */}
        {showAvvQuestion && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ist ein AVV mit dem Anbieter vorhanden?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button type="button" key={String(v)} onClick={() => setAvvExists(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${avvExists === v ? 'bg-indind-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Ja' : 'Nein'}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`px-4 py-3 rounded-lg ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.ok ? '✓' : '✗'} {result.text}
            </p>
            {!result.ok && (
              <p className="text-xs text-red-600 mt-1">→ AVV umgehend mit dem Anbieter abschließen oder System offline nehmen bis AVV vorliegt.</p>
            )}
            <button type="button" onClick={reset} className="mt-2 text-xs text-slate-500 underline hover:text-slate-700">Neu prüfen</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Art22Checker({ checked, setChecked }: {
  checked: Record<number, boolean>
  setChecked: (fn: (prev: Record<number, boolean>) => Record<number, boolean>) => void
}) {
  const toggle = (i: number) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  const passed = ART22_CHECKS.filter((_, i) => checked[i]).length
  const all = ART22_CHECKS.length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Art. 22 — Human-in-the-Loop-Qualität</p>
              <p className="text-xs text-slate-500">EuGH C-634/21: Formale Kontrolle reicht nicht — der Mensch muss tatsächlich entscheiden</p>
            </div>
          </div>
          {passed > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              passed === all ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {passed}/{all}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Prüfe ob dein Human-in-the-Loop-Prozess der Art. 22-Anforderung genügt:
        </p>
        <div className="space-y-1">
          {ART22_CHECKS.map((check, i) => (
            <label key={i} onClick={() => toggle(i)}
              className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 rounded transition-colors">
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                checked[i] ? 'bg-rose-600 border-rose-600' : 'border-slate-300 group-hover:border-rose-400'
              }`}>
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <p className={`text-xs leading-relaxed transition-colors ${checked[i] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {check}
              </p>
            </label>
          ))}
        </div>
        {passed === all && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700">✓ Alle Punkte erfüllt — Human-in-the-Loop-Prozess sieht gut aus</p>
          </div>
        )}
        {passed > 0 && passed < all && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">⚠ {all - passed} Punkt{all - passed > 1 ? 'e' : ''} noch offen — Prozess überprüfen</p>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-4">Diese Checkliste dient der Orientierung. Bei tatsächlichen Art. 22-Sachverhalten: Dreistufenmodell Stufe 3 → DSB/Anwalt.</p>
      </div>
    </div>
  )
}

/** Alle drei Fall-Checks — einklappbar, Antworten bleiben am Anwendungsfall. */
type GroupKey = 'risiko' | 'datenschutz' | 'qualitaet' | 'fair' | 'ethik' | 'plan'

/** Alle Prüfungen zu einem Anwendungsfall — Antworten bleiben am Fall. */
export default function CaseComplianceChecks({ ucId }: { ucId?: string }) {
  const [openGroup, setOpenGroup] = useState<GroupKey | null>(null)
  const [autoOpened, setAutoOpened] = useState(false)
  const [checks, setChecks] = useState<CaseChecks>(EMPTY_CHECKS)
  const [loaded, setLoaded] = useState(false)

  // Im Demo-Mandanten wird nichts geschrieben, sonst je Mandant + Fall
  const persistent = !!ucId && getMandantType() !== 'demo'

  useEffect(() => {
    let aktiv = true
    setLoaded(false)
    if (!ucId) { setChecks(EMPTY_CHECKS); setLoaded(true); return }
    loadChecks(ucId).then((c) => {
      if (!aktiv) return
      setChecks(c)
      setLoaded(true)
    })
    return () => { aktiv = false }
  }, [ucId])

  // Speichern als Effekt — nicht im Updater, der kann mehrfach laufen
  useEffect(() => {
    if (loaded && persistent && ucId) void saveChecks(ucId, checks)
  }, [checks, loaded, persistent, ucId])

  const dsCount =
    Object.values(checks.dsfa).filter(Boolean).length +
    Object.values(checks.art22).filter(Boolean).length +
    (checks.avv.external !== null ? 1 : 0)
  const dqCount = Object.values(checks.dataQuality.dims).filter((d) => d.rating !== null).length
  const fairCount = Object.values(checks.fair).filter(Boolean).length

  const rcResult = checks.riskClass.done && checks.riskClass.resultId
    ? TREE_NODES[checks.riskClass.resultId].result?.name ?? '' : ''

  // Reihenfolge wie im KI-Programm: erst Datengrundlage, dann Recht, dann Plan.
  const groups: { key: GroupKey; icon: string; title: string; hint: string; status: string; done: boolean }[] = [
    { key: 'qualitaet',   icon: '🧪', title: 'Datenqualität prüfen', hint: 'Sechs Dimensionen — zweckbezogen bewertet', status: dqCount ? `${dqCount}/6 bewertet` : '', done: dqCount === 6 },
    { key: 'fair',        icon: '✅', title: 'FAIR-Check',    hint: 'Auffindbar · Zugänglich · Interoperabel · Wiederverwendbar', status: fairCount ? `${fairCount} erfüllt` : '', done: fairCount === 4 },
    { key: 'risiko',      icon: '⚖️', title: 'EU AI Act — Risikoklasse', hint: '1–3 Fragen bis zur Einstufung', status: rcResult, done: checks.riskClass.done },
    { key: 'datenschutz', icon: '🛡️', title: 'Datenschutz',   hint: 'DSFA-Pflicht · AVV · Art. 22',              status: dsCount ? `${dsCount} beantwortet` : '', done: checks.avv.external !== null && checks.avv.personalData !== null },
    { key: 'ethik',       icon: '🧭', title: 'Ethik',         hint: 'FAST-Bewertung des Vorhabens',              status: checks.ethics.result ? checks.ethics.result.verdict : '', done: !!checks.ethics.result },
    { key: 'plan',        icon: '📋', title: 'To-do-Plan erstellen', hint: 'Compliance-Projektplan aus Profil und Prüfungen', status: '', done: false },
  ]

  const doneCount = groups.filter((g) => g.done).length

  // Beim Laden den ersten offenen Schritt aufklappen — der Wizard führt.
  useEffect(() => {
    if (!loaded || autoOpened) return
    setAutoOpened(true)
    const first = groups.find((g) => !g.done)
    if (first) setOpenGroup(first.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, autoOpened])

  const weiter = (key: GroupKey) => {
    const i = groups.findIndex((g) => g.key === key)
    const next = groups.slice(i + 1).find((g) => !g.done) ?? groups[i + 1]
    setOpenGroup(next ? next.key : null)
  }

  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Fall-Wizard · Prüfungen &amp; Plan</h2>
          <span className="text-[11px] font-semibold text-blue-600 flex-shrink-0">{doneCount}/{groups.length} erledigt</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
               style={{ width: `${Math.round((doneCount / groups.length) * 100)}%` }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {persistent
            ? 'Antworten werden automatisch zu diesem Anwendungsfall gespeichert.'
            : 'Im Demo-Mandanten werden Antworten nicht gespeichert.'}
          {' '}Orientierungshilfe, kein Ersatz für rechtliche Beratung.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {groups.map((g, gi) => {
          const isOpen = openGroup === g.key
          return (
            <div key={g.key}>
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : g.key)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                  g.done ? 'bg-green-500 text-white' : isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {g.done ? '✓' : gi + 1}
                </span>
                <span className="text-base leading-none flex-shrink-0">{g.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{g.title}</p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{g.hint}</p>
                </div>
                {g.status && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    {g.status}
                  </span>
                )}
                <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                     fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 bg-slate-50/50">
                  {g.key === 'risiko' && (
                    <RiskClassCheck
                      value={checks.riskClass}
                      onChange={(fn) => setChecks((prev) => ({ ...prev, riskClass: fn(prev.riskClass) }))}
                    />
                  )}
                  {g.key === 'datenschutz' && (
                    <>
                      <DsfaChecker
                        checked={checks.dsfa}
                        setChecked={(fn) => setChecks((prev) => ({ ...prev, dsfa: fn(prev.dsfa) }))}
                      />
                      <AvvChecker
                        value={checks.avv}
                        onChange={(avv) => setChecks((prev) => ({ ...prev, avv }))}
                      />
                      <Art22Checker
                        checked={checks.art22}
                        setChecked={(fn) => setChecks((prev) => ({ ...prev, art22: fn(prev.art22) }))}
                      />
                    </>
                  )}
                  {g.key === 'qualitaet' && (
                    <DataQualityCheck
                      value={checks.dataQuality}
                      onChange={(fn) => setChecks((prev) => ({ ...prev, dataQuality: fn(prev.dataQuality) }))}
                    />
                  )}
                  {g.key === 'fair' && (
                    <FairCheck
                      value={checks.fair}
                      onChange={(fn) => setChecks((prev) => ({ ...prev, fair: fn(prev.fair) }))}
                    />
                  )}
                  {g.key === 'ethik' && (
                    <EthicsCheck
                      value={checks.ethics}
                      onChange={(fn) => setChecks((prev) => ({ ...prev, ethics: fn(prev.ethics) }))}
                    />
                  )}
                  {g.key === 'plan' && <ProjectPlanContent ucid={ucId ?? null} />}

                  {g.key !== 'plan' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => weiter(g.key)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        {g.done ? 'Weiter →' : 'Später — nächster Schritt →'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
