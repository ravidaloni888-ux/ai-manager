import { useState } from 'react'

// ── Data ───────────────────────────────────────────────────────────────────

const TIMELINE = [
  { date: '1 Aug 2024', label: 'AI Act tritt in Kraft', highlight: false },
  { date: '2 Feb 2025', label: 'Verbote (Art. 5) + Kompetenzpflicht (Art. 4) — gilt heute', highlight: true },
  { date: '2 Aug 2025', label: 'GPAI-Modelle (Kap. V)', highlight: false },
  { date: '16/29 Jun 2026', label: 'Digital Omnibus: EP-Abstimmung (423 Stimmen) + Ratsbeschluss — nur noch Amtsblatt ausstehend (vor 2.8.2026)', highlight: true },
  { date: '2 Dec 2027', label: 'Hochrisiko-KI (Anhang III) — verschoben durch Digital Omnibus', highlight: false },
  { date: '2 Aug 2028', label: 'Vollständige Anwendung + produktintegrierte KI (Anhang I)', highlight: true },
]

const RISK_CLASSES = [
  {
    level: 1,
    name: 'Inakzeptables Risiko',
    color: 'bg-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    summary: 'Verbotene Praktiken — vollständig verboten seit 2. Feb 2025',
    duties: 'Einsatz und Inverkehrbringen sind verboten. Verstöße: Bußgelder bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes.',
    examples: [
      'Unterschwellige Manipulation (KI beeinflusst Verhalten unbemerkt)',
      'Social Scoring durch Behörden',
      'Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum (mit engen Ausnahmen)',
      'Prädiktive Polizeiarbeit allein auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen',
    ],
  },
  {
    level: 2,
    name: 'Hohes Risiko',
    color: 'bg-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    summary: 'Strenge Anforderungen für sensible Anwendungsbereiche (Art. 6–49)',
    duties: 'Risikomanagement, Datenqualität, technische Dokumentation, Transparenz, menschliche Aufsicht, Genauigkeit & Robustheit, Konformitätsbewertung vor Inverkehrbringen.',
    examples: [
      'KI in Medizinprodukten',
      'Biometrische Identifizierungssysteme',
      'Kritische Infrastruktur',
      'Bildung & Berufsausbildung',
      'Beschäftigung & Personalmanagement',
      'Zugang zu wesentlichen Dienstleistungen',
      'Strafverfolgung, Migration & Asyl, Justiz',
    ],
  },
  {
    level: 3,
    name: 'Begrenztes Risiko',
    color: 'bg-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    summary: 'Transparenzpflichten für bestimmte KI-Systeme (Art. 50–51)',
    duties: 'Nutzer müssen darüber informiert werden, dass sie mit KI interagieren oder Inhalte KI-generiert sind. Keine weiteren spezifischen Compliance-Anforderungen.',
    examples: [
      'Chatbots (müssen sich als KI zu erkennen geben)',
      'KI-generierte Inhalte / Deepfakes',
      'Emotionserkennung (sofern nicht verboten)',
    ],
  },
  {
    level: 4,
    name: 'Minimales Risiko',
    color: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    summary: 'Freie Nutzung — keine spezifischen KI-Act-Anforderungen',
    duties: 'Keine spezifischen Pflichten nach dem KI-Act. Allgemeine Rechtsvorschriften gelten weiterhin.',
    examples: [
      'Spam-Filter',
      'KI in Videospielen',
      'Inhaltsempfehlungssysteme',
      'Einfache Automatisierungstools',
    ],
  },
]

const ACTOR_ROLES = [
  {
    role: 'Anbieter',
    art: 'Art. 3 Nr. 3',
    definition: 'Entwickelt KI und bringt sie in Verkehr',
    example: 'Das Softwarehaus, das das Basis-System gebaut hat',
    duties: 'Vollständige Art. 16-Pflichten bei Hochrisiko-KI: Dokumentation, Konformitätsbewertung, CE-Kennzeichnung, Registrierung, Marktüberwachung nach Inverkehrbringen.',
  },
  {
    role: 'Betreiber',
    art: 'Art. 3 Nr. 4',
    definition: 'Setzt ein fremdes KI-System in eigener Verantwortung ein',
    example: 'Dr. Seika — solange das System unverändert bleibt. Private, nicht berufliche Nutzung ist ausdrücklich ausgenommen.',
    duties: 'Art. 26-Pflichten: zweckgemäßen Einsatz sicherstellen, zuständige Personen benennen und schulen (Art. 4), menschliche Aufsicht gewährleisten (Art. 14), Inputdaten überwachen, Vorfälle an den Anbieter melden.',
  },
  {
    role: 'Importeur',
    art: 'Art. 3 Nr. 6',
    definition: 'Bringt KI aus einem Drittstaat in die EU',
    example: 'EU-Tochter ("Bevollmächtigter") eines US- oder chinesischen Unternehmens',
    duties: 'Prüfen ob der Anbieter die Art. 16-Pflichten erfüllt hat, bevor die KI auf dem EU-Markt platziert wird.',
  },
  {
    role: 'Händler',
    art: 'Art. 3 Nr. 7',
    definition: 'Stellt KI in der Lieferkette bereit, ohne Veränderung',
    example: 'Reseller, der Softwarelizenzen weiterverkauft (nicht in der EU ansässig)',
    duties: 'CE-Kennzeichnung und Dokumentation prüfen; nicht in Verkehr bringen, wenn Anforderungen nicht erfüllt sind.',
  },
]

const ART25_TRIGGERS = [
  {
    id: 'modification',
    title: 'Erhebliche Veränderung',
    desc: 'Ein Hochrisiko-KI-System wird erheblich verändert (z. B. mit eigenen Daten nachtrainiert) — Art. 25 Abs. 1 lit. b',
  },
  {
    id: 'purpose',
    title: 'Zweckänderung',
    desc: 'Ein System wird für einen wesentlich anderen Zweck eingesetzt als vom Anbieter vorgesehen',
  },
  {
    id: 'own_brand',
    title: 'Eigenvermarktung',
    desc: 'Ein System wird unter eigenem Namen oder eigener Marke vermarktet — eindeutig, kein Graubereich',
  },
]

const COPYRIGHT_RULES = [
  {
    scenario: 'Rein KI-generiert',
    protection: 'Kein Schutz',
    color: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    detail: 'Kein menschlicher Gestaltungsanteil → kein Urheberrechtsschutz nach §2 UrhG. Nur "persönliche geistige Schöpfungen" sind geschützt.',
  },
  {
    scenario: 'Mensch + KI',
    protection: 'Abhängig vom menschlichen Anteil',
    color: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    detail: 'Prompt, Auswahl, Bearbeitung → Je höher der menschliche Anteil, desto eher besteht Urheberrechtsschutz.',
  },
  {
    scenario: 'KI als Werkzeug',
    protection: 'Voller Schutz',
    color: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    detail: 'KI nur als Werkzeug eingesetzt, Mensch schafft das Werk → geschützt wie eine herkömmliche Schöpfung.',
  },
]

const AI_ACT_GOALS = [
  { title: 'Schutz von Grundrechten, Demokratie, Rechtsstaatlichkeit', desc: 'Würde, Freiheit, Gleichheit, Privatsphäre, Nichtdiskriminierung — greift z.B. bei Bias-Risiken in HR-KI.', icon: '⚖️' },
  { title: 'Schutz von Gesundheit und Sicherheit', desc: 'Begründet die strenge Regulierung von Medizin-KI, Industrie-KI und autonomem Fahren.', icon: '🛡️' },
  { title: 'Förderung von Innovation und Wettbewerbsfähigkeit', desc: 'Regulatory Sandboxes (Art. 57), KMU-Erleichterungen, gestaffelte Anforderungen.', icon: '🚀' },
  { title: 'Stärkung des Vertrauens in KI', desc: 'Transparenzpflichten, Kennzeichnung, Risikomanagement — damit KI gesellschaftlich akzeptabel wird.', icon: '🤝' },
  { title: 'Funktionierender Binnenmarkt für KI', desc: 'Einheitliche Regeln in allen 27 EU-Staaten — kein "Forum Shopping" zwischen Mitgliedstaaten. CE-Kennzeichnung gilt EU-weit.', icon: '🇪🇺' },
]

const OMNIBUS_CHANGES = [
  { label: 'Neue Fristen', detail: 'Hochrisiko-Pflichten (Anhang III) verschoben auf 2.12.2027 · Anhang I (Produkte) auf 2.8.2028' },
  { label: 'SMC-Kategorie', detail: 'KMU-Erleichterungen ausgeweitet auf "Small Mid-Cap"-Unternehmen (bis ~500 MA / 100 Mio. € Umsatz)' },
  { label: 'Neues Verbot (Art. 5)', detail: 'KI-generierte intime Bilder ohne Einwilligung (Deepfake-Nudifier) ausdrücklich verboten' },
]

const KMU_BENEFITS = [
  {
    num: '1', title: 'Bevorzugter Zugang zu KI-Reallaboren (Sandbox)',
    points: ['Tests in kontrollierten Umgebungen — Rechtssicherheit beim Erproben', 'Austausch mit Behörden, Förderung von Innovation', 'Kostenloser Zugang für KMU und Start-ups (Art. 57)'],
  },
  {
    num: '2', title: 'Vereinfachte Dokumentation bei Hochrisiko-KI',
    points: ['Vereinfachtes Formular für technische Dokumentation (Anhang IV)', 'Kommission erstellt Template speziell für kleine Unternehmen', 'Weniger Bürokratie — gleiche Sicherheitsanforderungen'],
  },
  {
    num: '3', title: 'Niedrigere Bußobergrenzen',
    points: ['Es gilt jeweils der niedrigere Betrag: Fixsumme oder prozentualer Umsatzanteil', 'Beispiel: Mittelständler mit 30 Mio. € Umsatz zahlt max. 0,9 Mio. € (3 %) statt 15 Mio. €', 'Kleinstunternehmen mit 1 Mio. € Umsatz: max. 30.000 € (Art. 99)'],
  },
]

const ART50_DUTIES = [
  { title: 'Interaktive KI', desc: 'Chatbots und KI-Assistenten müssen sich als KI zu erkennen geben — Nutzer dürfen nicht glauben, mit einem Menschen zu sprechen.' },
  { title: 'Synthetische Inhalte', desc: 'KI-generierte Bilder, Audio, Video und Text müssen als solche gekennzeichnet werden.' },
  { title: 'Emotionserkennung', desc: 'Betreiber eines Emotionserkennungssystems informieren die davon betroffenen natürlichen Personen über den Betrieb des Systems.' },
  { title: 'Wasserzeichen (Art. 50 Abs. 2)', desc: 'Ausgaben des KI-Systems müssen in einem maschinenlesbaren Format gekennzeichnet und als künstlich erzeugt oder manipuliert erkennbar sein.' },
]

const BETREIBER_DUTIES = [
  { num: 1, art: 'Art. 26 Abs. 1', title: 'Zweckgemäßer Einsatz', desc: 'Das KI-System nur gemäß der Gebrauchsanweisung des Anbieters und für den vorgesehenen Zweck einsetzen. Eigenmächtige Zweckerweiterung löst Art. 25 (Rollenübergang) aus.' },
  { num: 2, art: 'Art. 26 Abs. 2', title: 'Zuständige Person benennen + schulen', desc: 'Eine zuständige natürliche Person benennen, die die menschliche Aufsicht über das KI-System ausübt. Diese Person muss ausreichend KI-Kompetenz (Art. 4) haben und entsprechend geschult sein.' },
  { num: 3, art: 'Art. 26 Abs. 3', title: 'Menschliche Aufsicht gewährleisten', desc: 'Sicherstellen, dass die im Betrieb eingesetzten natürlichen Personen die Kompetenz haben, das KI-System zu überwachen, Ergebnisse zu interpretieren und ggf. einzugreifen (Art. 14).' },
  { num: 4, art: 'Art. 26 Abs. 4', title: 'Inputdaten überwachen', desc: 'Die dem System zugeführten Daten auf Relevanz und Repräsentativität prüfen, soweit dies vom Betreiber kontrollierbar ist. Schlechte Inputdaten führen zu schlechten (oder diskriminierenden) Ergebnissen.' },
  { num: 5, art: 'Art. 26 Abs. 5', title: 'Protokollierung / Logs aufbewahren', desc: 'Die automatisch erzeugten Logs (soweit zugänglich) mindestens 6 Monate aufbewahren. Bei hochriskanten Entscheidungen ist eine längere Aufbewahrungspflicht zu prüfen (Beweissicherung, DSGVO Art. 5 lit. e).' },
  { num: 6, art: 'Art. 26 Abs. 6', title: 'Schwerwiegende Vorfälle melden', desc: 'Schwerwiegende Vorfälle und Fehlfunktionen dem Anbieter und ggf. der nationalen Marktüberwachungsbehörde (Bundesnetzagentur in Deutschland) melden.' },
  { num: 7, art: 'Art. 27', title: 'FRIA — Grundrechte-Folgenabschätzung', desc: 'Betreiber von Hochrisiko-KI, die Behörden sind oder Dienstleistungen im öffentlichen Interesse erbringen, müssen vor Inbetriebnahme eine Grundrechte-Folgenabschätzung (Fundamental Rights Impact Assessment) durchführen und veröffentlichen.', highlight: true },
]

const HUNDERT_TAGE = [
  {
    phase: '1',
    label: 'Sehen',
    days: 'Tag 1–30',
    color: 'bg-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    desc: 'Vollständigen Überblick über den KI-Einsatz im Unternehmen gewinnen',
    steps: [
      'KI-Inventar erstellen — alle eingesetzten KI-Systeme erfassen (auch Shadow AI)',
      'Risikoklassen gemäß Art. 6 + Anhang III vorläufig einordnen',
      'Anbieter-Betreiber-Verhältnis für jedes System klären',
      'Bestehende Verträge (AVV, Lizenzverträge) auf KI-Act-Klauseln prüfen',
      'Erste Stakeholder identifizieren (IT, Recht, HR, Betriebsrat)',
    ],
  },
  {
    phase: '2',
    label: 'Strukturieren',
    days: 'Tag 31–70',
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    desc: 'Governance-Rahmen aufbauen und Compliance-Lücken schließen',
    steps: [
      'KI-Beauftragten formal benennen und Rolle intern kommunizieren',
      'Governance-Dokumente erstellen: KI-Richtlinie, Nutzungsrichtlinien, Eskalationspfade',
      'Art. 4-Schulungen für Mitarbeitende planen und starten',
      'DSFA und FRIA (Art. 27) für Hochrisiko-Systeme anstoßen',
      'Betriebsrat einbinden (§87 BetrVG) — vor Ausweitung des Einsatzes',
      'Meldeprozess für KI-Vorfälle etablieren (intern + extern)',
    ],
  },
  {
    phase: '3',
    label: 'Wirksam werden',
    days: 'Tag 71–100',
    color: 'bg-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    desc: 'KI-Governance in den Regelbetrieb überführen',
    steps: [
      'KI-Register finalisieren und laufend aktualisieren',
      'Monitoring-Prozesse etablieren: Wer prüft was, wie oft?',
      'Schulungen abschließen — Dokumentation für Art. 4-Nachweis sichern',
      'Reporting-Rhythmus mit Geschäftsführung und Betriebsrat festlegen',
      'Erste Konformitätsprüfung für Hochrisiko-Systeme einleiten',
      'Quick Wins kommunizieren — KI-Governance als Wettbewerbsvorteil positionieren',
    ],
  },
]

const FALLSTUDIEN = [
  {
    id: 'clearview',
    company: 'Clearview AI',
    year: '2023',
    verdict: 'Bußgelder in 5 EU-Ländern (je 20–30 Mio. €)',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    problem: 'Clearview AI scrapt öffentlich zugängliche Fotos aus dem Internet (Social Media, Nachrichtenseiten) und erstellt daraus ein biometrisches Datenbank-System, das Gesichter in Echtzeit identifizieren kann.',
    violations: [
      'Keine Rechtsgrundlage für biometrische Datenverarbeitung (Art. 9 DSGVO)',
      'Verletzt Art. 5 EU AI Act: Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum',
      'Keine Datenschutzinformation an Betroffene (Art. 13/14 DSGVO)',
      'Widerspruch gegen Verarbeitung ignoriert (Art. 21 DSGVO)',
    ],
    lesson: 'Scraping öffentlicher Daten begründet keine Rechtsgrundlage. "Öffentlich" ≠ "frei verwendbar". Biometrische Systeme unterliegen Art. 9 DSGVO und Art. 5 AI Act.',
  },
  {
    id: 'aircanada',
    company: 'Air Canada Chatbot',
    year: '2024',
    verdict: 'Zivilgericht Kanada: Air Canada haftet für falsche KI-Auskunft',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    problem: 'Ein KI-Chatbot auf der Air Canada Website gab einem Kunden falsche Auskunft über eine Trauerrabatt-Richtlinie. Air Canada argumentierte, der Chatbot sei eine eigenständige "juristische Person" und für seine Aussagen selbst verantwortlich.',
    violations: [
      'Betreiber versuchte, Haftung auf den Chatbot selbst abzuwälzen',
      'Gericht: Ein Unternehmen ist für alle seine Kommunikationskanäle verantwortlich — inkl. KI',
      'Art. 22 DSGVO (relevant bei Automatisierung) + allgemeines Vertragsrecht',
    ],
    lesson: 'Der Betreiber kann die Haftung nicht auf das KI-System oder den Anbieter "auslagern". Was der Chatbot sagt, sagt das Unternehmen. Menschliche Aufsicht und klare Eskalationspfade sind Pflicht.',
  },
]

const PARALLELES_RECHT = [
  { law: 'EU AI Act', applies: 'Jedes KI-System in der EU (unabhängig von Daten)', focus: 'Risikoklassen, Pflichten für Anbieter/Betreiber, CE-Kennzeichnung', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { law: 'DSGVO', applies: 'Wenn personenbezogene Daten verarbeitet werden', focus: 'Rechtsgrundlage, Betroffenenrechte, Datenschutz by Design, DSFA', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { law: 'ProdHaftG / RL 2024', applies: 'KI als Produkt — bei Schäden durch fehlerhafte KI', focus: 'Schadensersatz ohne Verschuldensnachweis, gilt ab 9. Dez 2026', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { law: 'DSA', applies: 'Sehr große Online-Plattformen (>45 Mio. EU-Nutzer)', focus: 'Algorithmische Transparenz, Risikobewertung, Systemaudits', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { law: 'BetrVG §87', applies: 'Wenn Betriebsrat vorhanden + KI überwacht Mitarbeitende', focus: 'Mitbestimmungspflicht vor Einführung und Ausweitung', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { law: 'UrhG / §44b', applies: 'KI-Training + Verwertung KI-generierter Inhalte', focus: 'TDM-Ausnahme, Opt-Out, Schutzfähigkeit KI-Outputs', color: 'bg-green-50 border-green-200 text-green-700' },
]

const LIABILITY_TABLE = [
  { situation: 'KI-Fehler durch Designmangel', liable: 'Anbieter' },
  { situation: 'Fehleinsatz durch Betreiber', liable: 'Betreiber' },
  { situation: 'Projektleiter prüft KI-Output nicht', liable: 'Projektleiter + Büro' },
  { situation: 'Alle drei zusammen', liable: 'Gesamtschuldnerschaft' },
]

// ── Decision Tree ──────────────────────────────────────────────────────────

type NodeId = 'start' | 'q1' | 'q2' | 'q3' | 'r1' | 'r2' | 'r3' | 'r4'

interface TreeNode {
  id: NodeId
  type: 'question' | 'result'
  text: string
  sub?: string
  hints?: string[]
  yes?: NodeId
  no?: NodeId
  result?: { level: number; name: string; color: string; bg: string; border: string; text: string; desc: string; law: string }
}

const TREE_NODES: Record<NodeId, TreeNode> = {
  start: { id: 'start', type: 'question', text: '', yes: 'q1' },
  q1: {
    id: 'q1', type: 'question',
    text: 'Fällt das KI-System unter eine der verbotenen Praktiken nach Art. 5?',
    sub: 'Gilt seit dem 2. Februar 2025 ohne Übergangsfrist.',
    hints: [
      'Unterschwellige Manipulation — beeinflusst Verhalten unbemerkt',
      'Social Scoring durch Behörden mit Konsequenzen in anderen Lebensbereichen',
      'Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum',
      'Prädiktive Polizeiarbeit allein auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz oder in Bildungseinrichtungen',
    ],
    yes: 'r1', no: 'q2',
  },
  q2: {
    id: 'q2', type: 'question',
    text: 'Wird das System in einem Hochrisiko-Bereich eingesetzt? (Art. 6 + Anhang III)',
    sub: 'Die entscheidende Frage — Hochrisiko bedeutet erheblichen Compliance-Aufwand.',
    hints: [
      'Biometrische Identifizierung oder Kategorisierung von Personen',
      'Kritische Infrastruktur (Energie, Wasser, Verkehr)',
      'Bildung & Berufsausbildung (Zulassung, Beurteilung)',
      'Beschäftigung & Personalmanagement (Einstellung, Entlassung, Leistungsbewertung)',
      'Zugang zu wesentlichen Dienstleistungen (Kredit, Sozialleistungen)',
      'Strafverfolgung, Migration & Asyl, Justiz & demokratische Prozesse',
      'KI in Medizinprodukten oder sicherheitsrelevanten Komponenten',
    ],
    yes: 'r2', no: 'q3',
  },
  q3: {
    id: 'q3', type: 'question',
    text: 'Handelt es sich um einen Chatbot, generiert das System Inhalte oder erkennt es Emotionen?',
    sub: 'Transparenzpflicht (Art. 50) — Nutzer müssen wissen, dass sie mit KI interagieren.',
    hints: [
      'Chatbot oder konversationelle KI (auch integriert in andere Systeme)',
      'Generierung von Texten, Bildern, Audio oder Video (z. B. für Marketing)',
      'Deepfake-Erstellung oder synthetische Medien',
      'Emotionserkennung (sofern nicht bereits unter Art. 5 verboten)',
    ],
    yes: 'r3', no: 'r4',
  },
  r1: {
    id: 'r1', type: 'result', text: '',
    result: {
      level: 1, name: 'Inakzeptables Risiko — VERBOTEN',
      color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700',
      desc: 'Dieses KI-System ist grundsätzlich verboten. Einsatz und Inverkehrbringen sind unzulässig. Bußgelder bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes.',
      law: 'Art. 5 EU AI Act · gilt seit 2. Feb 2025',
    },
  },
  r2: {
    id: 'r2', type: 'result', text: '',
    result: {
      level: 2, name: 'Hohes Risiko',
      color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700',
      desc: 'Erlaubt — aber nur mit umfassenden Pflichten: Risikomanagement, technische Dokumentation (Anhang IV), CE-Kennzeichnung, Konformitätsbewertung vor Inverkehrbringen, EU-Datenbankregistrierung, menschliche Aufsicht.',
      law: 'Art. 6–49 + Anhang III · gilt ab Dez 2027',
    },
  },
  r3: {
    id: 'r3', type: 'result', text: '',
    result: {
      level: 3, name: 'Begrenztes Risiko',
      color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700',
      desc: 'Erlaubt — Nutzer müssen darüber informiert werden, dass sie mit KI interagieren oder Inhalte KI-generiert sind. Keine weiteren spezifischen Compliance-Anforderungen nach AI Act.',
      law: 'Art. 50 EU AI Act · gilt ab Aug 2026',
    },
  },
  r4: {
    id: 'r4', type: 'result', text: '',
    result: {
      level: 4, name: 'Minimales Risiko',
      color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700',
      desc: 'Keine spezifischen Pflichten nach dem EU AI Act. Freie Nutzung — allgemeine Rechtsvorschriften (DSGVO, Produkthaftung etc.) gelten weiterhin.',
      law: 'Keine AI-Act-Pflichten',
    },
  },
}

const QUESTION_ORDER: NodeId[] = ['q1', 'q2', 'q3']

function RiskDecisionTree() {
  const [answers, setAnswers] = useState<Record<NodeId, boolean | null>>({ q1: null, q2: null, q3: null, start: null, r1: null, r2: null, r3: null, r4: null })
  const [currentNode, setCurrentNode] = useState<NodeId>('q1')
  const [done, setDone] = useState(false)
  const [resultId, setResultId] = useState<NodeId | null>(null)

  const answer = (nodeId: NodeId, yes: boolean) => {
    const node = TREE_NODES[nodeId]
    setAnswers((prev) => ({ ...prev, [nodeId]: yes }))
    const next = yes ? node.yes! : node.no!
    const nextNode = TREE_NODES[next]
    if (nextNode.type === 'result') {
      setResultId(next)
      setDone(true)
    } else {
      setCurrentNode(next)
    }
  }

  const reset = () => {
    setAnswers({ q1: null, q2: null, q3: null, start: null, r1: null, r2: null, r3: null, r4: null })
    setCurrentNode('q1')
    setDone(false)
    setResultId(null)
  }

  const answeredQuestions = QUESTION_ORDER.filter((id) => answers[id] !== null)
  const result = resultId ? TREE_NODES[resultId].result! : null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Risikoklassen-Check — Wo fällt mein KI-System rein?</p>
          <p className="text-xs text-slate-500 mt-0.5">Beantworte 1–3 Fragen um die Risikoklasse zu ermitteln</p>
        </div>
        {(answeredQuestions.length > 0 || done) && (
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
            Neu starten
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Progress breadcrumb */}
        <div className="flex items-center gap-2">
          {QUESTION_ORDER.map((id, i) => {
            const answered = answers[id] !== null
            const isCurrent = currentNode === id && !done
            return (
              <div key={id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  answered ? (answers[id] ? 'bg-green-500 text-white' : 'bg-slate-400 text-white')
                  : isCurrent ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {answered ? (answers[id] ? '✓' : '✗') : i + 1}
                </div>
                {i < QUESTION_ORDER.length - 1 && (
                  <div className={`h-px w-6 ${answered ? 'bg-slate-300' : 'bg-slate-100'}`} />
                )}
              </div>
            )
          })}
          {done && result && (
            <>
              <div className="h-px w-6 bg-slate-300" />
              <div className={`w-6 h-6 rounded-full ${result.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                {result.level}
              </div>
            </>
          )}
        </div>

        {/* Answered questions — compact history */}
        {answeredQuestions.map((id) => {
          const node = TREE_NODES[id]
          const ans = answers[id]
          return (
            <div key={id} className="flex items-start gap-3 py-2 border-b border-slate-50">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${ans ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {ans ? 'Ja' : 'Nein'}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">{node.text}</p>
            </div>
          )
        })}

        {/* Current question */}
        {!done && (() => {
          const node = TREE_NODES[currentNode]
          return (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{node.text}</p>
                {node.sub && <p className="text-xs text-blue-600 mt-1">{node.sub}</p>}
                {node.hints && (
                  <ul className="mt-3 space-y-1">
                    {node.hints.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => answer(currentNode, true)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  Ja
                </button>
                <button onClick={() => answer(currentNode, false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  Nein
                </button>
              </div>
            </div>
          )
        })()}

        {/* Result */}
        {done && result && (
          <div className={`rounded-xl border ${result.border} ${result.bg} px-5 py-4 space-y-2`}>
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full ${result.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {result.level}
              </span>
              <p className={`text-base font-bold ${result.text}`}>{result.name}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{result.desc}</p>
            <p className={`text-[10px] font-semibold font-mono ${result.text}`}>{result.law}</p>
            <p className="text-[10px] text-slate-400 pt-1">Dieser Check dient der Erstorientierung. Für verbindliche Einordnung: Art. 6 und Anhang III lesen oder Fachanwalt hinzuziehen.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Components ─────────────────────────────────────────────────────────────

function RiskClassCard({ rc, expanded, onToggle }: {
  rc: typeof RISK_CLASSES[0]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`rounded-xl border ${rc.border} overflow-hidden`}>
      <button onClick={onToggle} className={`w-full flex items-center gap-4 px-5 py-4 ${rc.bg} hover:opacity-90 transition-opacity text-left`}>
        <span className={`w-8 h-8 rounded-full ${rc.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {rc.level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>{rc.level === 1 ? 'VERBOTEN' : rc.level === 2 ? 'STRENG' : rc.level === 3 ? 'TRANSPARENZ' : 'FREI'}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{rc.summary}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 py-4 bg-white space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Pflichten</p>
            <p className="text-xs text-slate-600 leading-relaxed">{rc.duties}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Beispiele</p>
            <ul className="space-y-1">
              {rc.examples.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.color}`} />
                  <span className="text-xs text-slate-600">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Art25Checker() {
  const [triggered, setTriggered] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setTriggered((p) => ({ ...p, [id]: !p[id] }))
  const activeCount = ART25_TRIGGERS.filter((t) => triggered[t.id]).length
  const isProvider = activeCount > 0

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">Art. 25 — Rollenübergang-Check</p>
        <p className="text-xs text-slate-500 mt-0.5">Wann wird ein Betreiber zum Anbieter (mit allen Art. 16-Pflichten)?</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {ART25_TRIGGERS.map((t) => (
          <label key={t.id} onClick={() => toggle(t.id)} className="flex items-start gap-3 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 py-2 rounded transition-colors">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${triggered[t.id] ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
              {triggered[t.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{t.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          </label>
        ))}
      </div>
      {activeCount > 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm font-semibold text-orange-700">⚠ Rollenübergang — Sie sind jetzt Anbieter</p>
          <p className="text-xs text-orange-600 mt-1">Alle Art. 16-Anbieterpflichten gelten. Dazu gehören Dokumentation, Konformitätsbewertung, CE-Kennzeichnung und Registrierung in der EU-Datenbank. Fachanwalt hinzuziehen (Dreistufenmodell Stufe 3).</p>
        </div>
      )}
      {activeCount === 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Wählen Sie oben einen Auslöser aus, um zu prüfen ob ein Rollenübergang vorliegt.</p>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EuAiActPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'copyright' | 'liability' | 'planung'>('overview')
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null)

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Risikoklassen & Zeitplan' },
    { id: 'roles', label: 'Akteursrollen' },
    { id: 'copyright', label: 'Urheberrecht' },
    { id: 'liability', label: 'Haftung & Fallstudien' },
    { id: 'planung', label: '100-Tage-Plan' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">EU AI Act</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Risikobasiertes Produktrecht für KI-Systeme — Struktur, Akteursrollen, Urheberrecht und Haftung
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            Stand: Juli 2026
          </span>
          <p className="text-[10px] text-slate-400 mt-1">
            Quelle:{' '}
            <a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
              EUR-Lex · VO 2024/1689
            </a>
          </p>
        </div>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: '4', label: '4 Risikoklassen', sub: 'Verboten · Hochrisiko · Begrenztes Risiko · Minimal' },
          { value: 'Feb 25', label: 'Bereits in Kraft', sub: 'Art. 5 (Verbote) + Art. 4 (KI-Kompetenz)' },
          { value: '≠', label: 'AI Act ≠ DSGVO', sub: 'Gilt unabhängig von der Verarbeitung personenbezogener Daten' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-slate-800">{m.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Important banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
        <p className="text-xs text-red-700 leading-relaxed">
          <span className="font-semibold">Wichtig:</span> Viele Betreiber glauben, der AI Act gelte noch nicht. Art. 5 und Art. 4 gelten seit Februar 2025 — vollständig und ohne Übergangsfrist. Ein System, das keine personenbezogenen Daten verarbeitet, fällt trotzdem unter den AI Act.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Decision Tree */}
          <RiskDecisionTree />

          {/* Structure */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">KI-Act-Logik: Verboten → Hochrisiko → Transparenz → GPAI → Sanktionen</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Kapitel</th>
                    <th className="text-left py-2 font-semibold text-slate-600">Inhalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { ch: 'Art. 5', c: 'Verbotene Praktiken' },
                    { ch: 'Art. 6–49', c: 'Hochrisiko-KI — das Herzstück' },
                    { ch: 'Art. 50–51', c: 'Transparenzpflichten' },
                    { ch: 'Art. 52–56', c: 'GPAI-Modelle / Foundation Models' },
                    { ch: 'Art. 99–101', c: 'Sanktionen bis zu 35 Mio. € oder 7 % Umsatz' },
                  ].map((r) => (
                    <tr key={r.ch}>
                      <td className="py-2 pr-4 font-mono text-slate-500 whitespace-nowrap">{r.ch}</td>
                      <td className="py-2 text-slate-600">{r.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Zeitplan — was gilt wann?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {TIMELINE.map((item) => (
                <div key={item.date} className={`flex items-start gap-4 px-5 py-3 ${item.highlight ? 'bg-blue-50' : ''}`}>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap mt-0.5 min-w-[90px]">{item.date}</span>
                  <p className={`text-xs leading-relaxed ${item.highlight ? 'font-semibold text-blue-700' : 'text-slate-600'}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Ziele */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Die 5 Ziele des EU AI Act</p>
              <p className="text-xs text-slate-500 mt-0.5">Erwägungsgrund 1 — hilft beim sinnvollen Auslegen des AI Act</p>
            </div>
            <div className="divide-y divide-slate-50">
              {AI_ACT_GOALS.map((g) => (
                <div key={g.title} className="flex items-start gap-3 px-5 py-3">
                  <span className="text-lg flex-shrink-0">{g.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{g.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Omnibus */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">NEU</span>
                <p className="text-sm font-semibold text-slate-800">Digital Omnibus — Was hat sich geändert?</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">EP 16.6.2026 (423 Stimmen) · Rat 29.6.2026 · Amtsblatt-Veröffentlichung vor 2.8.2026 erwartet</p>
            </div>
            <div className="divide-y divide-slate-50">
              {OMNIBUS_CHANGES.map((c) => (
                <div key={c.label} className="flex items-start gap-4 px-5 py-3">
                  <span className="text-xs font-bold text-blue-700 whitespace-nowrap mt-0.5 min-w-[140px]">{c.label}</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KMU & SMC */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">KMU & Small Mid-Caps — Wer profitiert?</p>
              <p className="text-xs text-slate-500 mt-0.5">Durch Digital Omnibus auf SMC ausgeweitet · Art. 57, Art. 99</p>
            </div>
            <div className="grid grid-cols-1 gap-0 divide-y divide-slate-50">
              {KMU_BENEFITS.map((b) => (
                <div key={b.num} className="px-5 py-4 flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{b.num}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 mb-1">{b.title}</p>
                    <ul className="space-y-0.5">
                      {b.points.map((p) => (
                        <li key={p} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-600">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Art. 50 — 4 Transparenzpflichten */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Art. 50 — Die 4 Transparenzpflichten</p>
              <p className="text-xs text-slate-500 mt-0.5">Gilt ab 2.8.2026 · Bundesnetzagentur ist zuständige Aufsichtsbehörde in Deutschland</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {ART50_DUTIES.map((d) => (
                <div key={d.title} className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1">{d.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk classes — simple overview grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                num: '1', name: 'Inakzeptables Risiko', color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
                plain: '1. Verboten. Diese KI-Systeme sind grundsätzlich nicht erlaubt.',
                law: 'Art. 5 · gilt ab Feb 2025',
                penalty: 'Bis zu 35 Mio. € oder 7 % Umsatz',
                examples: ['Social Scoring', 'Unterschwellige Manipulation', 'Biometrische Echtzeit-ID im öffentlichen Raum'],
              },
              {
                num: '2', name: 'Hohes Risiko', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
                plain: '2. Erlaubt — aber nur mit strenger Dokumentation, Aufsicht und Konformitätsprüfung vor dem Einsatz.',
                law: 'Art. 6–49 + Anhang III · Dez 2027',
                penalty: 'Kein Marktzugang ohne Konformität',
                examples: ['KI im HR & Recruiting', 'Kreditscoring', 'KI in Bildung', 'Medizinische KI'],
              },
              {
                num: '3', name: 'Begrenztes Risiko', color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
                plain: '3. Erlaubt — aber Nutzer müssen darauf hingewiesen werden, dass sie mit KI interagieren.',
                law: 'Art. 50 · gilt ab Aug 2026',
                penalty: 'Bußgeld bei fehlender Kennzeichnung',
                examples: ['Chatbots', 'KI-generierte Bilder/Texte', 'Deepfakes'],
              },
              {
                num: '4', name: 'Minimales Risiko', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
                plain: '4. Frei nutzbar. Keine spezifischen KI-Act-Anforderungen.',
                law: 'Keine spezifischen Pflichten',
                penalty: 'Keine nach dem KI-Act',
                examples: ['Spam-Filter', 'Empfehlungssysteme', 'KI in Spielen'],
              },
            ].map((rc) => (
              <div key={rc.num} className={`rounded-xl border ${rc.border} ${rc.bg} p-4 flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full ${rc.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{rc.num}</span>
                  <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{rc.plain}</p>
                <p className="text-[10px] text-slate-500 font-mono">{rc.law}</p>
                <ul className="space-y-0.5 mt-1">
                  {rc.examples.map((e) => (
                    <li key={e} className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${rc.color}`} />
                      <span className="text-[11px] text-slate-600">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Risk classes — detail cards */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Detailansicht — zum Aufklappen</p>
            {RISK_CLASSES.map((rc) => (
              <RiskClassCard
                key={rc.level}
                rc={rc}
                expanded={expandedRisk === rc.level}
                onToggle={() => setExpandedRisk(expandedRisk === rc.level ? null : rc.level)}
              />
            ))}
          </div>

          {/* Paralleles Recht */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Rechtliche Einordnung — AI Act ist nicht allein</p>
              <p className="text-xs text-slate-500 mt-0.5">Der EU AI Act ist eine EU-Verordnung (nicht Richtlinie) — gilt direkt, ohne nationale Umsetzung. Er gilt parallel zu anderen Rechtsrahmen.</p>
            </div>
            <div className="divide-y divide-slate-50">
              {PARALLELES_RECHT.map((r) => (
                <div key={r.law} className="flex items-start gap-4 px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap flex-shrink-0 mt-0.5 ${r.color}`}>{r.law}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{r.applies}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key question */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">Vier Risikoklassen</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">"Haben wir es mit einem Hochrisiko-KI-System zu tun?"</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Art. 6 und Anhang III lesen. Das ist die entscheidende Sollbruchstelle im KI-Management — bei Systemen mit begrenztem Risiko sind die Pflichten überschaubar (Art. 4 + Art. 50). Bei Hochrisiko-Systemen ist der Compliance-Aufwand erheblich — CE-Kennzeichnung, Dokumentation, Konformitätsbewertung.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Merksatz:</span> Die Rolle bestimmt die Pflichten — nicht das System. Dasselbe KI-System erzeugt für Betreiber und Anbieter unterschiedliche Pflichtenkataloge.
            </p>
          </div>

          <Art25Checker />

          {ACTOR_ROLES.map((r) => (
            <div key={r.role} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded">{r.art}</span>
                <p className="text-sm font-semibold text-slate-800">{r.role}</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Definition:</span> {r.definition}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Beispiel:</span> {r.example}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Pflichten:</span> {r.duties}</p>
              </div>
            </div>
          ))}

          {/* Betreiber 7 Pflichten + FRIA */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Art. 26 — Die 7 Betreiberpflichten (Hochrisiko-KI)</p>
              <p className="text-xs text-slate-500 mt-0.5">Gilt für jeden, der ein Hochrisiko-KI-System in eigener Verantwortung einsetzt — inkl. Art. 27 FRIA</p>
            </div>
            <div className="divide-y divide-slate-50">
              {BETREIBER_DUTIES.map((d) => (
                <div key={d.num} className={`flex items-start gap-4 px-5 py-3 ${d.highlight ? 'bg-violet-50' : ''}`}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${d.highlight ? 'bg-violet-600' : 'bg-slate-400'}`}>{d.num}</span>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">{d.art}</span>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold mb-0.5 ${d.highlight ? 'text-violet-700' : 'text-slate-700'}`}>{d.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Copyright */}
      {activeTab === 'copyright' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">§44b UrhG — Darf KI mit urheberrechtlich geschütztem Material trainiert werden?</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                §44b UrhG erlaubt Text and Data Mining (TDM) "um daraus Informationen insbesondere über Muster, Trends und Korrelationen zu gewinnen" — es sei denn, die Rechteinhaber haben einen Nutzungsvorbehalt (Opt-Out) ausgesprochen.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Opt-Out muss maschinenlesbar sein:</span> robots.txt, TDM Reservation Protocol oder IPTC/XMP-Metadaten. Eine Erklärung in AGB oder im Impressum reicht nicht (OLG Hamburg, Dez. 2025).</p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-red-700 leading-relaxed"><span className="font-semibold">LG München I, Nov. 2025:</span> Dauerhafte Einbettung vollständiger Werke in Modellparameter = Vervielfältigung — geht über die TDM-Ausnahme hinaus.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Wem gehört, was die KI schreibt? (§2 UrhG)</p>
              <p className="text-xs text-slate-500 mt-0.5">Nach deutschem Urheberrecht schützt §2 UrhG nur "persönliche geistige Schöpfungen"</p>
            </div>
            <div className="divide-y divide-slate-50">
              {COPYRIGHT_RULES.map((r) => (
                <div key={r.scenario} className="px-5 py-4 flex items-start gap-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${r.badge}`}>{r.protection}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-0.5">{r.scenario}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Liability */}
      {activeTab === 'liability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Produkthaftung für KI (ProdHaftG / EU-Richtlinie 2024/2853)</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Das Produkthaftungsgesetz (ProdHaftG, 1989) macht Hersteller für fehlerhafte <strong>Produkte</strong> haftbar — ohne Verschuldensnachweis. Das Problem: Das ProdHaftG wurde für physische Produkte entwickelt. Software — und erst recht lernende Software — passt nicht gut in diesen Rahmen.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Neue EU-Produkthaftungsrichtlinie 2024/2853</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Erfasst Software (einschließlich KI-Systeme) ausdrücklich als "Produkt". Umsetzungsfrist: <strong>9. Dezember 2026</strong>.</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Kontinuierliches Lernen</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Hersteller haften auch für Fehler, die aus <strong>kontinuierlichem Lernen</strong> nach Inverkehrbringen entstehen.</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">KI-Haftungsrichtlinie — zurückgezogen</p>
                <p className="text-xs text-amber-600 leading-relaxed">Die EU-Kommission hat 2022 einen Entwurf für eine KI-Haftungsrichtlinie vorgelegt (Kernidee: Beweislastumkehr). Sie wurde im <strong>Februar 2025</strong> offiziell zurückgezogen. Eine spezifische KI-Haftungsregelung auf EU-Ebene gibt es derzeit nicht.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Wer haftet heute?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {LIABILITY_TABLE.map((row) => (
                <div key={row.situation} className="flex items-start gap-4 px-5 py-3">
                  <p className="flex-1 text-xs text-slate-600">{row.situation}</p>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">{row.liable}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fallstudien */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Fallstudien — Reale KI-Haftungsfälle</p>
              <p className="text-xs text-slate-500 mt-0.5">Was passiert, wenn KI-Compliance missachtet wird</p>
            </div>
            <div className="divide-y divide-slate-100">
              {FALLSTUDIEN.map((f) => (
                <div key={f.id} className={`px-5 py-4 ${f.bg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${f.badge}`}>{f.year}</span>
                    <p className="text-sm font-semibold text-slate-800">{f.company}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Ergebnis: {f.verdict}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{f.problem}</p>
                  <ul className="space-y-1 mb-3">
                    {f.violations.map((v) => (
                      <li key={v} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{v}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`border ${f.border} rounded-lg px-3 py-2`}>
                    <p className="text-xs font-semibold text-slate-700">Lektion:</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.lesson}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Hinweis:</span> Haftungsfragen sind Dreistufenmodell Stufe 3 — immer einen Fachanwalt hinzuziehen. Diese Übersicht dient der Orientierung und stellt keine Rechtsberatung dar.
            </p>
          </div>
        </div>
      )}

      {/* Tab: 100-Tage-Plan */}
      {activeTab === 'planung' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Ziel:</span> In 100 Tagen von "wir wissen nicht was wir haben" zu "wir haben Governance und können das nachweisen". Für neu bestellte KI-Beauftragte oder Unternehmen, die gerade erst anfangen.
            </p>
          </div>

          {HUNDERT_TAGE.map((phase) => (
            <div key={phase.phase} className={`rounded-xl border ${phase.border} overflow-hidden`}>
              <div className={`px-5 py-4 ${phase.bg} flex items-center gap-4`}>
                <span className={`w-10 h-10 rounded-full ${phase.color} text-white text-lg font-bold flex items-center justify-center flex-shrink-0`}>{phase.phase}</span>
                <div>
                  <p className={`text-base font-bold ${phase.text}`}>{phase.label}</p>
                  <p className="text-xs text-slate-600">{phase.days} — {phase.desc}</p>
                </div>
              </div>
              <div className="bg-white px-5 py-4">
                <ul className="space-y-2">
                  {phase.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-0.5 w-5 h-5 rounded-full ${phase.color} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>{i + 1}</span>
                      <span className="text-xs text-slate-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Nach 100 Tagen sollten Sie haben:</p>
            <ul className="space-y-1.5">
              {[
                'KI-Register (vollständig, aktuell)',
                'Governance-Dokumentation (KI-Richtlinie, Nutzungsregeln)',
                'Schulungsnachweis für Art. 4 (Kompetenzpflicht)',
                'DSFA/FRIA für alle Hochrisiko-Systeme eingeleitet',
                'Meldeprozess für KI-Vorfälle etabliert',
                'Betriebsrat eingebunden (falls vorhanden)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span className="text-xs text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
