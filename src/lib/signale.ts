import type { AIUseCase } from '../types'
import { EMPTY_CHECKS } from '../components/compliance/CaseComplianceChecks'
import type { CaseChecks } from '../components/compliance/CaseComplianceChecks'
import type { CanvasZusatzDaten } from '../components/canvas/CanvasZusatz'
import type { Ton } from '../components/ui/Pruefung'
import { scopedGet, scopedSet } from './mandantData'
import { nachweiseAusPruefungen } from './nachweise'
import { fallStand } from './fallstand'
import { BETRIEBS_KPIS } from '../components/qa/BetriebsKpis'

// ─────────────────────────────────────────────────────────────────────────
// Signale aus dem Betrieb — abgeleitet, nicht gepflegt.
//
// Die App erzeugt laufend Hinweise: ein Nachweis ohne Beleg, eine Prüfung
// auf „stopp", ein Betriebs-KPI ohne Ausgangswert. Bisher waren sie nur
// dort sichtbar, wo sie entstanden — ein offener Nachweis etwa nur im
// Fall selbst. Fallübergreifend sah sie niemand, und was niemand sieht,
// verpufft.
//
// Diese Datei baut daraus eine Liste. Sie erfindet dafür nichts: Jedes
// Signal stammt aus einer bestehenden Prüfung und trägt den Weg dorthin
// mit sich. Gespeichert wird nur, was sich nicht ableiten lässt — die
// Entscheidung eines Menschen darüber.
// ─────────────────────────────────────────────────────────────────────────

export type SignalQuelle = 'nachweis' | 'pruefung' | 'kpi'

export interface Signal {
  /** Stabil über Neuberechnungen — daran hängt die Entscheidung. */
  key: string
  quelle: SignalQuelle
  /** Woher es stammt, für die Spalte „Quelle" */
  herkunft: string
  text: string
  ton: Ton
  /** Wohin, um es zu bearbeiten */
  pfad: string
  /** Bei fallbezogenen Signalen der Titel des Falls */
  fall?: string
}

export type Entscheidung = 'offen' | 'beobachten' | 'angenommen' | 'verworfen'

export interface Beschluss {
  entscheidung: Entscheidung
  /** Wer sich darum kümmert — nur bei „angenommen" */
  wer?: string
  /** ISO-Datum: Frist bei „angenommen", Wiedervorlage bei „beobachten" */
  frist?: string
  /** Begründung bei „verworfen" */
  grund?: string
  /** ISO-Zeitstempel des ersten Auftretens. Wird nie zurückgesetzt. */
  seit: string
}

const BUCKET = 'signale'

export const ENTSCHEIDUNG_LABEL: Record<Entscheidung, string> = {
  offen: 'Offen',
  beobachten: 'Beobachten',
  angenommen: 'Angenommen',
  verworfen: 'Verworfen',
}

// ── Ableitung ────────────────────────────────────────────────────────────

/**
 * Alle Signale des aktiven Mandanten. Reine Funktion: liest den
 * gespeicherten Stand, schreibt nichts.
 */
export function leiteSignaleAb(faelle: AIUseCase[]): Signal[] {
  const alleChecks = scopedGet<Record<string, CaseChecks>>('casechecks', {})
  const allerZusatz = scopedGet<Record<string, CanvasZusatzDaten>>('canvaszusatz', {})
  const signale: Signal[] = []

  for (const uc of faelle) {
    // Ohne jede Antwort ist der Fall nicht „auffällig", sondern unbearbeitet.
    // Das ist kein Betriebssignal — sonst steht am ersten Tag alles voll.
    if (!alleChecks[uc.id]) continue
    // Genau wie beim Laden im Wizard: ein Stand aus einer älteren Version
    // kann Felder nicht enthalten, die es inzwischen gibt.
    const checks: CaseChecks = { ...EMPTY_CHECKS, ...alleChecks[uc.id] }

    const dokuCount = [
      uc.docGoal, uc.docDataBasis, uc.docRiskMitigation, uc.docExplainability,
      uc.docOperations, uc.docRegulatory, uc.docVersioning,
    ].filter((v) => !!String(v ?? '').trim()).length

    // ① Nachweise, die noch nicht belegt sind
    for (const n of nachweiseAusPruefungen(checks, allerZusatz[uc.id] ?? null, dokuCount)) {
      if (n.erfuellt) continue
      signale.push({
        key: `nachweis:${uc.id}:${n.def.key}`,
        quelle: 'nachweis',
        herkunft: n.def.quelle ?? 'Dokumentation',
        text: `${n.def.label} — ${n.offen ?? 'noch offen'}`,
        ton: 'warn',
        pfad: `/canvas/${uc.id}${n.def.ziel ? `?check=${n.def.ziel}` : ''}`,
        fall: uc.title,
      })
    }

    // ② Prüfschritte, die auf „stopp" stehen — das wiegt schwerer als ein
    //    offener Nachweis: hier ist etwas geprüft und durchgefallen.
    for (const g of fallStand(checks)) {
      if (g.ton !== 'stopp') continue
      signale.push({
        key: `pruefung:${uc.id}:${g.key}`,
        quelle: 'pruefung',
        herkunft: g.title,
        text: `${g.title} — ${g.status || 'gestoppt'}`,
        ton: 'stopp',
        pfad: `/canvas/${uc.id}?check=${g.key}`,
        fall: uc.title,
      })
    }
  }

  // ③ Betriebs-KPIs, die als relevant markiert, aber nicht messbar sind.
  //    Ohne Ausgangswert lässt sich später keine Wirkung belegen — das ist
  //    kein Formfehler, sondern der Grund, warum Nutzen strittig bleibt.
  const kpiStand = scopedGet<Record<string, { relevant?: boolean; baseline?: string; methode?: string }>>('betriebskpi', {})
  for (const kpi of BETRIEBS_KPIS) {
    const w = kpiStand[kpi.key]
    if (!w?.relevant) continue
    const fehlt = [
      !String(w.baseline ?? '').trim() && 'Baseline',
      !String(w.methode ?? '').trim() && 'Messmethode',
    ].filter(Boolean) as string[]
    if (!fehlt.length) continue
    signale.push({
      key: `kpi:${kpi.key}`,
      quelle: 'kpi',
      herkunft: 'Betriebs-KPI',
      text: `${kpi.titel} — ${fehlt.join(' und ')} fehlt`,
      ton: 'warn',
      pfad: '/qa?tab=betrieb',
    })
  }

  return signale
}

// ── Beschlüsse ───────────────────────────────────────────────────────────

export function leseBeschluesse(): Record<string, Beschluss> {
  return scopedGet<Record<string, Beschluss>>(BUCKET, {})
}

/**
 * Ein Beschluss ändert die Zahl, die an anderer Stelle steht — im Reiter
 * und auf dem Dashboard. Ohne Nachricht würden die stehenbleiben, bis
 * jemand die Seite wechselt.
 */
export const SIGNAL_EVENT = 'signale:geaendert'

export function schreibeBeschluss(key: string, b: Beschluss): void {
  scopedSet(BUCKET, { ...leseBeschluesse(), [key]: b })
  window.dispatchEvent(new Event(SIGNAL_EVENT))
}

/**
 * Stempelt neu aufgetretene Signale mit dem heutigen Datum.
 *
 * Bewusst getrennt von der Ableitung, damit die rein bleibt. Ein Signal,
 * das verschwindet und später wiederkommt, behält seinen ursprünglichen
 * Zeitstempel — sonst setzt jedes Hin und Her die Uhr zurück, und genau
 * die alten Fälle verschwinden aus dem Blick.
 *
 * Gibt zurück, ob etwas geschrieben wurde.
 */
export function stempleNeue(signale: Signal[]): boolean {
  const stand = leseBeschluesse()
  const jetzt = new Date().toISOString()
  let neu = false
  for (const s of signale) {
    if (stand[s.key]) continue
    stand[s.key] = { entscheidung: 'offen', seit: jetzt }
    neu = true
  }
  if (neu) scopedSet(BUCKET, stand)
  return neu
}

/** Wie viele Tage steht das schon offen? */
export function tageSeit(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

/** Angenommen, aber die Frist ist verstrichen. */
export function istUeberfaellig(b: Beschluss | undefined): boolean {
  if (!b?.frist) return false
  if (b.entscheidung !== 'angenommen' && b.entscheidung !== 'beobachten') return false
  return new Date(b.frist) < new Date(new Date().toDateString())
}

/**
 * Verlangt dieses Signal noch eine Entscheidung?
 *
 * Was tatsächlich niemand entschieden hat, plus was überfällig ist.
 * „Beobachten" mit gültiger Wiedervorlage gehört nicht dazu — sonst
 * wäre die Entscheidung folgenlos.
 *
 * Ein Prädikat, zwei Verwender: die Zahl auf Kachel und Reiter und die
 * Voreinstellung der Liste. Getrennt gerechnet zeigten sie Verschiedenes,
 * und wer auf die Kachel klickte, fand eine andere Zahl vor als darauf
 * stand.
 */
export function istZuEntscheiden(s: Signal, beschluesse: Record<string, Beschluss>): boolean {
  const b = beschluesse[s.key]
  if (!b || b.entscheidung === 'offen') return true
  return istUeberfaellig(b)
}

export function zaehleOffen(signale: Signal[], beschluesse: Record<string, Beschluss>): number {
  return signale.filter((s) => istZuEntscheiden(s, beschluesse)).length
}
