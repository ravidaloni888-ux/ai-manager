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
  /**
   * Einrücktiefe. Ein eingerückter Eintrag hängt von dem darüberliegenden
   * mit kleinerer Tiefe ab — die Liste ist damit selbst die Reihenfolge.
   */
  ebene?: number
}

/** Der übergeordnete Eintrag: der nächste darüber mit kleinerer Tiefe. */
export function elternteil(items: Abhaengigkeit[], i: number): Abhaengigkeit | null {
  const meine = items[i]?.ebene ?? 0
  for (let j = i - 1; j >= 0; j--) {
    if ((items[j].ebene ?? 0) < meine) return items[j]
  }
  return null
}

/** Blockiert = ein Eintrag weiter oben in der Kette ist noch offen. */
export function istBlockiert(items: Abhaengigkeit[], i: number): boolean {
  let tiefe = items[i]?.ebene ?? 0
  for (let j = i - 1; j >= 0 && tiefe > 0; j--) {
    const e = items[j].ebene ?? 0
    if (e < tiefe) {
      if (items[j].status === 'offen') return true
      tiefe = e
    }
  }
  return false
}

/** Wie viele Einträge direkt darunter gehören zu diesem (seine Kinder samt Enkeln)? */
export function bereichLaenge(items: Abhaengigkeit[], i: number): number {
  const meine = items[i]?.ebene ?? 0
  let n = 1
  while (i + n < items.length && (items[i + n].ebene ?? 0) > meine) n++
  return n
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
  const [ziehtIdx, setZiehtIdx] = useState<number | null>(null)
  const [ueberIdx, setUeberIdx] = useState<number | null>(null)

  const items = daten.abhaengigkeiten
  const setItems = (next: Abhaengigkeit[]) => sichern({ ...daten, abhaengigkeiten: next })

  const hinzu = () => {
    if (!was.trim()) return
    setItems([...items, {
      id: nanoid(), was: was.trim(), entscheider: wer.trim(), status: 'offen',
      ebene: items.length > 0 ? (items[items.length - 1].ebene ?? 0) : 0,
    }])
    setWas(''); setWer('')
  }

  const umschalten = (id: string) =>
    setItems(items.map((a) => (a.id === id
      ? { ...a, status: a.status === 'offen' ? 'geklaert' : 'offen' } : a)))

  const setzeEntscheider = (id: string, entscheider: string) =>
    setItems(items.map((a) => (a.id === id ? { ...a, entscheider } : a)))

  /** Einen Eintrag samt allem, was unter ihm eingerückt ist, entfernen. */
  const weg = (i: number) => {
    const n = bereichLaenge(items, i)
    setItems([...items.slice(0, i), ...items.slice(i + n)])
  }

  /**
   * Einrücken geht nur, wenn darüber ein Eintrag steht, an den man sich
   * hängen kann — höchstens eine Ebene tiefer als der Vorgänger.
   */
  const einruecken = (i: number, richtung: 1 | -1) => {
    const meine = items[i].ebene ?? 0
    const vorher = i > 0 ? (items[i - 1].ebene ?? 0) : -1
    const ziel = meine + richtung
    if (ziel < 0 || ziel > vorher + 1) return
    // Untergeordnete wandern mit, sonst reißt die Kette
    const n = bereichLaenge(items, i)
    const next = items.map((a, j) =>
      j >= i && j < i + n ? { ...a, ebene: (a.ebene ?? 0) + richtung } : a)
    setItems(next)
  }

  /** Ziehen verschiebt den Eintrag mit allem, was unter ihm hängt. */
  const ablegen = (zielIdx: number) => {
    if (ziehtIdx === null || ziehtIdx === zielIdx) { setZiehtIdx(null); setUeberIdx(null); return }
    const n = bereichLaenge(items, ziehtIdx)
    // Nicht in den eigenen Unterbaum fallen lassen
    if (zielIdx > ziehtIdx && zielIdx < ziehtIdx + n) { setZiehtIdx(null); setUeberIdx(null); return }

    const block = items.slice(ziehtIdx, ziehtIdx + n)
    const ohne = [...items.slice(0, ziehtIdx), ...items.slice(ziehtIdx + n)]
    const einfuegeIdx = zielIdx > ziehtIdx ? zielIdx - n : zielIdx

    // Tiefe an die neue Umgebung anpassen, damit nichts in der Luft hängt
    const vorher = einfuegeIdx > 0 ? (ohne[einfuegeIdx - 1].ebene ?? 0) : -1
    const versatz = Math.min(0, vorher + 1 - (block[0].ebene ?? 0))
    const angepasst = block.map((a) => ({ ...a, ebene: Math.max(0, (a.ebene ?? 0) + versatz) }))

    setItems([...ohne.slice(0, einfuegeIdx), ...angepasst, ...ohne.slice(einfuegeIdx)])
    setZiehtIdx(null); setUeberIdx(null)
  }

  const offen = items.filter((a) => a.status === 'offen')
  const ohneEntscheider = offen.filter((a) => !a.entscheider.trim())
  const tiefe = items.reduce((m, a) => Math.max(m, (a.ebene ?? 0) + 1), 0)

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

      {items.length > 1 && (
        <p className="text-[11px] text-slate-400">
          Ziehen ordnet um, <span className="font-mono">→</span> rückt ein.
          Eingerückt heißt: hängt vom Eintrag darüber ab.
          {tiefe > 1 && <> · {tiefe} Ebenen tief</>}
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((a, i) => {
            const ebene = a.ebene ?? 0
            const blockiert = istBlockiert(items, i)
            const eltern = elternteil(items, i)
            const kannRein = i > 0 && ebene <= (items[i - 1].ebene ?? 0)
            return (
              <div
                key={a.id}
                style={{ marginLeft: ebene * 24 }}
                draggable
                onDragStart={() => setZiehtIdx(i)}
                onDragEnd={() => { setZiehtIdx(null); setUeberIdx(null) }}
                onDragOver={(e) => { e.preventDefault(); setUeberIdx(i) }}
                onDrop={(e) => { e.preventDefault(); ablegen(i) }}
                className={`group rounded-lg border px-2.5 py-2 transition-colors ${
                  ziehtIdx === i ? 'opacity-40'
                  : ueberIdx === i ? 'border-blue-400 bg-blue-50'
                  : a.status === 'geklaert' ? 'border-green-200 bg-green-50/50'
                  : blockiert ? 'border-amber-200 bg-amber-50/40'
                  : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing text-xs leading-none pt-1 flex-shrink-0 select-none"
                    title="Ziehen zum Umsortieren"
                  >
                    ⠿
                  </span>

                  <button
                    type="button"
                    onClick={() => umschalten(a.id)}
                    className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 transition-colors ${
                      a.status === 'geklaert' ? 'bg-green-500 text-white'
                      : 'border border-slate-300 text-transparent hover:border-slate-400'
                    }`}
                    title={a.status === 'geklaert' ? 'Wieder öffnen' : 'Als geklärt markieren'}
                  >
                    ✓
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${
                      a.status === 'geklaert' ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}>
                      {blockiert && <span title="wartet auf einen offenen Eintrag darüber">⏳ </span>}
                      {a.was}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex-shrink-0">entscheidet:</span>
                      <input
                        className="border-0 border-b border-transparent focus:border-slate-200 px-0 py-0 text-[11px] text-slate-600 focus:outline-none bg-transparent flex-1 min-w-0"
                        value={a.entscheider}
                        onChange={(e) => setzeEntscheider(a.id, e.target.value)}
                        placeholder="noch offen — wer?"
                      />
                    </div>
                    {eltern && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        erst nach: {eltern.was}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => einruecken(i, -1)}
                      disabled={ebene === 0}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:hover:text-slate-300 text-xs px-1"
                      title="Ausrücken"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => einruecken(i, 1)}
                      disabled={!kannRein}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:hover:text-slate-300 text-xs px-1"
                      title="Einrücken — hängt dann vom Eintrag darüber ab"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => weg(i)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs px-1 transition-opacity"
                      title="Entfernen — samt allem, was darunter hängt"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
          {offen.length} offen{tiefe > 1 && ` · ${tiefe} Ebenen — was nicht eingerückt ist, kann parallel laufen`}.
        </p>
      )}
    </div>
  )
}
