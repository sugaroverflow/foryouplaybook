import { config } from './config.js'

export async function callGrok(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  responseFormat?: 'json'
): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.xaiModel,
    temperature: 0.8,
    max_tokens: 2048,
    messages,
  }

  if (responseFormat === 'json') {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`xAI error: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0].message.content
}
