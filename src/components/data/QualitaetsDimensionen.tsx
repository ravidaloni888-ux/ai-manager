import { useNavigate } from 'react-router-dom'
import { QUALITY_DIMENSIONS } from '../assessments/DataQualityCheck'

// ─────────────────────────────────────────────────────────────────────────
// Die Dimensionen der Datenqualität — die Theorie.
//
// Bewertet wird im Anwendungsfall, weil Qualität zweckbezogen ist. Was die
// Dimensionen bedeuten, gilt dagegen für alle Fälle gleich und steht
// deshalb hier — nicht in jedem Fall erneut.
// ─────────────────────────────────────────────────────────────────────────

export default function QualitaetsDimensionen() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Datenqualität ist immer zweckbezogen.</strong> „Gut genug für ein Brainstorming" ist
        nicht automatisch „gut genug für ein RAG-System, das in 30 Sekunden eine Servicefrage
        beantwortet." Dieselben SAP-Daten: für das Controlling ausreichend — für das RAG-System
        unvollständig.
        <span className="block mt-1 text-xs text-slate-400">
          Sechs Dimensionen nach DAMA DMBOK2 Revised Edition (März 2024), ergänzt um
          Interoperabilität aus den FAIR-Prinzipien
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUALITY_DIMENSIONS.map((d, i) => (
          <div key={d.key} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{d.icon}</span>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-slate-300 mr-1.5">{i + 1}</span>{d.title}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{d.frage}</p>
            <p className="text-[11px] text-slate-400 italic leading-relaxed">{d.beispiel}</p>
            <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 leading-relaxed">
              Im Fall geprüft mit: <span className="text-slate-700">{d.check}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">Bewertet wird im Anwendungsfall</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Datenqualität entsteht nicht durch bessere Technik — sie entsteht, wenn jemand (Data Owner,
          Data Steward) die Verantwortung dafür trägt und die Anforderungen klar definiert sind.
          Welche Dimension am wichtigsten ist, entscheidet nicht die IT, sondern der Fachbereich —
          im Fall wird sie deshalb je Vorhaben als <strong>wichtig</strong> markiert.
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
