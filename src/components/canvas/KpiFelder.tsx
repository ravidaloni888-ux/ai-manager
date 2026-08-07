import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Erfolgskennzahlen mit drei Angaben.
//
// Ein KPI ohne Ausgangswert ist eine Behauptung, einer ohne Messmethode
// eine Absichtserklärung. Erst Baseline, Zielwert und Messmethode
// zusammen machen ihn nachprüfbar — deshalb drei Felder statt Freitext.
// ─────────────────────────────────────────────────────────────────────────

export interface Kpi {
  id: string
  name: string
  baseline: string
  ziel: string
  methode: string
}

const LEER = (): Kpi => ({ id: nanoid(), name: '', baseline: '', ziel: '', methode: '' })

const BUCKET = 'kpis'

const SPALTEN: { key: keyof Omit<Kpi, 'id' | 'name'>; label: string; frage: string; beispiel: string }[] = [
  { key: 'baseline', label: 'Baseline', frage: 'Wo stehen wir heute?',            beispiel: 'Bearbeitungszeit aktuell 3 Tage' },
  { key: 'ziel',     label: 'Zielwert', frage: 'Wo wollen wir hin — bis wann?',   beispiel: 'Unter 4 Stunden nach 6 Pilotmonaten' },
  { key: 'methode',  label: 'Messmethode', frage: 'Wer erhebt das, wie oft?',     beispiel: 'Fachbereich, monatlich aus dem Ticketsystem' },
]

/** Aus den Bausteinen einen lesbaren Satz — er landet in successMetrics. */
export function kpiSatz(k: Kpi): string {
  if (!k.name.trim()) return ''
  const teile = [
    k.name.trim(),
    k.baseline.trim() && `heute ${k.baseline.trim()}`,
    k.ziel.trim() && `Ziel ${k.ziel.trim()}`,
    k.methode.trim() && `gemessen: ${k.methode.trim()}`,
  ].filter(Boolean)
  return teile.join(' · ')
}

interface Props {
  ucId?: string
  /** Freitext aus dem Datensatz — Rückfall, solange keine Struktur vorliegt */
  freitext: string
  onChange: (text: string) => void
  readonly?: boolean
}

export default function KpiFelder({ ucId, freitext, onChange, readonly }: Props) {
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [geladen, setGeladen] = useState(false)
  const [hilfeOffen, setHilfeOffen] = useState(false)

  const speicherbar = !!ucId && getMandantType() !== 'demo'

  useEffect(() => {
    if (!ucId) { setKpis([LEER()]); setGeladen(true); return }
    const alle = scopedGet<Record<string, Kpi[]>>(BUCKET, {})
    const vorhanden = alle[ucId]
    setKpis(vorhanden?.length ? vorhanden : [LEER()])
    setGeladen(true)
  }, [ucId])

  const sichern = (next: Kpi[]) => {
    setKpis(next)
    if (speicherbar && ucId) {
      const alle = scopedGet<Record<string, Kpi[]>>(BUCKET, {})
      scopedSet(BUCKET, { ...alle, [ucId]: next })
    }
    // Der zusammengesetzte Text bleibt die Quelle für Liste, Export und Supabase
    onChange(next.map(kpiSatz).filter(Boolean).join('\n'))
  }

  const setFeld = (id: string, feld: keyof Kpi, wert: string) =>
    sichern(kpis.map((k) => (k.id === id ? { ...k, [feld]: wert } : k)))

  const hinzu = () => sichern([...kpis, LEER()])
  const weg = (id: string) => sichern(kpis.filter((k) => k.id !== id))

  const inputCls = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50'

  // Solange nichts strukturiert erfasst ist, den alten Freitext zeigen
  const nurFreitext = geladen && kpis.every((k) => !k.name.trim()) && freitext.trim().length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-xs font-semibold text-slate-600">2 · Erfolgskennzahlen (KPIs)</label>
        <button
          type="button"
          onClick={() => setHilfeOffen((v) => !v)}
          className="text-[11px] text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          {hilfeOffen ? 'Hinweis ausblenden' : 'Was gehört in einen KPI?'}
        </button>
      </div>

      {hilfeOffen && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-2">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Jeder KPI braucht drei Angaben — sonst bleibt er unscharf:
          </p>
          <div className="space-y-1.5">
            {SPALTEN.map((s) => (
              <div key={s.key} className="grid grid-cols-[80px_1fr] gap-2 items-baseline">
                <span className="text-[11px] font-semibold text-slate-700">{s.label}</span>
                <span className="text-[11px] text-slate-600">
                  {s.frage} <span className="text-slate-400">— {s.beispiel}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-200">
            Organisationen, die ihre KI-Initiativen an konkrete Geschäfts-KPI koppeln, berichten deutlich
            häufiger einen tatsächlichen EBIT-Effekt als solche, die nur die Nutzung messen.
            <span className="block">Quelle: McKinsey — The State of AI in 2025, November 2025</span>
          </p>
        </div>
      )}

      {nurFreitext && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] text-amber-900 leading-relaxed">
            <strong>Bisher als Freitext erfasst:</strong> {freitext}
          </p>
          <p className="text-[10px] text-amber-800 mt-1">
            Tragen Sie ihn unten strukturiert ein — Baseline und Messmethode fehlen sonst.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {kpis.map((k, i) => (
          <div key={k.id} className="rounded-lg border border-slate-200 p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 w-4 flex-shrink-0">{i + 1}</span>
              <input
                className={inputCls}
                disabled={readonly}
                value={k.name}
                onChange={(e) => setFeld(k.id, 'name', e.target.value)}
                placeholder="Kennzahl — z. B. Bearbeitungszeit je Vorgang"
              />
              {kpis.length > 1 && !readonly && (
                <button
                  type="button"
                  onClick={() => weg(k.id)}
                  className="text-slate-300 hover:text-red-500 text-xs flex-shrink-0 px-1"
                  title="Entfernen"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-2 pl-6">
              {SPALTEN.map((s) => (
                <div key={s.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">{s.label}</label>
                  <input
                    className={inputCls}
                    disabled={readonly}
                    value={k[s.key]}
                    onChange={(e) => setFeld(k.id, s.key, e.target.value)}
                    placeholder={s.beispiel}
                  />
                </div>
              ))}
            </div>
            {kpiSatz(k) && (
              <p className="text-[11px] text-slate-500 bg-slate-50 rounded px-2 py-1.5 ml-6">
                {kpiSatz(k)}
              </p>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <button
          type="button"
          onClick={hinzu}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-500"
        >
          + Weitere Kennzahl
        </button>
      )}
    </div>
  )
}
