import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUseCasesStore } from '../../store/useCasesStore'
import {
  leiteSignaleAb, leseBeschluesse, schreibeBeschluss, stempleNeue,
  tageSeit, istUeberfaellig, istZuEntscheiden, zaehleOffen, ENTSCHEIDUNG_LABEL, SIGNAL_EVENT,
} from '../../lib/signale'
import type { Signal, Beschluss, Entscheidung } from '../../lib/signale'
import { TON, Wahl } from '../ui/Pruefung'
import type { WahlOption } from '../ui/Pruefung'

// ─────────────────────────────────────────────────────────────────────────
// Was der Betrieb meldet — und was jemand daraufhin entschieden hat.
//
// Die Zeilen entstehen aus den Prüfungen, nicht aus Eingaben. Neu ist
// allein die rechte Spalte: die Entscheidung. „Beobachten" steht dort
// gleichberechtigt neben „Angenommen" — bewusst nichts zu tun ist eine
// Entscheidung, und wenn die Liste das nicht zulässt, pflegt sie niemand.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Die Zahl für Reiter und Dashboard. Hört auf Beschlüsse, damit sie sich
 * mitbewegt, statt bis zum nächsten Seitenwechsel falsch dazustehen.
 */
export function useOffeneSignale(): number {
  const { useCases } = useUseCasesStore()
  const [runde, setRunde] = useState(0)
  useEffect(() => {
    const auf = () => setRunde((r) => r + 1)
    window.addEventListener(SIGNAL_EVENT, auf)
    return () => window.removeEventListener(SIGNAL_EVENT, auf)
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => zaehleOffen(leiteSignaleAb(useCases), leseBeschluesse()), [useCases, runde])
}

const OPTIONEN: WahlOption<Entscheidung>[] = [
  { wert: 'offen',       label: 'Offen' },
  { wert: 'beobachten',  label: 'Beobachten', ton: 'teils' },
  { wert: 'angenommen',  label: 'Angenommen', ton: 'ok' },
  { wert: 'verworfen',   label: 'Verworfen' },
]

const eingabe = 'border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function heute(): string {
  return new Date().toISOString().slice(0, 10)
}

function Zeile({ nr, signal, beschluss, onBeschluss }: {
  nr: number
  signal: Signal
  beschluss: Beschluss
  onBeschluss: (b: Beschluss) => void
}) {
  const navigate = useNavigate()
  const ueberfaellig = istUeberfaellig(beschluss)
  const tage = tageSeit(beschluss.seit)
  const t = TON[signal.ton]

  return (
    <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 md:grid-cols-[2rem_1fr_9rem_6rem] md:items-start gap-x-3 gap-y-2">
      <span className="text-[11px] font-mono text-slate-400 pt-0.5">{String(nr).padStart(2, '0')}</span>

      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${t.punkt}`} />
          <p className="text-sm text-slate-800 leading-snug">{signal.text}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 ml-3.5">
          {signal.fall && <span className="text-[11px] text-slate-500">{signal.fall}</span>}
          <button
            type="button"
            onClick={() => navigate(signal.pfad)}
            className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
          >
            {signal.herkunft} →
          </button>
        </div>
      </div>

      <div className="text-[11px]">
        <span className={ueberfaellig ? 'text-red-700 font-semibold' : 'text-slate-500'}>
          {tage === 0 ? 'heute' : `seit ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`}
        </span>
        {ueberfaellig && <span className="block text-red-700 font-semibold">Frist verstrichen</span>}
      </div>

      <div className="md:col-start-2 md:col-span-3 space-y-2">
        <Wahl
          optionen={OPTIONEN}
          wert={beschluss.entscheidung}
          onWaehle={(e) => onBeschluss({ ...beschluss, entscheidung: e })}
        />

        {beschluss.entscheidung === 'angenommen' && (
          <div className="flex flex-wrap gap-2">
            <input
              className={`${eingabe} w-44`}
              placeholder="Wer kümmert sich?"
              value={beschluss.wer ?? ''}
              onChange={(e) => onBeschluss({ ...beschluss, wer: e.target.value })}
            />
            <input
              type="date" className={eingabe} min={heute()}
              value={beschluss.frist ?? ''}
              onChange={(e) => onBeschluss({ ...beschluss, frist: e.target.value })}
            />
          </div>
        )}

        {beschluss.entscheidung === 'beobachten' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">Wiedervorlage</span>
            <input
              type="date" className={eingabe} min={heute()}
              value={beschluss.frist ?? ''}
              onChange={(e) => onBeschluss({ ...beschluss, frist: e.target.value })}
            />
          </div>
        )}

        {beschluss.entscheidung === 'verworfen' && (
          <input
            className={`${eingabe} w-full max-w-md`}
            placeholder="Warum wird das nicht verfolgt?"
            value={beschluss.grund ?? ''}
            onChange={(e) => onBeschluss({ ...beschluss, grund: e.target.value })}
          />
        )}
      </div>
    </div>
  )
}

export default function Signalliste() {
  const { useCases } = useUseCasesStore()
  const [beschluesse, setBeschluesse] = useState<Record<string, Beschluss>>(() => leseBeschluesse())
  // Voreinstellung ist die Menge, die auch auf der Kachel steht — nicht
  // „alle". Sonst nennt die Kachel eine Zahl und die Liste zeigt eine andere.
  const [filter, setFilter] = useState<Entscheidung | 'alle' | 'zuTun'>('zuTun')

  const signale = useMemo(() => leiteSignaleAb(useCases), [useCases])

  // Neue Signale bekommen ihren Zeitstempel beim ersten Sehen. Das ist der
  // einzige Schreibvorgang, der ohne Zutun passiert — ohne ihn gäbe es
  // kein „offen seit", und damit keine Frage nach den ältesten Einträgen.
  useEffect(() => {
    if (stempleNeue(signale)) setBeschluesse(leseBeschluesse())
  }, [signale])

  const setzeBeschluss = (key: string, b: Beschluss) => {
    schreibeBeschluss(key, b)
    setBeschluesse((p) => ({ ...p, [key]: b }))
  }

  const stand = (s: Signal): Beschluss =>
    beschluesse[s.key] ?? { entscheidung: 'offen', seit: new Date().toISOString() }

  // Älteste zuerst — das ist die Reihenfolge, in der die Frage nach dem
  // Verbleib überhaupt gestellt werden kann.
  const sortiert = useMemo(() => {
    const liste = filter === 'alle' ? signale
      : filter === 'zuTun' ? signale.filter((s) => istZuEntscheiden(s, beschluesse))
      : signale.filter((s) => stand(s).entscheidung === filter)
    return [...liste].sort((a, b) => {
      const ua = istUeberfaellig(stand(a)) ? 0 : 1
      const ub = istUeberfaellig(stand(b)) ? 0 : 1
      if (ua !== ub) return ua - ub
      return stand(a).seit.localeCompare(stand(b).seit)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signale, beschluesse, filter])

  const zaehler = (e: Entscheidung) => signale.filter((s) => stand(s).entscheidung === e).length

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <p className="text-sm text-slate-700 leading-relaxed">
          Diese Liste wird nicht gepflegt, sondern <strong className="font-semibold">abgeleitet</strong>.
          Jede Zeile stammt aus einer Prüfung, einem Nachweis oder einem Betriebs-KPI und führt per
          Klick dorthin zurück. Beantwortet jemand die zugrunde liegende Frage, verschwindet die
          Zeile von selbst.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-2">
          Gespeichert wird allein die rechte Spalte — was jemand entschieden hat.
          <strong className="font-semibold"> „Beobachten" ist eine gültige Entscheidung</strong>,
          nicht das Fehlen einer. Ein Alarm ist eine Frage, kein Auftrag.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {([
          ['zuTun', `Zu entscheiden · ${zaehleOffen(signale, beschluesse)}`],
          ['alle', `Alle · ${signale.length}`],
          ...(['offen', 'beobachten', 'angenommen', 'verworfen'] as Entscheidung[])
            .map((e) => [e, `${ENTSCHEIDUNG_LABEL[e]} · ${zaehler(e)}`]),
        ] as [Entscheidung | 'alle' | 'zuTun', string][])
          .map(([wert, label]) => (
            <button
              key={wert}
              type="button"
              onClick={() => setFilter(wert)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === wert
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <div className="px-4 py-3 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-slate-800">Signale</h3>
          <span className="text-[11px] text-slate-400">älteste zuerst</span>
        </div>

        {sortiert.length === 0 ? (
          <div className="border-t border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              {signale.length === 0
                ? 'Keine offenen Signale. Sobald eine Prüfung etwas offenlässt, steht es hier.'
                : 'In dieser Ansicht steht nichts — wechsle den Filter.'}
            </p>
          </div>
        ) : (
          sortiert.map((s, i) => (
            <Zeile
              key={s.key}
              nr={i + 1}
              signal={s}
              beschluss={stand(s)}
              onBeschluss={(b) => setzeBeschluss(s.key, b)}
            />
          ))
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Verschwindet ein Signal und tritt später erneut auf, behält es seinen ursprünglichen
        Zeitstempel. Sonst würde jedes Hin und Her die Uhr zurücksetzen — und gerade die alten
        Fälle verschwänden aus dem Blick. Die Entscheidungen liegen lokal beim Mandanten.
      </p>
    </div>
  )
}
