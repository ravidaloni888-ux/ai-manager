import type { CaseChecks, GroupKey } from '../components/compliance/CaseComplianceChecks'
import { VERFUEGBARKEIT_FRAGEN } from '../components/assessments/DatenverfuegbarkeitCheck'
import { resultName, riskFromResult } from '../components/assessments/RiskClassCheck'
import type { Ton } from '../components/ui/Pruefung'

// ─────────────────────────────────────────────────────────────────────────
// Der Stand der Prüfschritte eines Falls.
//
// Diese Berechnung stand vorher im Fall-Wizard selbst. Sie liegt hier,
// weil sie an zwei Stellen gebraucht wird: im Wizard, der sie anzeigt,
// und in der Signalableitung, die fallübergreifend zählt. Zweimal
// geschrieben würden beide irgendwann Verschiedenes behaupten.
//
// Reine Funktion — sie liest nur aus checks und schreibt nichts.
// ─────────────────────────────────────────────────────────────────────────

export interface GruppenStand {
  key: GroupKey
  title: string
  hint: string
  status: string
  ton: Ton
  done: boolean
}

/** Wie weit ist das Gate der Datengrundlage — null heisst: noch nicht fertig beantwortet. */
export function gateStand(checks: CaseChecks): { offen: boolean | null; beantwortet: number } {
  const antworten = checks.verfuegbarkeit?.antworten ?? {}
  const beantwortet = VERFUEGBARKEIT_FRAGEN.filter((f) => antworten[f.id]).length
  const offen: boolean | null =
    beantwortet < VERFUEGBARKEIT_FRAGEN.length ? null
      : !VERFUEGBARKEIT_FRAGEN.some((f) => f.hart && antworten[f.id] === 'nein')
  return { offen, beantwortet }
}

export function fallStand(checks: CaseChecks): GruppenStand[] {
  // Beantwortet zählt, nicht bejaht — ein „Nein" ist auch eine Antwort
  const dsCount =
    Object.keys(checks.dsfa).length +
    Object.keys(checks.art22).length +
    [checks.avv.external, checks.avv.personalData, checks.avv.avvExists].filter((v) => v !== null).length
  const dqCount = Object.values(checks.dataQuality.dims).filter((d) => d.rating !== null).length
  const { offen: gateOffen, beantwortet: dgCount } = gateStand(checks)

  // Nie direkt in TREE_NODES greifen — gespeicherte Stände können IDs aus
  // einer älteren Baumversion enthalten.
  const rcResult = checks.riskClass.done ? resultName(checks.riskClass.resultId) : ''
  const rcStufe = riskFromResult(checks.riskClass.resultId)

  // Reihenfolge wie im KI-Programm: erst Datengrundlage, dann Recht, dann Plan.
  return [
    { key: 'datengrundlage', title: 'Datengrundlage',
      hint: `Erst das Gate aus ${VERFUEGBARKEIT_FRAGEN.length} Fragen, dann die sieben Qualitätsdimensionen`,
      status: gateOffen === null ? (dgCount ? `${dgCount}/${VERFUEGBARKEIT_FRAGEN.length} im Gate` : '')
        : gateOffen === false ? 'K.-o. — gestoppt'
        : dqCount ? `${dqCount}/7 bewertet` : 'Gate steht',
      ton: gateOffen === false ? 'stopp' : gateOffen === true && dqCount === 7 ? 'ok' : 'neutral',
      done: gateOffen === false || (gateOffen === true && dqCount === 7) },
    { key: 'risiko', title: 'EU AI Act — Risikoklasse',
      hint: 'Prüfpfad der Verordnung — meist 3–5 Fragen',
      status: rcResult,
      ton: rcStufe === 'Unacceptable Risk' ? 'stopp' : rcStufe === 'High Risk' ? 'warn' : rcStufe ? 'ok' : 'neutral',
      done: checks.riskClass.done },
    { key: 'datenschutz', title: 'Datenschutz',
      hint: 'DSFA-Pflicht · AVV · Art. 22',
      status: dsCount ? `${dsCount} beantwortet` : '',
      ton: 'neutral',
      done: checks.avv.external !== null && checks.avv.personalData !== null },
    { key: 'ethik', title: 'Ethik',
      hint: 'FAST-Bewertung des Vorhabens',
      status: checks.ethics.result ? checks.ethics.result.verdict : '',
      ton: checks.ethics.result?.verdict === 'JA' ? 'stopp'
        : checks.ethics.result?.verdict === 'UNKLAR' ? 'teils'
        : checks.ethics.result ? 'ok' : 'neutral',
      done: !!checks.ethics.result },
    { key: 'plan', title: 'To-do-Plan erstellen',
      hint: 'Compliance-Projektplan aus Profil und Prüfungen',
      status: '', ton: 'neutral', done: false },
  ]
}
