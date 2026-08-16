import { Pruefblock, Frage, Wahl, Fazit } from '../ui/Pruefung'
import type { WahlOption } from '../ui/Pruefung'

// ─────────────────────────────────────────────────────────────────────────
// Der Schwellenwert — eine Führungsentscheidung, kein Modelldetail.
//
// Technisch sitzt er nicht im Modell, sondern in einer Schicht darüber.
// Genau deshalb lässt er sich verschieben, ohne neu zu trainieren — und
// genau deshalb ist die Frage, wo er sitzt, keine Entwicklungsfrage.
// Das Entwicklungsteam liefert die Kurve; wo man sich darauf stellt,
// entscheidet die Fachseite mit einer Governance-Funktion.
//
// Gefragt wird hier nichts Rechnerisches. Gefragt wird, welcher Fehler
// dieses Vorhaben teurer zu stehen kommt, womit die heutige Einstellung
// begründet ist, und wer sie ändern beziehungsweise ein Einzelergebnis
// verwerfen darf. Das Letzte verlangt Art. 14 EU AI Act bei Hochrisiko
// ausdrücklich.
// ─────────────────────────────────────────────────────────────────────────

export type FehlerKosten = 'fehlalarm' | 'uebersehen' | 'gleich'

export interface SchwelleState {
  /** Welcher Fehler ist für dieses Vorhaben teurer? */
  teurer: FehlerKosten | null
  /** Wo steht der Wert heute — und womit begründet? */
  begruendung: string
  /** Wer darf ihn verschieben? */
  aendern: string
  /** Wer darf ein Einzelergebnis verwerfen? (Art. 14) */
  verwerfen: string
}

export const EMPTY_SCHWELLE: SchwelleState = {
  teurer: null, begruendung: '', aendern: '', verwerfen: '',
}

// Zwei Lesarten derselben Frage. Klassifikation kennt den Regler als
// Precision gegen Recall; bei einem generativen System gibt es keinen
// Regler in dem Sinn, aber dieselbe Abwägung. Deshalb tragen die
// Antworten beide Fälle, statt an einer Typ-Abfrage zu hängen, die
// selbst wieder gepflegt werden müsste.
const KOSTEN: WahlOption<FehlerKosten>[] = [
  { wert: 'fehlalarm',  label: 'Fehlalarm', ton: 'warn' },
  { wert: 'uebersehen', label: 'Übersehen', ton: 'warn' },
  { wert: 'gleich',     label: 'Etwa gleich' },
]

const FOLGE: Record<FehlerKosten, string> = {
  fehlalarm:
    'Der Wert gehört streng eingestellt: lieber einen echten Fall verpassen als viele harmlose melden. '
    + 'Der Preis dafür sind übersehene Fälle — und die tauchen in keiner Statistik auf, die jemand liest.',
  uebersehen:
    'Der Wert gehört großzügig eingestellt: lieber einen Fehlalarm zu viel als einen echten Fall verpassen. '
    + 'Der Preis wandert in den Fachbereich, der die Treffer abarbeitet — nicht in die IT.',
  gleich:
    'Dann ist die Frage noch nicht zu Ende gedacht. Fast immer trägt eine Seite die Kosten sichtbar '
    + 'und die andere unsichtbar — welche das hier ist, gehört benannt.',
}

const feld = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function SchwellenwertCheck({ value, onChange, hochrisiko }: {
  value: SchwelleState
  onChange: (fn: (prev: SchwelleState) => SchwelleState) => void
  /** Bei Hochrisiko verlangt Art. 14 eine benannte Aufsichtsperson */
  hochrisiko: boolean
}) {
  const v = value ?? EMPTY_SCHWELLE
  const setzen = <K extends keyof SchwelleState>(k: K, w: SchwelleState[K]) =>
    onChange((prev) => ({ ...(prev ?? EMPTY_SCHWELLE), [k]: w }))

  const beantwortet = [
    v.teurer !== null,
    !!v.begruendung.trim(),
    !!v.aendern.trim(),
    !!v.verwerfen.trim(),
  ].filter(Boolean).length

  const aufsichtFehlt = hochrisiko && !v.verwerfen.trim()

  return (
    <Pruefblock
      titel="Schwellenwert und Aufsicht"
      hinweis="Vier Entscheidungen — keine davon rechnerisch"
      stand={<span className="text-[11px] text-slate-500">{beantwortet}/4</span>}
    >
      <Frage
        id="schwelle-teurer" nr={1}
        titel="Teurerer Fehler"
        text="Welcher Fehler kostet dieses Vorhaben mehr — ein Fehlalarm oder ein übersehener Fall?"
        hinweis="Bei generativen Systemen gleichbedeutend: eine falsche Aussage durchlassen (Übersehen) gegen zu viel zurückhalten (Fehlalarm)."
        ton={v.teurer ? 'teils' : null}
        folge={v.teurer ? <p className="text-[12px] text-slate-600 leading-relaxed">{FOLGE[v.teurer]}</p> : undefined}
      >
        <Wahl optionen={KOSTEN} wert={v.teurer} onWaehle={(w) => setzen('teurer', w)} />
      </Frage>

      <Frage
        id="schwelle-begruendung" nr={2}
        titel="Heutige Einstellung"
        text="Wo steht der Schwellenwert heute — und womit ist das begründet?"
        hinweis="Der Wert steckt nicht im Modell, sondern in einer Schicht darüber. Er ist verschiebbar, ohne neu zu trainieren — und muss deshalb begründet sein, nicht nur vorhanden."
        ton={v.begruendung.trim() ? 'ok' : null}
      >
        <textarea
          className={feld} rows={2}
          placeholder={'z. B. 0,7 — bei 0,6 verdoppelte sich die Prüflast im Fachbereich ohne zusätzliche Treffer'}
          value={v.begruendung}
          onChange={(e) => setzen('begruendung', e.target.value)}
        />
      </Frage>

      <Frage
        id="schwelle-aendern" nr={3}
        titel="Wer verschiebt ihn"
        text="Wer darf den Schwellenwert ändern?"
        hinweis="Eine Rolle oder ein Gremium, keine Abteilung. Wird das nicht benannt, verschiebt ihn im Zweifel derjenige, der das Dashboard bedient."
        ton={v.aendern.trim() ? 'ok' : null}
      >
        <input
          className={feld}
          placeholder={'z. B. Fachbereichsleitung gemeinsam mit der KI-Beauftragten, protokolliert'}
          value={v.aendern}
          onChange={(e) => setzen('aendern', e.target.value)}
        />
      </Frage>

      <Frage
        id="schwelle-verwerfen" nr={4}
        titel="Wer verwirft ein Ergebnis"
        text="Wer darf ein einzelnes Ergebnis des Systems verwerfen?"
        hinweis="Mit Namen, nicht mit Abteilung. Bei Hochrisiko-Systemen verlangt Art. 14 EU AI Act ausdrücklich, dass Aufsichtspersonen dazu befähigt sind — und Art. 12 die Protokollierung."
        ton={v.verwerfen.trim() ? 'ok' : aufsichtFehlt ? 'stopp' : null}
      >
        <input
          className={feld}
          placeholder={'z. B. M. Berger (Sachbearbeitung), Vertretung: die diensthabende Teamleitung'}
          value={v.verwerfen}
          onChange={(e) => setzen('verwerfen', e.target.value)}
        />
      </Frage>

      {aufsichtFehlt ? (
        <Fazit ton="stopp" titel="Art. 14 nicht erfüllt">
          Das System ist als Hochrisiko eingestuft, aber niemand ist benannt, der ein Ergebnis
          verwerfen darf. „Ein Mensch schaut drauf" genügt dafür nicht — die Verordnung verlangt
          eine befähigte, benannte Aufsicht. Solange das offen ist, steht der Fall in der Signalliste.
        </Fazit>
      ) : beantwortet === 4 ? (
        <Fazit ton="ok" titel="Entschieden und begründet">
          Damit ist der Regler kein Modelldetail mehr, sondern eine dokumentierte Entscheidung mit
          Eigentümer. Sie gehört in die technische Dokumentation und wird bei jeder Nachtrainierung
          erneut geprüft — ein neues Modell hat andere Fehler.
        </Fazit>
      ) : null}
    </Pruefblock>
  )
}
