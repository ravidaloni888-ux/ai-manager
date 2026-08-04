import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useProfil } from '../../store/mandantProfil'

// ─────────────────────────────────────────────────────────────────────────
// Schulungsbedarf je Zielgruppe ermitteln.
//
// Die Kompetenzpflicht nach Art. 4 EU AI Act gilt seit dem 2. Februar 2025
// für alle, die KI betreiben oder nutzen — sie sagt aber nicht, WAS zu
// schulen ist. Das ergibt sich aus Rolle, Berührung mit dem System und
// dessen Risikoklasse. Genau das fragt dieser Wizard ab.
// ─────────────────────────────────────────────────────────────────────────

type Zielgruppe   = 'fuehrung' | 'anwender' | 'entwicklung' | 'betriebsrat' | 'compliance'
type Beruehrung   = 'nutzt' | 'beaufsichtigt' | 'entwickelt' | 'beschafft' | 'indirekt'
type Risiko       = 'hoch' | 'begrenzt' | 'minimal' | 'unklar'
type Vorwissen    = 'keins' | 'grundlagen' | 'erfahren'
type Bisher       = 'nichts' | 'einmalig' | 'regelmaessig'

interface Antworten {
  zielgruppe?: Zielgruppe
  beruehrung?: Beruehrung
  risiko?: Risiko
  vorwissen?: Vorwissen
  bisher?: Bisher
}

interface Analyse extends Antworten {
  id: string
  name: string
  erstelltAm: string
}

const ZIELGRUPPE_LABEL: Record<Zielgruppe, string> = {
  fuehrung:    'Führungskreis',
  anwender:    'Fachbereich · Anwender',
  entwicklung: 'Entwicklung & IT',
  betriebsrat: 'Betriebsrat',
  compliance:  'Compliance & Datenschutz',
}

// ── Kompetenzbausteine ───────────────────────────────────────────────────

interface Baustein {
  id: string
  titel: string
  inhalt: string
  recht?: string
  /** Trifft der Baustein auf diese Antworten zu? */
  wenn: (a: Antworten) => boolean
  /** pflicht = folgt aus einer Rechtspflicht, sonst gute Praxis */
  pflicht?: boolean
  dauer: number // Minuten
}

const hochrisiko = (a: Antworten) => a.risiko === 'hoch' || a.risiko === 'unklar'

const BAUSTEINE: Baustein[] = [
  {
    id: 'grundlagen',
    titel: 'KI-Grundlagen — was das System tut und was nicht',
    inhalt: 'Begriffe, Funktionsweise in Grundzügen, realistische Erwartung. Ohne diese Basis wird jede weitere Schulung zu Formelwissen.',
    recht: 'Art. 4 — ausreichendes Maß an KI-Kompetenz',
    wenn: (a) => a.vorwissen === 'keins',
    pflicht: true,
    dauer: 90,
  },
  {
    id: 'grenzen',
    titel: 'Grenzen erkennen — Halluzination, Bias, Scheinsicherheit',
    inhalt: 'Woran erkennt man ein falsches Ergebnis, das überzeugend aussieht? Der wichtigste Baustein für alle, die Ergebnisse weiterverwenden.',
    wenn: (a) => a.beruehrung === 'nutzt' || a.beruehrung === 'beaufsichtigt',
    pflicht: true,
    dauer: 90,
  },
  {
    id: 'verbote',
    titel: 'Verbotene Praktiken (Art. 5)',
    inhalt: 'Die acht verbotenen Anwendungen — damit niemand versehentlich etwas aufsetzt, das seit Februar 2025 unzulässig ist.',
    recht: 'Art. 5 · gilt seit 2. Feb 2025',
    wenn: () => true,
    pflicht: true,
    dauer: 45,
  },
  {
    id: 'transparenz',
    titel: 'Transparenzpflichten (Art. 50)',
    inhalt: 'Kennzeichnung KI-generierter Inhalte, Hinweis bei Chatbots, Wasserzeichen bei synthetischen Medien.',
    recht: 'Art. 50 · gilt ab Aug 2026',
    wenn: (a) => a.beruehrung === 'nutzt' || a.beruehrung === 'entwickelt',
    pflicht: true,
    dauer: 45,
  },
  {
    id: 'prompting',
    titel: 'Sichere Nutzung in der Praxis',
    inhalt: 'Was darf in die Eingabe, was nicht. Umgang mit Betriebs- und Personendaten, Prüfen vor Weiterverwendung.',
    wenn: (a) => a.beruehrung === 'nutzt',
    dauer: 120,
  },
  {
    id: 'aufsicht',
    titel: 'Menschliche Aufsicht wirksam ausüben (Art. 14)',
    inhalt: 'Wann darf und muss man die Empfehlung überstimmen? Gegen automation bias — blindes Nicken erfüllt die Aufsichtspflicht nicht.',
    recht: 'Art. 14 + Art. 26 Abs. 2 — zuständige Person mit ausreichender Kompetenz',
    wenn: (a) => a.beruehrung === 'beaufsichtigt' && hochrisiko(a),
    pflicht: true,
    dauer: 180,
  },
  {
    id: 'datenschutz',
    titel: 'Datenschutz beim KI-Einsatz',
    inhalt: 'Rechtsgrundlage, Zweckbindung, Auftragsverarbeitung, wann eine DSFA fällig wird.',
    recht: 'DSGVO Art. 6, 28, 35 · §26 BDSG',
    wenn: (a) => a.beruehrung !== 'indirekt',
    dauer: 90,
  },
  {
    id: 'risikomgmt',
    titel: 'Risikomanagement für Hochrisiko-Systeme (Art. 9)',
    inhalt: 'Risiken über den Lebenszyklus erfassen, bewerten, mindern und dokumentieren.',
    recht: 'Art. 9',
    wenn: (a) => a.beruehrung === 'entwickelt' && hochrisiko(a),
    pflicht: true,
    dauer: 180,
  },
  {
    id: 'datengov',
    titel: 'Daten-Governance für Trainingsdaten (Art. 10)',
    inhalt: 'Repräsentativität, Bias-Prüfung, Herkunftsnachweis, Umgang mit Lücken im Datensatz.',
    recht: 'Art. 10',
    wenn: (a) => a.beruehrung === 'entwickelt' && hochrisiko(a),
    pflicht: true,
    dauer: 180,
  },
  {
    id: 'doku',
    titel: 'Technische Dokumentation (Anhang IV)',
    inhalt: 'Was hineingehört, wer sie pflegt und wie sie prüffähig bleibt.',
    recht: 'Art. 11 + Anhang IV',
    wenn: (a) => a.beruehrung === 'entwickelt' && hochrisiko(a),
    pflicht: true,
    dauer: 120,
  },
  {
    id: 'beschaffung',
    titel: 'KI einkaufen — worauf beim Anbieter zu achten ist',
    inhalt: 'CE-Kennzeichnung, Konformitätserklärung, Gebrauchsanweisung, AVV. Und wann man durch eigene Änderungen selbst zum Anbieter wird (Art. 25).',
    recht: 'Art. 25, Art. 26 Abs. 1',
    wenn: (a) => a.beruehrung === 'beschafft' || a.zielgruppe === 'fuehrung',
    dauer: 90,
  },
  {
    id: 'mitbestimmung',
    titel: 'Mitbestimmung bei KI am Arbeitsplatz',
    inhalt: 'Wann §87 BetrVG greift, was eine Betriebsvereinbarung regeln sollte, Leistungs- und Verhaltenskontrolle.',
    recht: '§87 Abs. 1 Nr. 6 BetrVG',
    wenn: (a) => a.zielgruppe === 'betriebsrat',
    pflicht: true,
    dauer: 120,
  },
  {
    id: 'governance',
    titel: 'Governance, Rollen und Verantwortung',
    inhalt: 'Wer entscheidet was, wer haftet, wie läuft die Freigabe eines neuen Vorhabens.',
    wenn: (a) => a.zielgruppe === 'fuehrung' || a.zielgruppe === 'compliance',
    dauer: 90,
  },
  {
    id: 'auffrischung',
    titel: 'Auffrischung und Aktualisierung',
    inhalt: 'Der Rechtsrahmen greift gestaffelt bis 2028. Ein jährlicher Termin hält den Nachweis lebendig.',
    recht: 'Art. 4 — fortlaufende Kompetenz',
    wenn: (a) => a.bisher === 'einmalig' || a.bisher === 'regelmaessig',
    dauer: 60,
  },
]

/** Kirkpatrick-Zielebene: bei Aufsicht und Hochrisiko reicht Wissen nicht. */
function zielEbene(a: Antworten): { stufe: number; name: string; grund: string } {
  if (a.beruehrung === 'beaufsichtigt' && hochrisiko(a)) {
    return {
      stufe: 4, name: 'Ergebnisse',
      grund: 'Bei Aufsicht über Hochrisiko-Systeme muss belegbar sein, dass Fehlentscheidungen tatsächlich abgefangen werden — nicht nur, dass geschult wurde.',
    }
  }
  if (hochrisiko(a) || a.beruehrung === 'entwickelt' || a.beruehrung === 'beaufsichtigt') {
    return {
      stufe: 3, name: 'Verhalten',
      grund: 'Der Nachweis nach Art. 4 verlangt Kompetenz im Handeln. Ein Anwesenheitsnachweis genügt hier nicht.',
    }
  }
  return {
    stufe: 2, name: 'Lernen',
    grund: 'Für die reine Anwendung genügt ein belegter Wissenszuwachs, etwa über eine kurze Lernkontrolle.',
  }
}

function formatEmpfehlung(minuten: number, a: Antworten): string {
  if (a.beruehrung === 'entwickelt' || (a.beruehrung === 'beaufsichtigt' && hochrisiko(a))) {
    return 'Präsenz oder virtuelles Klassenzimmer mit Übungen am eigenen System — Selbstlernkurse tragen die Verhaltensebene nicht.'
  }
  if (minuten <= 120) return 'Kompakt in einem Termin, gern als Präsenzworkshop mit eigenen Beispielen.'
  if (minuten <= 300) return 'Zwei bis drei Termine à 90 Minuten, dazwischen Anwendung im Alltag.'
  return 'Modulare Reihe über mehrere Wochen, ergänzt um Sprechstunden.'
}

const BUCKET = 'schulungsbedarf'

// ── Fragen ───────────────────────────────────────────────────────────────

interface Frage {
  id: keyof Antworten
  frage: string
  hinweis?: string
  optionen: { wert: string; label: string; sub?: string }[]
}

const FRAGEN: Frage[] = [
  {
    id: 'zielgruppe',
    frage: 'Welche Gruppe soll geschult werden?',
    optionen: [
      { wert: 'fuehrung',    label: 'Führungskreis',            sub: 'entscheidet über Einsatz und Budget' },
      { wert: 'anwender',    label: 'Fachbereich · Anwender',   sub: 'arbeitet täglich mit dem System' },
      { wert: 'entwicklung', label: 'Entwicklung & IT',         sub: 'baut, konfiguriert oder betreibt' },
      { wert: 'betriebsrat', label: 'Betriebsrat',              sub: 'Mitbestimmung bei KI am Arbeitsplatz' },
      { wert: 'compliance',  label: 'Compliance & Datenschutz', sub: 'prüft und überwacht' },
    ],
  },
  {
    id: 'beruehrung',
    frage: 'Wie berührt diese Gruppe die KI-Systeme?',
    hinweis: 'Die Pflichten hängen an der Tätigkeit, nicht am Titel.',
    optionen: [
      { wert: 'nutzt',         label: 'Nutzt fertige Werkzeuge',        sub: 'Eingaben machen, Ergebnisse weiterverwenden' },
      { wert: 'beaufsichtigt', label: 'Beaufsichtigt Entscheidungen',   sub: 'prüft und überstimmt KI-Vorschläge' },
      { wert: 'entwickelt',    label: 'Entwickelt oder konfiguriert',   sub: 'baut, trainiert, stellt ein' },
      { wert: 'beschafft',     label: 'Entscheidet über Beschaffung',   sub: 'wählt Anbieter aus, gibt frei' },
      { wert: 'indirekt',      label: 'Nur mittelbar betroffen',        sub: 'arbeitet nicht selbst damit' },
    ],
  },
  {
    id: 'risiko',
    frage: 'Welche Risikoklasse haben die betroffenen Systeme?',
    hinweis: 'Aus Ihren erfassten Anwendungsfällen vorgeschlagen — bei Bedarf überschreiben.',
    optionen: [
      { wert: 'hoch',     label: 'Hochrisiko',           sub: 'Anhang III oder Anhang I' },
      { wert: 'begrenzt', label: 'Begrenztes Risiko',    sub: 'Chatbot, generative Inhalte' },
      { wert: 'minimal',  label: 'Minimales Risiko',     sub: 'keine besonderen Pflichten' },
      { wert: 'unklar',   label: 'Noch nicht eingestuft', sub: 'wird vorsichtshalber wie Hochrisiko behandelt' },
    ],
  },
  {
    id: 'vorwissen',
    frage: 'Welches Vorwissen bringt die Gruppe mit?',
    optionen: [
      { wert: 'keins',      label: 'Kein nennenswertes Vorwissen' },
      { wert: 'grundlagen', label: 'Grundlagen sind bekannt' },
      { wert: 'erfahren',   label: 'Arbeitet routiniert mit KI' },
    ],
  },
  {
    id: 'bisher',
    frage: 'Was ist bisher geschult worden?',
    optionen: [
      { wert: 'nichts',        label: 'Noch nichts' },
      { wert: 'einmalig',      label: 'Eine einmalige Einführung' },
      { wert: 'regelmaessig',  label: 'Regelmäßige Termine laufen' },
    ],
  },
]

// ── Komponente ───────────────────────────────────────────────────────────

export default function SchulungsbedarfWizard() {
  const { useCases } = useUseCasesStore()
  const profil = useProfil()

  const [antworten, setAntworten] = useState<Antworten>({})
  const [pos, setPos] = useState(0)
  const [fertig, setFertig] = useState(false)
  const [gespeichert, setGespeichert] = useState<Analyse[]>([])

  const speicherbar = getMandantType() !== 'demo'

  useEffect(() => {
    setGespeichert(scopedGet<Analyse[]>(BUCKET, []))
  }, [])

  // Risikoklasse aus dem Portfolio vorschlagen
  const hatHochrisiko = useCases.some((uc) => uc.euAiActRisk === 'High Risk' || uc.euAiActRisk === 'Unacceptable Risk')
  const vorschlagRisiko: Risiko = useCases.length === 0 ? 'unklar' : hatHochrisiko ? 'hoch' : 'begrenzt'

  const frage = FRAGEN[pos]

  const antworte = (wert: string) => {
    // Der Portfolio-Vorschlag wird nur markiert, nicht vorab gesetzt — eine
    // Einstufung, an der Schulungspflichten hängen, gehört bewusst bestätigt.
    setAntworten({ ...antworten, [frage.id]: wert } as Antworten)
    if (pos + 1 < FRAGEN.length) setPos(pos + 1)
    else setFertig(true)
  }

  const zurueck = () => {
    if (fertig) { setFertig(false); setPos(FRAGEN.length - 1); return }
    if (pos > 0) setPos(pos - 1)
  }

  const neu = () => { setAntworten({}); setPos(0); setFertig(false) }

  const sichern = () => {
    const eintrag: Analyse = {
      ...antworten,
      id: nanoid(),
      name: antworten.zielgruppe ? ZIELGRUPPE_LABEL[antworten.zielgruppe] : 'Zielgruppe',
      erstelltAm: new Date().toISOString(),
    }
    const next = [...gespeichert, eintrag]
    setGespeichert(next)
    if (speicherbar) scopedSet(BUCKET, next)
    neu()
  }

  const entfernen = (id: string) => {
    const next = gespeichert.filter((g) => g.id !== id)
    setGespeichert(next)
    if (speicherbar) scopedSet(BUCKET, next)
  }

  // ── Ableitung ──
  const treffer = BAUSTEINE.filter((b) => b.wenn(antworten))
  const pflichtBausteine = treffer.filter((b) => b.pflicht)
  const empfohlen = treffer.filter((b) => !b.pflicht)
  const gesamtMinuten = treffer.reduce((s, b) => s + b.dauer, 0)
  const ebene = zielEbene(antworten)
  const stunden = Math.round((gesamtMinuten / 60) * 10) / 10

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Schulungsbedarf ermitteln</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Fünf Fragen je Zielgruppe — daraus entsteht der Kompetenzbedarf mit Rechtsbezug,
          Umfang und der Nachweisebene, die Sie erreichen müssen.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        {!fertig ? (
          <>
            <div className="flex items-center gap-1.5">
              {FRAGEN.map((f, i) => (
                <div key={f.id} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    antworten[f.id] ? 'bg-green-500 text-white'
                    : i === pos ? 'bg-blue-600 text-white'
                    : 'border-2 border-slate-300 bg-white text-slate-400'
                  }`}>
                    {antworten[f.id] ? '✓' : i + 1}
                  </div>
                  {i < FRAGEN.length - 1 && <div className="h-px w-4 bg-slate-200" />}
                </div>
              ))}
            </div>

            <div>
              <p className="text-base font-semibold text-slate-800 leading-snug">{frage.frage}</p>
              {frage.hinweis && <p className="text-xs text-slate-500 mt-1">{frage.hinweis}</p>}
            </div>

            <div className="space-y-2">
              {frage.optionen.map((o) => {
                const gewaehlt = antworten[frage.id] === o.wert
                const istVorschlag = frage.id === 'risiko' && o.wert === vorschlagRisiko
                return (
                  <button key={o.wert} type="button" onClick={() => antworte(o.wert)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      gewaehlt ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{o.label}</span>
                      {istVorschlag && !gewaehlt && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          aus Portfolio
                        </span>
                      )}
                    </span>
                    {o.sub && (
                      <span className={`block text-[11px] mt-0.5 ${gewaehlt ? 'text-slate-300' : 'text-slate-500'}`}>
                        {o.sub}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {pos > 0 && (
              <button type="button" onClick={zurueck}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                ← Zurück
              </button>
            )}
          </>
        ) : (
          <>
            {/* Ergebnis */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Bedarf</p>
                <p className="text-lg font-bold text-slate-800">
                  {antworten.zielgruppe ? ZIELGRUPPE_LABEL[antworten.zielgruppe] : ''}
                </p>
              </div>
              <button type="button" onClick={neu}
                className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
                Neu starten
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Bausteine</p>
                <p className="text-xl font-bold text-slate-800">{treffer.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Umfang</p>
                <p className="text-xl font-bold text-slate-800">{stunden} Std.</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Nachweisebene</p>
                <p className="text-xl font-bold text-slate-800">K{ebene.stufe}</p>
              </div>
            </div>

            {/* Rechtliche Einordnung */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold text-amber-900">Was verpflichtend ist</p>
              <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                Die KI-Kompetenzpflicht nach <strong>Art. 4 EU AI Act</strong> gilt seit dem 2. Februar 2025 —
                ohne Übergangsfrist und unabhängig von der Risikoklasse.
                {hochrisiko(antworten) && antworten.beruehrung === 'beaufsichtigt' && (
                  <> Zusätzlich verlangt <strong>Art. 26 Abs. 2</strong>, dass die zur Aufsicht benannte Person
                  die nötige Kompetenz und Befugnis besitzt.</>
                )}
                {' '}Die Schulung muss <strong>dokumentiert</strong> werden — sonst gilt sie im Prüffall als nicht erfolgt.
              </p>
            </div>

            {/* Bausteine */}
            <div className="space-y-3">
              {[{ titel: 'Pflichtbausteine', liste: pflichtBausteine, ton: 'border-l-red-400' },
                { titel: 'Empfohlen', liste: empfohlen, ton: 'border-l-slate-300' }].map((gruppe) =>
                gruppe.liste.length > 0 ? (
                  <div key={gruppe.titel}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      {gruppe.titel} · {gruppe.liste.length}
                    </p>
                    <div className="space-y-2">
                      {gruppe.liste.map((b) => (
                        <div key={b.id} className={`border-l-2 ${gruppe.ton} bg-slate-50 rounded-r-lg px-3 py-2`}>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">{b.titel}</p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{b.dauer} Min.</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{b.inhalt}</p>
                          {b.recht && (
                            <p className="text-[10px] font-mono text-slate-400 mt-1">{b.recht}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>

            {/* Format und Nachweis */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                <p className="text-[11px] font-bold text-slate-700">Format</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{formatEmpfehlung(gesamtMinuten, antworten)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                <p className="text-[11px] font-bold text-slate-700">
                  Erfolg messen — Kirkpatrick-Ebene {ebene.stufe} ({ebene.name})
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{ebene.grund}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={zurueck}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                ← Antwort ändern
              </button>
              <button type="button" onClick={sichern}
                className="ml-auto text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                In den Schulungsplan übernehmen ✓
              </button>
            </div>
            {!speicherbar && (
              <p className="text-[10px] text-slate-400">Im Demo-Mandanten wird nichts dauerhaft gespeichert.</p>
            )}
          </>
        )}
      </div>

      {/* Bisher ermittelter Bedarf */}
      {gespeichert.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Ermittelter Bedarf · {gespeichert.length}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {gespeichert.map((g) => {
              const bausteine = BAUSTEINE.filter((b) => b.wenn(g))
              const std = Math.round((bausteine.reduce((s, b) => s + b.dauer, 0) / 60) * 10) / 10
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{g.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {bausteine.length} Bausteine · {std} Std. · Ebene K{zielEbene(g).stufe}
                    </p>
                  </div>
                  <button type="button" onClick={() => entfernen(g.id)}
                    className="text-slate-300 hover:text-red-500 text-xs flex-shrink-0">
                    Entfernen
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {profil.betriebsrat && antworten.zielgruppe !== 'betriebsrat' && (
        <p className="text-[11px] text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Für dieses Mandat ist ein Betriebsrat hinterlegt — planen Sie eine eigene Analyse für dieses Gremium ein,
          bevor die Schulung der Belegschaft startet.
        </p>
      )}
    </div>
  )
}
