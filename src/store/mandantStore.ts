import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────
// Mandanten — für wen mache ich gerade KI-Management?
//
//   'demo'     → feste Beispieldaten (WellSeal), nichts wird gespeichert
//   'internal' → eigenes Haus (Beraterfirma), liegt in Supabase (bestehende Daten)
//   'client'   → Kundenmandat, bleibt ausschliesslich lokal im Browser
//
// Kundendaten gehen bewusst NICHT nach Supabase: das Backend hat aktuell
// keine Zugriffstrennung. Siehe README / Stufe B.
// ─────────────────────────────────────────────────────────────────────────

export type MandantType = 'demo' | 'internal' | 'client'

export interface Mandant {
  id: string
  name: string
  type: MandantType
  /** Kurzbeschreibung, z. B. Branche oder Projektname */
  note?: string
  /** Welche Wizard-Schritte gelten für dieses Mandat? undefined = alle */
  scope?: string[]
  /** Name der gewählten Umfangsvorlage, nur zur Anzeige */
  scopePreset?: string
  createdAt?: string
}

export const HUB_ID = 'hub'
export const DEMO_ID = 'demo'

const BUILTIN: Mandant[] = [
  { id: HUB_ID,  name: 'Die Beraterfirma', type: 'internal', note: 'Eigenes Haus · internes KI-Programm' },
  { id: DEMO_ID, name: 'Demo (WellSeal)',  type: 'demo',     note: 'Lern- und Beispielmodus' },
]

export const MANDANT_STYLE: Record<MandantType, { icon: string; badge: string; dot: string; label: string }> = {
  internal: { icon: '🏢', badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',  label: 'Intern' },
  client:   { icon: '🤝', badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500',  label: 'Kunde' },
  demo:     { icon: '🎓', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', label: 'Demo' },
}

const LS_CLIENTS = 'ai_mandanten_v1'
const LS_ACTIVE  = 'ai_active_mandant_v1'
const LS_LEGACY_DEMO = 'ai_demo_mode_v1'

function readClients(): Mandant[] {
  try {
    const raw = localStorage.getItem(LS_CLIENTS)
    return raw ? (JSON.parse(raw) as Mandant[]) : []
  } catch { return [] }
}

function writeClients(list: Mandant[]) {
  try { localStorage.setItem(LS_CLIENTS, JSON.stringify(list)) } catch {}
}

export function allMandanten(): Mandant[] {
  return [...BUILTIN, ...readClients()]
}

export function getActiveMandantId(): string {
  try {
    const stored = localStorage.getItem(LS_ACTIVE)
    if (stored && allMandanten().some((m) => m.id === stored)) return stored
    // Erstaufruf: alten Demo-Schalter übernehmen (Default war "Demo an")
    const legacy = localStorage.getItem(LS_LEGACY_DEMO)
    return legacy === 'false' ? HUB_ID : DEMO_ID
  } catch { return DEMO_ID }
}

export function getActiveMandant(): Mandant {
  const id = getActiveMandantId()
  return allMandanten().find((m) => m.id === id) ?? BUILTIN[1]
}

export function getMandantType(): MandantType {
  return getActiveMandant().type
}

interface MandantStore {
  mandanten: Mandant[]
  activeId: string
  init: () => void
  setActive: (id: string) => void
  addClient: (name: string, note?: string, scope?: string[], scopePreset?: string) => string
  setScope: (id: string, scope: string[] | undefined, scopePreset?: string) => void
  renameMandant: (id: string, name: string, note?: string) => void
  removeClient: (id: string) => void
}

export const useMandantStore = create<MandantStore>()((set, get) => ({
  mandanten: allMandanten(),
  activeId: getActiveMandantId(),

  init: () => set({ mandanten: allMandanten(), activeId: getActiveMandantId() }),

  setActive: (id) => {
    try { localStorage.setItem(LS_ACTIVE, id) } catch {}
    set({ activeId: id })
  },

  addClient: (name, note, scope, scopePreset) => {
    const id = `c_${Date.now().toString(36)}`
    const next = [...readClients(), {
      id, name, type: 'client' as const, note, scope, scopePreset,
      createdAt: new Date().toISOString(),
    }]
    writeClients(next)
    set({ mandanten: allMandanten() })
    return id
  },

  setScope: (id, scope, scopePreset) => {
    if (id === HUB_ID || id === DEMO_ID) return
    writeClients(readClients().map((m) => (m.id === id ? { ...m, scope, scopePreset } : m)))
    set({ mandanten: allMandanten() })
  },

  renameMandant: (id, name, note) => {
    // eingebaute Mandanten sind nicht umbenennbar
    if (id === HUB_ID || id === DEMO_ID) return
    writeClients(readClients().map((m) => (m.id === id ? { ...m, name, note } : m)))
    set({ mandanten: allMandanten() })
  },

  removeClient: (id) => {
    if (id === HUB_ID || id === DEMO_ID) return
    writeClients(readClients().filter((m) => m.id !== id))
    // zugehörige Daten mit entfernen
    try {
      const prefix = `m_${id}_`
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => localStorage.removeItem(k))
    } catch {}
    if (get().activeId === id) get().setActive(HUB_ID)
    set({ mandanten: allMandanten() })
  },
}))

/** Reaktiver Helfer für Komponenten: läuft der Demo-Mandant? */
export function useIsDemo(): boolean {
  const activeId = useMandantStore((s) => s.activeId)
  return (allMandanten().find((m) => m.id === activeId)?.type ?? 'demo') === 'demo'
}

/** Reaktive Mandanten-ID — als Effekt-Abhängigkeit zum Neuladen nutzen. */
export function useMandantId(): string {
  return useMandantStore((s) => s.activeId)
}
