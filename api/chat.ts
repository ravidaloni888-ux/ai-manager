import type { VercelRequest, VercelResponse } from '@vercel/node'

// ─────────────────────────────────────────────────────────────────────────
// Chat über das Wissen der App.
//
// Der Server hält keine eigene Wissenskopie. Die passenden Ausschnitte
// sucht der Client aus denselben Konstanten heraus, aus denen auch die
// Seiten gerendert werden, und schickt sie mit. So kann die Antwort nicht
// von dem abweichen, was in der App steht.
//
// Das Modell darf ausschliesslich aus diesen Ausschnitten antworten. Was
// nicht drinsteht, wird als „steht nicht in der App" beantwortet — bei
// einem Werkzeug für Compliance-Arbeit ist eine erfundene Rechtsauskunft
// schlimmer als eine fehlende.
// ─────────────────────────────────────────────────────────────────────────

interface Ausschnitt { titel: string; quelle: string; pfad: string; text: string }
interface Nachricht { role: 'user' | 'assistant'; content: string }

const SYSTEM = `Du bist der Nachschlage-Assistent einer Web-App für KI-Beauftragte (KI-Management nach EU AI Act, DSGVO, ISO 42001).

Du beantwortest Fragen AUSSCHLIESSLICH auf Grundlage der mitgelieferten Ausschnitte aus der App.

Regeln:
1. Nutze nur die Ausschnitte. Ergänze nichts aus deinem allgemeinen Wissen — auch dann nicht, wenn du die Antwort zu kennen glaubst.
2. Decken die Ausschnitte die Frage nicht ab, sage das klar in einem Satz und nenne, was die App zum Thema stattdessen enthält. Rate nicht.
3. Verweise am Ende jeder Aussage auf den Fundort in Klammern, z. B. (Glossar) oder (EU AI Act · Prüfbaum). Nimm dafür das Feld „Quelle" des Ausschnitts.
4. Antworte auf Deutsch, knapp und sachlich. Zwei bis sechs Sätze, es sei denn, die Frage verlangt eine Aufzählung.
5. Du gibst keine Rechtsberatung. Bei rechtlich heiklen Fragen weise darauf hin, dass die App eine Orientierungshilfe ist und die verbindliche Einordnung Fachleuten obliegt.
6. Erfinde keine Artikelnummern, Fristen oder Schwellenwerte. Nenne nur, was wörtlich in den Ausschnitten steht.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, ausschnitte } = req.body as {
    messages?: Nachricht[]
    ausschnitte?: Ausschnitt[]
  }

  if (!messages?.length) return res.status(400).json({ error: 'messages is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  // Kein Treffer im Bestand — dann gar nicht erst das Modell fragen.
  if (!ausschnitte?.length) {
    return res.status(200).json({
      antwort: 'Dazu finde ich nichts in der App. Formuliere die Frage gern mit einem Fachbegriff — etwa „Hochrisiko", „DSFA", „Datenqualität", „Canary Release" oder „FAIR".',
      quellen: [],
    })
  }

  const wissenBlock = ausschnitte
    .map((a, i) => `--- Ausschnitt ${i + 1} ---\nTitel: ${a.titel}\nQuelle: ${a.quelle}\n${a.text}`)
    .join('\n\n')

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
        max_tokens: 900,
        system: `${SYSTEM}\n\nAusschnitte aus der App:\n\n${wissenBlock}`,
        // Nur die letzten Wechsel — der Verlauf soll den Wissensblock nicht verdrängen
        messages: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return res.status(502).json({ error: `Anthropic API error: ${response.status}`, detail })
    }

    const data = await response.json() as { content: Array<{ text?: string }> }
    const antwort = data.content?.map((c) => c.text ?? '').join('').trim()
    if (!antwort) return res.status(502).json({ error: 'Leere Antwort vom Modell' })

    return res.status(200).json({
      antwort,
      quellen: ausschnitte.map((a) => ({ titel: a.titel, quelle: a.quelle, pfad: a.pfad })),
    })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
