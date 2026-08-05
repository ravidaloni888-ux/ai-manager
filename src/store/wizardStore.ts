import { create } from 'zustand'
import { getDemoMode } from './demoStore'
import { scopedGet, scopedSet, migrateLegacyKeys } from '../lib/mandantData'
import { getActiveMandant, useMandantStore, allMandanten } from './mandantStore'
import type { MandantType } from './mandantStore'

export type StepId =
  // Phase 1 · Fundament
  | 'swot' | 'vision' | 'maturity' | 'gap' | 'strategie'
  // Phase 2 · Rechtsrahmen & Ethik
  | 'eu-act-basics' | 'dsgvo' | 'ethics'
  // Phase 3 · Governance & Stakeholder
  | 'governance' | 'roles' | 'stakeholders'
  // Phase 4 · Portfolio & Priorisierung
  | 'usecases' | 'data-quality' | 'score' | 'eu-act' | 'project-plan'
  // Phase 5 · Risiko & Investition
  | 'risks' | 'roadmap' | 'roi'
  // Phase 6 · Umsetzung & Betrieb
  | 'qa' | 'data-integrity' | 'change' | 'enablement'

export const ALL_STEP_IDS: StepId[] = [
  'swot', 'vision', 'maturity', 'gap', 'strategie',
  'eu-act-basics', 'dsgvo', 'ethics',
  'governance', 'roles', 'stakeholders',
  'usecases', 'data-quality', 'score', 'eu-act', 'project-plan',
  'risks', 'roadmap', 'roi',
  'qa', 'data-integrity', 'change', 'enablement',
]

// Which step IDs cover each route (a route is "done" if ANY of its steps is done)
export const ROUTE_STEPS: Record<string, StepId[]> = {
  '/strategy':     ['swot', 'vision', 'maturity', 'gap', 'strategie'],
  '/maturity':     ['maturity'],
  '/eu-ai-act':    ['eu-act-basics'],
  '/dsgvo':        ['dsgvo'],
  '/ethik':        ['ethics'],
  '/governance':   ['governance', 'roles'],
  '/stakeholders': ['stakeholders'],
  '/use-cases':    ['usecases', 'score', 'eu-act'],
  '/data':         ['data-integrity'],
  '/risk':         ['risks'],
  '/roadmap':      ['roadmap'],
  '/roi':          ['roi'],
  '/qa':           ['qa'],
  '/change':       ['change'],
  '/enablement':   ['enablement'],
}


// ── Umfang je Mandant ────────────────────────────────────────────────────
//
// Rechtsrahmen und Ethik sind eigene Kompetenz — die erarbeitet man einmal,
// nicht pro Kunde neu. Sie entfallen deshalb in Kundenmandaten.

export const KNOWLEDGE_STEP_IDS: StepId[] = ['eu-act-basics', 'dsgvo', 'ethics']
export const WORK_STEP_IDS: StepId[] = ALL_STEP_IDS.filter((id) => !KNOWLEDGE_STEP_IDS.includes(id))

export interface ScopePreset {
  key: string
  label: string
  hint: string
  steps: StepId[]
}

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    key: 'compliance',
    label: 'Compliance-Prüfung',
    hint: 'Bestandsaufnahme, Einstufung nach EU AI Act, Risiken und Maßnahmenplan.',
    steps: ['usecases', 'eu-act', 'project-plan', 'risks'],
  },
  {
    key: 'usecase',
    label: 'Use-Case-Entwicklung',
    hint: 'Einen Anwendungsfall von der Idee bis zu Abnahmekriterien und ROI führen.',
    steps: ['usecases', 'data-quality', 'score', 'qa', 'roi'],
  },
  {
    key: 'full',
    label: 'Vollprogramm',
    hint: 'Komplettes KI-Programm für den Kunden aufbauen — ohne die eigenen Wissensmodule.',
    steps: WORK_STEP_IDS,
  },
]

/** Schritte, die für den aktiven Mandanten gelten — in fachlicher Reihenfolge. */
export function resolveScope(scope: string[] | undefined, type?: MandantType): StepId[] {
  // Ohne gesetzten Umfang: Kundenmandate ohne die eigenen Wissensmodule
  if (!scope) return type === 'client' ? WORK_STEP_IDS : ALL_STEP_IDS
  const set = new Set(scope)
  // immer entlang der definierten Gesamtreihenfolge, nie in Auswahlreihenfolge
  return ALL_STEP_IDS.filter((id) => set.has(id))
}

export function getActiveScope(): StepId[] {
  const m = getActiveMandant()
  return resolveScope(m.scope, m.type)
}

/** Reaktive Variante für Komponenten. */
export function useActiveScope(): StepId[] {
  const activeId = useMandantStore((s) => s.activeId)
  const mandanten = useMandantStore((s) => s.mandanten)
  const m = mandanten.find((x) => x.id === activeId) ?? allMandanten().find((x) => x.id === activeId)
  return resolveScope(m?.scope, m?.type)
}

// Fortschritt wird je Mandant getrennt gespeichert
const BUCKET = 'wizard'

export function loadProgress(): Set<StepId> {
  migrateLegacyKeys()
  if (getDemoMode()) return new Set(getActiveScope())
  // unbekannte IDs verwerfen (z. B. aus einer älteren Wizard-Version)
  const stored = scopedGet<string[]>(BUCKET, [])
  return new Set(stored.filter((id): id is StepId => (ALL_STEP_IDS as string[]).includes(id)))
}

export function saveProgress(done: Set<StepId>) {
  if (getDemoMode()) return
  scopedSet(BUCKET, [...done])
}

interface WizardStore {
  done: Set<StepId>
  init: () => void
  toggle: (id: StepId) => void
}

export const useWizardStore = create<WizardStore>()((set, get) => ({
  done: loadProgress(),

  init: () => {
    set({ done: loadProgress() })
  },

  toggle: (id) => {
    const next = new Set(get().done)
    next.has(id) ? next.delete(id) : next.add(id)
    saveProgress(next)
    set({ done: next })
  },
}))

// ── Welche Schritte greifen für dieses Mandat? ───────────────────────────
//
// Schritte werden nie versteckt, nur als "entfällt" markiert — mit Grund und
// weiterhin offenbar. Eine Einstufung kann sich ändern; verschwundene Schritte
// wären dann stillschweigend weg.

export interface StepNote {
  entfaellt?: boolean
  /** Warum der Schritt entfällt — wird dem Nutzer angezeigt */
  grund?: string
  /** Zusatzhinweis ohne Entfall */
  hinweis?: string
}

interface RelevanceInput {
  iso42001?: 'ja' | 'nein' | 'spaeter'
  /** Anzahl erfasster Anwendungsfälle */
  faelle: number
  /** Ist mindestens ein Fall als Hochrisiko oder inakzeptabel eingestuft? */
  hatHochrisiko: boolean
}

export function deriveStepNotes(input: RelevanceInput): Partial<Record<StepId, StepNote>> {
  const notes: Partial<Record<StepId, StepNote>> = {}

  // Solange nichts erfasst ist, lässt sich nichts ableiten — alles bleibt offen.
  const bewertbar = input.faelle > 0

  if (bewertbar && !input.hatHochrisiko) {
    notes.risks = {
      entfaellt: true,
      grund: 'Kein Anwendungsfall ist als Hochrisiko eingestuft — ein förmliches Risikoregister ist nicht vorgeschrieben. Sobald ein Fall auf Hochrisiko wechselt, wird der Schritt wieder fällig.',
    }
    notes['data-integrity'] = {
      entfaellt: true,
      grund: 'Die Protokollierungspflicht nach Art. 12 EU AI Act greift nur bei Hochrisiko-Systemen. Als gute Praxis bleibt der Schritt sinnvoll — Sie können ihn jederzeit öffnen.',
    }
  }

  if (input.iso42001 === 'nein') {
    notes.governance = {
      hinweis: 'ISO 42001 ist für dieses Mandat nicht angestrebt — der AIMS-Reiter auf der Governance-Seite ist für Sie nicht relevant.',
    }
  }

  return notes
}
