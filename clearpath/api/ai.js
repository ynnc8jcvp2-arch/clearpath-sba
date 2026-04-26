import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemInstruction = '', jsonMode = false } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemInstruction,
      messages: [{ role: 'user', content: jsonMode ? `${prompt}\n\nRespond with valid JSON only. No markdown, no code fences.` : prompt }],
    });

    const text = message.content[0].text;

    if (jsonMode) {
      try {
        return res.status(200).json({ result: JSON.parse(text) });
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return res.status(200).json({ result: JSON.parse(match[0]) });
        return res.status(500).json({ error: 'AI returned invalid JSON' });
      }
    }

    return res.status(200).json({ result: text });
  } catch (error) {
    console.error('AI error:', error);
    return res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
}
