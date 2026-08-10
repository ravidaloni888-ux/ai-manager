import type { VerfuegbarkeitState } from './DatenverfuegbarkeitCheck'
import type { DataQualityState } from './DataQualityCheck'
import { fairAusPruefungen, FAIR_STAND_LABEL, type FairStand } from '../../lib/fair'

// FAIR als Lesart der Datengrundlage — die Theorie steht unter /data.

const FARBE: Record<FairStand, { rand: string; kachel: string; text: string }> = {
  erfuellt:  { rand: 'border-emerald-200', kachel: 'bg-emerald-500 text-white', text: 'text-emerald-700' },
  teilweise: { rand: 'border-amber-200',   kachel: 'bg-amber-500 text-white',   text: 'text-amber-700' },
  kritisch:  { rand: 'border-red-200',     kachel: 'bg-red-500 text-white',     text: 'text-red-700' },
  offen:     { rand: 'border-slate-200',   kachel: 'bg-slate-200 text-slate-500', text: 'text-slate-400' },
}

export default function FairAnsicht({ v, q }: { v?: VerfuegbarkeitState; q?: DataQualityState }) {
  const zeilen = fairAusPruefungen(v, q)
  const beantwortet = zeilen.filter((z) => z.stand !== 'offen').length

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">FAIR-Prinzipien</p>
        <span className="text-[11px] text-slate-400">
          {beantwortet === 0 ? 'ergibt sich aus den Antworten oben' : `${beantwortet}/4 abgedeckt`}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Keine eigene Erhebung — dieselben Sachverhalte im Vokabular der Forschungsdaten
        (Wilkinson et al. 2016). Die Prinzipien im Detail stehen unter{' '}
        <a href="/data" className="text-blue-600 hover:underline font-medium">Daten-Governance</a>.
      </p>
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {zeilen.map((z) => {
          const f = FARBE[z.stand]
          return (
            <div key={z.key} className={`flex items-start gap-2 rounded-lg border ${f.rand} px-2.5 py-2`}>
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold ${f.kachel}`}>
                {z.buchstabe}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-700 leading-tight">{z.titel}</p>
                <p className={`text-[10px] ${f.text} leading-tight mt-0.5`}>
                  {FAIR_STAND_LABEL[z.stand]} · {z.quelle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
