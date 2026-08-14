import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { findeWissen, WISSEN } from '../lib/wissen'
import type { WissenStueck } from '../lib/wissen'

// ─────────────────────────────────────────────────────────────────────────
// Ulli — Nachschlagen im Bestand der App.
//
// Kein allgemeiner Assistent: Die Antwort entsteht aus denselben Daten,
// aus denen die Seiten gerendert werden, und nennt ihren Fundort. Was die
// App nicht enthält, wird als Lücke benannt statt erfunden — bei einem
// Werkzeug für Compliance-Arbeit ist das der Unterschied zwischen nützlich
// und gefährlich.
// ─────────────────────────────────────────────────────────────────────────

interface Nachricht {
  role: 'user' | 'assistant'
  content: string
  quellen?: { titel: string; quelle: string; pfad: string }[]
}

/**
 * Fettschrift aus **Sternchen**. Das Modell schreibt Markdown, und roh
 * angezeigt stehen die Sternchen mitten im Satz. Mehr als fett braucht
 * es hier nicht — Aufzählungen und Absätze trägt schon der Zeilenumbruch.
 */
function Formatiert({ text }: { text: string }) {
  const teile = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
      {teile.map((t, i) =>
        t.startsWith('**') && t.endsWith('**') && t.length > 4
          ? <strong key={i} className="font-semibold">{t.slice(2, -2)}</strong>
          : <span key={i}>{t}</span>,
      )}
    </p>
  )
}

const BEISPIELE = [
  'Wann gilt ein KI-System als Hochrisiko?',
  'Wann brauche ich eine DSFA?',
  'Was ist der Unterschied zwischen Canary Release und Shadow Mode?',
  'Welche Dimensionen hat Datenqualität?',
  'Was bedeutet FAIR?',
]

export default function ChatPage() {
  const navigate = useNavigate()
  const [verlauf, setVerlauf] = useState<Nachricht[]>([])
  const [eingabe, setEingabe] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const endeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endeRef.current?.scrollIntoView({ block: 'end' })
  }, [verlauf, laeuft])

  const fragen = async (text: string) => {
    const frage = text.trim()
    if (!frage || laeuft) return

    const neuerVerlauf: Nachricht[] = [...verlauf, { role: 'user', content: frage }]
    setVerlauf(neuerVerlauf)
    setEingabe('')
    setLaeuft(true)
    setFehler('')

    // Die Suche läuft hier, nicht auf dem Server — so bleibt die Antwort an
    // dieselben Konstanten gebunden, aus denen die Seiten entstehen.
    const ausschnitte: WissenStueck[] = findeWissen(frage)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: neuerVerlauf.map((n) => ({ role: n.role, content: n.content })),
          ausschnitte,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setVerlauf([...neuerVerlauf, { role: 'assistant', content: data.antwort, quellen: data.quellen }])
    } catch (e) {
      setFehler(String(e))
      setVerlauf(neuerVerlauf)
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Kopf */}
      <div className="border-b-2 border-slate-800 pb-4">
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">Nachschlagen</p>
        <h1 className="text-2xl font-bold text-slate-800">Ulli</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Ulli antwortet ausschliesslich aus dem Bestand dieser App — mit Angabe, wo es steht.
          Derzeit {WISSEN.length} Einträge aus Glossar, Prüfbaum, Datengrundlage, Deployment und den Arbeitsschritten.
        </p>
      </div>

      {/* Verlauf */}
      <div className="space-y-4">
        {verlauf.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed">
              Ulli erfindet nichts: durchsucht wird allein der Inhalt dieser App, und geantwortet
              wird nur daraus — was hier nicht steht, wird auch so gesagt. Für verbindliche
              Rechtsauskünfte ist Ulli nicht gedacht.
            </p>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Zum Anfangen</p>
              <div className="flex flex-wrap gap-2">
                {BEISPIELE.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => void fragen(b)}
                    className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {verlauf.map((n, i) => (
          n.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
              <Formatiert text={n.content} />
              {n.quellen && n.quellen.length > 0 && (
                <div className="border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Nachlesen in der App
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Map(n.quellen.map((q) => [q.pfad + q.quelle, q])).values()].slice(0, 6).map((q) => (
                      <button
                        key={q.pfad + q.quelle}
                        type="button"
                        title={q.titel}
                        onClick={() => navigate(q.pfad)}
                        className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors"
                      >
                        {q.quelle} →
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ))}

        {laeuft && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-slate-500">Ulli sucht im Bestand der App…</p>
          </div>
        )}

        {fehler && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-800">Die Anfrage ist fehlgeschlagen</p>
            <p className="text-[12px] text-red-700 mt-1 leading-relaxed">{fehler}</p>
          </div>
        )}

        <div ref={endeRef} />
      </div>

      {/* Datenschutzhinweis — steht bewusst direkt über dem Eingabefeld und
          nicht im Kleingedruckten der Seite: Gelesen wird er nur dort, wo
          man gerade tippt. */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-[12px] text-amber-900 leading-relaxed">
          <strong>Keine echten Kunden- oder Personendaten eingeben.</strong> Die Frage wird zur
          Beantwortung an Anthropic in die USA übertragen. Formulieren Sie allgemein
          („ein Bewerbungssystem") statt konkret (Firmen- oder Personennamen).
        </p>
      </div>

      {/* Eingabe */}
      <form
        onSubmit={(e) => { e.preventDefault(); void fragen(eingabe) }}
        className="sticky bottom-4 bg-white rounded-xl shadow-md border border-slate-200 p-2 flex items-end gap-2"
      >
        <textarea
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void fragen(eingabe) }
          }}
          rows={1}
          placeholder="Frage an Ulli — Enter sendet, Umschalt+Enter für eine neue Zeile"
          className="flex-1 resize-none border-0 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={laeuft || !eingabe.trim()}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex-shrink-0"
        >
          Fragen
        </button>
        {verlauf.length > 0 && (
          <button
            type="button"
            onClick={() => { setVerlauf([]); setFehler('') }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 flex-shrink-0"
          >
            Neu
          </button>
        )}
      </form>
    </div>
  )
}
