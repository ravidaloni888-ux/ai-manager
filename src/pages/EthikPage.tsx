import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  verdict: 'JA' | 'NEIN' | 'UNKLAR'
  verdictReason: string
  fastDimensions: ('F' | 'A' | 'S' | 'T')[]
  fastExplanations: Partial<Record<'F' | 'A' | 'S' | 'T', string>>
  zone: string
  zoneExplanation: string
  mainRisk: string
  recommendation: string
  severity: 'Hoch' | 'Mittel' | 'Niedrig'
}

// ── Static data ───────────────────────────────────────────────────────────────
const FAST = [
  {
    key: 'F' as const,
    label: 'Fairness',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    dot: 'bg-blue-500',
    desc: 'Kein KI-System darf Einzelpersonen oder Gruppen unzulässig benachteiligen. Inklusives Design, faire Algorithmen, disaggregierte Metriken.',
  },
  {
    key: 'A' as const,
    label: 'Accountability',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
    desc: 'Klare Verantwortlichkeiten für KI-Entscheidungen. Auditierbarkeit, Dokumentation, menschliche Aufsicht (Art. 14 KI-VO).',
  },
  {
    key: 'S' as const,
    label: 'Sustainability',
    color: 'bg-green-50 border-green-200 text-green-800',
    dot: 'bg-green-500',
    desc: 'Langfristige gesellschaftliche, ökonomische und ökologische Verträglichkeit. Arbeitsmarkt-Folgen, Sozialverträglichkeit.',
  },
  {
    key: 'T' as const,
    label: 'Transparency',
    color: 'bg-teal-50 border-teal-200 text-teal-800',
    dot: 'bg-teal-500',
    desc: 'Entscheidungen, Daten und Prozesse nachvollziehbar und kommunizierbar machen. Erklärbarkeit, Art. 13/26/50 KI-VO.',
  },
]

const SUM = [
  { head: 'Respect', body: 'Würde und Autonomie der betroffenen Personen achten. Menschen sind Zweck, nicht Mittel.', case: 'Verletzt: Toeslagenaffaire' },
  { head: 'Connect', body: 'Aufrichtige, offene und inklusive Kommunikation über das System und seine Grenzen.', case: 'Verletzt: Character.AI' },
  { head: 'Care', body: 'Aktiv für das Wohlergehen aller Betroffenen sorgen — auch wenn niemand explizit darum bittet.', case: 'Verletzt: Character.AI · Hangzhou' },
  { head: 'Protect', body: 'Soziale Werte, Gerechtigkeit und das Gemeinwohl schützen — über individuelle Interessen hinaus.', case: 'Verletzt: alle drei Fälle' },
]

const CASES = [
  {
    label: 'Niederlande · 2017–2021',
    title: 'Toeslagenaffaire — Der teuerste Algorithmus Europas',
    text: 'Die niederländische Finanzbehörde setzte einen Algorithmus zur Betrugserkennung bei Kindergeld-Anträgen ein. Doppelte Staatsangehörigkeit und nicht-niederländische Nachnamen erhöhten den Risiko-Score systematisch. Ca. 26.000 Familien fälschlich als Betrüger markiert, Kabinett Rutte trat zurück.',
    signal: 'Fehlende Erklärbarkeit · keine disaggregierten Metriken · kein Human-in-the-Loop bei negativen Entscheidungen.',
    fast: ['F', 'A', 'T'] as ('F' | 'A' | 'S' | 'T')[],
    color: 'border-l-blue-500',
  },
  {
    label: 'USA · 2024–2026',
    title: 'Character.AI / Sewell Setzer — Vertrauen als Geschäftsmodell',
    text: 'Ein 14-Jähriger führte intensive emotionale Beziehung mit einem Chatbot, der als Psychiater auftrat. Als er Suizidgedanken äußerte, antwortete der Bot: „Please do, my sweet king." Sewell Setzer starb Minuten später. Pennsylvania klagte wegen unerlaubter Heilkundeausübung.',
    signal: 'Kein Transparenzhinweis auf KI-Natur · keine Altersverifikation · kein Krisenprotokoll · Nutzerbindung als primäres Optimierungsziel.',
    fast: ['A', 'T'] as ('F' | 'A' | 'S' | 'T')[],
    color: 'border-l-red-500',
  },
  {
    label: 'China · 2024–2026',
    title: 'Hangzhou — KI ersetzt Mensch: Wer zahlt den Preis?',
    text: 'Ein KI-Unternehmen automatisierte die Stelle eines QA-Supervisors. Der Mitarbeiter wurde mit 40 % Gehaltskürzung versetzt; bei Ablehnung entlassen. Gericht: KI-getriebener Stellenabbau ist kein Grund für rechtmäßige Entlassung. „Die Kosten der Transformation können nicht auf Arbeitnehmer abgewälzt werden."',
    signal: 'Keine Sozialverträglichkeitsprüfung · kein Change-Management · Effizienzgewinn wird nicht geteilt.',
    fast: ['S', 'A'] as ('F' | 'A' | 'S' | 'T')[],
    color: 'border-l-green-500',
  },
]

const ZONES = [
  { label: 'Legal', q: 'Ist es erlaubt?', std: 'DSGVO · KI-VO · Arbeitsrecht · Produkthaftung', color: 'bg-slate-50 border-slate-200' },
  { label: 'Ethical', q: 'Ist es vertretbar?', std: 'Würde ich es Betroffenen, Presse, Betriebsrat erklären wollen?', color: 'bg-amber-50 border-amber-200' },
  { label: 'Optimal', q: 'Ist es wirklich gut?', std: 'SUM Values · NIST AI RMF · Best Practice', color: 'bg-teal-50 border-teal-200' },
]

const FAIRNESS_DEFS = [
  { term: 'Demographic Parity', body: 'Gleiche Ausgangsquoten je Gruppe.', weakness: 'Ignoriert unterschiedliche Basisraten.' },
  { term: 'Equalized Odds', body: 'Gleiche Fehlerraten je Gruppe (FP + FN).', weakness: 'Schwer zu kalibrieren; kann Quoten dennoch ungleich machen.' },
  { term: 'Calibration', body: 'Gleiche Treffsicherheit je Score-Wert.', weakness: 'Erzeugt bei unterschiedlichen Basisraten zwangsläufig ungleiche Quoten.' },
]

// ── Helper components ─────────────────────────────────────────────────────────
function FastBadge({ dim }: { dim: 'F' | 'A' | 'S' | 'T' }) {
  const f = FAST.find(x => x.key === dim)!
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${f.color}`}>
      <span className={`w-2 h-2 rounded-full ${f.dot}`} />
      {dim} — {f.label}
    </span>
  )
}

function SeverityBadge({ s }: { s: 'Hoch' | 'Mittel' | 'Niedrig' }) {
  const cls = s === 'Hoch' ? 'bg-red-100 text-red-700 border-red-200'
    : s === 'Mittel' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-green-100 text-green-700 border-green-200'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>{s}</span>
}

// ── Wizard ────────────────────────────────────────────────────────────────────
function EthikWizard() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/ethics-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseText: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data as AnalysisResult)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const verdictStyle = result
    ? result.verdict === 'JA'
      ? { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-600 text-white' }
      : result.verdict === 'NEIN'
      ? { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-600 text-white' }
      : { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500 text-white' }
    : null

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Wizard header */}
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-0.5">KI-Ethik · Zweistufige Bewertung</p>
          <h2 className="text-white font-semibold text-base">Fall analysieren</h2>
        </div>
        <span className="text-2xl">⚖️</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Fall beschreiben
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Beschreibe den KI-Anwendungsfall: Was macht das System? Welche Daten nutzt es? Wer ist betroffen? Welche Entscheidungen trifft es automatisch?&#10;&#10;Oder kopiere einfach eine Fallbeschreibung rein — z.B. aus einem Projektdokument oder Pressebericht."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none placeholder:text-slate-400 leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-1">Je mehr Kontext, desto präziser die Analyse — Datenquellen, Entscheidungslogik, Zielgruppe.</p>
        </div>

        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analysiere…
            </>
          ) : '⚖️ Ethisch bewerten'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Result */}
        {result && verdictStyle && (
          <div className={`rounded-xl border ${verdictStyle.border} ${verdictStyle.bg} overflow-hidden`}>
            {/* Verdict strip */}
            <div className="px-5 py-4 flex items-start gap-4 border-b border-inherit">
              <span className={`text-xs font-black tracking-widest px-3 py-1.5 rounded-lg flex-shrink-0 mt-0.5 ${verdictStyle.badge}`}>
                {result.verdict}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${verdictStyle.text} leading-snug`}>{result.verdictReason}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <SeverityBadge s={result.severity} />
                  <span className="text-xs text-slate-500 font-mono">Zone: <strong>{result.zone}</strong></span>
                </div>
              </div>
            </div>

            {/* FAST dimensions */}
            {result.fastDimensions.length > 0 && (
              <div className="px-5 py-4 border-b border-inherit space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Betroffene FAST-Dimensionen</p>
                <div className="flex flex-wrap gap-2">
                  {result.fastDimensions.map(d => <FastBadge key={d} dim={d} />)}
                </div>
                <div className="space-y-2 mt-2">
                  {result.fastDimensions.map(d => result.fastExplanations[d] && (
                    <div key={d} className="flex gap-2 text-sm">
                      <span className="font-bold text-slate-600 flex-shrink-0 w-4">{d}</span>
                      <span className="text-slate-700">{result.fastExplanations[d]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main risk + zone */}
            <div className="px-5 py-4 border-b border-inherit space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zentrale Schwachstelle</p>
              <p className="text-sm text-slate-800">{result.mainRisk}</p>
              <p className="text-xs text-slate-500 mt-1">{result.zoneExplanation}</p>
            </div>

            {/* Recommendation */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Empfehlung für den KIB</p>
              <p className="text-sm text-slate-800 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EthikPage() {
  const [activeTab, setActiveTab] = useState<'frameworks' | 'cases' | 'fairness'>('frameworks')

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">KI-Beauftragte:r · Tag 11</p>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            Ethische KI-Risiken<br />
            <span className="italic text-slate-500 font-normal text-xl">Bewertung &amp; Einordnung</span>
          </h1>
        </div>
        <div className="text-right text-xs font-mono text-slate-400 leading-relaxed">
          <p>Zweistufige Bewertung</p>
          <p>nach FAST-Prinzipien</p>
          <p>Alan Turing Institute</p>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-white border border-slate-200 border-l-4 border-l-teal-500 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong className="text-teal-700">Zweistufige Bewertung:</strong> Für jeden Fall zwei Fragen — unabhängig voneinander.
        <br /><br />
        <strong>Schritt a)</strong> Handelt es sich überhaupt um ein ethisches KI-Risiko? Nicht jedes Problem mit KI ist ein <em>ethisches</em> Problem — manche sind technisch, manche rechtlich, manche organisatorisch.
        <br /><br />
        <strong>Schritt b)</strong> Wenn ja: Welche FAST-Dimension(en) des Alan Turing Institute sind betroffen? Mehrfachauswahl ist möglich — und oft richtig.
      </div>

      {/* ── WIZARD ── */}
      <EthikWizard />

      {/* ── THEORY TABS ── */}
      <div className="space-y-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([
            { id: 'frameworks', label: 'Frameworks' },
            { id: 'cases', label: 'Fallstudien' },
            { id: 'fairness', label: 'Fairness-Dilemma' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Frameworks ── */}
        {activeTab === 'frameworks' && (
          <div className="space-y-5">
            {/* Drei-Zonen-Modell */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Drei-Zonen-Modell</p>
                <h3 className="text-base font-bold text-slate-800">Recht · Ethik · Optimal</h3>
                <p className="text-sm text-slate-500 mt-1">Datenschutz-Compliance bedeutet: das gesetzliche Minimum ist erfüllt. Datenethik fragt weiter.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ZONES.map(z => (
                  <div key={z.label} className={`border rounded-xl p-4 ${z.color}`}>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{z.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mb-2 italic">„{z.q}"</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{z.std}</p>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong>Leitgedanke:</strong> Alle drei historischen Fälle haben Compliance-Checks bestanden — und sind trotzdem gescheitert. DSGVO ist Untergrenze, nicht Ziel.
              </div>
            </section>

            {/* FAST */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Alan Turing Institute · FAST Track Principles</p>
                <h3 className="text-base font-bold text-slate-800">FAST — SUM operativ umsetzen</h3>
                <p className="text-sm text-slate-500 mt-1">Die FAST-Prinzipien übersetzen den SUM-Werterahmen in vier operative Handlungsprinzipien.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FAST.map(f => (
                  <div key={f.key} className={`border rounded-xl p-4 ${f.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${f.dot}`} />
                      <p className="text-xs font-black tracking-widest uppercase">{f.key} — {f.label}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
                <strong>SUM + FAST zusammen:</strong> SUM sagt, <em>was</em> zählt. FAST sagt, <em>wie</em> du es umsetzt. Für den KIB ist FAST das Werkzeug, SUM der Kompass.
              </div>
            </section>

            {/* SUM Values */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Alan Turing Institute · 2019</p>
                <h3 className="text-base font-bold text-slate-800">SUM Values — Der ethische Kompass</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUM.map(s => (
                  <div key={s.head} className="border border-teal-200 rounded-xl p-4 bg-teal-50">
                    <p className="text-sm font-bold text-teal-800 mb-1">{s.head}</p>
                    <p className="text-sm text-slate-700 leading-relaxed mb-2">{s.body}</p>
                    <p className="text-xs font-mono text-teal-600">{s.case}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Transparenz-Test */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Werkzeug · Alan Turing Institute</p>
                <h3 className="text-base font-bold text-slate-800">Der Transparenz-Test</h3>
                <p className="text-sm text-slate-500 mt-1">Drei Fragen — reichen, wenn eine „nein" ist.</p>
              </div>
              {[
                { nr: '①', term: 'Ist es legal?', body: 'DSGVO, KI-VO, Arbeitsrecht, Produkthaftungsgesetz — alle relevanten Normen geprüft?' },
                { nr: '②', term: 'Könnten wir es erklären?', body: 'Der Presse, dem Betriebsrat, den Betroffenen selbst — ohne Einschränkungen und Fußnoten?' },
                { nr: '③', term: 'Was würde ein Vernünftiger sagen?', body: 'Nicht: „Ist es technisch möglich?" — sondern: „Ist es richtig?" Perspektive einer unbeteiligten, informierten Person.' },
              ].map(q => (
                <div key={q.nr} className="flex gap-3 items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="font-mono text-sm font-bold text-teal-600 flex-shrink-0 w-6 mt-0.5">{q.nr}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{q.term}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{q.body}</p>
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
                <strong>Wenn eine Antwort „nein" ist:</strong> Das ist ein Ethiksignal — unabhängig davon, ob das System formal erlaubt ist. Der KIB dokumentiert das Signal und macht es zur Chefsache.
              </div>
            </section>
          </div>
        )}

        {/* ── Tab: Fallstudien ── */}
        {activeTab === 'cases' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-4">Drei Fälle — drei Muster</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="text-left py-2 pr-4 text-xs font-mono text-slate-500 uppercase tracking-wide">Fall</th>
                      <th className="text-left py-2 pr-4 text-xs font-mono text-slate-500 uppercase tracking-wide">Ethischer Kern</th>
                      <th className="text-left py-2 text-xs font-mono text-slate-500 uppercase tracking-wide">KIB-Rolle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { fall: 'Toeslagenaffaire', kern: 'Automatisierte Entscheidung ohne Nachvollziehbarkeit, diskriminierender Effekt', kib: 'Bias-Audit fordern · Erklärbarkeit prüfen' },
                      { fall: 'Character.AI', kern: 'Vertrauen in eine Rolle, die die KI nicht hat und nicht haben darf', kib: 'Transparenz-Test · Art. 50 KI-VO prüfen' },
                      { fall: 'Hangzhou', kern: 'Technologiegewinn privatisiert, Risiko auf Arbeitnehmer externalisiert', kib: 'FRIA anstoßen · HR einbinden' },
                    ].map(r => (
                      <tr key={r.fall}>
                        <td className="py-3 pr-4 font-semibold text-slate-800">{r.fall}</td>
                        <td className="py-3 pr-4 text-slate-600 text-xs leading-relaxed">{r.kern}</td>
                        <td className="py-3 text-xs text-teal-700 font-mono">{r.kib}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800 mt-4">
                <strong>Gemeinsames Muster:</strong> In allen drei Fällen war die ethische Lücke <em>vor</em> der rechtlichen Lücke erkennbar — für jemanden, der systematisch hingeschaut hat. Das ist die Rolle des KIB.
              </div>
            </div>

            {CASES.map(c => (
              <div key={c.title} className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${c.color} p-5 space-y-3`}>
                <div>
                  <p className="text-xs font-mono tracking-widest text-blue-600 uppercase mb-1">{c.label}</p>
                  <h3 className="text-base font-bold text-slate-800">{c.title}</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
                <div className="flex flex-wrap gap-2">
                  {c.fast.map(d => <FastBadge key={d} dim={d} />)}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
                  <strong className="text-slate-700">KIB-Frühwarnsignal:</strong> {c.signal}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Fairness-Dilemma ── */}
        {activeTab === 'fairness' && (
          <div className="space-y-5">
            {/* Fairness-Dilemma */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Algorithmic Fairness · Chouldechova 2017</p>
                <h3 className="text-base font-bold text-slate-800">Drei Definitionen — und warum man sich entscheiden muss</h3>
                <p className="text-sm text-slate-500 mt-1">Fairness klingt selbstverständlich — ist aber mathematisch komplex. Es gibt mehrere Definitionen, die nicht gleichzeitig erfüllbar sind.</p>
              </div>
              <div className="space-y-2">
                {FAIRNESS_DEFS.map(d => (
                  <div key={d.term} className="grid grid-cols-[180px_1fr_1fr] gap-4 items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-sm">
                    <span className="font-semibold text-slate-800">{d.term}</span>
                    <span className="text-slate-600">{d.body}</span>
                    <span className="text-red-600 text-xs">{d.weakness}</span>
                  </div>
                ))}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
                <strong>Das Fairness-Dilemma (Chouldechova 2017):</strong> Wenn die Basisraten zwischen zwei Gruppen verschieden sind, lassen sich Demographic Parity, Equalized Odds und Calibration mathematisch <em>nicht alle gleichzeitig</em> erfüllen. Fairness ist deshalb keine technische Entscheidung — sie ist eine <strong>politische</strong>. Der KIB moderiert sie, dokumentiert sie und macht sie transparent.
              </div>
            </section>

            {/* Bias im Lebenszyklus */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Bias im Lebenszyklus · Partnership on AI · Turing Institute</p>
                <h3 className="text-base font-bold text-slate-800">Wer kann Bias adressieren — und wer kann ihn stoppen?</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="text-left py-2 pr-4 text-xs font-mono text-slate-500 uppercase tracking-wide w-32">Phase</th>
                      <th className="text-left py-2 pr-4 text-xs font-mono text-slate-500 uppercase tracking-wide">Typisches Bias-Risiko</th>
                      <th className="text-left py-2 text-xs font-mono text-slate-500 uppercase tracking-wide">Wer kann stoppen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { phase: 'Daten erheben', risk: 'Unterrepräsentation; historische Diskriminierung wird eingefroren', who: 'Data Engineer · Fachbereich · KIB' },
                      { phase: 'Labeln', risk: 'Annotator-Bias; kulturelle Vorannahmen fließen ins Modell ein', who: 'Data Scientist · Diversity-Kontrolle' },
                      { phase: 'Trainieren', risk: 'Overfitting auf Mehrheitsgruppe; Minderheiten schlechter erkannt', who: 'ML-Ingenieur · KIB (disaggr. Metriken)' },
                      { phase: 'Deployen', risk: 'Schwellenwerte nicht je Gruppe geprüft; Fehlerraten unbemerkt', who: 'KIB · DSB · Rechtsabteilung' },
                      { phase: 'Betreiben', risk: 'Concept Drift; Performance verschlechtert sich für Gruppen unterschiedlich', who: 'KIB · Monitoring · Fachbereich' },
                    ].map(r => (
                      <tr key={r.phase}>
                        <td className="py-3 pr-4 font-semibold text-slate-800 text-xs whitespace-nowrap">{r.phase}</td>
                        <td className="py-3 pr-4 text-slate-600 text-xs leading-relaxed">{r.risk}</td>
                        <td className="py-3 text-xs text-teal-700 font-mono whitespace-nowrap">{r.who}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong>Berufsidentität — die stille Dimension:</strong> Gooch (2026): Ein Arzt verlor nach intensiver KI-Nutzung seine diagnostische Kompetenz: <em>„Ich habe das Werkzeug so gut genutzt, dass ich das Denken selbst verlernt habe."</em> Expertise-Erosion ist ein KIB-Problem, das in die Risikobetrachtung gehört.
              </div>
            </section>

            {/* NIST */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">NIST · AI RMF 1.0 · 2023</p>
                <h3 className="text-base font-bold text-slate-800">Die 7 Merkmale vertrauenswürdiger KI</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { m: 'Valid & Reliable', b: 'Tut konsistent, was es soll — messbar und reproduzierbar', ref: 'Art. 9 Abs. 1' },
                  { m: 'Safe', b: 'Kein unvertretbares physisches oder psychisches Risiko', ref: 'Art. 9 Abs. 4' },
                  { m: 'Secure & Resilient', b: 'Widerstandsfähig gegen Angriffe, Fehler und unvorhergesehene Eingaben', ref: 'Art. 15' },
                  { m: 'Explainable', b: 'Entscheidungen nachvollziehbar und für Betroffene interpretierbar', ref: 'Art. 13' },
                  { m: 'Privacy-Enhanced', b: 'Datenschutz strukturell eingebaut — nicht nachträglich aufgesetzt', ref: 'Art. 10 Abs. 5' },
                  { m: 'Fair', b: 'Keine unzulässige Diskriminierung von Gruppen oder Einzelpersonen', ref: 'Art. 10 Abs. 2' },
                  { m: 'Accountable', b: 'Klare Verantwortlichkeiten und wirksame menschliche Aufsicht', ref: 'Art. 14' },
                ].map(r => (
                  <div key={r.m} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-800">{r.m}</p>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{r.ref}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.b}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-t border-slate-200 pt-4">
        <span>alfatraining · KI-Beauftragte:r · Tag 11 · Datenschutz &amp; Datenethik</span>
        <span>Alan Turing Institute · FAST · SUM · NIST AI RMF</span>
      </div>
    </div>
  )
}
