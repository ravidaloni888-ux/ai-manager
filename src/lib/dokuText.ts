import type { CaseChecks } from '../components/compliance/CaseComplianceChecks'
import { resultName, riskFromResult } from '../components/assessments/RiskClassCheck'
import { VERFUEGBARKEIT_FRAGEN } from '../components/assessments/DatenverfuegbarkeitCheck'

// ─────────────────────────────────────────────────────────────────────────
// Vorschläge für die Anhang-IV-Dokumentation.
//
// Vier der sieben Abschnitte stehen inhaltlich schon woanders im Fall —
// Ziel, Datenbasis, Risiko und Regulatorik. Sie hier ein zweites Mal zu
// tippen erzeugt nur die Chance, dass beides auseinanderläuft.
//
// Der Vorschlag ersetzt die Arbeit nicht: Anhang IV verlangt einen
// zusammenhängenden Text, keine Stichworte. Er liefert das Gerüst und
// bleibt danach frei bearbeitbar.
// ─────────────────────────────────────────────────────────────────────────

export interface DokuQuelle {
  businessProblem?: string
  aiApproach?: string
  dataRequirements?: string
  title?: string
}

/** Die Einstufung steht intern englisch, der Nachweistext ist deutsch. */
const RISIKO_DE: Record<string, string> = {
  'Unacceptable Risk': 'verbotene Praktik (Art. 5)',
  'High Risk': 'Hochrisiko (Anhang III)',
  'Limited Risk': 'begrenztes Risiko — Transparenzpflichten (Art. 50)',
  'Minimal Risk': 'minimales Risiko',
}

const QUAL_LABEL: Record<string, string> = {
  gut: 'gut', teilweise: 'teilweise ausreichend', kritisch: 'kritisch',
}

/** Null heisst: dafür liegt noch nichts vor, kein Knopf anbieten. */
export function dokuVorschlag(
  feld: string,
  q: DokuQuelle,
  checks: CaseChecks | null,
): string | null {
  switch (feld) {
    case 'docGoal': {
      const teile: string[] = []
      if (q.businessProblem?.trim()) teile.push(`Zweck: ${q.businessProblem.trim()}`)
      if (q.aiApproach?.trim()) teile.push(`Technischer Ansatz: ${q.aiApproach.trim()}`)
      return teile.length ? teile.join('\n\n') : null
    }

    case 'docDataBasis': {
      const teile: string[] = []
      if (q.dataRequirements?.trim()) teile.push(`Datenbedarf: ${q.dataRequirements.trim()}`)

      const antworten = checks?.verfuegbarkeit?.antworten ?? {}
      const verf = VERFUEGBARKEIT_FRAGEN
        .filter((f) => antworten[f.id])
        .map((f) => `${f.titel}: ${antworten[f.id] === 'ja' ? 'gegeben' : antworten[f.id] === 'teils' ? 'teilweise' : 'nicht gegeben'}`)
      if (verf.length) teile.push(`Verfügbarkeit — ${verf.join('; ')}.`)

      const dims = Object.entries(checks?.dataQuality?.dims ?? {}).filter(([, d]) => d.rating)
      if (dims.length) {
        teile.push(`Datenqualität — ${dims.map(([k, d]) => `${k}: ${QUAL_LABEL[d.rating as string] ?? d.rating}`).join('; ')}.`)
      }
      return teile.length ? teile.join('\n\n') : null
    }

    case 'docRiskMitigation': {
      const rc = checks?.riskClass
      if (!rc?.done || !rc.resultId) return null
      const name = resultName(rc.resultId)
      const stufe = riskFromResult(rc.resultId)
      const teile = [`Einstufung nach EU AI Act: ${name ?? 'siehe Risikoklassen-Check'}${stufe ? ` — ${RISIKO_DE[stufe] ?? stufe}` : ''}.`]
      if (stufe === 'High Risk') {
        teile.push(
          'Daraus folgen die Pflichten aus Art. 9 (Risikomanagement über den Lebenszyklus), ' +
          'Art. 10 (Daten-Governance), Art. 14 (menschliche Aufsicht) und Art. 15 (Genauigkeit und Robustheit). ' +
          'Restrisiko und Gegenmaßnahmen sind hier je Risiko zu benennen.',
        )
      }
      if (rc.gpai) teile.push('Zusätzlich GPAI-Pflichten nach Art. 51–55.')
      return teile.join('\n\n')
    }

    case 'docRegulatory': {
      const rc = checks?.riskClass
      const teile: string[] = []
      if (rc?.done && rc.resultId) {
        const stufe = riskFromResult(rc.resultId)
        teile.push(`Regulatorischer Rahmen: EU AI Act, Einstufung ${stufe ? RISIKO_DE[stufe] ?? stufe : 'siehe Prüfung'}.`)
        if (stufe === 'High Risk') {
          teile.push('Konformitätsbewertung nach Art. 43, Registrierung nach Art. 49, CE-Kennzeichnung nach Art. 48.')
        }
      }
      const avv = checks?.avv
      if (avv?.personalData) {
        teile.push(
          'DSGVO: Personenbezogene Daten werden verarbeitet.' +
          (avv.external ? ` Auftragsverarbeitung durch Dritte — AVV ${avv.avvExists ? 'liegt vor' : 'noch offen'} (Art. 28).` : ''),
        )
      }
      return teile.length ? teile.join('\n\n') : null
    }

    default:
      return null
  }
}
