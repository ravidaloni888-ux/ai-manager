import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Zwei Canvas-Elemente, die sonst zwischen den Zeilen verschwinden.
//
// Stakeholder: Ein Vorhaben scheitert selten daran, dass niemand es will,
// sondern daran, dass jemand zustimmen musste und nicht gefragt wurde.
//
// Abhängigkeiten: Was vorher geklärt sein muss, bestimmt den Zeitplan
// stärker als die Entwicklungsdauer — und ohne benannten Entscheider
// bleibt eine Vorfrage liegen, bis sie das Vorhaben blockiert.
// ─────────────────────────────────────────────────────────────────────────

export type StakeholderRolle = 'profitiert' | 'betroffen' | 'entscheidet'

export interface Stakeholder {
  id: string
  name: string
  rolle: StakeholderRolle
  notiz: string
}

export interface Abhaengigkeit {
  id: string
  was: string
  entscheider: string
  status: 'offen' | 'geklaert'
  /** IDs der Vorfragen, die vorher geklärt sein müssen */
  haengtVon?: string[]
}

export interface Stufen {
  /** Vorfragen nach Ebenen — Ebene 0 hat keine Vorbedingung */
  ebenen: Abhaengigkeit[][]
  /** Einträge, die in einem Ringschluss hängen und keiner Ebene zuzuordnen sind */
  ringschluss: Abhaengigkeit[]
}

/**
 * Reihenfolge aus den Abhängigkeiten ableiten (topologische Sortierung).
 *
 * Die Zahl der Ebenen sagt, wie viele Runden mindestens nötig sind, bis
 * alles geklärt ist — das ist die eigentliche Aussage. Ein Ringschluss
 * (A wartet auf B, B auf A) wird nicht stillschweigend aufgelöst, sondern
 * gemeldet: Er bedeutet, dass niemand anfangen kann.
 */
export function stufenBerechnen(items: Abhaengigkeit[]): Stufen {
  const offen = new Map(items.map((a) => [a.id, a]))
  const erledigt = new Set<string>()
  const ebenen: Abhaengigkeit[][] = []

  while (offen.size > 0) {
    const bereit = [...offen.values()].filter((a) =>
      (a.haengtVon ?? []).filter((id) => offen.has(id)).length === 0,
    )
    if (bereit.length === 0) break   // nur noch Ringschlüsse übrig
    bereit.forEach((a) => { offen.delete(a.id); erledigt.add(a.id) })
    ebenen.push(bereit)
  }

  return { ebenen, ringschluss: [...offen.values()] }
}

/** Blockiert = mindestens eine Vorbedingung ist noch offen. */
export function istBlockiert(a: Abhaengigkeit, alle: Abhaengigkeit[]): boolean {
  return (a.haengtVon ?? []).some((id) => {
    const v = alle.find((x) => x.id === id)
    return v && v.status === 'offen'
  })
}

export interface CanvasZusatzDaten {
  stakeholder: Stakeholder[]
  abhaengigkeiten: Abhaengigkeit[]
}

const LEER: CanvasZusatzDaten = { stakeholder: [], abhaengigkeiten: [] }
const BUCKET = 'canvaszusatz'

const ROLLEN: { wert: StakeholderRolle; label: string; frage: string; bg: string; aktiv: string }[] = [
  { wert: 'profitiert',  label: 'Profitiert',  frage: 'Wer hat den Nutzen?',
    bg: 'bg-green-100 text-green-700',   aktiv: 'bg-green-500 text-white' },
  { wert: 'betroffen',   label: 'Betroffen',   frage: 'Wessen Arbeit ändert sich?',
    bg: 'bg-amber-100 text-amber-700',   aktiv: 'bg-amber-500 text-white' },
  { wert: 'entscheidet', label: 'Zustimmung',  frage: 'Wer muss zustimmen?',
    bg: 'bg-purple-100 text-purple-700', aktiv: 'bg-purple-600 text-white' },
]

const inputCls = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

/** Beide Blöcke teilen sich einen Speicher je Fall. */
function useZusatz(ucId?: string) {
  const [daten, setDaten] = useState<CanvasZusatzDaten>(LEER)
  const speicherbar = !!ucId && getMandantType() !== 'demo'

  useEffect(() => {
    if (!ucId) { setDaten(LEER); return }
    const alle = scopedGet<Record<string, CanvasZusatzDaten>>(BUCKET, {})
    setDaten({ ...LEER, ...(alle[ucId] ?? {}) })
  }, [ucId])

  const sichern = (next: CanvasZusatzDaten) => {
    setDaten(next)
    if (speicherbar && ucId) {
      const alle = scopedGet<Record<string, CanvasZusatzDaten>>(BUCKET, {})
      scopedSet(BUCKET, { ...alle, [ucId]: next })
    }
  }

  return { daten, sichern, speicherbar }
}

// ── ⑤ Stakeholder & RACI ─────────────────────────────────────────────────

export function StakeholderFeld({ ucId, nummer }: { ucId?: string; nummer: number }) {
  const { daten, sichern } = useZusatz(ucId)
  const [entwurf, setEntwurf] = useState('')
  const [rolle, setRolle] = useState<StakeholderRolle>('profitiert')

  const hinzu = () => {
    const name = entwurf.trim()
    if (!name) return
    sichern({ ...daten, stakeholder: [...daten.stakeholder, { id: nanoid(), name, rolle, notiz: '' }] })
    setEntwurf('')
  }

  const setzeRolle = (id: string, r: StakeholderRolle) =>
    sichern({ ...daten, stakeholder: daten.stakeholder.map((s) => (s.id === id ? { ...s, rolle: r } : s)) })

  const setzeNotiz = (id: string, notiz: string) =>
    sichern({ ...daten, stakeholder: daten.stakeholder.map((s) => (s.id === id ? { ...s, notiz } : s)) })

  const weg = (id: string) =>
    sichern({ ...daten, stakeholder: daten.stakeholder.filter((s) => s.id !== id) })

  const fehlendeRollen = ROLLEN.filter((r) => !daten.stakeholder.some((s) => s.rolle === r.wert))

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-xs font-semibold text-slate-600">
          {nummer} · Stakeholder &amp; RACI
        </label>
        <span className="text-[11px] text-slate-400">
          Wer profitiert, wer betroffen ist, wer zustimmen muss
        </span>
      </div>

      {daten.stakeholder.length > 0 && (
        <div className="space-y-1.5">
          {daten.stakeholder.map((s) => (
            <div key={s.id} className="group rounded-lg border border-slate-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-800 font-medium min-w-0 flex-1 truncate">{s.name}</span>
                <div className="flex gap-1 flex-shrink-0">
                  {ROLLEN.map((r) => (
                    <button
                      key={r.wert}
                      type="button"
                      onClick={() => setzeRolle(s.id, r.wert)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        s.rolle === r.wert ? r.aktiv : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => weg(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs flex-shrink-0 transition-opacity"
                >
                  ✕
                </button>
              </div>
              <input
                className="w-full mt-1.5 border-0 border-b border-transparent focus:border-slate-200 px-0 py-0.5 text-[11px] text-slate-600 focus:outline-none bg-transparent"
                value={s.notiz}
                onChange={(e) => setzeNotiz(s.id, e.target.value)}
                placeholder="Notiz — z. B. Vetorecht bei Budgetfreigabe"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={rolle}
          onChange={(e) => setRolle(e.target.value as StakeholderRolle)}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
        >
          {ROLLEN.map((r) => <option key={r.wert} value={r.wert}>{r.label}</option>)}
        </select>
        <input
          className={inputCls}
          value={entwurf}
          onChange={(e) => setEntwurf(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); hinzu() } }}
          placeholder={ROLLEN.find((r) => r.wert === rolle)?.frage}
        />
        <button
          type="button"
          onClick={hinzu}
          disabled={!entwurf.trim()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 flex-shrink-0"
        >
          +
        </button>
      </div>

      {daten.stakeholder.length > 0 && fehlendeRollen.length > 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          Noch niemand unter: <strong>{fehlendeRollen.map((r) => r.label).join(', ')}</strong>.
          {fehlendeRollen.some((r) => r.wert === 'entscheidet') &&
            ' Wer zustimmen muss, gehört benannt, bevor gebaut wird — das ist der häufigste Stolperstein.'}
        </p>
      )}
    </div>
  )
}

// ── ⑧ Abhängigkeiten & Vorentscheidungen ─────────────────────────────────

export function AbhaengigkeitenFeld({ ucId, nummer }: { ucId?: string; nummer: number }) {
  const { daten, sichern } = useZusatz(ucId)
  const [was, setWas] = useState('')
  const [wer, setWer] = useState('')

  const hinzu = () => {
    if (!was.trim()) return
    sichern({
      ...daten,
      abhaengigkeiten: [...daten.abhaengigkeiten,
        { id: nanoid(), was: was.trim(), entscheider: wer.trim(), status: 'offen' }],
    })
    setWas(''); setWer('')
  }

  const umschalten = (id: string) =>
    sichern({
      ...daten,
      abhaengigkeiten: daten.abhaengigkeiten.map((a) =>
        a.id === id ? { ...a, status: a.status === 'offen' ? 'geklaert' : 'offen' } : a),
    })

  const setzeEntscheider = (id: string, entscheider: string) =>
    sichern({
      ...daten,
      abhaengigkeiten: daten.abhaengigkeiten.map((a) => (a.id === id ? { ...a, entscheider } : a)),
    })

  const weg = (id: string) =>
    sichern({
      ...daten,
      abhaengigkeiten: daten.abhaengigkeiten
        .filter((a) => a.id !== id)
        // Verweise auf den entfernten Eintrag mitnehmen, sonst zeigen sie ins Leere
        .map((a) => ({ ...a, haengtVon: (a.haengtVon ?? []).filter((v) => v !== id) })),
    })

  const toggleVorbedingung = (id: string, vorId: string) =>
    sichern({
      ...daten,
      abhaengigkeiten: daten.abhaengigkeiten.map((a) => {
        if (a.id !== id) return a
        const bisher = a.haengtVon ?? []
        return { ...a, haengtVon: bisher.includes(vorId) ? bisher.filter((v) => v !== vorId) : [...bisher, vorId] }
      }),
    })

  const stufen = stufenBerechnen(daten.abhaengigkeiten)
  const offen = daten.abhaengigkeiten.filter((a) => a.status === 'offen')
  const ohneEntscheider = offen.filter((a) => !a.entscheider.trim())

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-xs font-semibold text-slate-600">
          {nummer} · Abhängigkeiten &amp; Vorentscheidungen
        </label>
        <span className="text-[11px] text-slate-400">
          Was zuerst geklärt sein muss — und wer entscheidet
        </span>
      </div>

      {/* Reihenfolge aus den Vorbedingungen — zeigt, was parallel laufen kann */}
      {daten.abhaengigkeiten.length > 1 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-700">Reihenfolge</p>
            <span className="text-[10px] text-slate-400">
              {stufen.ebenen.length > 0
                ? `${stufen.ebenen.length} ${stufen.ebenen.length === 1 ? 'Runde' : 'Runden'} nacheinander`
                : ''}
            </span>
          </div>

          {stufen.ebenen.map((ebene, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex justify-center py-0.5">
                  <span className="text-slate-300 text-xs leading-none">↓</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-slate-400 w-10 flex-shrink-0 pt-1">
                  {i + 1}.
                </span>
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {ebene.map((a) => {
                    const blockiert = istBlockiert(a, daten.abhaengigkeiten)
                    return (
                      <span
                        key={a.id}
                        className={`text-[11px] px-2 py-1 rounded-md max-w-[220px] truncate ${
                          a.status === 'geklaert' ? 'bg-green-100 text-green-700 line-through'
                          : blockiert ? 'bg-amber-100 text-amber-800'
                          : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                        title={a.entscheider ? `${a.was} — entscheidet: ${a.entscheider}` : a.was}
                      >
                        {a.status === 'geklaert' ? '✓ ' : blockiert ? '⏳ ' : ''}{a.was}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {stufen.ringschluss.length > 0 && (
            <p className="text-[11px] text-red-800 bg-red-50 border border-red-200 rounded px-2 py-1.5">
              <strong>Ringschluss:</strong> {stufen.ringschluss.map((a) => a.was).join(' ↔ ')} warten
              gegenseitig aufeinander. So kann niemand anfangen — eine der Abhängigkeiten muss weg.
            </p>
          )}

          {stufen.ebenen.length > 1 && stufen.ringschluss.length === 0 && (
            <p className="text-[10px] text-slate-400 pt-0.5">
              Was in derselben Zeile steht, lässt sich parallel klären. Die Zahl der Zeilen ist die
              Mindestzahl an Runden — sie bestimmt die Vorlaufzeit stärker als die Entwicklungsdauer.
            </p>
          )}
        </div>
      )}

      {daten.abhaengigkeiten.length > 0 && (
        <div className="space-y-1.5">
          {daten.abhaengigkeiten.map((a) => (
            <div key={a.id} className={`group rounded-lg border px-3 py-2 ${
              a.status === 'geklaert' ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => umschalten(a.id)}
                  className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 transition-colors ${
                    a.status === 'geklaert' ? 'bg-green-500 text-white' : 'border border-slate-300 text-transparent hover:border-slate-400'
                  }`}
                  title={a.status === 'geklaert' ? 'Wieder öffnen' : 'Als geklärt markieren'}
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] leading-snug ${
                    a.status === 'geklaert' ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}>
                    {a.was}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-400 flex-shrink-0">entscheidet:</span>
                    <input
                      className="border-0 border-b border-transparent focus:border-slate-200 px-0 py-0 text-[11px] text-slate-600 focus:outline-none bg-transparent flex-1 min-w-0"
                      value={a.entscheider}
                      onChange={(e) => setzeEntscheider(a.id, e.target.value)}
                      placeholder="noch offen — wer?"
                    />
                  </div>

                  {/* Vorbedingungen wählen — daraus entsteht die Reihenfolge oben */}
                  {daten.abhaengigkeiten.length > 1 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 flex-shrink-0">erst nach:</span>
                      {daten.abhaengigkeiten
                        .filter((v) => v.id !== a.id)
                        .map((v) => {
                          const an = (a.haengtVon ?? []).includes(v.id)
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => toggleVorbedingung(a.id, v.id)}
                              className={`text-[10px] px-1.5 py-0.5 rounded max-w-[150px] truncate transition-colors ${
                                an ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={an ? `Nicht mehr von „${v.was}" abhängig` : `Erst nach „${v.was}"`}
                            >
                              {v.was}
                            </button>
                          )
                        })}
                      {(a.haengtVon ?? []).length === 0 && (
                        <span className="text-[10px] text-slate-300">— kann sofort beginnen</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => weg(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs flex-shrink-0 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_180px_auto] gap-2">
        <input
          className={inputCls}
          value={was}
          onChange={(e) => setWas(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); hinzu() } }}
          placeholder="Was muss vorher geklärt sein? z. B. AVV mit dem Anbieter"
        />
        <input
          className={inputCls}
          value={wer}
          onChange={(e) => setWer(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); hinzu() } }}
          placeholder="Wer entscheidet?"
        />
        <button
          type="button"
          onClick={hinzu}
          disabled={!was.trim()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 flex-shrink-0"
        >
          +
        </button>
      </div>

      {ohneEntscheider.length > 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          {ohneEntscheider.length} offene {ohneEntscheider.length === 1 ? 'Vorfrage hat' : 'Vorfragen haben'} keinen
          Entscheider. Ohne Namen bleibt sie liegen, bis sie das Vorhaben blockiert.
        </p>
      )}
      {offen.length > 0 && ohneEntscheider.length === 0 && (
        <p className="text-[11px] text-slate-400">
          {offen.length} offen — der Zeitplan beginnt erst, wenn diese geklärt sind.
        </p>
      )}
    </div>
  )
}
