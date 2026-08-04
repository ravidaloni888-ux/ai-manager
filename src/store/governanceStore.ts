import { create } from 'zustand'
import { GovernanceData } from '../types'
import { loadGovernance, saveGovernance, DEFAULT_GOVERNANCE } from '../lib/supabase'
import { getDemoMode } from './demoStore'
import { loadFor, saveFor } from '../lib/mandantData'

export const DEMO_GOVERNANCE: GovernanceData = {
  richtlinie: {
    zweck: 'KI wird ausschließlich zur Unterstützung von Geschäftsprozessen eingesetzt, die messbaren Nutzen für Kundschaft, Mitarbeitende oder Partner stiften. Zugelassen sind Kundenservice-Automatisierung, Optimierung der Lieferkette, Betrugserkennung, HR-Analytik und Produktempfehlungen. KI trifft keine vollständig autonomen Entscheidungen über Personen ohne menschliche Aufsicht.',
    daten: 'Verwendet werden dürfen nur unternehmenseigene, lizenzierte oder mit Einwilligung überlassene Daten — für Training wie für den Betrieb. Personenbezogene Daten werden auf Grundlage der DSGVO verarbeitet (Art. 6, bei besonderen Kategorien Art. 9). Alle Daten produktiver KI-Systeme sind im Datenkatalog verzeichnet. Besondere Kategorien (Gesundheit, Finanzen, Personal) brauchen vor der Nutzung die ausdrückliche Freigabe der DSB.',
    transparenz: 'KI-Systeme mit Kunden- oder Personalbezug müssen eine Erklärungsebene bieten, die für Betroffene zugänglich ist. Mitarbeitende werden informiert, wenn KI an Entscheidungen über sie mitwirkt. Entscheidungsprotokolle werden 24 Monate für Prüfzwecke aufbewahrt. Das KI-Register führt alle laufenden Systeme mit Datenquellen und Modellversionen.',
    verantwortlichkeiten: 'Die KI-Verantwortliche (CDO) trägt die Gesamtverantwortung für das KI-Programm. Jeder Anwendungsfall hat eine benannte fachliche Auftraggeberin und eine technische Verantwortliche. Die DSB wird bei allen Fällen mit Personenbezug einbezogen. Die Ethik-Prüferin führt vor dem Produktivgang Fairness-Prüfungen für Personal- und Kundensysteme durch. Der KI-Governance-Ausschuss tagt vierteljährlich zum Compliance-Stand.',
    risikomanagement: 'Alle Anwendungsfälle werden nach den Risikoklassen des EU AI Act eingestuft. Hochrisiko-Systeme (Anhang III) brauchen vor der Inbetriebnahme eine vollständige Konformitätsbewertung und eine DSFA. Ein KI-Risikoregister dokumentiert für jedes System Eintrittswahrscheinlichkeit, Auswirkung, Maßnahme und Restrisiko. Kritische Risiken (Wert ab 15) gehen binnen fünf Arbeitstagen an den KI-Governance-Ausschuss.',
    ethik: 'KI-Systeme dürfen nicht nach Alter, Geschlecht, Herkunft, Religion, Behinderung oder anderen geschützten Merkmalen benachteiligen. Kunden- und Personalsysteme werden vor dem Produktivgang und danach halbjährlich auf demografische Verzerrung geprüft. Die Ethik-Prüferin führt ein Protokoll dieser Prüfungen. Mitarbeitende können ethische Bedenken anonym über die KI-Ethik-Hotline melden.',
    schulung: 'Alle Mitarbeitenden, die mit KI-Systemen arbeiten, absolvieren binnen 30 Tagen nach Eintritt einen verpflichtenden zweistündigen Grundlagenkurs. Rollenspezifische Schulungen (Entwicklung, Analyse, Führung) folgen binnen 90 Tagen. KI-Multiplikatoren je Abteilung erhalten jährlich acht Stunden Vertiefung. Der Abschluss wird in der Schulungsmatrix nachgehalten und dem KI-Governance-Ausschuss berichtet.',
  },
  roles: {
    aiOwner:  'Dr. Maria Müller (Chief Digital Officer)',
    dpo:      'Thomas Fischer (Datenschutzbeauftragter)',
    security: 'Lisa Weber (Leitung IT-Sicherheit)',
    ethics:   'James Okafor (Vorsitz KI-Ethik-Ausschuss)',
    business: 'Sandra Klein (Bereichsleitung Betrieb)',
  },
  steps: {
    step1: true, step2: true, step3: true, step4: true, step5: true,
    step6: false, step7: true, step8: false, step9: false,
  },
  aims: {
    kl4:  { status: 'done',        note: 'Geltungsbereich festgelegt: vier KI-Systeme im Betrieb (Radiologie-KI, EPA-Agent, Chatbot, Verbrauchsmaterialien). Stakeholder-Landkarte dokumentiert.' },
    kl5:  { status: 'done',        note: 'KI-Politik von der Geschäftsführung freigegeben. Rolle der/des KI-Beauftragten nach Klausel 5.3 eingerichtet.' },
    kl6:  { status: 'in_progress', note: 'Risikobewertung für die Hochrisiko-Systeme abgeschlossen. Folgenabschätzung (A.5) für die Radiologie-KI steht aus.' },
    kl7:  { status: 'in_progress', note: 'Schulungsmatrix aktiv (siehe Schulung & Coaching). 68 % abgeschlossen — ISO 42001 §7.2 verlangt 100 % für Rollen im Produktivbetrieb.' },
    kl8:  { status: 'in_progress', note: 'KI-Lebenszyklus für Radiologie-KI und EPA-Agent dokumentiert. Validierungsdokumentation für den Chatbot steht aus.' },
    kl9:  { status: 'not_started', note: '' },
    kl10: { status: 'not_started', note: '' },
  },
}

interface GovernanceStore {
  data: GovernanceData | null
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  save: (data: GovernanceData) => Promise<void>
}

export const useGovernanceStore = create<GovernanceStore>()((set) => ({
  data: null,
  loading: true,
  saving: false,

  init: async () => {
    if (getDemoMode()) {
      set({ data: DEMO_GOVERNANCE, loading: false })
      return
    }
    const data = await loadFor('governance', loadGovernance, DEFAULT_GOVERNANCE)
    set({ data, loading: false })
  },

  save: async (data) => {
    set({ saving: true })
    await saveFor('governance', saveGovernance, data)
    set({ data, saving: false })
  },
}))
