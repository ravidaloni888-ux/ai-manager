import { getActiveMandantId, getMandantType, HUB_ID, DEMO_ID } from '../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Persistenz-Weiche je Mandantentyp.
//
//   demo     → nichts laden/speichern, die Stores nutzen ihre Beispieldaten
//   internal → Supabase (bestehender Pfad, unverändert)
//   client   → localStorage, isoliert je Mandant unter  m_<id>_<bucket>
// ─────────────────────────────────────────────────────────────────────────

export function scopedKey(bucket: string, mandantId = getActiveMandantId()): string {
  return `m_${mandantId}_${bucket}`
}

export function scopedGet<T>(bucket: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(scopedKey(bucket))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

export function scopedSet<T>(bucket: string, value: T): void {
  try { localStorage.setItem(scopedKey(bucket), JSON.stringify(value)) } catch {}
}

/** Lädt für den aktiven Mandanten — Supabase beim AI Hub, sonst lokal. */
export async function loadFor<T>(
  bucket: string,
  fromSupabase: () => Promise<T>,
  blank: T,
): Promise<T> {
  if (getMandantType() === 'internal') return fromSupabase()
  return scopedGet(bucket, blank)
}

/** Speichert für den aktiven Mandanten. Im Demo-Modus passiert nichts. */
export async function saveFor<T>(
  bucket: string,
  toSupabase: (d: T) => Promise<void>,
  data: T,
): Promise<void> {
  const type = getMandantType()
  if (type === 'demo') return
  if (type === 'internal') { await toSupabase(data); return }
  scopedSet(bucket, data)
}

// ── Einmalige Übernahme bestehender Daten in das Mandantenschema ──────────

const LS_MIGRATED = 'ai_mandant_migration_v1'

/** Ordnet Alt-Schlüssel ohne Mandantenbezug dem AI Hub bzw. Demo zu. */
export function migrateLegacyKeys(): void {
  try {
    if (localStorage.getItem(LS_MIGRATED)) return

    const moves: [string, string][] = [
      ['ai_start_v1',              scopedKey('wizard', HUB_ID)],
      ['ai_stakeholders_v2',       scopedKey('stakeholders', HUB_ID)],
      ['ai_roadmap_v1_workspace',  scopedKey('roadmap', HUB_ID)],
      ['ai_roadmap_v1_demo',       scopedKey('roadmap', DEMO_ID)],
      ['ai_roadmap_horizons_v1',   scopedKey('horizons', HUB_ID)],
    ]

    for (const [from, to] of moves) {
      const val = localStorage.getItem(from)
      if (val !== null && localStorage.getItem(to) === null) {
        localStorage.setItem(to, val)
      }
    }

    localStorage.setItem(LS_MIGRATED, '1')
  } catch {}
}
