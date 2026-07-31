import { create } from 'zustand'
import { getActiveMandantId, useMandantStore } from './mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Eigenschaften, die für die ganze Organisation gelten — nicht je Fall.
//
// Sie steuern, welche Schritte im Assistenten überhaupt greifen, und füllen
// den Projektplan, damit er nicht bei jedem Anwendungsfall dasselbe fragt.
// ─────────────────────────────────────────────────────────────────────────

export type Rolle = 'betreiber' | 'anbieter'
export type IsoZiel = 'ja' | 'nein' | 'spaeter'
export type Branche = 'sonstige' | 'medizin' | 'finanzen' | 'oeffentlich'

export interface MandantProfil {
  rolle?: Rolle
  betriebsrat?: boolean
  iso42001?: IsoZiel
  branche?: Branche
}

export const EMPTY_PROFIL: MandantProfil = {}

const LS_KEY = 'ai_mandant_profile_v1'

function readAll(): Record<string, MandantProfil> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, MandantProfil>) : {}
  } catch { return {} }
}

export function getProfil(mandantId = getActiveMandantId()): MandantProfil {
  return readAll()[mandantId] ?? EMPTY_PROFIL
}

/** Wie viele der vier Angaben sind gemacht? */
export function profilCount(p: MandantProfil): number {
  return [p.rolle, p.betriebsrat, p.iso42001, p.branche].filter((v) => v !== undefined).length
}

interface ProfilStore {
  profile: Record<string, MandantProfil>
  init: () => void
  set: (patch: Partial<MandantProfil>) => void
}

export const useProfilStore = create<ProfilStore>()((set, get) => ({
  profile: readAll(),

  init: () => set({ profile: readAll() }),

  set: (patch) => {
    const id = getActiveMandantId()
    const next = { ...get().profile, [id]: { ...(get().profile[id] ?? {}), ...patch } }
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    set({ profile: next })
  },
}))

/** Reaktives Profil des aktiven Mandanten. */
export function useProfil(): MandantProfil {
  const activeId = useMandantStore((s) => s.activeId)
  const profile = useProfilStore((s) => s.profile)
  return profile[activeId] ?? EMPTY_PROFIL
}
