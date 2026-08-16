import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'
import { loadCaseChecks, saveCaseChecks } from '../../lib/supabase'
import DataQualityCheck, { EMPTY_DATA_QUALITY, QUALITY_DIMENSIONS } from '../assessments/DataQualityCheck'
import type { DataQualityState } from '../assessments/DataQualityCheck'
import { EMPTY_FAIR } from '../../lib/fair'
import type { FairState } from '../../lib/fair'
import EthicsCheck, { EMPTY_ETHICS } from '../assessments/EthicsCheck'
import RiskClassCheck, { EMPTY_RISK_CLASS, resultName, riskFromResult } from '../assessments/RiskClassCheck'
import FairAnsicht from '../assessments/FairAnsicht'
import DatenverfuegbarkeitCheck, { EMPTY_VERFUEGBARKEIT, VERFUEGBARKEIT_FRAGEN } from '../assessments/DatenverfuegbarkeitCheck'
import type { VerfuegbarkeitState } from '../assessments/DatenverfuegbarkeitCheck'
import type { RiskClassState } from '../assessments/RiskClassCheck'
import type { EthicsState } from '../assessments/EthicsCheck'
import { fallStand, gateStand } from '../../lib/fallstand'
import { ProjectPlanContent } from '../../pages/ProjectPlanPage'
import { Sektion, StandZahl } from '../ui/Sektion'
import { Pruefblock, Frage, Wahl, Fazit, JA_NEIN, TON, Sprungleiste } from '../ui/Pruefung'
import type { WahlOption, Ton, SprungPunkt, SprungSchritt } from '../ui/Pruefung'

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
  verfuegbarkeit: VerfuegbarkeitState
  dsfa: Record<string, boolean>
  avv: AvvState
  art22: Record<number, boolean>
  dataQuality: DataQualityState
  fair: FairState
  ethics: EthicsState
  riskClass: RiskClassState
}

export const EMPTY_CHECKS: CaseChecks = {
  verfuegbarkeit: EMPTY_VERFUEGBARKEIT,
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

// „kurz" ist der Name in der Sprungleiste — der volle Satz passt dort nicht.
export const DSFA_TRIGGERS = [
  { id: 'employees',  kurz: 'Mitarbeiterdaten',     label: 'Mitarbeiterdaten werden systematisch verarbeitet' },
  { id: 'profiling',  kurz: 'Profiling',            label: 'KI-gestütztes Profiling von Personen findet statt' },
  { id: 'new',        kurz: 'Neueinsatz',           label: 'Das System wird neu eingesetzt (kein geringfügiges Update)' },
  { id: 'decisions',  kurz: 'Entscheidungen',       label: 'Das System trifft oder beeinflusst erhebliche Entscheidungen über Personen' },
  { id: 'sensitive',  kurz: 'Besondere Kategorien', label: 'Es werden besondere Kategorien (Gesundheit, Herkunft etc.) verarbeitet' },
]

export const ART22_CHECKS = [
  { kurz: 'Information',      text: 'Der Mensch erhält alle relevanten Informationen — nicht nur das KI-Ergebnis' },
  { kurz: 'Überstimmbarkeit', text: 'Der Mensch kann die Empfehlung der KI tatsächlich überstimmen (kein sozialer/technischer Druck)' },
  { kurz: 'Dokumentation',    text: 'Die Entscheidung des Menschen wird dokumentiert — nicht nur das KI-Ergebnis' },
  { kurz: 'Abweichungen',     text: 'Es gibt Fälle, in denen Menschen tatsächlich abweichend von der KI entschieden haben' },
  { kurz: 'Prüfzeit',         text: 'Die Zeit für die menschliche Prüfung ist ausreichend — kein "Fließband-Nicken"' },
]

/** Trifft zu / trifft nicht zu — dieselbe Wahl in allen Prüfungen. */
const ZUTREFFEND: WahlOption<boolean>[] = [
  { wert: true,  label: 'Trifft zu',       ton: 'warn' },
  { wert: false, label: 'Trifft nicht zu', ton: 'ok' },
]

function DsfaChecker({ checked, setChecked }: {
  checked: Record<string, boolean>
  setChecked: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void
}) {
  const setzen = (id: string, v: boolean) => setChecked((prev) => ({ ...prev, [id]: v }))
  const triggersActive = DSFA_TRIGGERS.filter((t) => checked[t.id]).length
  const beantwortet = DSFA_TRIGGERS.filter((t) => checked[t.id] !== undefined).length
  const required = triggersActive >= 1

  return (
    <Pruefblock
      titel="DSFA-Pflicht (Art. 35)"
      hinweis="Ein einziger Auslöser genügt — dann ist die Folgenabschätzung vor dem Einsatz fällig."
      stand={<span className="text-[11px] text-slate-400 flex-shrink-0">{beantwortet}/{DSFA_TRIGGERS.length}</span>}
    >
      {DSFA_TRIGGERS.map((t, i) => (
        <Frage
          key={t.id}
          id={`dsfa-${t.id}`}
          nr={i + 1}
          text={t.label}
          ton={checked[t.id] === undefined ? null : checked[t.id] ? 'warn' : 'ok'}
        >
          <Wahl optionen={ZUTREFFEND} wert={checked[t.id]} onWaehle={(v) => setzen(t.id, v)} />
        </Frage>
      ))}

      {(triggersActive > 0 || beantwortet === DSFA_TRIGGERS.length) && (
        required ? (
          <Fazit ton="stopp" titel="DSFA erforderlich">
            {triggersActive} Auslöser {triggersActive > 1 ? 'treffen' : 'trifft'} zu. Die DSFA muss vor
            dem Systemeinsatz durchgeführt werden. Einbeziehung des DSB empfohlen
            (Dreistufenmodell Stufe 2).
          </Fazit>
        ) : (
          <Fazit ton="ok" titel="DSFA wahrscheinlich nicht erforderlich">
            Kein Auslöser trifft zu. Beachten Sie: Eine DSFA kann auch bei hier nicht aufgeführten
            Szenarien erforderlich sein.
          </Fazit>
        )
      )}
    </Pruefblock>
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
  const beantwortet = [external, personalData, avvExists].filter((v) => v !== null).length

  return (
    <Pruefblock
      titel="AVV-Pflicht (Art. 28)"
      hinweis="Drei Fragen, die sich nacheinander öffnen — mehr braucht die Entscheidung nicht."
      aktion={beantwortet > 0
        ? <button type="button" onClick={reset} className="text-[11px] text-slate-400 hover:text-slate-600 underline flex-shrink-0">Neu prüfen</button>
        : undefined}
    >
      <Frage
        id="avv-external"
        nr={1}
        text="Läuft das KI-System auf Servern eines externen Anbieters?"
        ton={external === null ? null : 'neutral'}
      >
        <Wahl optionen={JA_NEIN} wert={external} onWaehle={(v) => onChange({ external: v, personalData: null, avvExists: null })} />
      </Frage>

      {external === true && (
        <Frage
          id="avv-personalData"
          nr={2}
          text="Werden dabei personenbezogene Daten verarbeitet?"
          ton={personalData === null ? null : 'neutral'}
        >
          <Wahl optionen={JA_NEIN} wert={personalData} onWaehle={(v) => onChange({ ...value, personalData: v, avvExists: null })} />
        </Frage>
      )}

      {showAvvQuestion && (
        <Frage
          id="avv-avvExists"
          nr={3}
          text="Ist ein AVV mit dem Anbieter vorhanden?"
          ton={avvExists === null ? null : avvExists ? 'ok' : 'stopp'}
        >
          <Wahl optionen={JA_NEIN} wert={avvExists} onWaehle={setAvvExists} />
        </Frage>
      )}

      {result && (
        <Fazit ton={result.ok ? 'ok' : 'stopp'} titel={result.text}>
          {!result.ok && 'AVV umgehend mit dem Anbieter abschließen oder das System offline nehmen, bis er vorliegt.'}
        </Fazit>
      )}
    </Pruefblock>
  )
}

/** Erfüllt / nicht erfüllt — für Anforderungen, die man nachweisen muss. */
const ERFUELLT: WahlOption<boolean>[] = [
  { wert: true,  label: 'Erfüllt',       ton: 'ok' },
  { wert: false, label: 'Nicht erfüllt', ton: 'stopp' },
]

function Art22Checker({ checked, setChecked }: {
  checked: Record<number, boolean>
  setChecked: (fn: (prev: Record<number, boolean>) => Record<number, boolean>) => void
}) {
  const setzen = (i: number, v: boolean) => setChecked((prev) => ({ ...prev, [i]: v }))
  const passed = ART22_CHECKS.filter((_, i) => checked[i]).length
  const beantwortet = ART22_CHECKS.filter((_, i) => checked[i] !== undefined).length
  const all = ART22_CHECKS.length

  return (
    <Pruefblock
      titel="Art. 22 — Qualität der menschlichen Aufsicht"
      hinweis="EuGH C-634/21: Formale Kontrolle reicht nicht — der Mensch muss tatsächlich entscheiden können."
      stand={<span className="text-[11px] text-slate-400 flex-shrink-0">{beantwortet}/{all}</span>}
    >
      {ART22_CHECKS.map((check, i) => (
        <Frage
          key={i}
          id={`art22-${i}`}
          nr={i + 1}
          text={check.text}
          ton={checked[i] === undefined ? null : checked[i] ? 'ok' : 'stopp'}
        >
          <Wahl optionen={ERFUELLT} wert={checked[i]} onWaehle={(v) => setzen(i, v)} />
        </Frage>
      ))}

      {beantwortet === all && (
        passed === all ? (
          <Fazit ton="ok" titel="Alle Punkte erfüllt">
            Der Human-in-the-Loop-Prozess genügt den Anforderungen aus Art. 22.
          </Fazit>
        ) : (
          <Fazit ton="stopp" titel={`${all - passed} Punkt${all - passed > 1 ? 'e' : ''} nicht erfüllt`}>
            Der Prozess hält der Art.-22-Anforderung so nicht stand — die offenen Punkte gehören
            behoben, bevor das System entscheidet.
          </Fazit>
        )
      )}

      <p className="text-[10px] text-slate-400">
        Orientierungshilfe. Bei tatsächlichen Art.-22-Sachverhalten: Dreistufenmodell Stufe 3 → DSB/Anwalt.
      </p>
    </Pruefblock>
  )
}

/** Alle drei Fall-Checks — einklappbar, Antworten bleiben am Anwendungsfall. */
export type GroupKey = 'datengrundlage' | 'risiko' | 'datenschutz' | 'ethik' | 'plan'

const GROUP_KEYS: GroupKey[] = ['datengrundlage', 'risiko', 'datenschutz', 'ethik', 'plan']

/** Alte Deep-Links zeigten auf die drei getrennten Datenprüfungen. */
const ALTE_KEYS: Record<string, GroupKey> = {
  verfuegbarkeit: 'datengrundlage', qualitaet: 'datengrundlage', fair: 'datengrundlage',
}

/** Alle Prüfungen zu einem Anwendungsfall — Antworten bleiben am Fall. */
export default function CaseComplianceChecks(
  { ucId, onChecks, offen = true, onToggle }:
  { ucId?: string; onChecks?: (c: CaseChecks) => void; offen?: boolean; onToggle?: () => void },
) {
  const [params] = useSearchParams()
  const gewuenscht = params.get('check') as GroupKey | null
  const aufgeloest = gewuenscht ? ALTE_KEYS[gewuenscht] ?? gewuenscht : null
  const vorgewaehlt = aufgeloest && GROUP_KEYS.includes(aufgeloest) ? aufgeloest : null

  const [openGroup, setOpenGroup] = useState<GroupKey | null>(vorgewaehlt)
  // Kommt der Nutzer aus dem geführten Modus, ist die Gruppe schon gesetzt —
  // dann nicht noch einmal automatisch auf den ersten offenen Schritt springen.
  const [autoOpened, setAutoOpened] = useState(!!vorgewaehlt)
  const [checks, setChecks] = useState<CaseChecks>(EMPTY_CHECKS)
  const [loaded, setLoaded] = useState(false)

  // Der Param kann sich ändern, ohne dass die Komponente neu aufgebaut wird —
  // etwa beim Sprung aus den Nachweisen darunter. Der Startwert allein genügt
  // deshalb nicht.
  useEffect(() => {
    if (vorgewaehlt) { setOpenGroup(vorgewaehlt); setAutoOpened(true) }
  }, [vorgewaehlt])

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

  // Die Bewertung oben leitet ihre Machbarkeit aus diesen Antworten ab
  useEffect(() => {
    if (loaded) onChecks?.(checks)
  }, [checks, loaded, onChecks])

  // Der Stand je Schritt wird in lib/fallstand.ts berechnet — dieselbe
  // Funktion nutzt die Signalableitung, damit beide dasselbe behaupten.
  const groups = fallStand(checks)
  const { offen: gateOffen, beantwortet: dgCount } = gateStand(checks)
  const gateAntworten = checks.verfuegbarkeit?.antworten ?? {}

  const doneCount = groups.filter((g) => g.done).length

  // Sprungziele je Schritt — nur dort, wo die Fragen unabhängig voneinander
  // sind. Die Risikoklasse ist ein Baum: die nächste Frage ergibt sich erst
  // aus der vorigen, es gibt also nichts, zu dem man vorgreifen könnte.
  const punkteDatengrundlage: SprungPunkt[] = [
    ...VERFUEGBARKEIT_FRAGEN.map((f) => ({
      id: `gate-${f.id}`, label: f.titel, erledigt: !!gateAntworten[f.id],
    })),
    ...(gateOffen !== false ? QUALITY_DIMENSIONS.map((d) => ({
      id: `dim-${d.key}`, label: d.title, erledigt: checks.dataQuality.dims[d.key]?.rating !== null,
    })) : []),
  ]

  const punkteDatenschutz: SprungPunkt[] = [
    ...DSFA_TRIGGERS.map((t) => ({ id: `dsfa-${t.id}`, label: t.kurz, erledigt: checks.dsfa[t.id] !== undefined })),
    { id: 'avv-external', label: 'AVV · Anbieter', erledigt: checks.avv.external !== null },
    ...(checks.avv.external === true
      ? [{ id: 'avv-personalData', label: 'AVV · Personendaten', erledigt: checks.avv.personalData !== null }]
      : []),
    ...(checks.avv.external === true && checks.avv.personalData === true
      ? [{ id: 'avv-avvExists', label: 'AVV · vorhanden?', erledigt: checks.avv.avvExists !== null }]
      : []),
    ...ART22_CHECKS.map((c, i) => ({ id: `art22-${i}`, label: `Art. 22 · ${c.kurz}`, erledigt: checks.art22[i] !== undefined })),
  ]

  const punkteFuer = (key: GroupKey): SprungPunkt[] =>
    key === 'datengrundlage' ? punkteDatengrundlage : key === 'datenschutz' ? punkteDatenschutz : []

  const sprungSchritte: SprungSchritt[] = groups.map((g, i) => ({
    key: g.key,
    nr: i + 1,
    label: g.title,
    erledigt: g.done,
    ton: g.ton,
    offen: openGroup === g.key,
    punkte: punkteFuer(g.key),
  }))

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

  /** Schritt öffnen und dorthin scrollen — auch wenn ein anderer, langer
   *  Schritt gerade offen ist und den Rest der Liste nach unten schiebt. */
  const springeZuSchritt = (key: GroupKey) => {
    setOpenGroup(key)
    setTimeout(() => document.getElementById(`schritt-${key}`)?.scrollIntoView({ block: 'start' }), 60)
  }

  return (
    <Sektion
      id="fall-wizard"
      nummer={4}
      titel="Prüfungen & Plan" zusatz="· 5 Schritte"
      offen={offen}
      onToggle={onToggle ?? (() => {})}
      stand={<StandZahl ist={doneCount} soll={groups.length} />}
    >
      <div className="-mx-5 -mt-4">
        <div className="px-5 pb-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

      <div className="flex items-start gap-4 border-t border-slate-100 pr-5">
      <div className="min-w-0 flex-1 divide-y divide-slate-100">
        {groups.map((g, gi) => {
          const isOpen = openGroup === g.key
          return (
            <div key={g.key} id={`schritt-${g.key}`} className="scroll-mt-2">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : g.key)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                {/* Runde Nummer = Schritt. Die Sektion darüber hat eine eckige.
                    Abgeschlossen ist nicht dasselbe wie in Ordnung — ein K.-o.
                    beendet den Schritt, verdient aber kein grünes Häkchen. */}
                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                  g.done ? (g.ton === 'stopp' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white')
                  : isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {g.done ? '✓' : gi + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{g.title}</p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{g.hint}</p>
                </div>
                {g.status && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TON[g.ton].flaeche} ${TON[g.ton].schrift}`}>
                    {g.status}
                  </span>
                )}
                <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                     fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 bg-slate-50/50">
                  <div className="space-y-4">
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
                    {g.key === 'datengrundlage' && (
                      <>
                        <DatenverfuegbarkeitCheck
                          value={checks.verfuegbarkeit ?? EMPTY_VERFUEGBARKEIT}
                          onChange={(fn) => setChecks((prev) => ({ ...prev, verfuegbarkeit: fn(prev.verfuegbarkeit ?? EMPTY_VERFUEGBARKEIT) }))}
                        />

                        {/* Das Gate hat oben schon Alarm geschlagen — hier steht
                            nur noch, warum das Qualitätswerkzeug fehlt. */}
                        {gateOffen === false ? (
                          <Fazit ton="neutral" titel="Detailprüfung ausgesetzt">
                            Ob die vorhandenen Daten sauber sind, ändert am Ergebnis oben nichts —
                            erst muss die Grundlage geklärt werden.
                          </Fazit>
                        ) : (
                          <DataQualityCheck
                            value={checks.dataQuality}
                            onChange={(fn) => setChecks((prev) => ({ ...prev, dataQuality: fn(prev.dataQuality) }))}
                          />
                        )}

                        <FairAnsicht v={checks.verfuegbarkeit} q={checks.dataQuality} />
                      </>
                    )}
                    {g.key === 'ethik' && (
                      <EthicsCheck
                        value={checks.ethics}
                        onChange={(fn) => setChecks((prev) => ({ ...prev, ethics: fn(prev.ethics) }))}
                      />
                    )}
                    {g.key === 'plan' && <ProjectPlanContent ucid={ucId ?? null} />}
                  </div>

                  {g.key !== 'plan' && (
                    <div className="flex justify-end pt-4">
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

        <Sprungleiste
          schritte={sprungSchritte}
          aufSchritt={(k) => springeZuSchritt(k as GroupKey)}
        />
      </div>
      </div>
    </Sektion>
  )
}
