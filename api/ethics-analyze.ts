import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { caseText } = req.body as { caseText?: string }
  if (!caseText?.trim()) return res.status(400).json({ error: 'caseText is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured', keys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('ANTH')) })

  const systemPrompt = `Du bist ein KI-Ethikexperte und KI-Beauftragter. Du bewertest KI-Fälle nach dem FAST-Framework des Alan Turing Institute und nach dem Drei-Zonen-Modell (Legal/Ethical/Optimal).

FAST-Dimensionen:
- F (Fairness): Unzulässige Diskriminierung, Ausschluss, ungleiche Behandlung von Gruppen
- A (Accountability): Fehlende Verantwortlichkeit, fehlende Auditierbarkeit, kein Human-in-the-Loop
- S (Sustainability): Langfristige gesellschaftliche/ökologische/soziale Schäden, Arbeitsmarkt-Folgen
- T (Transparency): Fehlende Nachvollziehbarkeit, versteckte Datennutzung, keine Erklärbarkeit

Antworte IMMER als valides JSON mit exakt dieser Struktur:
{
  "verdict": "JA" | "NEIN" | "UNKLAR",
  "verdictReason": "Ein Satz: warum JA/NEIN/UNKLAR",
  "fastDimensions": ["F", "A", "S", "T"] (nur zutreffende),
  "fastExplanations": {
    "F": "Erklärung für F, nur wenn betroffen",
    "A": "Erklärung für A, nur wenn betroffen",
    "S": "Erklärung für S, nur wenn betroffen",
    "T": "Erklärung für T, nur wenn betroffen"
  },
  "zone": "Legal" | "Ethical" | "Optimal" | "Mehrere",
  "zoneExplanation": "Welche Zone ist betroffen und warum",
  "mainRisk": "Die wichtigste ethische Schwachstelle in einem Satz",
  "recommendation": "Die konkreteste Empfehlung für einen KI-Beauftragten (2–3 Sätze)",
  "severity": "Hoch" | "Mittel" | "Niedrig"
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Bewerte folgenden Fall:\n\n${caseText}` }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Anthropic API error: ${response.status}`, detail: err })
    }

    const data = await response.json() as { content: Array<{ text: string }> }
    const text = data.content[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'No JSON in response', raw: text })

    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
