import { AIUseCase, AIRisk, RiskCategory } from '../types'

export type RisikoArt = 'Bias' | 'Technischer Fehler' | 'Ethisches Risiko' | 'Sicherheitsrisiko'

export const RISIKOART_META: Record<RisikoArt, { label: string; desc: string; category: RiskCategory }> = {
  'Bias': {
    label: 'Bias',
    desc: 'Systematische Verzerrungen in Trainingsdaten oder Modellausgaben, die bestimmte Gruppen benachteiligen.',
    category: 'Bias & Fairness',
  },
  'Technischer Fehler': {
    label: 'Technischer Fehler',
    desc: 'Modell-Drift, Halluzinationen, Ausfälle oder Leistungsverlust durch veränderte Datenbedingungen.',
    category: 'Model Performance',
  },
  'Ethisches Risiko': {
    label: 'Ethisches Risiko',
    desc: 'Verletzung ethischer Grundsätze: Autonomiebias, fehlende Transparenz, Verletzung von Grundrechten.',
    category: 'Regulatory & Legal',
  },
  'Sicherheitsrisiko': {
    label: 'Sicherheitsrisiko',
    desc: 'Datenschutzverletzungen, Adversarial Attacks, Vendor Lock-in oder fehlende Zugriffskontrollen.',
    category: 'Security & Privacy',
  },
}

interface DerivedEntry { beschreibung: string; art: RisikoArt; b: number; a: number; e: number }

function deriveEntries(uc: AIUseCase): DerivedEntry[] {
  const euRisk = uc.euAiActRisk
  const bBase = euRisk === 'Unacceptable Risk' ? 10 : euRisk === 'High Risk' ? 8 : euRisk === 'Limited Risk' ? 5 : 3
  const entries: DerivedEntry[] = []

  // ── Ethisches Risiko (immer) ──────────────────────────────────────────────
  entries.push({
    beschreibung: `KI-Risikoeinstufung "${euRisk ?? 'Minimal Risk'}" nach EU AI Act`,
    art: 'Ethisches Risiko', b: bBase, a: bBase >= 8 ? 6 : 4, e: bBase >= 8 ? 7 : 4,
  })
  if (bBase >= 7) {
    entries.push({
      beschreibung: 'Automation Bias – Nutzer verlassen sich blind auf KI-Ausgaben',
      art: 'Ethisches Risiko', b: bBase, a: 6, e: 8,
    })
  }
  if (!uc.complianceLegal) {
    entries.push({
      beschreibung: 'Keine Rechtsgrundlage dokumentiert – Einsatz ohne DSGVO/KI-VO-Grundlage',
      art: 'Ethisches Risiko', b: 7, a: 6, e: 4,
    })
  }
  if (!uc.complianceDocumentation) {
    entries.push({
      beschreibung: 'Dokumentationspflichten unerfüllt – kein Nachweis für Audit',
      art: 'Ethisches Risiko', b: 6, a: 7, e: 3,
    })
  }

  // ── Bias (immer mindestens 1) ─────────────────────────────────────────────
  if (!uc.compliancePersonalData) {
    entries.push({
      beschreibung: 'Personendaten nicht dokumentiert – fehlende DSGVO Art. 30 Pflicht',
      art: 'Bias', b: 6, a: 5, e: 5,
    })
  }
  if (!uc.complianceDataMin) {
    entries.push({
      beschreibung: 'Datensparsamkeit nicht sichergestellt (DSGVO Art. 5)',
      art: 'Bias', b: 5, a: 6, e: 5,
    })
  }
  // Fallback: immer mindestens ein Bias-Eintrag
  if (!entries.some((e) => e.art === 'Bias')) {
    entries.push({
      beschreibung: 'Trainingsdaten-Bias – potenzielle Unterrepräsentation von Minderheiten',
      art: 'Bias', b: bBase, a: 4, e: 6,
    })
  }

  // ── Technischer Fehler (immer mindestens 1) ───────────────────────────────
  entries.push({
    beschreibung: 'Modell-Drift – Leistungsverlust durch veränderte Datenverteilung bleibt unbemerkt',
    art: 'Technischer Fehler', b: Math.max(3, bBase - 1), a: 5, e: 7,
  })
  if (bBase >= 7) {
    entries.push({
      beschreibung: 'Halluzinationen / falsch-positive Ausgaben ohne Konfidenzwarnung',
      art: 'Technischer Fehler', b: bBase, a: 5, e: 8,
    })
  }

  // ── Sicherheitsrisiko (immer mindestens 1) ────────────────────────────────
  entries.push({
    beschreibung: 'Vendor Lock-in – Ausfall des KI-Anbieters legt Betrieb still',
    art: 'Sicherheitsrisiko', b: 7, a: 3, e: 4,
  })
  if (!uc.complianceLiability) {
    entries.push({
      beschreibung: 'Verantwortlichkeit nicht definiert – bei Schaden unklar wer haftet',
      art: 'Sicherheitsrisiko', b: 7, a: 5, e: 4,
    })
  }
  if (bBase >= 7) {
    entries.push({
      beschreibung: 'Adversarial Attacks – gezielte Manipulation der KI-Eingaben möglich',
      art: 'Sicherheitsrisiko', b: bBase, a: 4, e: 6,
    })
  }

  return entries
}

export function deriveAIRisks(uc: AIUseCase): Omit<AIRisk, 'id'>[] {
  return deriveEntries(uc).map((e) => ({
    useCaseId: uc.id,
    useCaseTitle: uc.title,
    category: RISIKOART_META[e.art].category,
    title: e.beschreibung.slice(0, 80),
    description: e.beschreibung,
    b: e.b, a: e.a, e: e.e,
    mitigation: '',
    mitigationStatus: 'None' as const,
    owner: '',
    residualB: Math.max(1, e.b - 2),
    residualA: Math.max(1, e.a - 2),
    residualE: Math.max(1, e.e - 2),
  }))
}

export function deriveRisikoEntries(uc: AIUseCase) {
  return deriveEntries(uc).map((e, idx) => ({ ...e, id: `auto-${uc.id}-${idx}`, auto: true as const }))
}
