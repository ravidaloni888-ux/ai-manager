import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────
// FAIR — die Theorie. Bewertet wird im Anwendungsfall, nicht hier.
//
// Die Prinzipien stammen aus dem Forschungsdatenmanagement (Wilkinson et
// al. 2016) und sind heute Leitbild für jedes nachhaltige Datenmanagement.
// Im Fall werden sie nicht erneut abgefragt, sondern aus Gate und
// Qualitätsdimensionen abgeleitet — dieselben Sachverhalte, anderes
// Vokabular.
// ─────────────────────────────────────────────────────────────────────────

export const FAIR_PRINZIPIEN = [
  {
    key: 'findable',
    letter: 'F',
    title: 'Findable',
    bedeutung: 'Auffindbar',
    inhalt: 'Daten mit eindeutiger ID in durchsuchbarem Verzeichnis.',
    praxisfrage: 'Kann das System einen Eintrag gezielt finden — oder durchsucht es immer den gesamten Korpus?',
    merkmale: [
      'Jeder Datensatz / jedes Dokument hat eine eindeutige, stabile ID.',
      'Ein durchsuchbares Verzeichnis (Index/Katalog) existiert.',
      'Metadaten beschreiben den Inhalt für gezieltes Auffinden.',
    ],
    imFall: 'Existenz der Daten',
  },
  {
    key: 'accessible',
    letter: 'A',
    title: 'Accessible',
    bedeutung: 'Zugänglich',
    inhalt: 'Standard-Protokolle · auch wenn der Ersteller nicht mehr verfügbar ist.',
    praxisfrage: 'Was passiert mit den Daten, wenn der Ersteller in Rente geht und sein Konto deaktiviert wird?',
    merkmale: [
      'Zugriff über offene Standard-Protokolle (nicht an eine Person gebunden).',
      'Daten bleiben verfügbar, auch wenn der Ersteller ausscheidet.',
      'Zugriffsrechte sind klar geregelt und dokumentiert.',
    ],
    imFall: 'Zugänglichkeit',
  },
  {
    key: 'interoperable',
    letter: 'I',
    title: 'Interoperable',
    bedeutung: 'Interoperabel',
    inhalt: 'Gemeinsame Vokabularien und Formate · kombinierbar mit anderen Datensätzen.',
    praxisfrage: 'Ist die Terminologie mit anderen Systemen (z. B. SAP-Projektbezeichnungen) kompatibel?',
    merkmale: [
      'Gemeinsame, standardisierte Vokabularien / Terminologie.',
      'Offene, austauschbare Datenformate.',
      'Kombinierbar mit anderen relevanten Datensätzen im Haus.',
    ],
    imFall: 'Qualitätsdimensionen Interoperabilität und Konsistenz',
  },
  {
    key: 'reusable',
    letter: 'R',
    title: 'Reusable',
    bedeutung: 'Wiederverwendbar',
    inhalt: 'Klare Nutzungslizenzen + Provenienzangaben (Herkunftsnachweise).',
    praxisfrage: 'Dürfen die Daten auch von anderen Niederlassungen genutzt werden — und wer hat das entschieden?',
    merkmale: [
      'Klare Nutzungslizenz / Nutzungsrechte definiert.',
      'Provenienz (Herkunft, Quelle) ist dokumentiert.',
      'Nutzungskontext und Einschränkungen sind beschrieben.',
    ],
    imFall: 'Nutzungsrecht',
  },
]

const FARBEN: Record<string, { bg: string; text: string; border: string }> = {
  F: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300' },
  A: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-300' },
  I: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  R: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
}

export default function FairPrinzipien() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>FAIR — Leitbild für nachhaltiges Datenmanagement.</strong> Ursprünglich für
        Forschungsdaten — heute Leitbild für jedes nachhaltige Datenmanagementsystem.
        <span className="block mt-1 text-xs text-slate-400">Wilkinson et al. 2016 · go-fair.org/fair-principles</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FAIR_PRINZIPIEN.map((p) => {
          const c = FARBEN[p.letter]
          return (
            <div key={p.key} className={`bg-white rounded-xl border ${c.border} p-4 space-y-2.5`}>
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} text-lg font-bold flex items-center justify-center flex-shrink-0`}>
                  {p.letter}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.bedeutung}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{p.inhalt}</p>
              <p className={`text-xs italic leading-relaxed ${c.text} ${c.bg} rounded-lg px-2.5 py-1.5`}>
                „{p.praxisfrage}"
              </p>

              <div className="space-y-1 pt-0.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Woran man es erkennt</p>
                {p.merkmale.map((m) => (
                  <p key={m} className="text-[11px] text-slate-500 leading-relaxed flex gap-1.5">
                    <span className="text-slate-300 flex-shrink-0">—</span>{m}
                  </p>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                Im Fall abgeleitet aus: <span className="text-slate-600">{p.imFall}</span>
              </p>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">Bewertet wird im Anwendungsfall</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          FAIR wird nicht separat abgefragt. Die vier Prinzipien decken dieselben Sachverhalte ab wie
          das Gate und die Qualitätsdimensionen — wer beides getrennt ausfüllt, beantwortet dieselbe
          Frage zweimal und kann sich dabei widersprechen. Im Fall steht der FAIR-Stand deshalb als
          abgeleitete Ansicht unter der Datengrundlage.
        </p>
        <button
          type="button"
          onClick={() => navigate('/guide?step=data-quality')}
          className="mt-3 text-xs font-semibold bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Fall auswählen und prüfen →
        </button>
      </div>
    </div>
  )
}
