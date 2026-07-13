import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'

// ── Types ──────────────────────────────────────────────────────────────────

type RiskLevel = 'high' | 'limited' | 'minimal' | null
type AkteurRolle = 'anbieter' | 'betreiber' | null
type Step = 'form' | 'questions' | 'plan'

interface FormData {
  name: string
  description: string
}

interface Answers {
  akteurRolle: AkteurRolle
  riskLevel: RiskLevel
  personalData: boolean | null
  hrContext: boolean | null
  externalProvider: boolean | null  // only relevant for Betreiber
  worksCouncil: boolean | null
  commercialOutput: boolean | null
  notifiedBody: boolean | null      // only relevant for Anbieter + High Risk
}

interface BoolQuestion {
  key: keyof Answers
  q: string
  sub?: string
  yes: string
  no: string
}

function getBoolQuestions(answers: Answers): BoolQuestion[] {
  const qs: BoolQuestion[] = [
    {
      key: 'personalData',
      q: 'Werden personenbezogene Daten verarbeitet?',
      sub: 'Namen, E-Mails, Mitarbeiterdaten, Kundenprofile, IP-Adressen — alles was einer Person zugeordnet werden kann.',
      yes: 'Ja, personenbezogene Daten', no: 'Nein, nur anonyme Daten',
    },
    {
      key: 'hrContext',
      q: 'Wird das System im HR-Kontext eingesetzt?',
      sub: 'Bewerbungsscreening, Leistungsbewertung, Kündigung, Monitoring von Mitarbeitenden.',
      yes: 'Ja, HR-Kontext', no: 'Nein',
    },
  ]
  if (answers.akteurRolle === 'betreiber') {
    qs.push({
      key: 'externalProvider',
      q: 'Kommt das KI-System von einem externen Anbieter?',
      sub: 'Cloud-Dienste (OpenAI, Microsoft Copilot, Google etc.) oder zugekaufte Software mit KI-Komponente.',
      yes: 'Ja, externer Anbieter', no: 'Nein, Eigenentwicklung durch uns',
    })
  }
  qs.push(
    {
      key: 'worksCouncil',
      q: 'Gibt es einen Betriebsrat im Unternehmen?',
      sub: '§87 BetrVG: Mitbestimmungspflicht bei technischen Überwachungseinrichtungen.',
      yes: 'Ja, Betriebsrat vorhanden', no: 'Nein',
    },
    {
      key: 'commercialOutput',
      q: 'Werden KI-generierte Inhalte kommerziell genutzt oder veröffentlicht?',
      sub: 'Texte, Bilder, Code oder andere Outputs die in Produkte oder Publikationen einfließen.',
      yes: 'Ja, Inhalte werden genutzt / veröffentlicht', no: 'Nein, nur interne Nutzung',
    },
  )
  if (answers.akteurRolle === 'anbieter' && answers.riskLevel === 'high') {
    qs.push({
      key: 'notifiedBody',
      q: 'Ist das System biometrisch oder unterliegt es sektoralen Harmonisierungsvorschriften?',
      sub: 'Biometrische Fernidentifizierung (Anhang III Nr. 1) oder KI als Sicherheitskomponente in Produkten unter MDR, Maschinenverordnung o.ä. → dann ist ein externer Notified Body (Anhang VII) Pflicht.',
      yes: 'Ja — Biometrie oder sektorale Vorschriften', no: 'Nein — Standard Hochrisiko (Anhang VI intern)',
    })
  }
  return qs
}

interface TodoItem {
  id: string
  text: string
  law?: string
  priority?: 'high' | 'medium'
  done: boolean
}

interface Phase {
  id: string
  title: string
  subtitle: string
  color: string
  bg: string
  border: string
  text: string
  items: TodoItem[]
}

// ── Plan Generator ─────────────────────────────────────────────────────────

function generatePlan(form: FormData, answers: Answers): Phase[] {
  const { akteurRolle, riskLevel, personalData, hrContext, externalProvider, worksCouncil, commercialOutput, notifiedBody } = answers
  const isHighRisk = riskLevel === 'high'
  const isLimited = riskLevel === 'limited'
  const isAnbieter = akteurRolle === 'anbieter'
  const isBetreiber = akteurRolle === 'betreiber'

  // ── Phase 1: Rechtliche & Compliance-Prüfung ──────────────────────────────

  const phase1: TodoItem[] = [
    { id: 'p1_risk', text: 'Risikoklasse nach EU AI Act formal einordnen und dokumentieren (Art. 6 + Anhang III)', law: 'Art. 6 EU AI Act', priority: 'high', done: false },

    // ── Anbieter-spezifisch ──
    ...(isAnbieter && isHighRisk ? [
      { id: 'p1_a_qms', text: 'Qualitätsmanagementsystem (QMS) aufbauen (Art. 17) — Verantwortlichkeiten, Prozesse, Ressourcen, Risikobehandlung', law: 'Art. 17 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isAnbieter && isHighRisk ? [
      { id: 'p1_a_data', text: 'Datenverwaltungspraktiken festlegen (Art. 10) — Trainings-, Validierungs- und Testdaten, Qualitätskriterien, Bias-Prüfung vor Training', law: 'Art. 10 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_a_techdoku', text: 'Technische Dokumentation nach Anhang IV erstellen (Art. 11) — Systembeschreibung, Architektur, Designentscheidungen, Performance-Metriken', law: 'Art. 11 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_a_transparency', text: 'Transparenzanforderungen ins Design einbauen (Art. 13) — Betreiber muss System interpretieren und korrekt einsetzen können', law: 'Art. 13 EU AI Act', done: false },
      { id: 'p1_a_oversight', text: 'Menschliche Aufsicht ins System einbauen (Art. 14) — Override-Mechanismus, Kill-Switch, Monitoring-Schnittstelle für Betreiber', law: 'Art. 14 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_a_robustness', text: 'Genauigkeit, Robustheit und Cybersicherheit sicherstellen (Art. 15) — Leistungsgrenzen dokumentieren, Angriffsvektoren analysieren', law: 'Art. 15 EU AI Act', done: false },
      { id: 'p1_a_konf_weg', text: `Konformitätsbewertungsverfahren wählen: ${notifiedBody ? 'Anhang VII — Notified Body erforderlich (Biometrie / sektorale Vorschriften MDR etc.)' : 'Anhang VI — internes Verfahren (Regelfall Hochrisiko)'}`, law: 'Art. 43 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_a_konf', text: 'Konformitätsbewertung durchführen — alle 8 Anforderungen (Art. 9–15, 17) nachweislich erfüllen', law: 'Art. 43 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_a_erklaerung', text: 'EU-Konformitätserklärung (Art. 47) erstellen und von zeichnungsberechtigter Person unterzeichnen lassen', law: 'Art. 47 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isAnbieter && isLimited ? [
      { id: 'p1_a_art50', text: 'Transparenzpflicht Art. 50 Abs. 1 im System verankern — KI muss sich vor Interaktion als KI kennzeichnen', law: 'Art. 50 EU AI Act', priority: 'high' as const, done: false },
    ] : []),

    // ── Betreiber-spezifisch ──
    ...(isBetreiber ? [
      { id: 'p1_b_rolle', text: 'Betreiberpflichten Art. 26 vollständig klären — Nutzung nur wie vom Anbieter vorgesehen, Änderungen am Zweck = neue Anbieterrolle', law: 'Art. 26 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isBetreiber && isHighRisk ? [
      { id: 'p1_b_fria', text: 'FRIA (Grundrechte-Folgenabschätzung Art. 27) prüfen — Pflicht für öffentliche Stellen bei Hochrisiko-KI; empfohlen für alle High-Risk-Betreiber', law: 'Art. 27 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isBetreiber && isHighRisk ? [
      { id: 'p1_b_tech', text: 'Technische Dokumentation und EU-Konformitätserklärung vom Anbieter anfordern und prüfen (Art. 13 Abs. 1 lit. b)', law: 'Art. 13 EU AI Act', done: false },
    ] : []),
    ...(isBetreiber && isLimited ? [
      { id: 'p1_b_art50', text: 'Prüfen ob Anbieter Art. 50-Kennzeichnung (KI als KI erkennbar) korrekt implementiert hat — ggf. nachfordern', law: 'Art. 50 EU AI Act', priority: 'high' as const, done: false },
    ] : []),

    // ── Gemeinsam ──
    ...(personalData ? [
      { id: 'p1_rechtsgrundlage', text: 'Rechtsgrundlage für Datenverarbeitung prüfen (Art. 6 DSGVO / §26 BDSG)', law: 'Art. 6 DSGVO', priority: 'high' as const, done: false },
      { id: 'p1_dsfa', text: 'DSFA-Pflicht prüfen (Art. 35 DSGVO) — bei systematischer Verarbeitung, Profiling oder Hochrisiko-KI', law: 'Art. 35 DSGVO', priority: 'high' as const, done: false },
    ] : []),
    ...(hrContext ? [
      { id: 'p1_art22', text: 'Art. 22 DSGVO prüfen — automatisierte Entscheidung mit erheblicher Wirkung?', law: 'Art. 22 DSGVO', priority: 'high' as const, done: false },
      { id: 'p1_betrvg', text: '§87 BetrVG: Mitbestimmungspflicht klären — Betriebsrat vor Einführung einbinden', law: '§87 BetrVG', priority: 'high' as const, done: false },
    ] : []),
    ...(worksCouncil && !hrContext ? [
      { id: 'p1_betrvg_gen', text: 'Betriebsrat informieren — prüfen ob Mitbestimmungsrecht besteht (§87 BetrVG)', law: '§87 BetrVG', done: false },
    ] : []),
    { id: 'p1_dreistufen', text: 'Offene Rechtsfragen nach Dreistufenmodell eskalieren (DSB → Fachanwalt → Behörde)', done: false },
  ]

  // ── Phase 2: Technische & Organisatorische Vorbereitung ───────────────────

  const phase2: TodoItem[] = [
    // ── Anbieter-spezifisch ──
    ...(isAnbieter && isHighRisk ? [
      { id: 'p2_a_logging', text: 'Logging-System aufbauen (Art. 12) — automatische Protokollierung: Eingabe, Ausgabe, Zeitstempel, System-Version. Aufbewahrung mind. 6 Monate. Pseudonymisierung direkte Personenbezüge.', law: 'Art. 12 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p2_a_instructions', text: 'Gebrauchsanweisung für Betreiber erstellen (Art. 13 Abs. 3) — Zweck, Grenzen, Monitoring-Hinweise, Kontaktdaten Anbieter', law: 'Art. 13 EU AI Act', priority: 'high' as const, done: false },
    ] : []),

    // ── Betreiber-spezifisch ──
    ...(isBetreiber && externalProvider && personalData ? [
      { id: 'p2_b_avv', text: 'AVV mit KI-Anbieter abschließen (Art. 28 DSGVO) — Pflicht wenn personenbezogene Daten verarbeitet werden', law: 'Art. 28 DSGVO', priority: 'high' as const, done: false },
    ] : []),
    ...(isBetreiber && externalProvider ? [
      { id: 'p2_b_vertrag', text: 'Vertrag auf KI-Act-Klauseln prüfen: Anbieter-Pflichten, Haftung, Zugang zu technischer Dokumentation, Vorfallmeldepflichten', done: false },
      { id: 'p2_b_drittland', text: 'Drittlandtransfer prüfen — Serverstandort klären, ggf. SCCs (Art. 46 DSGVO) oder Data Privacy Framework nötig', law: 'Art. 46 DSGVO', done: false },
    ] : []),
    ...(isBetreiber ? [
      { id: 'p2_b_info', text: 'Beschäftigte und ihre Vertretung informieren — über Ob und Wie des KI-Einsatzes, bevor die KI in Betrieb geht (Art. 26 Abs. 6)', law: 'Art. 26 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p2_b_aufsicht', text: 'Aufsichtsperson benennen (Art. 26 Abs. 2) — wer überwacht den Einsatz, wer darf eingreifen?', law: 'Art. 26 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isBetreiber && isHighRisk ? [
      { id: 'p2_b_logs', text: 'Logs vom Anbieter-System aufbewahren (Art. 26 Abs. 5) — mind. 6 Monate, Zugriff bei Vorfällen sicherstellen', law: 'Art. 26 EU AI Act', done: false },
    ] : []),

    // ── Gemeinsam ──
    { id: 'p2_schulung', text: 'Schulung für alle Nutzer planen — KI-Kompetenz nach Art. 4 EU AI Act nachweisen', law: 'Art. 4 EU AI Act', priority: 'high' as const, done: false },
    { id: 'p2_register', text: 'KI-System ins interne KI-Register aufnehmen', done: false },
    ...(personalData ? [
      { id: 'p2_verzeichnis', text: 'Verzeichnis der Verarbeitungstätigkeiten (VVT) aktualisieren (Art. 30 DSGVO)', law: 'Art. 30 DSGVO', done: false },
    ] : []),
  ]

  // ── Phase 3: Pilotbetrieb ─────────────────────────────────────────────────

  const phase3: TodoItem[] = [
    { id: 'p3_scope', text: 'Pilotscope definieren — welche Nutzer, welche Daten, welcher Zeitraum', done: false },
    { id: 'p3_monitoring', text: 'Monitoring-Prozess aufsetzen: Wer prüft Outputs wie häufig?', priority: 'medium' as const, done: false },
    { id: 'p3_schwellwerte', text: 'Schwellwerte definieren: Klassifikationsgenauigkeit < 90 % → Untersuchung; < 85 % → Deaktivierung; Drift > 0,3 → Re-Training-Prüfung', priority: 'high' as const, done: false },

    // ── Anbieter-spezifisch ──
    ...(isAnbieter && isHighRisk ? [
      { id: 'p3_a_bias', text: 'Bias-Prüfung der Trainingsdaten (Art. 10 Abs. 2) — Historical Bias, Representation Bias, Measurement Bias', law: 'Art. 10 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p3_a_pmm_plan', text: 'Post-Market-Monitoring-Plan (Art. 72) entwickeln — welche Metriken, Erfassungsintervall, Reporting-Empfänger, Eskalationspfade', law: 'Art. 72 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p3_a_drift', text: 'Verhaltens-Baseline dokumentieren — Ausgangszustand für spätere Drift-Erkennung (Datendrift, Konzeptdrift, Lerndrift)', done: false },
    ] : []),

    // ── Betreiber-spezifisch ──
    ...(isBetreiber && isHighRisk ? [
      { id: 'p3_b_inputdaten', text: 'Inputdaten auf Relevanz und Repräsentativität prüfen (Art. 26 Abs. 4) — keine ungeeigneten Daten in das System einspeisen', law: 'Art. 26 EU AI Act', done: false },
      { id: 'p3_b_bias', text: 'Bias bei Inputs und Outputs beobachten — systematische Benachteiligung von Gruppen erkennen und melden', priority: 'high' as const, done: false },
    ] : []),

    // ── Gemeinsam ──
    { id: 'p3_feedback', text: 'Feedback-Kanal für Nutzer einrichten — Meldung von Fehlern und Auffälligkeiten', done: false },
    { id: 'p3_vorfall', text: 'Vorfallsprotokoll anlegen — schwerwiegende Fehler und Beinahe-Vorfälle dokumentieren', done: false },
    ...(isHighRisk ? [
      { id: 'p3_meldung', text: 'Meldeprozess für schwerwiegende Vorfälle einrichten: intern → Bundesnetzagentur. Fristen: 2 Tage (krit. Infrastruktur), 10 Tage (Tod), 15 Tage (sonstige). Beinahe-Vorfälle ebenfalls meldepflichtig.', law: 'Art. 73 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(commercialOutput ? [
      { id: 'p3_urhg', text: 'Urheberrecht klären: KI-generierte Inhalte kennzeichnen, Schutzfähigkeit prüfen (§44b UrhG)', law: '§44b UrhG', done: false },
    ] : []),
  ]

  // ── Phase 4: Rollout & laufender Betrieb ──────────────────────────────────

  const phase4: TodoItem[] = [
    { id: 'p4_schulung_abschluss', text: 'Schulungen abschließen und Teilnahme für Art. 4-Nachweis dokumentieren', law: 'Art. 4 EU AI Act', priority: 'high' as const, done: false },

    // ── Anbieter-spezifisch ──
    ...(isAnbieter && isHighRisk ? [
      { id: 'p4_a_ce', text: 'CE-Kennzeichnung anbringen (Art. 48) — Pflicht vor Inverkehrbringen oder Inbetriebnahme', law: 'Art. 48 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p4_a_eu_db', text: 'Hochrisiko-KI in EU-Datenbank registrieren (Art. 49 Abs. 1) — vor Inverkehrbringen', law: 'Art. 49 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p4_a_pmm', text: 'Post-Market-Monitoring-System aktiv betreiben (Art. 72) — Logs sammeln, Drift analysieren, Incidents melden', law: 'Art. 72 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p4_a_logs', text: 'Logs min. 6 Monate aufbewahren (Art. 12) — regelmäßige Prüfung, Aufbewahrungsfristen sicherstellen', law: 'Art. 12 EU AI Act', done: false },
      { id: 'p4_a_aenderung', text: 'Prozess für wesentliche Änderungen definieren (Art. 43 Abs. 4) — neue Konformitätsbewertung auslösen wenn Systemverhalten sich grundlegend ändert', law: 'Art. 43 EU AI Act', done: false },
    ] : []),
    ...(isAnbieter ? [
      { id: 'p4_a_markt', text: 'Marktüberwachungsbehörde auf Anfrage unterstützen — technische Dokumentation, Logs, Zugänge bereitstellen (Art. 74)', law: 'Art. 74 EU AI Act', done: false },
    ] : []),

    // ── Betreiber-spezifisch ──
    ...(isBetreiber && isHighRisk ? [
      { id: 'p4_b_eu_db', text: 'Registrierung in EU-Datenbank als Betreiber prüfen (Art. 49 Abs. 2) — bestimmte Betreiber müssen sich ebenfalls registrieren', law: 'Art. 49 EU AI Act', done: false },
      { id: 'p4_b_pmm', text: 'PMM-Bericht an Anbieter: Auffälligkeiten, Vorfälle und Systemverhalten strukturiert zurückmelden (Art. 72 Abs. 4)', law: 'Art. 72 EU AI Act', done: false },
    ] : []),
    ...(isBetreiber ? [
      { id: 'p4_b_anbieter_kontakt', text: 'Anbieter bei schwerwiegenden Vorfällen unverzüglich informieren — Anbieter-Meldepflicht wird dadurch ausgelöst (Art. 73)', law: 'Art. 73 EU AI Act', priority: 'high' as const, done: false },
    ] : []),

    // ── Gemeinsam ──
    { id: 'p4_reporting', text: 'Reporting-Rhythmus mit Geschäftsführung festlegen (Quartalsreport KI-Governance)', done: false },
    ...(worksCouncil ? [
      { id: 'p4_br_update', text: 'Betriebsrat über Rollout informieren — laufende Mitbestimmung sicherstellen', law: '§87 BetrVG', done: false },
    ] : []),
    { id: 'p4_review', text: `Jahresreview: Use Case "${form.name}" — noch aktuell, noch konform, Rolle noch korrekt?`, done: false },
  ]

  return [
    {
      id: 'phase1',
      title: 'Phase 1 — Rechtliche & Compliance-Prüfung',
      subtitle: isAnbieter
        ? 'Anbieter: QMS, Technische Dokumentation, Konformitätsbewertung vorbereiten'
        : 'Betreiber: Pflichten Art. 26 klären, FRIA, Anbieter-Dokumentation prüfen',
      color: 'bg-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
      items: phase1,
    },
    {
      id: 'phase2',
      title: 'Phase 2 — Technische & Organisatorische Vorbereitung',
      subtitle: isAnbieter
        ? 'Anbieter: Logging, Gebrauchsanweisung, Schulungen — vor Markteinführung'
        : 'Betreiber: Verträge, Mitarbeiter-Info, Aufsichtsperson — vor Pilot',
      color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
      items: phase2,
    },
    {
      id: 'phase3',
      title: 'Phase 3 — Pilotbetrieb',
      subtitle: isAnbieter
        ? 'Anbieter: Bias-Prüfung, PMM-Plan, Baseline — im kontrollierten Betrieb'
        : 'Betreiber: Inputdaten-Kontrolle, Monitoring, Vorfallsmeldung',
      color: 'bg-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700',
      items: phase3,
    },
    {
      id: 'phase4',
      title: 'Phase 4 — Rollout & laufender Betrieb',
      subtitle: isAnbieter
        ? 'Anbieter: CE-Kennzeichnung, EU-DB-Registrierung, PMM-System, Marktüberwachung'
        : 'Betreiber: EU-DB prüfen, Vorfälle melden, PMM-Berichte an Anbieter',
      color: 'bg-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
      items: phase4,
    },
  ]
}

// ── Law URL helper ─────────────────────────────────────────────────────────

function getLawUrl(law: string): string | null {
  const l = law.toLowerCase()
  if (l.includes('eu ai act') || l.includes('anhang')) {
    return 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32024R1689'
  }
  if (l.includes('dsgvo')) {
    return 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679'
  }
  if (l.includes('bdsg')) {
    return 'https://www.gesetze-im-internet.de/bdsg_2018/'
  }
  if (l.includes('betrvg')) {
    return 'https://www.gesetze-im-internet.de/betrvg/'
  }
  if (l.includes('urhg')) {
    return 'https://www.gesetze-im-internet.de/urhg/'
  }
  return null
}

// ── Risk Detector ──────────────────────────────────────────────────────────

interface RiskDetection {
  level: RiskLevel
  reason: string
  law: string
  detail?: string
}

function detectRisk(name: string, description: string): RiskDetection | null {
  const text = (name + ' ' + description).toLowerCase()

  // Unacceptable Risk (Art. 5) — shown as high risk with warning
  const unacceptable: { kw: string[]; reason: string; detail: string }[] = [
    {
      kw: ['social scoring', 'soziales scoring', 'bürger bewerten', 'sozialkreditsystem'],
      reason: 'Verdacht: Verbotenes KI-System — Soziales Scoring',
      detail: 'Soziales Scoring durch staatliche Stellen ist nach EU AI Act verboten.',
    },
    {
      kw: ['emotion erkennen', 'emotion detection', 'emotionserkennung arbeitsplatz', 'gefühle erkennen mitarbeiter', 'gefühle erkennen schüler'],
      reason: 'Verdacht: Verbotenes KI-System — Emotionserkennung',
      detail: 'Emotionserkennung am Arbeitsplatz oder in Bildungseinrichtungen ist verboten.',
    },
    {
      kw: ['unterschwellig manipul', 'subliminal'],
      reason: 'Verdacht: Verbotenes KI-System — Unterschwellige Manipulation',
      detail: 'Unterschwellige Techniken zur Verhaltensmanipulation sind verboten.',
    },
  ]

  for (const cat of unacceptable) {
    if (cat.kw.some((k) => text.includes(k))) {
      return { level: 'high', reason: cat.reason, law: 'Art. 5 EU AI Act', detail: cat.detail }
    }
  }

  // High Risk — Anhang III
  const highRisk: { kw: string[]; reason: string; law: string; detail: string }[] = [
    {
      kw: ['biometri', 'gesichtserkennung', 'face recognition', 'fingerabdruck', 'iris-scan', 'ganganalyse'],
      reason: 'Hohes Risiko erkannt: Biometrische Identifizierung',
      law: 'Anhang III Nr. 1 EU AI Act',
      detail: 'Biometrische Identifizierung oder Kategorisierung natürlicher Personen ist Hochrisiko-KI.',
    },
    {
      kw: ['krankenhaus', 'radiologie', 'ct-', 'röntgen', 'mrt', 'diagnose', 'patient', 'medizinisch', 'klinik', 'medizinprodukt', 'onkologie', 'pathologie', 'healthcare', 'befund', 'behandlungsplan', 'therapie'],
      reason: 'Hohes Risiko erkannt: Medizin / Patientenversorgung',
      law: 'Art. 6 Abs. 1 EU AI Act i.V.m. MDR',
      detail: 'KI als Sicherheitskomponente in Medizinprodukten oder zur Unterstützung klinischer Entscheidungen ist Hochrisiko. MDR/IVDR-Konformität und ggf. Notified Body erforderlich.',
    },
    {
      kw: ['epa', 'elektronische patientenakte', 'patientendaten'],
      reason: 'Hohes Risiko erkannt: Verarbeitung von Patientendaten (EPA)',
      law: 'Art. 6 Abs. 1 EU AI Act i.V.m. MDR',
      detail: 'KI-Systeme, die auf die Elektronische Patientenakte zugreifen und klinische oder administrative Entscheidungen treffen, gelten als Hochrisiko.',
    },
    {
      kw: ['bewerbung', 'lebenslauf', 'cv ', 'resume', 'recruiting', 'rekrutier', 'personalentscheid', 'kündigung', 'beförderung', 'attrition', 'mitarbeiter screening', 'hr-', 'human resources'],
      reason: 'Hohes Risiko erkannt: HR / Beschäftigung',
      law: 'Anhang III Nr. 4 EU AI Act',
      detail: 'KI für Einstellung, Beförderung, Kündigung oder Überwachung von Beschäftigten ist Hochrisiko. Betriebsrat einbinden (§87 BetrVG), DSFA prüfen (Art. 35 DSGVO).',
    },
    {
      kw: ['kredit', 'kreditwürdig', 'bonität', 'kreditvergabe', 'darlehen', 'finanzier', 'credit scoring', 'credit risk', 'kreditrisik'],
      reason: 'Hohes Risiko erkannt: Kreditvergabe / Finanzdienstleistungen',
      law: 'Anhang III Nr. 5 EU AI Act',
      detail: 'KI zur Beurteilung der Kreditwürdigkeit oder Kreditvergabe ist Hochrisiko. Betrifft auch Scoring-Systeme, die Zugang zu wesentlichen Dienstleistungen beeinflussen.',
    },
    {
      kw: ['betrug', 'fraud', 'betrugserkennung', 'fraud detection', 'zahlungsausfall'],
      reason: 'Hohes Risiko erkannt: Betrugserkennung im Finanzbereich',
      law: 'Anhang III Nr. 5 EU AI Act',
      detail: 'Betrugserkennung mit direkten Auswirkungen auf Personen (Kontosperrung, Ablehnung) ist Hochrisiko-KI.',
    },
    {
      kw: ['sozialleistung', 'bürgergeld', 'hartz', 'sozialhilfe', 'arbeitslosengeld', 'notaufnahme', 'rettung', 'emergency service'],
      reason: 'Hohes Risiko erkannt: Wesentliche öffentliche Dienstleistungen',
      law: 'Anhang III Nr. 5 EU AI Act',
      detail: 'KI bei der Vergabe von Sozialleistungen oder im Notfalleinsatz ist Hochrisiko.',
    },
    {
      kw: ['polizei', 'strafverfolgung', 'kriminalität vorhersage', 'predictive policing', 'verdächtig', 'law enforcement'],
      reason: 'Hohes Risiko erkannt: Strafverfolgung',
      law: 'Anhang III Nr. 6 EU AI Act',
      detail: 'KI in der Strafverfolgung — z.B. zur Vorhersage von Straftaten oder Täterprofilierung — ist Hochrisiko.',
    },
    {
      kw: ['migration', 'asyl', 'visa', 'grenzkon', 'aufenthalts', 'border control'],
      reason: 'Hohes Risiko erkannt: Migration / Grenzkontrolle',
      law: 'Anhang III Nr. 7 EU AI Act',
      detail: 'KI in Migration, Asyl- oder Visaverfahren und Grenzkontrollen ist Hochrisiko.',
    },
    {
      kw: ['gericht', 'urteil', 'rechtsprechung', 'strafmaß', 'richter', 'justiz', 'legal judgment'],
      reason: 'Hohes Risiko erkannt: Rechtspflege',
      law: 'Anhang III Nr. 8 EU AI Act',
      detail: 'KI zur Unterstützung von Richtern oder in der Strafjustiz ist Hochrisiko.',
    },
    {
      kw: ['studienplatzvergabe', 'hochschulzulassung', 'abitur', 'prüfungsauswertung', 'student admission', 'noten automatisch', 'bildungseinrichtung bewertung'],
      reason: 'Hohes Risiko erkannt: Bildung / Prüfungswesen',
      law: 'Anhang III Nr. 3 EU AI Act',
      detail: 'KI zur Zulassung, Bewertung oder Überwachung in Bildungseinrichtungen ist Hochrisiko.',
    },
  ]

  for (const cat of highRisk) {
    if (cat.kw.some((k) => text.includes(k))) {
      return { level: 'high', reason: cat.reason, law: cat.law, detail: cat.detail }
    }
  }

  // Limited Risk (Art. 50)
  const limitedRisk: { kw: string[]; reason: string; law: string; detail: string }[] = [
    {
      kw: ['chatbot', 'chat bot', 'virtueller assistent', 'sprachassistent', 'konversations', 'fragen beantwort', 'ihre fragen', 'dialog-system', 'voice bot'],
      reason: 'Begrenztes Risiko: Konversations-KI / Chatbot',
      law: 'Art. 50 Abs. 1 EU AI Act',
      detail: 'Chatbots und KI-Systeme im Dialog mit Menschen müssen sich als KI kennzeichnen. Nutzer sind vor Interaktionsbeginn zu informieren.',
    },
    {
      kw: ['texte generier', 'text generier', 'inhalte generier', 'content generier', 'zusammenfassung', 'meeting summary', 'protokoll', 'brief erstell', 'gpt', 'llm', 'sprachmodell', 'generative', 'deepfake', 'bild generier', 'video generier'],
      reason: 'Begrenztes Risiko: Generative KI / Synthesized Content',
      law: 'Art. 50 Abs. 2 EU AI Act',
      detail: 'KI-generierte Texte, Bilder oder Videos müssen als synthetisch gekennzeichnet werden (Ausnahme: offensichtlich kreative Werke).',
    },
    {
      kw: ['sentiment', 'stimmungsanalyse', 'kundenbewertung analyse', 'social media analyse', 'review analyse'],
      reason: 'Begrenztes Risiko: Stimmungsanalyse / NLP',
      law: 'Art. 50 EU AI Act',
      detail: 'Reine Analysetools ohne direkte Entscheidungswirkung auf Personen sind in der Regel begrenztes oder minimales Risiko.',
    },
  ]

  for (const cat of limitedRisk) {
    if (cat.kw.some((k) => text.includes(k))) {
      return { level: 'limited', reason: cat.reason, law: cat.law, detail: cat.detail }
    }
  }

  return null
}

// ── Components ─────────────────────────────────────────────────────────────

function QuestionCard({
  question, sub, yes, no, onAnswer,
}: {
  question: string; sub?: string; yes: string; no: string; onAnswer: (val: boolean) => void
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{question}</p>
        {sub && <p className="text-xs text-blue-600 mt-1">{sub}</p>}
      </div>
      <div className="flex gap-3">
        <button onClick={() => onAnswer(true)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          {yes}
        </button>
        <button onClick={() => onAnswer(false)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          {no}
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function euAiActRiskToLevel(risk?: string): RiskLevel {
  if (risk === 'High Risk' || risk === 'Unacceptable Risk') return 'high'
  if (risk === 'Limited Risk') return 'limited'
  if (risk === 'Minimal Risk') return 'minimal'
  return null
}

export function ProjectPlanContent({ ucid }: { ucid?: string | null }) {
  const { useCases } = useUseCasesStore()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormData>({ name: '', description: '' })
  const [answers, setAnswers] = useState<Answers>({
    akteurRolle: null,
    riskLevel: null,
    personalData: null,
    hrContext: null,
    externalProvider: null,
    worksCouncil: null,
    commercialOutput: null,
    notifiedBody: null,
  })
  const [qIndex, setQIndex] = useState(0)
  const [plan, setPlan] = useState<Phase[] | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showNote, setShowNote] = useState<Record<string, boolean>>({})

  // Pre-fill from ucid prop
  useEffect(() => {
    if (!ucid) return
    const uc = useCases.find((u) => u.id === ucid)
    if (!uc) return
    setForm({ name: uc.title, description: uc.businessProblem ?? '' })
    setAnswers((prev) => ({
      ...prev,
      riskLevel: euAiActRiskToLevel(uc.euAiActRisk),
      personalData: uc.compliancePersonalData ?? null,
    }))
    setQIndex(0)
    setStep('questions')
  }, [ucid, useCases])

  const totalItems = plan?.reduce((sum, p) => sum + p.items.length, 0) ?? 0
  const doneCount = Object.values(checked).filter(Boolean).length
  const progress = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  const toggleItem = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  const startQuestions = () => {
    if (!form.name.trim()) return
    setQIndex(0)
    setStep('questions')
  }

  const answerRolle = (rolle: AkteurRolle) => {
    setAnswers((a) => ({ ...a, akteurRolle: rolle }))
    setQIndex(1)
  }

  const answerRisk = (level: RiskLevel) => {
    setAnswers((a) => ({ ...a, riskLevel: level }))
    setQIndex(2)
  }

  const answerBool = (key: keyof Answers, val: boolean) => {
    const next = { ...answers, [key]: val }
    setAnswers(next)
    const bqs = getBoolQuestions(next)
    const boolIdx = qIndex - 2  // qIndex 0=Rolle, 1=Risiko, 2+=Bool
    if (boolIdx < bqs.length - 1) {
      setQIndex(qIndex + 1)
    } else {
      const generated = generatePlan(form, next)
      setPlan(generated)
      setChecked({})
      setNotes({})
      setShowNote({})
      setStep('plan')
    }
  }

  const reset = () => {
    setStep('form')
    setForm({ name: '', description: '' })
    setAnswers({ akteurRolle: null, riskLevel: null, personalData: null, hrContext: null, externalProvider: null, worksCouncil: null, commercialOutput: null, notifiedBody: null })
    setQIndex(0)
    setPlan(null)
    setChecked({})
    setNotes({})
    setShowNote({})
  }

  const goBack = () => {
    if (step === 'plan') {
      const bqs = getBoolQuestions(answers)
      setStep('questions')
      setQIndex(1 + bqs.length)  // last bool question index
    } else if (step === 'questions') {
      if (qIndex === 0) {
        setStep('form')
      } else {
        setQIndex(qIndex - 1)
      }
    }
  }

  const boolQuestions = getBoolQuestions(answers)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projektplan-Generator</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Use Case eingeben → Fragen beantworten → maßgeschneiderter Compliance-Projektplan
          </p>
        </div>
        {step !== 'form' && (
          <button onClick={reset}
            className="text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            Neu starten
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        {(['form', 'questions', 'plan'] as Step[]).map((s, i) => {
          const isCompleted = (step === 'questions' && s === 'form') || (step === 'plan' && s !== 'plan')
          const isClickable = isCompleted || (step === 'plan' && s === 'questions')
          return (
            <div key={s} className="flex items-center gap-3">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (s === 'form') { setStep('form') }
                  else if (s === 'questions') { setStep('questions'); setQIndex(1 + getBoolQuestions(answers).length) }
                }}
                className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? 'bg-blue-600 text-white' :
                  isCompleted ? 'bg-green-500 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted && (s as string) !== 'plan' ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-slate-800' : isCompleted ? 'text-green-600 underline-offset-2' : 'text-slate-400'}`}>
                  {s === 'form' ? 'Use Case' : s === 'questions' ? 'Fragen' : 'Projektplan'}
                </span>
              </button>
              {i < 2 && <div className={`h-px w-8 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Form */}
      {step === 'form' && (
        <div className="bg-white rounded-xl shadow-sm px-6 py-6 space-y-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Use Case Name *</label>
            <input
              type="text"
              placeholder="z.B. KI-gestütztes Bewerbungsscreening"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kurzbeschreibung <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <textarea
              placeholder="Was soll das System tun? Wer nutzt es? Welche Entscheidungen trifft es?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={startQuestions}
            disabled={!form.name.trim()}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Weiter → Fragen beantworten
          </button>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-xs text-slate-500">Use Case</p>
            <p className="text-sm font-semibold text-slate-800">{form.name}</p>
          </div>

          {/* Progress dots + back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: 2 + boolQuestions.length }, (_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                  i < qIndex ? 'bg-green-500' : i === qIndex ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              ))}
              <span className="text-xs text-slate-400 ml-1">Frage {qIndex + 1} von {2 + boolQuestions.length}</span>
            </div>
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Zurück
            </button>
          </div>

          {/* Q0: Akteurrolle */}
          {qIndex === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">In welcher Rolle setzt ihr das KI-System ein?</p>
                <p className="text-xs text-slate-500 mt-1">Das ist die wichtigste Weichenstellung im EU AI Act — Anbieter und Betreiber haben grundlegend verschiedene Pflichten (Art. 3 Nr. 3/4).</p>
              </div>
              <div className="space-y-2">
                <button onClick={() => answerRolle('anbieter')}
                  className="w-full flex items-start gap-4 px-4 py-4 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl text-left transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg flex-shrink-0 mt-0.5">🏭</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Anbieter <span className="text-xs font-normal text-blue-600 ml-1">Art. 3 Nr. 3 EU AI Act</span></p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Wir <strong>entwickeln</strong> das KI-System selbst und bringen es in Verkehr oder nehmen es in Betrieb — als Produkt oder interne Lösung.</p>
                    <p className="text-[10px] text-blue-600 mt-1.5 font-medium">Pflichten: QMS · Technische Dokumentation · Konformitätsbewertung · CE-Kennzeichnung · EU-DB-Registrierung</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <button onClick={() => answerRolle('betreiber')}
                  className="w-full flex items-start gap-4 px-4 py-4 border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-xl text-left transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg flex-shrink-0 mt-0.5">🏢</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Betreiber <span className="text-xs font-normal text-violet-600 ml-1">Art. 3 Nr. 4 EU AI Act</span></p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Wir <strong>nutzen</strong> ein KI-System — zugekauft oder eigenentwickelt — unter eigener Verantwortung in unserem Kontext.</p>
                    <p className="text-[10px] text-violet-600 mt-1.5 font-medium">Pflichten: Art. 26 Nutzungspflichten · FRIA Art. 27 · Menschliche Aufsicht · Beschäftigte informieren · Vorfälle melden</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0 group-hover:text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Tipp: Wer ein bestehendes KI-System wesentlich verändert (Zweck oder Funktion), wechselt in die Anbieterrolle.</p>
            </div>
          )}

          {/* Q1: Risikoklasse */}
          {qIndex === 1 && (() => {
            const detected = detectRisk(form.name, form.description)
            const detectedUrl = detected ? getLawUrl(detected.law) : null
            return (
              <div className="space-y-3">
                {/* Auto-detection banner */}
                {detected && (
                  <div className={`rounded-xl border px-4 py-3 space-y-2 ${
                    detected.level === 'high' ? 'bg-orange-50 border-orange-300' :
                    detected.level === 'limited' ? 'bg-amber-50 border-amber-300' :
                    'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm">🔍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">{detected.reason}</p>
                        {detected.detail && (
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{detected.detail}</p>
                        )}
                        {detectedUrl ? (
                          <a href={detectedUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-1">
                            {detected.law}
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                          </a>
                        ) : (
                          <p className="text-[11px] font-mono text-slate-500 mt-1">{detected.law}</p>
                        )}
                      </div>
                      <button
                        onClick={() => answerRisk(detected.level)}
                        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          detected.level === 'high' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                          detected.level === 'limited' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                          'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Übernehmen →
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Welche Risikoklasse hat das KI-System?</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {detected ? 'Erkennung oben bestätigen oder manuell korrigieren:' : 'Keine automatische Erkennung — bitte manuell wählen:'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        level: 'high' as RiskLevel,
                        label: 'Hohes Risiko',
                        sub: 'Anhang III — HR, Kredit, Medizin, Bildung, Strafverfolgung etc.',
                        color: detected?.level === 'high'
                          ? 'border-orange-400 bg-orange-100 ring-2 ring-orange-300'
                          : 'border-orange-300 bg-orange-50 hover:bg-orange-100',
                      },
                      {
                        level: 'limited' as RiskLevel,
                        label: 'Begrenztes Risiko',
                        sub: 'Chatbots, KI-generierte Inhalte — Art. 50 Transparenzpflicht',
                        color: detected?.level === 'limited'
                          ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-300'
                          : 'border-amber-300 bg-amber-50 hover:bg-amber-100',
                      },
                      {
                        level: 'minimal' as RiskLevel,
                        label: 'Minimales Risiko',
                        sub: 'Spam-Filter, Empfehlungssysteme, interne Tools ohne Personenbezug',
                        color: detected?.level === 'minimal'
                          ? 'border-green-400 bg-green-100 ring-2 ring-green-300'
                          : 'border-green-300 bg-green-50 hover:bg-green-100',
                      },
                    ].map((opt) => (
                      <button key={opt.level} onClick={() => answerRisk(opt.level)}
                        className={`w-full flex items-start gap-3 px-4 py-3 border rounded-lg text-left transition-colors ${opt.color}`}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {qIndex >= 2 && (() => {
            const q = boolQuestions[qIndex - 2]
            if (!q) return null
            return (
              <QuestionCard
                question={q.q}
                sub={q.sub}
                yes={q.yes}
                no={q.no}
                onAnswer={(val) => answerBool(q.key, val)}
              />
            )
          })()}
        </div>
      )}

      {/* Step 3: Plan */}
      {step === 'plan' && plan && (
        <div className="space-y-6">
          {/* Summary header */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Fragen bearbeiten
                </button>
              </div>
              <p className="text-xs text-slate-500">Projektplan für</p>
              <p className="text-base font-bold text-slate-800">{form.name}</p>
              {form.description && <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">{doneCount}/{totalItems}</p>
                <p className="text-xs text-slate-500">Aufgaben erledigt</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#16a34a" strokeWidth="3"
                    strokeDasharray={`${progress * 0.942} 94.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {[
              answers.akteurRolle === 'anbieter'
                ? { label: '🏭 Anbieter (Art. 3 Nr. 3)', color: 'bg-blue-100 text-blue-800 border border-blue-300' }
                : { label: '🏢 Betreiber (Art. 3 Nr. 4)', color: 'bg-violet-100 text-violet-800 border border-violet-300' },
              { label: answers.riskLevel === 'high' ? 'Hohes Risiko' : answers.riskLevel === 'limited' ? 'Begrenztes Risiko' : 'Minimales Risiko', color: answers.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' : answers.riskLevel === 'limited' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700' },
              ...(answers.personalData ? [{ label: 'Personenbezogene Daten', color: 'bg-violet-100 text-violet-700' }] : []),
              ...(answers.hrContext ? [{ label: 'HR-Kontext', color: 'bg-red-100 text-red-700' }] : []),
              ...(answers.externalProvider ? [{ label: 'Externer Anbieter', color: 'bg-blue-100 text-blue-700' }] : []),
              ...(answers.worksCouncil ? [{ label: 'Betriebsrat', color: 'bg-slate-100 text-slate-700' }] : []),
              ...(answers.commercialOutput ? [{ label: 'Kommerzielle Outputs', color: 'bg-cyan-100 text-cyan-700' }] : []),
              ...(answers.notifiedBody ? [{ label: 'Notified Body (Anhang VII)', color: 'bg-orange-100 text-orange-700' }] : []),
            ].map((tag) => (
              <span key={tag.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tag.color}`}>{tag.label}</span>
            ))}
          </div>

          {/* Phases */}
          {plan.map((phase, phaseIdx) => {
            const phaseDone = phase.items.filter((item) => checked[item.id]).length
            return (
              <div key={phase.id} className={`rounded-xl border ${phase.border} overflow-hidden`}>
                <div className={`px-5 py-4 ${phase.bg} flex items-center gap-4`}>
                  <span className={`w-9 h-9 rounded-full ${phase.color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                    {phaseIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${phase.text}`}>{phase.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{phase.subtitle}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/60 ${phase.text} flex-shrink-0`}>
                    {phaseDone}/{phase.items.length}
                  </span>
                </div>
                <div className="bg-white divide-y divide-slate-50">
                  {phase.items.map((item) => {
                    const lawUrl = item.law ? getLawUrl(item.law) : null
                    const noteVisible = showNote[item.id]
                    const noteText = notes[item.id] ?? ''
                    return (
                      <div key={item.id} className="px-5 py-3 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleItem(item.id)}>
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            checked[item.id] ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'
                          }`}>
                            {checked[item.id] && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${checked[item.id] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {item.text}
                              {item.priority === 'high' && !checked[item.id] && (
                                <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">PRIO</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Law link + Begründung toggle */}
                        <div className="ml-8 mt-1.5 flex items-center gap-3 flex-wrap">
                          {item.law && (
                            lawUrl ? (
                              <a
                                href={lawUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-mono underline underline-offset-2 flex items-center gap-0.5"
                              >
                                {item.law}
                                <svg className="w-2.5 h-2.5 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">{item.law}</span>
                            )
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowNote((p) => ({ ...p, [item.id]: !p[item.id] })) }}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              noteText
                                ? 'border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {noteText ? '📝 Begründung' : '+ Begründung'}
                          </button>
                        </div>

                        {/* Begründung textarea */}
                        {noteVisible && (
                          <div className="ml-8 mt-2" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={noteText}
                              onChange={(e) => setNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                              placeholder="Begründung eingeben — z.B. warum diese Anforderung nicht zutrifft oder abgelehnt wurde …"
                              rows={2}
                              className="w-full text-xs px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                            />
                          </div>
                        )}

                        {/* Show saved note when collapsed */}
                        {!noteVisible && noteText && (
                          <p className="ml-8 mt-1 text-[10px] text-amber-700 italic bg-amber-50 rounded px-2 py-1">
                            {noteText}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Hinweis:</span> Dieser Plan dient der Orientierung und ersetzt keine Rechtsberatung. Offene Rechtsfragen nach dem Dreistufenmodell eskalieren — DSB oder Fachanwalt einschalten.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectPlanPage() {
  const [searchParams] = useSearchParams()
  const ucid = searchParams.get('ucid')
  return <ProjectPlanContent ucid={ucid} />
}
