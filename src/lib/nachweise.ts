import type { CaseChecks } from '../components/compliance/CaseComplianceChecks'
import type { CanvasZusatzDaten } from '../components/canvas/CanvasZusatz'

// ─────────────────────────────────────────────────────────────────────────
// Compliance-Nachweise aus den Prüfungen ableiten.
//
// Ein Häkchen „DSFA durchgeführt wenn erforderlich" ist eine Behauptung.
// Der DSFA-Trigger-Check daneben ermittelt, ob sie erforderlich ist. Das
// eine soll aus dem anderen folgen, statt danebenzustehen — sonst erfasst
// man denselben Sachverhalt zweimal und sie können auseinanderlaufen.
// ─────────────────────────────────────────────────────────────────────────

export type NachweisKey =
  | 'complianceLegal' | 'compliancePersonalData' | 'complianceDataMin'
  | 'complianceDocumentation' | 'complianceLiability'

export interface NachweisDef {
  key: NachweisKey
  label: string
  desc: string
  /** Woher die Bestätigung stammt — null heisst: bleibt Handarbeit */
  quelle: string | null
  /** Wohin, wenn die Quelle noch offen ist */
  ziel?: string
}

export interface NachweisStand {
  def: NachweisDef
  /** Aus den Quellen belegt? */
  erfuellt: boolean
  /** Was fehlt, wenn nicht erfüllt */
  offen?: string
}

export const NACHWEISE: NachweisDef[] = [
  {
    key: 'complianceLegal',
    label: 'Rechtsgrundlage bestätigt',
    desc: 'DSGVO-Rechtsgrundlage und EU AI Act-Klassifizierung dokumentiert',
    quelle: 'Risikoklassen-Check',
    ziel: 'risiko',
  },
  {
    key: 'compliancePersonalData',
    label: 'Personendaten & DSFA geklärt',
    desc: 'Personendatenflüsse identifiziert, DSFA-Pflicht geprüft',
    quelle: 'Datenschutz-Prüfung',
    ziel: 'datenschutz',
  },
  {
    key: 'complianceDataMin',
    label: 'Datensparsamkeit & Zweckbindung sichergestellt',
    desc: 'Nur für den angegebenen Zweck notwendige Daten werden verarbeitet',
    quelle: 'Datenverfügbarkeit — Nutzungsrecht',
    ziel: 'verfuegbarkeit',
  },
  {
    key: 'complianceDocumentation',
    label: 'Dokumentations- & Nachweispflichten erfüllt',
    desc: 'Technische Dokumentation und Audit-Trail vorhanden',
    quelle: null,   // die Dokumentation unten füllt das
  },
  {
    key: 'complianceLiability',
    label: 'Haftung & Verantwortung definiert',
    desc: 'Wer zustimmen muss, ist benannt',
    quelle: 'Stakeholder — Rolle „Zustimmung"',
  },
]

/**
 * Was die Prüfungen tatsächlich belegen. Nur was dort beantwortet wurde,
 * gilt als Nachweis — geraten wird nichts.
 */
export function nachweiseAusPruefungen(
  checks: CaseChecks | null,
  zusatz: CanvasZusatzDaten | null,
  dokuCount: number,
): NachweisStand[] {
  return NACHWEISE.map((def): NachweisStand => {
    switch (def.key) {
      case 'complianceLegal': {
        const ok = !!checks?.riskClass?.done
        return { def, erfuellt: ok, offen: ok ? undefined : 'Risikoklasse noch nicht ermittelt' }
      }
      case 'compliancePersonalData': {
        const avv = checks?.avv
        const dsfaBeantwortet = Object.keys(checks?.dsfa ?? {}).length > 0
        const ok = avv?.personalData !== null && avv?.personalData !== undefined && dsfaBeantwortet
        return { def, erfuellt: !!ok, offen: ok ? undefined : 'DSFA-Trigger und AVV-Frage noch offen' }
      }
      case 'complianceDataMin': {
        // Das Nutzungsrecht deckt die Zweckbindung ab — dieselbe Frage
        const recht = checks?.verfuegbarkeit?.antworten?.recht
        const ok = recht === 'ja'
        return {
          def, erfuellt: ok,
          offen: recht === undefined ? 'Nutzungsrecht noch nicht geprüft'
            : 'Nutzungsrecht nicht uneingeschränkt gegeben',
        }
      }
      case 'complianceDocumentation': {
        const ok = dokuCount >= 4
        return { def, erfuellt: ok, offen: ok ? undefined : `Dokumentation erst ${dokuCount} von 7 Feldern` }
      }
      case 'complianceLiability': {
        const ok = !!zusatz?.stakeholder?.some((s) => s.rolle === 'entscheidet')
        return { def, erfuellt: ok, offen: ok ? undefined : 'Niemand mit Rolle „Zustimmung" benannt' }
      }
    }
  })
}
