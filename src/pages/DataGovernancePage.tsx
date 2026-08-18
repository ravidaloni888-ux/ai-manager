import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VERFUEGBARKEIT_FRAGEN } from '../components/assessments/DatenverfuegbarkeitCheck'
import FairPrinzipien from '../components/data/FairPrinzipien'
import QualitaetsDimensionen from '../components/data/QualitaetsDimensionen'
import TheoryBlock from '../components/ui/TheoryBlock'

// ─────────────────────────────────────────────────────────────────────────
// Tag 15 · Datenmanagement & -Governance
// ─────────────────────────────────────────────────────────────────────────

// ── Seite 5: Die sechs Dimensionen der Datenqualität ─────────────────────


export const INTEGRITY_MECHANISMS = [
  {
    icon: '🔒',
    title: 'Prüfsummen & Hashes',
    body: 'Beim Einlesen eines Dokuments wird ein kryptographischer Fingerabdruck erzeugt. Bei jedem Abruf wird er verglichen — stimmt er nicht mehr, wurde das Dokument verändert.',
    tag: 'Unveränderlichkeit',
  },
  {
    icon: '📋',
    title: 'Audit-Trail',
    body: 'Protokolliert nach Art. 12 EU AI Act bei Hochrisiko-KI Ereignisse während des Lebenszyklus des Systems in einem der Zweckbestimmung angemessenen Maße.',
    tag: 'Nachvollziehbarkeit',
    highlight: 'Neue Umsetzungsfrist (Digital Omnibus, 7. Mai 2026): 2. Dezember 2027',
  },
  {
    icon: '🗂',
    title: 'Versionierung',
    body: 'Erhält frühere Datenstände und die Möglichkeit, sie wiederherzustellen (Back-up, Disaster Recovery).',
    tag: 'Zustandshistorie',
  },
]

export const VERSIONING_PRINCIPLES = [
  { title: 'Zustandshistorie', body: 'Jeder frühere Datenzustand bleibt abrufbar — kein Informationsverlust durch Überschreiben.' },
  { title: 'Änderungstransparenz', body: 'Was wurde geändert? Von wem? Zu welchem Zeitpunkt? Die Änderung ist sichtbar und begründet.' },
  { title: 'Parallelbetrieb', body: 'Alt und neu koexistieren — keine Zwangsentscheidung beim Anlegen einer neuen Version.' },
]

function DatenintegritaetTab() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Datenintegrität</strong> stellt sicher, dass Daten das bleiben, was sie sein sollen. Drei Mechanismen greifen ineinander.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {INTEGRITY_MECHANISMS.map(m => (
          <div key={m.title} className="bg-white rounded-xl border-2 border-orange-200 p-5 space-y-2 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{m.tag}</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{m.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed flex-1">{m.body}</p>
            {m.highlight && (
              <p className="text-[11px] font-semibold text-orange-700 bg-orange-50 rounded-lg px-2.5 py-1.5 mt-1">{m.highlight}</p>
            )}
          </div>
        ))}
      </div>

      {/* Versioning detail */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Versionierung · Drei Kernprinzipien</p>
          <p className="text-xs text-slate-400 mt-1">Zustände erhalten, Änderungen nachvollziehen. Die alte Version bleibt erhalten — auch wenn eine neue angelegt wird.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VERSIONING_PRINCIPLES.map(p => (
            <div key={p.title} className="border border-orange-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{p.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function DataGovernancePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'integritaet' | 'qualitaet' | 'fair'>('integritaet')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4">
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">KI-Beauftragte:r · Tag 15</p>
        <h1 className="text-2xl font-bold text-slate-800">Datenmanagement &amp; -Governance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Integrität, Protokollierung und Versionierung — die organisatorische Grundlage
        </p>
      </div>

      {/* Der Kern der Datenarbeit — steht bewusst vor allem anderen */}
      <div className="bg-slate-800 text-white rounded-xl px-6 py-5 space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Der kritische Engpass</p>
        <h2 className="text-xl font-bold">Das Modell ist selten das Problem — die Daten schon</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          In der Mehrzahl gescheiterter KI-Projekte liegt die Ursache nicht in der Technologie, sondern in
          der Datenverfügbarkeit: Daten existieren zwar, sind aber verteilt, uneinheitlich in der Qualität,
          rechtlich beschränkt oder nicht in der nötigen Granularität vorhanden.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {VERFUEGBARKEIT_FRAGEN.map((f, i) => (
            <div key={f.id} className="bg-white/10 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold">
                <span className="text-slate-400 mr-1.5">{i + 1}</span>{f.titel}
                {f.hart && <span className="ml-2 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">K.-o.</span>}
              </p>
              <p className="text-[12px] text-slate-300 mt-1 leading-snug">{f.frage}</p>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-slate-300 pt-1">
          {VERFUEGBARKEIT_FRAGEN.length} Fragen, die <strong className="text-white">vor jedem Business Case</strong> zu beantworten sind —
          je Anwendungsfall, weil sie zweckbezogen sind.
        </p>
        <button
          type="button"
          onClick={() => navigate('/guide?step=data-quality')}
          className="text-xs font-semibold bg-white text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Fall auswählen und prüfen →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'integritaet', label: '🔒 Datenintegrität' },
          { id: 'qualitaet', label: '📐 Qualitätsdimensionen' },
          { id: 'fair', label: '🔗 FAIR-Prinzipien' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'integritaet' && <DatenintegritaetTab />}
      {tab === 'qualitaet' && <QualitaetsDimensionen />}
      {tab === 'fair' && <FairPrinzipien />}

      {/* Die fallbezogenen Prüfungen sind an den Anwendungsfall gewandert */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">Die fallbezogenen Datenprüfungen liegen im Anwendungsfall</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Die Datengrundlage ist zweckbezogen — sie braucht ein konkretes Vorhaben. Sie finden sie im
          Anwendungsfall unter <strong>Fall-Wizard · Prüfungen &amp; Plan</strong>: erst das Gate aus
          {' '}{VERFUEGBARKEIT_FRAGEN.length} Fragen, dann die sieben Qualitätsdimensionen im Detail.
          FAIR ergibt sich daraus, ohne zweite Erhebung.
        </p>
      </div>
    </div>
  )
}
