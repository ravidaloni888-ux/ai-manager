import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { caseText } = req.body as { caseText?: string }
  if (!caseText?.trim()) return res.status(400).json({ error: 'caseText is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const systemPrompt = `Du bist ein KI-Beauftragter und QS-Experte. Du erstellst Anforderungskataloge für KI-Projekte nach ISO/IEC 25059.

Leitprinzip: "Besser werden" ist keine Anforderung — eine Zahl ist eine Anforderung. Jede Schwelle muss Pareto-optimiert sein: gut genug für den Nutzen, ohne überdimensionierten Aufwand. Nur bei Sicherheit/Recht gilt Nulltoleranz.

Für jeden beschriebenen KI-Anwendungsfall erstellst du Anforderungen in drei Pflicht-Kategorien und einer Bonus-Kategorie:

1. FUNKTIONAL (F-1 bis F-3): Was das System tun MUSS. Prüfbar als Ja/Nein pro Antwort.
2. NICHT-FUNKTIONAL (NF-1 bis NF-3): Wie das System arbeiten muss — Zeit, Verfügbarkeit, Aktualität. Prüfbar über Messreihen.
3. QUALITATIV (Q-1 bis Q-3): Wie gut die Ausgaben sind — Inhalt, Vollständigkeit, Sprache. Prüfbar durch Stichproben.
4. COMPLIANCE (C-1 bis C-2, Bonus): Was rechtlich gelten muss — DSGVO, KI-VO, Branchenrecht.

Jede Anforderung hat exakt diese vier Felder:
- anforderung: Konkrete, prüfbar formulierte Anforderung (ein Satz, Subjekt: das System)
- messgroesse: Konkrete Zahl oder Quote + Abnahmeschwelle (z.B. "≥ 90 % der Antworten...", "p95 ≤ 5 Sekunden", "100 %", "0 Verstöße")
- warumSchwelle: Begründung, warum diese Schwelle Pareto-optimal ist (nicht zu hoch, nicht zu niedrig)
- pruefmethode: Konkrete Methode vor Go-Live + Monitoring im laufenden Betrieb

Antworte AUSSCHLIESSLICH als valides JSON:
{
  "functional": [
    { "id": "F-1", "anforderung": "...", "messgroesse": "...", "warumSchwelle": "...", "pruefmethode": "..." },
    { "id": "F-2", ... },
    { "id": "F-3", ... }
  ],
  "nonFunctional": [
    { "id": "NF-1", ... },
    { "id": "NF-2", ... },
    { "id": "NF-3", ... }
  ],
  "qualitative": [
    { "id": "Q-1", ... },
    { "id": "Q-2", ... },
    { "id": "Q-3", ... }
  ],
  "compliance": [
    { "id": "C-1", ... },
    { "id": "C-2", ... }
  ]
}`

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
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Erstelle den Anforderungskatalog für folgenden KI-Anwendungsfall:\n\n${caseText}` }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Anthropic API error: ${response.status}`, detail: err })
    }

    const data = await response.json() as { content: Array<{ text: string }> }
    const text = data.content[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'No JSON in response', raw: text })

    return res.status(200).json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
