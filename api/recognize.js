// Serverless-Funktion (Vercel): ruft Anthropic serverseitig auf, damit der API-Key
// niemals im (öffentlichen) Client-Code oder Repo landet.
// Testfunktion — zusätzlich zur kostenlosen manuellen Erfassung, nicht als Ersatz.

const DEFAULT_CATS = [
  'Elektronik', 'Möbel', 'Küche & Haushalt', 'Kleidung & Schmuck',
  'Werkzeug & Hobby', 'Fahrräder', 'Kunstgegenstände', 'Sonstiges'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server nicht konfiguriert: ANTHROPIC_API_KEY fehlt in den Vercel-Umgebungsvariablen.' });
    return;
  }

  const { imageBase64, mediaType, textHint } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: 'Kein Bild übermittelt.' });
    return;
  }

  const prompt = `Erkenne den Hausrat-Gegenstand auf dem Foto (Marke, Modell, Typ) und recherchiere den aktuellen Neuwert/Wiederbeschaffungswert in Deutschland.${textHint ? ' Zusätzlicher Hinweis: ' + textHint : ''}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Du bist Experte für Hausrat-Inventarisierung in Deutschland. Antworte NUR mit JSON ohne Markdown-Codeblock:
{
  "name": "<Bezeichnung mit Marke+Modell>",
  "cat": "<exakt eine von: ${DEFAULT_CATS.join('|')}>",
  "year": "<Kaufjahr 4-stellig falls erkennbar, sonst leer>",
  "serial": "<Modell-/Seriennummer falls erkennbar, sonst leer>",
  "price": <Neuwert in EUR als ganze Zahl>,
  "source": "<Shopname, z. B. Amazon.de>",
  "sourceUrl": "<https://... URL zur Quelle>",
  "note": "<kurze Anmerkung oder leer>"
}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      res.status(resp.status).json({ error: data.error?.message || 'Anthropic-API-Fehler' });
      return;
    }

    const texts = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const match = texts.replace(/```json|```/g, '').match(/\{[\s\S]*?\}/);
    if (!match) {
      res.status(200).json({ error: 'Kein Ergebnis erkannt.' });
      return;
    }
    const obj = JSON.parse(match[0]);
    res.status(200).json(obj);
  } catch (err) {
    res.status(500).json({ error: String(err && err.message || err) });
  }
}
