import { TERMS } from '../pages/GlossaryPage'
import { STEPS } from '../pages/StartPage'
import { DEPLOYMENT_STRATEGIEN, TEST_EBENEN } from '../pages/QAPage'
import { FAIR_PRINZIPIEN } from '../components/data/FairPrinzipien'
import { VERFUEGBARKEIT_FRAGEN } from '../components/assessments/DatenverfuegbarkeitCheck'
import { QUALITY_DIMENSIONS } from '../components/assessments/DataQualityCheck'
import { TREE_NODES } from '../components/assessments/RiskClassCheck'
import { DSFA_TRIGGERS, ART22_CHECKS } from '../components/compliance/CaseComplianceChecks'
import { NACHWEISE } from './nachweise'
import { RISIKOART_META } from './deriveRisks'
import {
  TIMELINE, RISK_CLASSES, ACTOR_ROLES, COPYRIGHT_RULES, AI_ACT_GOALS, OMNIBUS_CHANGES,
  KMU_BENEFITS, BETREIBER_DUTIES, FALLSTUDIEN, PARALLELES_RECHT, KONFORMITAET_SCHRITTE,
  TRANSPARENZ_PFADE, PMM_ELEMENTE, MELDEPFLICHT_FRISTEN, DRIFT_TYPEN, LIABILITY_TABLE,
} from '../pages/EuAiActPage'
import {
  AIMS_CLAUSES, BAUSTEINE, GAP_LUECKEN, SCHATTEN_RISIKEN, RISIKOARTEN_INFO, NIST_TRIAS,
  RICHTLINIE_FIELDS, ROLES,
} from '../pages/GovernancePage'
import { ARTICLES, DREISTUFENMODELL, DSGVO_GRUNDSAETZE, BIAS_TYPES } from '../pages/DsgvoPage'
import { FAST, CASES, ZONES, FAIRNESS_DEFS } from '../pages/EthikPage'
import { RESISTANCE_CAUSES, EMPATHY_PRINCIPLES, ADKAR_STEPS, KOTTER_STEPS } from '../pages/ChangeManagementPage'
import { VENDORS, CRITERIA } from '../pages/VendorPage'
import { ISO_TRAINING_REQUIREMENTS, ADOPTION_BLOCKS } from '../pages/EnablementPage'
import { DIMS } from '../pages/MaturityPage'
import { ROLES as COE_ROLLEN, ISO_REQUIREMENTS } from '../pages/RolesPage'
import { INTEGRITY_MECHANISMS, VERSIONING_PRINCIPLES } from '../pages/DataGovernancePage'
import { VERGESSENE_POSTEN } from '../pages/ProjectPlanPage'
import {
  ABHAENGIGKEITSARTEN, PRIORISIERUNGS_FRAGEN, VERBINDLICHKEITSSTUFEN,
  REIFEGRAD_TEMPO, ROADMAP_PRUEFFRAGEN, HORIZONS,
} from '../pages/RoadmapPage'
import {
  ZUSAMMENSCHLUSS_WEGE, PROZESS_KANDIDATEN, ZUSAMMENSCHLUSS_REGELN,
} from '../pages/ChangeManagementPage'
import { SCHWELLE_FRAGEN } from '../components/assessments/SchwellenwertCheck'
import { SIGNAL_ERKLAERUNG, SIGNAL_QUELLEN, ENTSCHEIDUNG_LABEL } from './signale'

// ─────────────────────────────────────────────────────────────────────────
// Das Wissen der App als durchsuchbare Stücke.
//
// Nichts hier ist abgeschrieben: Jedes Stück entsteht aus derselben
// Konstante, aus der auch die Seite gerendert wird. Ändert sich der
// Prüfbaum oder eine Qualitätsdimension, ändert sich die Antwort des
// Chats mit — es gibt keine zweite Fassung, die veralten könnte.
//
// Deshalb trägt jedes Stück auch seinen Fundort. Der Chat behauptet
// nichts, er verweist: „steht unter Glossar", „steht im Prüfbaum".
// ─────────────────────────────────────────────────────────────────────────

export interface WissenStueck {
  titel: string
  /** Anzeigename des Fundorts */
  quelle: string
  /** Route in der App, damit man nachlesen kann */
  pfad: string
  text: string
}

/** Umlaute und Satzzeichen weg — sonst findet „Datenqualitat" nichts. */
function normalisieren(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function bauen(): WissenStueck[] {
  const stuecke: WissenStueck[] = []

  // ── Glossar ──
  for (const t of TERMS) {
    stuecke.push({
      titel: t.term,
      quelle: `Glossar · ${t.category}`,
      pfad: '/glossary',
      text: [t.definition, t.example && `Beispiel: ${t.example}`].filter(Boolean).join(' '),
    })
  }

  // ── EU AI Act: Prüfpfad und Ergebnisse ──
  for (const node of Object.values(TREE_NODES)) {
    if (node.type === 'question') {
      stuecke.push({
        titel: `Prüffrage: ${node.text}`,
        quelle: 'EU AI Act · Risikoklassen-Prüfbaum',
        pfad: '/eu-ai-act',
        text: [node.sub, ...(node.hints ?? [])].filter(Boolean).join(' · '),
      })
    } else if (node.result) {
      const r = node.result
      stuecke.push({
        titel: `Einstufung: ${r.name}`,
        quelle: `EU AI Act · ${r.law}`,
        pfad: '/eu-ai-act',
        text: `${r.desc} Rechtsgrundlage: ${r.law}.`,
      })
    }
  }

  // ── Datengrundlage: das Gate ──
  for (const f of VERFUEGBARKEIT_FRAGEN) {
    stuecke.push({
      titel: `Datenverfügbarkeit — ${f.titel}`,
      quelle: `Datengrundlage · Gate${f.hart ? ' (K.-o.-Frage)' : ''}`,
      pfad: '/data',
      text: `${f.frage} ${f.hinweis} Wird das verneint: ${f.beiNein}`,
    })
  }

  // ── Datenqualität: die sieben Dimensionen ──
  for (const d of QUALITY_DIMENSIONS) {
    stuecke.push({
      titel: `Datenqualität — ${d.title}`,
      quelle: 'Daten-Governance · Qualitätsdimensionen',
      pfad: '/data?tab=qualitaet',
      text: `${d.frage} Geprüft wird: ${d.check} Beispiel: ${d.beispiel}`,
    })
  }

  // ── FAIR ──
  for (const p of FAIR_PRINZIPIEN) {
    stuecke.push({
      titel: `FAIR — ${p.title} (${p.bedeutung})`,
      quelle: 'Daten-Governance · FAIR-Prinzipien',
      pfad: '/data?tab=fair',
      text: `${p.inhalt} Praxisfrage: ${p.praxisfrage} Woran man es erkennt: ${p.merkmale.join(' ')} Im Fall abgeleitet aus: ${p.imFall}.`,
    })
  }

  // ── Testebenen ──
  for (const e of TEST_EBENEN) {
    stuecke.push({
      titel: `Testebene: ${e.name} (${e.kurz})`,
      quelle: 'KI-Qualitätssicherung · Test-Typen',
      pfad: '/qa?tab=tests',
      text: `Leitfrage: ${e.leitfrage} Perspektive: ${e.perspektive}. Werkzeuge: ${e.werkzeuge}. Wann: ${e.wann}. Die drei Ebenen sind keine Alternativen — jede sieht etwas, das den anderen verborgen bleibt.`,
    })
  }

  // ── Deployment ──
  for (const s of DEPLOYMENT_STRATEGIEN) {
    stuecke.push({
      titel: `Deployment-Strategie: ${s.name}`,
      quelle: 'KI-Qualitätssicherung · Deployment',
      pfad: '/qa?tab=abnahme',
      text: `${s.kern} ${s.folge} Risiko: ${s.risiko}.`,
    })
  }

  // ── DSGVO: DSFA-Auslöser (Art. 35) ──
  stuecke.push({
    titel: 'DSFA-Pflicht — wann eine Datenschutz-Folgenabschätzung nötig ist (Art. 35 DSGVO)',
    quelle: 'Anwendungsfall · Datenschutz-Prüfung',
    pfad: '/dsgvo',
    text: `Ein einziger Auslöser genügt, dann ist die Folgenabschätzung vor dem Einsatz fällig. Die fünf geprüften Auslöser: ${DSFA_TRIGGERS.map((t) => t.label).join('; ')}. Trifft mindestens einer zu, muss die DSFA VOR dem Systemeinsatz durchgeführt werden; Einbeziehung des Datenschutzbeauftragten empfohlen. Trifft keiner zu, ist sie wahrscheinlich nicht erforderlich — sie kann aber auch bei hier nicht aufgeführten Szenarien nötig sein.`,
  })

  // ── DSGVO: menschliche Aufsicht (Art. 22) ──
  stuecke.push({
    titel: 'Art. 22 DSGVO — Qualität der menschlichen Aufsicht bei automatisierten Entscheidungen',
    quelle: 'Anwendungsfall · Datenschutz-Prüfung',
    pfad: '/dsgvo',
    text: `EuGH C-634/21: Formale Kontrolle reicht nicht — der Mensch muss tatsächlich entscheiden können. Geprüft wird: ${ART22_CHECKS.map((c) => c.text).join('; ')}.`,
  })

  // ── DSGVO: AVV (Art. 28) ──
  stuecke.push({
    titel: 'AVV-Pflicht — Auftragsverarbeitungsvertrag (Art. 28 DSGVO)',
    quelle: 'Anwendungsfall · Datenschutz-Prüfung',
    pfad: '/dsgvo',
    text: 'Ein AVV ist erforderlich, wenn das KI-System auf Servern eines externen Anbieters läuft UND dabei personenbezogene Daten verarbeitet werden. Fehlt er in diesem Fall, ist die gesamte Verarbeitung rechtswidrig — auch bei namhaften Anbietern. Läuft nichts extern oder werden keine personenbezogenen Daten verarbeitet, ist kein AVV nötig.',
  })

  // ── Compliance-Nachweise ──
  for (const n of NACHWEISE) {
    stuecke.push({
      titel: `Compliance-Nachweis: ${n.label}`,
      quelle: 'Anwendungsfall · Compliance-Nachweise',
      pfad: '/use-cases',
      text: `${n.desc}${n.quelle ? ` Wird belegt durch: ${n.quelle}.` : ''}`,
    })
  }

  // ── Risikoarten ──
  for (const [art, meta] of Object.entries(RISIKOART_META)) {
    stuecke.push({
      titel: `KI-Risikoart: ${art}`,
      quelle: `Risiken · ${meta.category}`,
      pfad: '/risk',
      text: meta.desc,
    })
  }

  // ── Die Arbeitsschritte des Programms ──
  for (const s of STEPS) {
    stuecke.push({
      titel: `Arbeitsschritt ${s.num}: ${s.title}`,
      quelle: `KI-Programm · Phase ${s.phase}`,
      pfad: `/guide?step=${s.id}`,
      text: `${s.description} ${s.detail ?? ''} ${(s.eingaben ?? []).join(' ')}`,
    })
  }

  // ── EU AI Act: die Seite selbst ────────────────────────────────────────
  const eu = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `EU AI Act · ${quelle}`, pfad: '/eu-ai-act', text })

  for (const r of RISK_CLASSES) {
    eu(`Risikoklasse: ${r.name}`, 'Risikoklassen',
      `${r.summary} Pflichten: ${r.duties} Beispiele: ${r.examples.join(', ')}.`)
  }
  for (const a of ACTOR_ROLES) {
    eu(`Rolle: ${a.role}`, `Akteure · ${a.art}`,
      `${a.definition} Beispiel: ${a.example} Pflichten: ${a.duties}`)
  }
  for (const d of BETREIBER_DUTIES) {
    eu(`Betreiberpflicht ${d.num}: ${d.title}`, d.art, d.desc)
  }
  for (const f of FALLSTUDIEN) {
    eu(`Fallstudie: ${f.company} (${f.year})`, 'Fallstudien',
      `${f.problem} Verstöße: ${f.violations.join(' · ')}. Ergebnis: ${f.verdict}`)
  }
  for (const t of TRANSPARENZ_PFADE) {
    eu(`Transparenz: ${t.von} → ${t.an}`, `Transparenz · ${t.law}`, `${t.pflicht} ${t.frage}`)
  }
  for (const k of KONFORMITAET_SCHRITTE) {
    eu(`Konformitätsbewertung Schritt ${k.num}: ${k.title}`, k.law, k.desc)
  }
  for (const p of PMM_ELEMENTE) {
    eu(`Beobachtung nach Inverkehrbringen: ${p.title}`, 'Art. 72 · Post-Market Monitoring', p.desc)
  }
  for (const d of DRIFT_TYPEN) {
    eu(`Drift-Typ: ${d.name}`, 'Betrieb · Drift', d.desc)
  }
  for (const p of PARALLELES_RECHT) {
    eu(`Paralleles Recht: ${p.law}`, 'Rechtsrahmen', `Gilt für: ${p.applies} Schwerpunkt: ${p.focus}`)
  }
  for (const c of COPYRIGHT_RULES) {
    eu(`Urheberrecht: ${c.scenario}`, 'Urheberrecht', `${c.protection} — ${c.detail}`)
  }
  for (const g of AI_ACT_GOALS) eu(`Ziel des AI Act: ${g.title}`, 'Ziele', g.desc)
  for (const o of OMNIBUS_CHANGES) eu(`Digital Omnibus: ${o.label}`, 'Omnibus-Änderungen', o.detail)
  for (const k of KMU_BENEFITS) eu(`KMU-Erleichterung ${k.num}: ${k.title}`, 'KMU', k.points.join(' · '))
  for (const l of LIABILITY_TABLE) eu(`Haftung: ${l.situation}`, 'Haftung', `Haftbar ist: ${l.liable}`)
  eu('Fristen des EU AI Act', 'Zeitplan',
    TIMELINE.map((t) => `${t.date}: ${t.label}`).join(' · '))
  eu('Meldepflicht bei schwerwiegenden Vorfällen', 'Art. 73 · Fristen',
    MELDEPFLICHT_FRISTEN.map((m) => `${m.typ}: ${m.frist}`).join(' · '))

  // ── Governance: ISO 42001 und der Betrieb ──────────────────────────────
  const gov = (titel: string, quelle: string, text: string, tab = '') =>
    stuecke.push({ titel, quelle: `Governance · ${quelle}`, pfad: `/governance${tab}`, text })

  for (const k of AIMS_CLAUSES) {
    gov(`ISO/IEC 42001 Klausel ${k.kl}: ${k.title}`, 'ISO 42001',
      `${k.desc}${k.coveredBy ? ` In der App abgedeckt durch: ${k.coveredBy}.` : ''}`)
  }
  for (const b of BAUSTEINE) gov(`Governance-Baustein: ${b.label}`, 'Bausteine', b.desc)
  for (const g of GAP_LUECKEN) gov(`Governance-Lücke: ${g.title}`, 'GAP-Analyse', g.why)
  for (const s of SCHATTEN_RISIKEN) gov(`Schatten-KI-Risiko: ${s.title}`, 'Shadow AI', s.desc)
  for (const r of RISIKOARTEN_INFO) {
    gov(`Risikoart: ${r.art}`, 'Risikoarten', `${r.kern} Beispiel: ${r.beispiel}`)
  }
  for (const n of NIST_TRIAS) gov(`NIST-Schadensdimension: ${n.label}`, 'NIST AI RMF', n.desc)
  for (const f of RICHTLINIE_FIELDS) gov(`KI-Richtlinie: ${f.title}`, 'KI-Richtlinie', f.desc)
  for (const r of ROLES) gov(`Governance-Rolle: ${r.title}`, 'Verantwortlichkeiten', r.desc)

  // ── DSGVO ──────────────────────────────────────────────────────────────
  const dsgvo = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `DSGVO · ${quelle}`, pfad: '/dsgvo', text })

  for (const a of ARTICLES) {
    dsgvo(`${a.tag} — ${a.title}`, a.tag,
      `${a.summary} ${a.details} Beispiel: ${a.example}`)
  }
  for (const g of DSGVO_GRUNDSAETZE) {
    dsgvo(`Grundsatz: ${g.short} (${g.name})`, g.art, g.desc)
  }
  for (const s of DREISTUFENMODELL) {
    dsgvo(`Dreistufenmodell — Stufe ${s.stufe}: ${s.title}`, 'Dreistufenmodell',
      `${s.merkmal} Aufgaben: ${s.tasks.join(' · ')}`)
  }
  for (const b of BIAS_TYPES) {
    dsgvo(`Bias-Art: ${b.type}`, 'Bias & Diskriminierung', b.desc)
  }

  // ── Ethik ──────────────────────────────────────────────────────────────
  const ethik = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `Ethik · ${quelle}`, pfad: '/ethik', text })

  for (const f of FAST) ethik(`FAST — ${f.key}: ${f.label}`, 'FAST-Prinzipien', f.desc)
  for (const z of ZONES) ethik(`Prüfzone: ${z.label}`, 'Drei Zonen', `${z.q} Maßstab: ${z.std}`)
  for (const c of CASES) ethik(`Ethik-Fall: ${c.title}`, c.label, `${c.text} Signal: ${c.signal}`)
  for (const d of FAIRNESS_DEFS) {
    ethik(`Fairness-Definition: ${d.term}`, 'Fairness', `${d.body} Schwäche: ${d.weakness}`)
  }

  // ── Change Management ──────────────────────────────────────────────────
  const change = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `Change · ${quelle}`, pfad: '/change', text })

  for (const c of RESISTANCE_CAUSES) {
    change(`Widerstand: ${c.title}`, 'Widerstandsursachen',
      `${c.motto} ${c.ursache} Typische Aussagen: ${c.aussagen.join(' · ')} Was hilft: ${c.hilft}`)
  }
  for (const p of EMPATHY_PRINCIPLES) change(`Empathie: ${p.title}`, 'Gesprächsführung', p.body)
  for (const a of ADKAR_STEPS) {
    change(`ADKAR ${a.letter}: ${a.title}`, 'ADKAR',
      `${a.sub} Leitfrage: ${a.frage} Fehlt es: ${a.fehlt} — ${a.fehltDetail} Abhilfe: ${a.fix}`)
  }
  for (const k of KOTTER_STEPS) {
    change(`Kotter: ${k.title}`, '8 Schritte', `${k.was} Beispiel: ${k.beispiel}`)
  }

  // ── Anbieter ───────────────────────────────────────────────────────────
  for (const v of VENDORS) {
    stuecke.push({
      titel: `Anbieter: ${v.name}`,
      quelle: `Anbietervergleich · ${v.category}`,
      pfad: '/vendors',
      text: `${v.description} Anbieter: ${v.vendor}. Preismodell: ${v.pricingModel}. `
        + `EU-Datenhaltung: ${v.euDataResidency ? 'ja' : 'nein'}, DSGVO-bereit: ${v.gdprReady ? 'ja' : 'nein'}, `
        + `On-Premise: ${v.onPremise ? 'ja' : 'nein'}, Feintuning: ${v.fineTuning ? 'ja' : 'nein'}.`,
    })
  }
  stuecke.push({
    titel: 'Bewertungskriterien für KI-Anbieter',
    quelle: 'Anbietervergleich · Kriterien',
    pfad: '/vendors',
    text: CRITERIA.map((c) => c.label).join(' · '),
  })

  // ── Befähigung ─────────────────────────────────────────────────────────
  for (const r of ISO_TRAINING_REQUIREMENTS) {
    stuecke.push({
      titel: `Schulungsanforderung ${r.clause}: ${r.title}`,
      quelle: `Befähigung · ISO 42001 ${r.clause}`,
      pfad: '/enablement',
      text: `${r.description} Zu prüfen: ${r.check} ${r.detail}`,
    })
  }
  for (const b of ADOPTION_BLOCKS) {
    stuecke.push({
      titel: `Akzeptanz-Hürde ${b.nr}: ${b.title}`,
      quelle: 'Befähigung · Akzeptanz',
      pfad: '/enablement',
      text: `„${b.quote}" Verhalten: ${b.verhalten} Ziel: ${b.ziel} Was tun: ${b.wasTun} `
        + `Was hilft: ${b.wasHilft} Verantwortlich: ${b.verantwortlich}`,
    })
  }

  // ── Reifegrad ──────────────────────────────────────────────────────────
  for (const d of DIMS) {
    stuecke.push({
      titel: `Reifegrad-Dimension: ${d.label}`,
      quelle: 'Reifegrad · Dimensionen',
      pfad: '/maturity',
      text: d.questions.join(' · '),
    })
  }

  // ── Rollen im KI-Kompetenzzentrum ──────────────────────────────────────
  for (const r of COE_ROLLEN) {
    stuecke.push({
      titel: `Rolle: ${r.title}`,
      quelle: 'Team & Rollen',
      pfad: '/roles',
      text: `${r.responsibility} Aufgaben: ${r.activities.join(' · ')}`,
    })
  }
  for (const r of ISO_REQUIREMENTS) {
    stuecke.push({
      titel: `ISO 42001 ${r.clause}: ${r.requirement}`,
      quelle: `Team & Rollen · ISO ${r.clause}`,
      pfad: '/roles',
      text: `${r.description} Abgedeckt durch: ${r.coveredLabel}`,
    })
  }

  // ── Daten-Governance: Integrität und Versionierung ─────────────────────
  for (const m of INTEGRITY_MECHANISMS) {
    stuecke.push({
      titel: `Datenintegrität: ${m.title}`,
      quelle: 'Daten-Governance · Integrität',
      pfad: '/data',
      text: `${m.body} ${m.tag}`,
    })
  }
  for (const p of VERSIONING_PRINCIPLES) {
    stuecke.push({
      titel: `Versionierung: ${p.title}`,
      quelle: 'Daten-Governance · Versionierung',
      pfad: '/data',
      text: p.body,
    })
  }

  // ── Projektplan: die vergessenen Budgetposten ──────────────────────────
  for (const p of VERGESSENE_POSTEN) {
    stuecke.push({
      titel: `Vergessener Projektposten: ${p.titel}`,
      quelle: 'Projektplan · Was in Standard-Plänen fehlt',
      // Der Plan hat keine eigene Route — er steht im Prüfschritt
      // „To-do-Plan" innerhalb eines Anwendungsfalls.
      pfad: '/canvas',
      text: `${p.kurz}. ${p.text} Diese Position ist typischerweise nicht eingeplant und `
        + 'erscheint später als Budgetüberschreitung.',
    })
  }

  // ── Roadmap: vom Einzelfall zum Portfolio ──────────────────────────────
  const portfolio = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `Roadmap · ${quelle}`, pfad: '/roadmap?tab=portfolio', text })

  for (const a of ABHAENGIGKEITSARTEN) {
    portfolio(`Abhängigkeit: ${a.art}`, 'Abhängigkeiten', `${a.frage} Konsequenz: ${a.konsequenz}`)
  }
  for (const f of PRIORISIERUNGS_FRAGEN) {
    portfolio(`Priorisierungsfrage: ${f.frage}`, 'Priorisierung', f.zweck)
  }
  for (const s of VERBINDLICHKEITSSTUFEN) {
    portfolio(`Verbindlichkeitsstufe: ${s.stufe}`, 'Roadmap-Stufen',
      // Bewusst nicht "Horizont" im Titel — das Wort ist für das
      // BCG-Modell (Deploy/Reshape/Invent, Zeithorizont) belegt.
      `${s.verbindlichkeit} Inhalt: ${s.inhalt}. Nicht zu verwechseln mit den strategischen `
      + `Horizonten (Deploy/Reshape/Invent) — die messen den Zeithorizont eines Vorhabens, `
      + 'diese Stufe misst seine Verbindlichkeit.')
  }
  for (const r of REIFEGRAD_TEMPO) {
    portfolio(`Reifegrad-Gate: ${r.wennGilt}`, 'Reifegrad bestimmt Tempo', r.gehoertDarauf)
  }
  stuecke.push({
    titel: 'Fünf Prüffragen an eine fertige Roadmap',
    quelle: 'Roadmap · Prüffragen',
    pfad: '/roadmap?tab=portfolio',
    text: ROADMAP_PRUEFFRAGEN.join(' · '),
  })
  for (const h of HORIZONS) {
    stuecke.push({
      titel: `Strategischer Horizont: ${h.label}`,
      quelle: 'Roadmap · Strategische Horizonte (BCG)',
      pfad: '/roadmap?tab=horizonte',
      // "Horizont" hier: Zeitraum bis zur Wirkung (Deploy/Reshape/Invent) —
      // nicht zu verwechseln mit der Verbindlichkeitsstufe oben.
      text: `${h.titel} (${h.zeitraum}). ${h.body} Nicht zu verwechseln mit den `
        + 'Verbindlichkeitsstufen Beschlossen/Vorbereitet/Beobachtet — die messen, wie fest '
        + 'ein Vorhaben zugesagt ist, nicht seinen Zeithorizont.',
    })
  }

  // ── Change Management: Zusammenschluss ─────────────────────────────────
  const zs = (titel: string, quelle: string, text: string) =>
    stuecke.push({ titel, quelle: `Change · Zusammenschluss · ${quelle}`, pfad: '/change?tab=zusammenschluss', text })

  for (const w of ZUSAMMENSCHLUSS_WEGE) {
    zs(`Organisationsweg: ${w.weg}`, 'Organisationsstruktur', `${w.passiert} Preis: ${w.preis}`)
  }
  for (const p of PROZESS_KANDIDATEN) {
    zs(`Prozesskandidat: ${p.stelle}`, 'Prozessanalyse', `${p.frage} ${p.hinweis}`)
  }
  for (const r of ZUSAMMENSCHLUSS_REGELN) {
    zs(`Handlungsregel: ${r.regel}`, 'Handlungsregeln', r.text)
  }
  zs(
    'Forschungsbefund zu Übernahmen',
    'Evidenzlage',
    'Eine Metaanalyse im Strategic Management Journal (King, Dalton, Daily & Covin, 2004) findet im '
    + 'Mittel keine Leistungsverbesserung durch Übernahmen und keine verlässlichen Erfolgsfaktoren. '
    + 'Angemessen ist deshalb eine Roadmap mit Entscheidungspunkten statt Endzuständen.',
  )
  zs(
    'Kulturunterschiede bei Zusammenschlüssen',
    'Kultur',
    'Eine Metaanalyse in Organization Science (Stahl & Voigt, 2008; 46 Studien, über 10.000 '
    + 'Zusammenschlüsse) zeigt: Kulturelle Unterschiede wirken sich nicht durchgängig negativ aus. '
    + 'Entscheidend ist nicht der Abstand zwischen den Kulturen, sondern wie mit ihm umgegangen wird '
    + '— nur dort harmonisieren, wo es tatsächlich kollidiert.',
  )
  zs(
    'Schatten-KI-Nutzung im Zusammenschluss',
    'Nutzungswirklichkeit',
    'Eine Studie mit über 48.000 Befragten in 47 Ländern (Melbourne/KPMG, 2025): 57 % verbergen ihre '
    + 'KI-Nutzung, fast die Hälfte nutzt KI entgegen Richtlinien, nur 40 % kennen eine Richtlinie dazu. '
    + 'Veränderungsarbeit ist deshalb Regel- und Befähigungsarbeit, keine Überzeugungsarbeit.',
  )

  // ── Schwellenwert & Aufsicht ───────────────────────────────────────────
  for (const f of SCHWELLE_FRAGEN) {
    stuecke.push({
      titel: `Schwellenwert — ${f.titel}`,
      quelle: 'Fallprüfung · Schwellenwert & Aufsicht',
      pfad: '/canvas',
      text: `${f.frage} ${f.hinweis}`,
    })
  }

  // ── Signalliste ────────────────────────────────────────────────────────
  stuecke.push({
    titel: 'Signalliste — was der Betrieb meldet',
    quelle: 'Betrieb · Signale',
    pfad: '/qa?tab=signale',
    text: SIGNAL_ERKLAERUNG.join(' '),
  })
  stuecke.push({
    titel: 'Woraus Signale entstehen',
    quelle: 'Betrieb · Signale',
    pfad: '/qa?tab=signale',
    text: SIGNAL_QUELLEN.map((q) => `${q.quelle}: ${q.wann}`).join(' · ')
      + `. Mögliche Entscheidungen: ${Object.values(ENTSCHEIDUNG_LABEL).join(', ')}.`,
  })

  return stuecke
}

export const WISSEN: WissenStueck[] = bauen()

/** Wörter, die in fast jeder Frage stehen und deshalb nichts unterscheiden. */
const STOPPWOERTER = new Set([
  'was', 'ist', 'sind', 'wie', 'wer', 'wann', 'warum', 'wo', 'welche', 'welcher', 'welches',
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'und', 'oder', 'nicht', 'auch', 'bei', 'mit', 'von', 'fur', 'auf', 'im', 'in', 'zu', 'zum',
  'ich', 'wir', 'man', 'muss', 'kann', 'soll', 'sich', 'es', 'sie', 'er', 'mir', 'mich',
  'gibt', 'hat', 'haben', 'werden', 'wird', 'sein', 'mehr', 'aber', 'denn', 'als', 'wenn',
])

/**
 * Fachbegriffe, die dieselbe Sache meinen. Ohne das findet „Hochrisiko"
 * die Einstufung „Hohes Risiko" nicht — es ist wörtlich ein anderes Wort.
 */
const SYNONYME: Record<string, string[]> = {
  hochrisiko: ['hohes', 'risiko', 'anhang', 'iii'],
  hochrisikosystem: ['hohes', 'risiko', 'anhang', 'iii'],
  dsfa: ['datenschutz', 'folgenabschatzung', 'art', '35'],
  folgenabschatzung: ['dsfa'],
  avv: ['auftragsverarbeitung', 'auftragsverarbeitungsvertrag', 'art', '28'],
  auftragsverarbeitungsvertrag: ['avv'],
  verboten: ['inakzeptables', 'praktik', 'art'],
  gpai: ['allgemeinem', 'verwendungszweck', 'modell'],
  ko: ['harte', 'gate'],
  rollout: ['deployment', 'produktion'],
  ausrollen: ['deployment', 'canary', 'produktion'],
  datenschutzbeauftragter: ['dsb', 'datenschutz'],
}

/**
 * Die zur Frage passenden Stücke — einfache Begriffssuche, kein Modell.
 *
 * Bewusst schlicht: Der Chat soll aus dem Bestand der App antworten, und
 * für gut hundert Stücke genügt Wortüberdeckung. Titeltreffer zählen
 * dreifach, weil der Titel den Begriff benennt, um den es geht.
 */
/**
 * Deutsche Beugung grob abtragen: „Betreibers" soll „Betreiber" finden,
 * „Pflichten" soll „Betreiberpflicht" finden. Kein Stemmer — nur die
 * letzten ein bis zwei Buchstaben, und erst ab einer Länge, bei der das
 * nicht in Unsinn umschlägt.
 */
function stamm(w: string): string {
  if (w.length < 7) return w
  return w.replace(/(en|er|es|em|n|s|e)$/, '')
}

/**
 * Deutsche Komposita von hinten aufbrechen: „Datenversionierung" soll
 * „Versionierung" finden, „Modellüberwachung" die „Überwachung".
 *
 * Kein Wörterbuch — nur die Endstücke ab sieben Zeichen, absteigend
 * nach Länge, damit das längste und damit spezifischste zuerst greift.
 * Treffer darüber zählen weniger als ein direkter, sonst verdrängen
 * zufällige Wortenden die echten Treffer.
 */
function endstuecke(w: string): string[] {
  if (w.length < 11) return []
  const out: string[] = []
  for (let i = 1; w.length - i >= 7; i++) out.push(w.slice(i))
  return out
}

export function findeWissen(frage: string, max = 14): WissenStueck[] {
  const gefragt = normalisieren(frage).split(' ')
    // Zahlen bleiben drin, auch kurze: „Art. 26", „Klausel 9", „Art. 35"
    // sind genau die Form, in der Menschen nach Vorschriften fragen.
    .filter((w) => (w.length > 2 || /^\d+$/.test(w)) && !STOPPWOERTER.has(w))
  const woerter = [...new Set(gefragt.flatMap((w) => [w, ...(SYNONYME[w] ?? [])]))]
  if (woerter.length === 0) return []

  const bewertet = WISSEN.map((s) => {
    const titel = normalisieren(s.titel)
    const text = normalisieren(s.text)
    // Der Fundort trägt die Artikelnummern („Art. 26 Abs. 1"). Ohne ihn
    // ist eine Vorschrift über ihre Nummer nicht auffindbar.
    const quelle = normalisieren(s.quelle)
    let imTitel = 0
    let imText = 0
    for (const w of woerter) {
      const st = stamm(w)
      const enden = endstuecke(w)
      if (titel.includes(w) || quelle.includes(w)) imTitel++
      else if (st !== w && (titel.includes(st) || quelle.includes(st))) imTitel += 0.6
      else if (enden.some((e) => titel.includes(e) || quelle.includes(e))) imTitel += 0.4
      if (text.includes(w)) imText++
      else if (st !== w && text.includes(st)) imText += 0.6
      else if (enden.some((e) => text.includes(e))) imText += 0.4
    }
    // Lange Abschnitte treffen sonst allein durch ihre Länge — der lange
    // Ausnahmen-Knoten des Prüfbaums stand vorher bei fast jeder Frage
    // oben. Der Textanteil wird deshalb auf die Länge normiert.
    const laenge = text.split(' ').length
    const laengenFaktor = 40 / (40 + laenge)
    const punkte = imTitel * 3 + imText * laengenFaktor * 4
    return { s, punkte }
  }).filter((x) => x.punkte > 0)

  bewertet.sort((a, b) => b.punkte - a.punkte)
  return bewertet.slice(0, max).map((x) => x.s)
}
