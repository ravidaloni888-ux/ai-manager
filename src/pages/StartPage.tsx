import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMandantStore, MANDANT_STYLE } from '../store/mandantStore'
import { useWizardStore, StepId, useActiveScope, SCOPE_PRESETS, WORK_STEP_IDS, deriveStepNotes } from '../store/wizardStore'
import { useProfil, useProfilStore } from '../store/mandantProfil'
import { useUseCasesStore } from '../store/useCasesStore'
import MandatProfil from '../components/start/MandatProfil'

interface Step {
  id: StepId
  phase: string
  num: number
  /** 'read' = reines Nachschlagewerk, gehört nicht in die Aufgabenliste */
  kind?: 'do' | 'read'
  title: string
  description: string
  detail: string
  /** Was genau einzutragen ist — die Punkte, die der geführte Modus abfragt */
  eingaben?: string[]
  effort: string
  to: string
  cta: string
}

export const STEPS: Step[] = [
  // ── Phase 1 · Fundament ──
  {
    id: 'swot',
    phase: 'Fundament',
    num: 1,
    title: 'SWOT für den KI-Einsatz',
    description: 'Stärken, Schwächen, Chancen und Risiken erfassen — grob, zwei bis vier Punkte je Feld.',
    detail: 'Die Standortbestimmung kommt vor die Vision, damit das Zielbild nicht am Markt oder an der eigenen Lage vorbeigeht. Entscheidend sind die unbequemen Felder: Wer Schwächen und Risiken auslässt, formuliert eine Vision, die im ersten Quartal an der Wirklichkeit zerschellt.',
    eingaben: [
      'Stärken — welche Daten, welches Fachwissen, welcher Rückhalt',
      'Schwächen — wo Daten, Kompetenzen oder Entscheidungswege fehlen',
      'Chancen — Marktlücken, reife Technologie, Partnerschaften',
      'Risiken — Auflagen, Wettbewerb, Abhängigkeit von Anbietern',
    ],
    effort: '~45 Min.',
    to: '/strategy?tab=swot',
    cta: 'SWOT öffnen',
  },
  {
    id: 'vision',
    phase: 'Fundament',
    num: 1,
    title: 'KI-Vision definieren',
    description: 'Legen Sie die strategische Ausrichtung fest — Zeithorizont, 3 Kernziele und die Wettbewerbsherausforderung, die den KI-Einsatz antreibt.',
    detail: 'Eine klare Vision richtet die Organisation aus und gibt jeder Anwendungsfallentscheidung einen "Nordstern". Ohne sie zerfallen KI-Bemühungen in isolierte Experimente, die sich nie verstärken.',
    eingaben: [
      'Zeithorizont der Vision (z. B. 3 Jahre)',
      'Drei Kernziele, je in einem Satz',
      'Die Wettbewerbsherausforderung, die KI beantworten soll',
      'Schwerpunktbereiche mit Zielbild',
    ],
    effort: '~30 Min.',
    to: '/strategy?tab=vision',
    cta: 'Vision-Assistent öffnen',
  },
  {
    id: 'maturity',
    phase: 'Fundament',
    num: 2,
    title: 'KI-Reifegrad einschätzen',
    description: 'Schließen Sie die Reifegradbeurteilung ab, um zu verstehen, wo Ihre Organisation in Bezug auf Daten, Talente, Tools und Governance steht.',
    detail: 'Der Reifegradscore zeigt, welche Anwendungsfälle heute realistisch sind und wo Sie investieren müssen, bevor Sie skalieren. Er verhindert Überversprechen gegenüber Stakeholdern.',
    eingaben: [
      'Je Dimension (Daten, Talente, Technologie, Governance, Kultur) eine Reifestufe 1–5',
      'Kurze Begründung, woran Sie die Stufe festmachen',
    ],
    effort: '~45 Min.',
    to: '/strategy?tab=maturity',
    cta: 'Reifegrad einschätzen',
  },

  {
    id: 'gap',
    phase: 'Fundament',
    num: 4,
    title: 'Gap-Analyse — Lücke bestimmen',
    description: 'Die Differenz zwischen Anspruch und Reife je Dimension, sortiert nach Größe.',
    detail: 'Keine eigene Erhebung, sondern Rechenarbeit: Soll kommt aus dem Ambitionsniveau der Vision, Ist aus dem Reifegradcheck. Deshalb steht dieser Schritt zwingend nach beiden. Die größte Lücke bestimmt, worauf die Strategie antworten muss — alles andere ist Beiwerk.',
    eingaben: [
      'Nichts einzutragen — Vision und Reifegrad müssen vorliegen',
      'Ergebnis prüfen: ist der Engpass plausibel?',
      'Bei „keine Lücke": Ambitionsniveau womöglich zu niedrig gewählt',
    ],
    effort: '~15 Min.',
    to: '/strategy?tab=gap',
    cta: 'Gap-Analyse öffnen',
  },

  {
    id: 'strategie',
    phase: 'Fundament',
    num: 5,
    title: 'Strategische Schwerpunkte festlegen',
    description: 'Aus der größten Lücke die Schwerpunkte ableiten, priorisieren und mit Budget und Kennzahlen hinterlegen.',
    detail: 'Die Strategie ist die Antwort auf die Gap-Analyse — sie sagt, wie die Lücke geschlossen wird. Wer hier Schwerpunkte setzt, die nichts mit dem ermittelten Engpass zu tun haben, hat entweder die Lücke falsch bestimmt oder die Strategie an ihr vorbei gebaut. Budget und Kennzahlen machen aus der Absicht eine Verpflichtung.',
    eingaben: [
      'Je Schwerpunkt eine Priorität setzen — der Engpass aus der Gap-Analyse zuerst',
      'Zielbild je Schwerpunkt in einem Satz',
      'Gesamtbudget und Ziel-Rendite eintragen',
      'Kennzahlen mit Ist, Ziel und Frist',
    ],
    effort: '~1 Std.',
    to: '/strategy?tab=focus',
    cta: 'Schwerpunkte öffnen',
  },

  // ── Phase 2 · Rechtsrahmen & Ethik ──
  {
    id: 'eu-act-basics',
    phase: 'Rechtsrahmen & Ethik',
    num: 3,
    kind: 'read',
    title: 'EU AI Act verstehen',
    description: 'Verschaffen Sie sich Überblick über Zeitplan, die vier Risikoklassen und die Pflichten je Klasse — bevor Sie eigene Systeme einordnen.',
    detail: 'Sie können Anwendungsfälle nicht in Risikoklassen einsortieren, die Sie nicht kennen — dieser Schritt ist die Grundlage für die spätere Klassifizierung je Anwendungsfall. Die Kompetenzpflicht (Art. 4) und die Verbote (Art. 5) gelten bereits seit Februar 2025.',
    effort: '~45 Min.',
    to: '/eu-ai-act',
    cta: 'EU AI Act öffnen',
  },
  {
    id: 'dsgvo',
    phase: 'Rechtsrahmen & Ethik',
    num: 4,
    title: 'DSGVO-Grundlagen klären',
    description: 'Marktortprinzip, Rechtsgrundlagen der Verarbeitung, Auftragsverarbeitung und die Anforderungen an eine Datenschutz-Folgenabschätzung (DSFA).',
    detail: 'KI-Systeme verarbeiten fast immer personenbezogene Daten. Ohne saubere Rechtsgrundlage und AVV ist ein Projekt rechtswidrig — unabhängig davon, wie gut es funktioniert. Diese Basis brauchen Sie für die Governance-Richtlinie und die Fallprüfung.',
    eingaben: [
      'Die Dreistufen-Prüfung für Ihr Haus durchgehen',
      'Festhalten, welche Rechtsgrundlage Sie üblicherweise heranziehen',
    ],
    effort: '~45 Min.',
    to: '/dsgvo',
    cta: 'DSGVO & Datenschutz öffnen',
  },
  {
    id: 'ethics',
    phase: 'Rechtsrahmen & Ethik',
    num: 5,
    title: 'Ethischen Maßstab erarbeiten',
    description: 'FAST-Prinzipien, SUM-Werte und das Drei-Zonen-Modell als Maßstab für die spätere Bewertung einzelner Vorhaben.',
    detail: 'Legal ist nicht gleich vertretbar. Hier erarbeiten Sie den Maßstab; angewendet wird er später je Anwendungsfall unter „Prüfungen zu diesem Fall". Festgeschrieben wird er in der Ethik-Dimension Ihrer Governance-Richtlinie — ohne diesen Schritt füllen Sie die dort ins Blaue.',
    eingaben: [
      'Den ethischen Maßstab für Ihr Haus festlegen (FAST/SUM, Drei-Zonen)',
      'Notieren, welche Zone für Sie tabu ist',
    ],
    effort: '~30 Min.',
    to: '/ethik',
    cta: 'KI-Ethik öffnen',
  },

  // ── Phase 3 · Governance & Stakeholder ──
  {
    id: 'governance',
    phase: 'Governance & Stakeholder',
    num: 6,
    title: 'KI-Governance-Richtlinie aufsetzen',
    description: 'Dokumentieren Sie Ihre organisationsweite KI-Richtlinie in 7 Dimensionen: Zweck, Daten, Transparenz, Verantwortung, Risiko, Ethik und Schulung.',
    detail: 'Die Richtlinie übersetzt EU AI Act, DSGVO und Ihren ethischen Rahmen in verbindliche Hausregeln. Sie ist unter dem EU AI Act erforderlich und verhindert Schatten-KI-Initiativen.',
    eingaben: [
      'Je Dimension (Zweck, Daten, Transparenz, Verantwortung, Risiko, Ethik, Schulung) die Hausregel formulieren',
      'Geltungsbereich und Inkrafttreten eintragen',
    ],
    effort: '~1 Std.',
    to: '/governance',
    cta: 'KI-Governance öffnen',
  },
  {
    id: 'roles',
    phase: 'Governance & Stakeholder',
    num: 7,
    title: 'Rollen & Verantwortlichkeiten zuweisen',
    description: 'Benennen Sie KI-Verantwortlichen, Datenschutzbeauftragten, Data Owner, Ethik-Prüfer und weitere Schlüsselrollen — und dokumentieren Sie, wer wofür verantwortlich ist.',
    detail: 'Der EU AI Act erfordert benannte Verantwortlichkeit. Wichtig: Die KI-Beauftragte verantwortet den Prozess, die fachliche Datenverantwortung liegt bei den Data Ownern im Fachbereich.',
    eingaben: [
      'KI-Verantwortliche:n benennen',
      'Datenschutzbeauftragte:n benennen',
      'Data Owner je Fachbereich benennen',
      'Ethik-Prüfer:in benennen',
    ],
    effort: '~20 Min.',
    to: '/governance',
    cta: 'Rollen zuweisen',
  },
  {
    id: 'stakeholders',
    phase: 'Governance & Stakeholder',
    num: 8,
    title: 'Stakeholder-Analyse durchführen',
    description: 'Kartieren Sie alle Beteiligten nach Macht und Interesse (Mendelow-Matrix) und leiten Sie daraus die Kommunikationsstrategie je Quadrant ab.',
    detail: 'Neben den formalen Rollen entscheidet die informelle Machtkarte über Erfolg oder Scheitern. Sie ist außerdem Voraussetzung für die Change-Diagnose — politischer Widerstand lässt sich ohne sie nicht erkennen.',
    eingaben: [
      'Alle Beteiligten erfassen',
      'Je Person Macht und Interesse einschätzen',
      'Kommunikationsstrategie je Quadrant ableiten',
    ],
    effort: '~1 Std.',
    to: '/stakeholders',
    cta: 'Stakeholder-Analyse öffnen',
  },

  // ── Phase 4 · Portfolio & Priorisierung ──
  {
    id: 'usecases',
    phase: 'Portfolio & Priorisierung',
    num: 9,
    title: 'KI-Anwendungsfälle inventarisieren',
    description: 'Fügen Sie jede KI-Initiative — in Betrieb, in Evaluierung oder nur eine Idee — zum Portfolio hinzu. Inkl. Abteilung, Status und kurzer Problembeschreibung.',
    detail: 'Man kann nur managen, was man sieht. Viele Organisationen entdecken in dieser Phase Schatten-KI-Projekte — Initiativen, die ohne Governance oder Risikoprüfung laufen.',
    eingaben: [
      'Je Initiative: Titel, Abteilung, Status',
      'Kurze Problembeschreibung',
      'Auch laufende und nur angedachte Vorhaben aufnehmen',
    ],
    effort: '~1–2 Std.',
    to: '/use-cases',
    cta: 'Anwendungsfälle öffnen',
  },
  {
    id: 'data-quality',
    phase: 'Portfolio & Priorisierung',
    num: 10,
    title: 'Datenqualität je Fall prüfen',
    description: 'Bewerten Sie die Datengrundlage jedes Kandidaten: erst das Gate aus drei Fragen, dann die sieben Qualitätsdimensionen — im Anwendungsfall unter „Prüfungen zu diesem Fall".',
    detail: 'Datenqualität ist Machbarkeit. Ein RAG-System mit 70 % der Daten kann schlechter sein als keins, wenn die fehlenden 30 % genau die kritischen Fälle abdecken. Diese Prüfung gehört vor die Bewertung — sonst schätzen Sie die Machbarkeit bei der Bewertung falsch ein.',
    eingaben: [
      'Je Fall die sieben Qualitätsdimensionen bewerten',
      'FAIR ergibt sich daraus — ohne zweite Erhebung',
      '(im Anwendungsfall unter „Prüfungen zu diesem Fall")',
    ],
    effort: '~30 Min. pro Fall',
    to: '/use-cases',
    cta: 'Anwendungsfälle öffnen',
  },
  {
    id: 'score',
    phase: 'Portfolio & Priorisierung',
    num: 11,
    title: 'Portfolio bewerten & priorisieren',
    description: 'Füllen Sie das KI-Canvas für jeden Fall aus — Geschäftsnutzen, Machbarkeit, strategische Passung und Dringlichkeit — um ein Prioritätsranking zu errechnen.',
    detail: 'Priorisierung löst das Problem "der Lauteste gewinnt". Das gewichtete Scoremodell gibt der Führungsebene eine objektive Grundlage für Investitionsentscheidungen — die Machbarkeit ist nach der Datenprüfung belastbar.',
    eingaben: [
      'Je Fall: Geschäftsnutzen, Machbarkeit, strategische Passung, Dringlichkeit',
      'Canvas-Felder zum Vorhaben ausfüllen',
    ],
    effort: '~30 Min. pro Fall',
    to: '/use-cases',
    cta: 'Anwendungsfälle bewerten',
  },
  {
    id: 'eu-act',
    phase: 'Portfolio & Priorisierung',
    num: 12,
    title: 'EU AI Act-Risiko je Fall klassifizieren',
    description: 'Legen Sie das EU AI Act-Risikoniveau (Minimal / Limited / High / Unacceptable) für jeden Anwendungsfall fest und füllen Sie die Datenschutz-Checkliste für Hochrisikofälle aus.',
    detail: 'Jetzt wenden Sie den Rahmen des EU AI Act auf Ihr eigenes Portfolio an. Hochrisiko-Systeme erfordern eine DSFA und zusätzliche Dokumentation — frühzeitige Identifikation vermeidet kostspielige Nachbesserungen. Hilfsmittel dafür: die Compliance-Checks unter DSGVO & Datenschutz (DSFA-Pflicht, AVV, Art. 22).',
    eingaben: [
      'Je Fall den Risikoklassen-Check durchlaufen',
      'Je Fall DSFA-Pflicht, AVV und Art. 22 prüfen',
    ],
    effort: '~15 Min. pro Fall',
    to: '/use-cases',
    cta: 'Risikoniveaus prüfen',
  },
  {
    id: 'project-plan',
    phase: 'Portfolio & Priorisierung',
    num: 13,
    title: 'Compliance-Projektplan erstellen',
    description: 'Der Plan entsteht im Anwendungsfall aus Mandanten-Profil und den dort erledigten Prüfungen — gefragt wird nur noch, was offen ist.',
    detail: 'Die Klassifizierung allein sagt nur, dass Pflichten bestehen — nicht, welche Aufgaben daraus konkret folgen. Der Plan übersetzt das Ergebnis der Risikoklassifizierung in eine abarbeitbare Liste.',
    eingaben: [
      'Im Anwendungsfall die offenen Fragen des Plans beantworten',
      'Der Rest wird aus Profil und Prüfungen übernommen',
    ],
    effort: '~30 Min. pro Fall',
    to: '/use-cases',
    cta: 'Anwendungsfälle öffnen',
  },

  // ── Phase 5 · Risiko & Investition ──
  {
    id: 'risks',
    phase: 'Risiko & Investition',
    num: 14,
    title: 'KI-Risiken erfassen & bewerten',
    description: 'Erfassen Sie technische, ethische und operative Risiken Ihres Portfolios. Bewerten Sie B×A×E, weisen Sie Verantwortliche zu und verfolgen Sie den Maßnahmenstatus.',
    detail: 'KI-Risiken (Bias, Modell-Drift, Vendor Lock-in) sind oft unsichtbar, bis sie einen Vorfall verursachen. Ein Risikoregister macht sie sichtbar und handhabbar, bevor sie eskalieren.',
    eingaben: [
      'Je Risiko: Beschreibung, Kategorie, Bewertung B×A×E',
      'Verantwortliche:n und Maßnahme zuweisen',
    ],
    effort: '~1 Std.',
    to: '/risk',
    cta: 'Risikomanager öffnen',
  },
  {
    id: 'roadmap',
    phase: 'Risiko & Investition',
    num: 16,
    title: 'Roadmap generieren',
    description: 'Sequenzieren Sie Anwendungsfälle in Quartale nach Prioritätsscore und Budgetobergrenze — und ordnen Sie das Portfolio den drei strategischen Horizonten zu.',
    detail: 'Eine Roadmap wandelt das Prioritätsranking in eine Lieferverpflichtung um. Der Horizonte-Check zeigt zusätzlich, ob Sie in der Pilotfalle stecken: 74 % der Unternehmen bleiben dauerhaft im Deploy-Horizont und nennen das Strategie.',
    eingaben: [
      'Budgetobergrenze je Quartal setzen',
      'Fälle den Quartalen zuordnen',
      'Portfolio den drei Horizonten zuordnen',
    ],
    effort: '~30 Min.',
    to: '/roadmap',
    cta: 'Roadmap-Generator öffnen',
  },
  {
    id: 'roi',
    phase: 'Risiko & Investition',
    num: 17,
    title: 'ROI für Schlüsselfälle berechnen',
    description: 'Modellieren Sie für Ihre Hochprioritätsfälle Investitionskosten, Jahresnutzen, Amortisationszeit und Break-even-Punkt.',
    detail: 'Finanzen und Führungsebene werden ROI-Zahlen vor der Budgetfreigabe verlangen. Zusammen mit der Roadmap ergibt das den Business Case, den Sie zur Freigabe vorlegen.',
    eingaben: [
      'Je Schlüsselfall: Investitionskosten und Jahresnutzen',
      'Laufende Kosten eintragen',
    ],
    effort: '~15 Min. pro Fall',
    to: '/roi',
    cta: 'ROI-Rechner öffnen',
  },

  // ── Phase 6 · Umsetzung & Betrieb ──
  {
    id: 'qa',
    phase: 'Umsetzung & Betrieb',
    num: 18,
    title: 'QS & Abnahmekriterien festlegen',
    description: 'Legen Sie Test-Typen, Abnahmestrategie und einen prüfbaren Anforderungskatalog mit Messgrößen und Schwellenwerten fest.',
    detail: '"Besser werden" ist keine Anforderung — eine Zahl ist eine Anforderung. Abnahmekriterien müssen stehen, bevor gebaut wird; sonst diskutieren Sie am Ende darüber, ob das Ergebnis gut genug ist.',
    eingaben: [
      'Test-Typen und Abnahmestrategie wählen',
      'Anforderungen mit Messgröße und Schwellenwert formulieren',
    ],
    effort: '~1–2 Std.',
    to: '/qa',
    cta: 'KI-Qualitätssicherung öffnen',
  },
  {
    id: 'data-integrity',
    phase: 'Umsetzung & Betrieb',
    num: 17,
    title: 'Datenintegrität sicherstellen',
    description: 'Prüfsummen, Audit-Trail und Versionierung festlegen — die Mechanismen, die dafür sorgen, dass Daten das bleiben, was sie sein sollen.',
    detail: 'Bei Hochrisiko-Systemen ist die Protokollierung nach Art. 12 EU AI Act Pflicht (Frist 2. Dezember 2027). Anders als die Datenqualität gilt das nicht je Fall, sondern ist Infrastruktur — einmal eingerichtet, für alle Systeme wirksam.',
    eingaben: [
      'Prüfsummen-Verfahren festlegen',
      'Audit-Trail und Aufbewahrungsdauer festlegen',
      'Versionierung von Daten und Modellen festlegen',
    ],
    effort: '~45 Min.',
    to: '/data',
    cta: 'Daten & Qualität öffnen',
  },
  {
    id: 'change',
    phase: 'Umsetzung & Betrieb',
    num: 19,
    title: 'Change-Widerstände diagnostizieren',
    description: 'Bestimmen Sie je Schlüsselperson die Widerstandsdimension (rational / emotional / politisch) und den ADKAR-Barrierepunkt — und leiten Sie daraus Maßnahmen ab.',
    detail: 'KI-Projekte scheitern selten an der Technologie, meist an der Organisation. Wer die Dimension verwechselt, greift falsch ein: Emotionaler Widerstand, mit Fakten bekämpft, verhärtet sich. Erst diagnostizieren, dann handeln — und erst dann schulen.',
    eingaben: [
      'Je Schlüsselperson die Widerstandsdimension bestimmen',
      'Je Person den ADKAR-Barrierepunkt bestimmen',
      'Maßnahme je Person ableiten',
    ],
    effort: '~1 Std.',
    to: '/change',
    cta: 'Change Management öffnen',
  },
  {
    id: 'enablement',
    phase: 'Umsetzung & Betrieb',
    num: 20,
    title: 'Team-Schulung planen',
    description: 'Definieren Sie Ihren Schulungsplan nach Zielgruppe, Format, Zeitpunkt und Sprache — und legen Sie fest, wie Sie den Erfolg messen.',
    detail: 'Schulung wirkt erst ab der Akzeptanzphase. Wer bei Frust und Widerstand schult, verstärkt ihn — deshalb kommt die Change-Diagnose zuerst. Bei KI-Systemen ist Kirkpatrick-Ebene 3 (Verhalten) der Mindeststandard.',
    eingaben: [
      'Zielgruppen und Formate festlegen',
      'Zeitpunkt und Sprache je Schulung',
      'Messgröße für den Schulungserfolg',
    ],
    effort: '~45 Min.',
    to: '/enablement',
    cta: 'Schulung & Coaching öffnen',
  },
]

const PHASES = [...new Set(STEPS.map((s) => s.phase))]

const PHASE_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Fundament':                { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
  'Rechtsrahmen & Ethik':     { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800',   badge: 'bg-rose-100 text-rose-700' },
  'Governance & Stakeholder': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  'Portfolio & Priorisierung':{ bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  'Risiko & Investition':     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  'Umsetzung & Betrieb':      { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700' },
}


// ── Page ───────────────────────────────────────────────────────────────────
export default function StartPage() {
  const navigate = useNavigate()
  const activeId  = useMandantStore((s) => s.activeId)
  const mandanten = useMandantStore((s) => s.mandanten)
  const setScope  = useMandantStore((s) => s.setScope)
  const scope     = useActiveScope()
  const { done, toggle, init } = useWizardStore()
  const profil = useProfil()
  const initProfil = useProfilStore((p) => p.init)
  const { useCases } = useUseCasesStore()
  const [expanded, setExpanded] = useState<StepId | null>(null)
  const [scopeOpen, setScopeOpen] = useState(false)

  useEffect(() => { init(); initProfil() }, [activeId, init, initProfil])

  const mandant = mandanten.find((m) => m.id === activeId)
  const isClient = mandant?.type === 'client'

  // Nur Schritte im Umfang des Mandats — fortlaufend neu nummeriert,
  // damit bei eingeschränktem Umfang keine Lücken entstehen.
  const scopeSet = new Set<StepId>(scope)
  const inScope = STEPS.filter((s) => scopeSet.has(s.id))
  // Nur Schritte, bei denen tatsächlich etwas entsteht, sind abhakbare Aufgaben.
  const steps = inScope
    .filter((s) => s.kind !== 'read')
    .map((s, i) => ({ ...s, num: i + 1 }))
  const readSteps = inScope.filter((s) => s.kind === 'read')

  // Schritte, die für dieses Mandat nicht greifen — markiert, nicht versteckt
  const notes = deriveStepNotes({
    iso42001: profil.iso42001,
    faelle: useCases.length,
    hatHochrisiko: useCases.some((uc) => uc.euAiActRisk === 'High Risk' || uc.euAiActRisk === 'Unacceptable Risk'),
  })
  const entfallen = steps.filter((s) => notes[s.id]?.entfaellt)
  const pflicht = steps.filter((s) => !notes[s.id]?.entfaellt)

  const completedCount = pflicht.filter((s) => done.has(s.id)).length
  const totalCount     = pflicht.length
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // first incomplete step id
  const nextStep = pflicht.find((s) => !done.has(s.id))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Einstieg</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isClient
            ? 'Die Schritte, die für dieses Kundenmandat gelten — in fachlicher Reihenfolge.'
            : 'Ihr KI-Manager-Playbook — folgen Sie diesen Schritten, um ein solides KI-Programm aufzubauen.'}
        </p>
      </div>

      {/* Mandat & Umfang */}
      {mandant && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-base leading-none">{MANDANT_STYLE[mandant.type].icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{mandant.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Umfang: {mandant.scopePreset
                  ? SCOPE_PRESETS.find((p) => p.key === mandant.scopePreset)?.label ?? 'Individuell'
                  : isClient ? 'Individuell' : 'Komplettes Programm'} · {totalCount} Schritte
                {entfallen.length > 0 && ` · ${entfallen.length} entfallen`}
              </p>
            </div>
            {isClient && (
              <button
                onClick={() => setScopeOpen((v) => !v)}
                className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                {scopeOpen ? 'Schließen' : 'Umfang ändern'}
              </button>
            )}
          </div>

          {isClient && scopeOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              {SCOPE_PRESETS.map((preset) => {
                const isCurrent = mandant.scopePreset === preset.key
                return (
                  <button
                    key={preset.key}
                    onClick={() => { setScope(mandant.id, preset.steps, preset.key); setScopeOpen(false) }}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      isCurrent ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{preset.label}</p>
                      <span className="text-[10px] text-slate-400">{preset.steps.length} Schritte</span>
                      {isCurrent && <span className="ml-auto text-[10px] font-bold text-blue-600">aktiv</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{preset.hint}</p>
                  </button>
                )
              })}
              <button
                onClick={() => { setScope(mandant.id, WORK_STEP_IDS, undefined); setScopeOpen(false) }}
                className="w-full text-left rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-800">Alle Arbeitsschritte</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ohne die eigenen Wissensmodule (Rechtsrahmen &amp; Ethik).</p>
              </button>
            </div>
          )}
        </div>
      )}

      <MandatProfil />

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">
            {completedCount === totalCount
              ? '🎉 Alle Schritte abgeschlossen!'
              : `${completedCount} von ${totalCount} Schritten abgeschlossen`}
          </p>
          <span className="text-sm font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextStep && (
          <div className="flex items-center justify-between gap-4 mt-3">
            <p className="text-xs text-slate-400 min-w-0">
              Als nächstes: <span className="font-semibold text-slate-600">Schritt {nextStep.num} — {nextStep.title}</span>
            </p>
            <button
              onClick={() => navigate(`/guide?step=${nextStep.id}`)}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Fortsetzen →
            </button>
          </div>
        )}
      </div>

      {/* Steps by phase */}
      {PHASES.filter((phase) => steps.some((s) => s.phase === phase)).map((phase) => {
        const phaseSteps  = steps.filter((s) => s.phase === phase)
        const phaseDone   = phaseSteps.filter((s) => done.has(s.id)).length
        const style       = PHASE_STYLE[phase]

        return (
          <div key={phase} className="space-y-2">
            {/* Phase header */}
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{phase}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {phaseDone}/{phaseSteps.length}
              </span>
            </div>

            {/* Step cards */}
            <div className="space-y-2">
              {phaseSteps.map((step) => {
                const note       = notes[step.id]
                const skipped    = !!note?.entfaellt
                const isComplete = done.has(step.id)
                const isNext     = nextStep?.id === step.id
                const isExpanded = expanded === step.id

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl border-2 transition-all ${
                      skipped
                        ? 'border-slate-100 opacity-60'
                        : isComplete
                        ? 'border-slate-100 opacity-70'
                        : isNext
                        ? 'border-blue-400 shadow-md'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggle(step.id)}
                        className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                          isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : isNext
                            ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
                            : 'border-slate-300 text-slate-300 hover:border-slate-400'
                        }`}
                        title={isComplete ? 'Als unvollständig markieren' : 'Als abgeschlossen markieren'}
                      >
                        {isComplete ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{step.num}</span>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {step.title}
                              </p>
                              {isNext && !skipped && (
                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Weiter</span>
                              )}
                              {skipped && (
                                <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">entfällt</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                            {note?.grund && (
                              <p className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
                                <strong className="text-slate-600">Warum entfällt das?</strong> {note.grund}
                              </p>
                            )}
                            {note?.hinweis && (
                              <p className="text-[11px] text-amber-800 mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
                                {note.hinweis}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {step.effort}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className={`mt-3 p-3 rounded-lg text-xs text-slate-600 leading-relaxed border ${style.bg} ${style.border}`}>
                            <p className={`font-semibold mb-1 ${style.text}`}>Warum dieser Schritt wichtig ist</p>
                            {step.detail}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2.5">
                          <button
                            onClick={() => navigate(`/guide?step=${step.id}`)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isComplete
                                ? 'text-slate-500 bg-slate-50 hover:bg-slate-100'
                                : 'text-white bg-blue-600 hover:bg-blue-500'
                            }`}
                          >
                            {step.cta} →
                          </button>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : step.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? 'Detail ausblenden' : 'Warum?'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Nachschlagewerke — kein Fortschritt, nur Referenz */}
      {readSteps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Wissensgrundlagen</p>
          <p className="text-[11px] text-slate-400 mb-3">
            Nachschlagewerke ohne Fortschritt — hier wird nichts abgehakt, Sie schlagen bei Bedarf nach.
          </p>
          <div className="space-y-2">
            {readSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => navigate(step.to)}
                className="w-full flex items-center gap-3 text-left border border-slate-100 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <span className="text-base leading-none flex-shrink-0">📖</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 leading-tight">{step.title}</p>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{step.description}</p>
                </div>
                <span className="text-xs text-slate-300 flex-shrink-0">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-slate-400 pb-2">
        Schritte können in beliebiger Reihenfolge abgeschlossen werden — die obige Sequenz spiegelt die fachlichen Abhängigkeiten wider.
        Fortschritt wird automatisch im Browser gespeichert.
      </p>
    </div>
  )
}
