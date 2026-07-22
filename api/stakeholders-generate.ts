import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { context, count } = req.body as { context?: string; count?: number }
  if (!context?.trim()) return res.status(400).json({ error: 'context is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const n = Math.min(Math.max(count ?? 6, 3), 10)

  const systemPrompt = `Du bist ein erfahrener Stakeholder-Analyst und KI-Programmmanager.
Du analysierst Projektkontext und erstellst realistische Stakeholder-Profile nach der Mendelow-Matrix und den "Dangerous Animals of Product Management"-Archetypen.

Die 10 Tier-Archetypen:
- hippo: HiPPO (Highest Paid Person's Opinion) — Entscheidet auf Bauchgefühl, blockiert Daten
- rhino: RHiNO (Really High-value New Opportunity) — Fordert One-off-Features für einzelne Deals
- wolf: WoLF (Works on Latest Fire) — Permanentes Firefighting, keine strategische Planung
- zebra: ZEbRA (Zero Evidence But Really Arrogant) — Behauptet auf Basis von Erfahrung ohne Daten
- seagull: Seagull Manager — Taucht ohne Kontext auf, verursacht Chaos, verschwindet wieder
- cobra: CoBRA (Cognitive Bias Related Assertions) — Unsichtbare kognitive Verzerrungen steuern Entscheidungen
- puffin: PUFFIn (Plans Unending Feature Factory Initiatives) — Feature-Fabrik ohne strategischen Anker
- goose: GOOSE (Guesstimating Overly Optimistic Scheduling Estimates) — Chronisch zu optimistisch bei Zeitschätzungen
- puma: PUMA (Promotes Unusually Meaningless Assumptions) — Springt auf einzelne Datenpunkte als universelle Wahrheit
- yak: YAK (Yet Another KPI) — Besessen von Metriken, die nicht mit echten Ergebnissen verbunden sind

Regeln für die Stakeholder-Analyse:
- Macht (power): Formale UND faktische Macht berücksichtigen (1=keine, 10=maximale Macht)
- Interesse (interest): Wie stark ist die Person vom Projekt betroffen/daran interessiert (1=kein, 10=maximales Interesse)
- Tier-Archetypus: Wähle den passendsten Archetypen basierend auf der Rolle und typischen Verhaltensmustern
- Notizen: Erkläre konkret, warum dieser Archetypus passt und welche spezifische Herausforderung diese Person darstellt
- Verwende realistische deutschsprachige Namen und Rollen passend zum Kontext

Antworte AUSSCHLIESSLICH als valides JSON-Array (kein zusätzlicher Text):
[
  {
    "name": "Vollständiger Name",
    "role": "Titel / Funktion",
    "power": 7,
    "interest": 8,
    "animal": "hippo",
    "notes": "Konkrete Erklärung, warum dieser Archetyp passt und was zu beachten ist."
  }
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Analysiere den folgenden Projektkontext und erstelle genau ${n} Stakeholder-Profile.\n\nProjektkontext:\n${context.trim()}\n\nErstelle ${n} realistische Stakeholder für dieses Projekt. Stelle sicher, dass alle 4 Mendelow-Quadranten repräsentiert sind (Manage Closely, Keep Satisfied, Keep Informed, Monitor) und verschiedene Tier-Archetypen verwendet werden.`,
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Anthropic API error: ${response.status}`, detail: err })
    }

    const data = await response.json() as { content: Array<{ text: string }> }
    const text = data.content[0]?.text ?? ''

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return res.status(502).json({ error: 'No JSON array in response', raw: text })

    const stakeholders = JSON.parse(jsonMatch[0])
    return res.status(200).json({ stakeholders })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
