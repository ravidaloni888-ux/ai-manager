import type { VerfuegbarkeitState } from './DatenverfuegbarkeitCheck'
import type { DataQualityState } from './DataQualityCheck'
import { fairAusPruefungen, FAIR_STAND_LABEL, type FairStand } from '../../lib/fair'
import { Pruefblock, TON, type Ton } from '../ui/Pruefung'

// FAIR als Lesart der Datengrundlage — die Theorie steht unter /data.

const ALS_TON: Record<FairStand, Ton> = {
  erfuellt: 'ok', teilweise: 'teils', kritisch: 'stopp', offen: 'neutral',
}

export default function FairAnsicht({ v, q }: { v?: VerfuegbarkeitState; q?: DataQualityState }) {
  const zeilen = fairAusPruefungen(v, q)
  const beantwortet = zeilen.filter((z) => z.stand !== 'offen').length

  return (
    <Pruefblock
      titel="FAIR-Prinzipien — abgeleitet"
      hinweis="Keine eigene Erhebung: dieselben Sachverhalte im Vokabular der Forschungsdaten (Wilkinson et al. 2016)."
      stand={<span className="text-[11px] text-slate-400 flex-shrink-0">{beantwortet}/4</span>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {zeilen.map((z) => {
          const t = TON[ALS_TON[z.stand]]
          return (
            <div key={z.key} className={`flex items-start gap-2 rounded-lg border ${t.rand} ${t.flaeche} px-2.5 py-2`}>
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold ${t.voll}`}>
                {z.buchstabe}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-700 leading-tight">{z.titel}</p>
                <p className={`text-[10px] ${t.schrift} leading-tight mt-0.5`}>
                  {FAIR_STAND_LABEL[z.stand]} · aus {z.quelle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-slate-400">
        Was die Prinzipien bedeuten, steht unter{' '}
        <a href="/data" className="text-blue-600 hover:underline font-medium">Daten-Governance</a>.
      </p>
    </Pruefblock>
  )
}
