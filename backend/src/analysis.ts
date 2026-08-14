import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { extractPostFeatures } from './features.js'
import { computeFit, type FitResult, type PostWithMetrics } from './fit.js'
import { callGrok } from './llm.js'

export interface PlaybookOutput {
  archetype: {
    name: string
    description: string
    confidence: 'High' | 'Medium' | 'Low'
  }
  discoveries: Array<{
    headline: string
    explanation: string
    why_it_matters: string
    confidence: 'High' | 'Medium' | 'Low'
    evidence_post_ids: string[]
  }>
  moves: Array<{
    move_type: 'rewrite' | 'double_down' | 'change' | 'go_talk' | 'experiment'
    title: string
    body: string
    rewrite_text?: string
    evidence_post_ids: string[]
  }>
}

export async function runAnalysis(scanId: string, userId: string): Promise<void> {
  const user = db.prepare('SELECT goal FROM users WHERE id = ?').get(userId) as
    | { goal: string | null }
    | undefined
  const goal = user?.goal || 'balanced'

  const posts = db
    .prepare(
      `SELECT
         p.id, p.user_id, p.x_post_id, p.text, p.post_type, p.created_at,
         p.has_url, p.media_type, p.conversation_id,
         ms.likes, ms.replies, ms.reposts, ms.quotes, ms.bookmarks,
         ms.impressions, ms.engagements, ms.profile_clicks, ms.url_clicks
       FROM posts p
       LEFT JOIN metric_snapshots ms ON ms.post_id = p.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(userId) as PostWithMetrics[]

  for (const post of posts) {
    const features = extractPostFeatures(post)
    db.prepare(
      'INSERT OR REPLACE INTO post_features (post_id, deterministic_json) VALUES (?, ?)'
    ).run(post.id, JSON.stringify(features))
  }

  const fit = computeFit(posts)

  const evidence = posts
    .filter((p) => p.post_type === 'original' || p.post_type === 'quote')
    .map((p) => ({
      id: p.x_post_id,
      type: p.post_type,
      text: p.text,
      created_at: p.created_at,
      likes: p.likes,
      replies: p.replies,
      reposts: p.reposts,
      quotes: p.quotes,
      bookmarks: p.bookmarks,
      impressions: p.impressions,
      profile_clicks: p.profile_clicks,
      url_clicks: p.url_clicks,
    }))

  const raw = await callGrok(
    [
      {
        role: 'system',
        content:
          'You are ForYou Playbook, a playful, evidence-obsessed X strategy assistant. Be specific, avoid generic advice, and never claim to know X’s production ranking score. Return strict JSON.',
      },
      {
        role: 'user',
        content: buildPlaybookPrompt({ posts: evidence, goal, fit }),
      },
    ],
    'json'
  )

  const parsed = JSON.parse(raw) as PlaybookOutput
  persistPlaybook(scanId, userId, fit, parsed)
}

function buildPlaybookPrompt({
  posts,
  goal,
  fit,
}: {
  posts: any[]
  goal: string
  fit: FitResult
}): string {
  return `Generate a JSON playbook for this X creator. Goal: ${goal}. Fit profile: ${JSON.stringify(fit)}.

Schema:
{
  "archetype": { "name": "2-4 word playful name with one emoji", "description": "one sentence with a light roast", "confidence": "High|Medium|Low" },
  "discoveries": [ { "headline": "short surprising headline", "explanation": "evidence sentence with counts", "why_it_matters": "one sentence", "confidence": "High|Medium|Low", "evidence_post_ids": ["x post id"] } ],
  "moves": [ { "move_type": "rewrite|double_down|change|go_talk|experiment", "title": "short", "body": "plain text with evidence", "rewrite_text": "only for rewrite move", "evidence_post_ids": ["x post id"] } ]
}

Rules:
- Exactly 3 discoveries and exactly 5 moves.
- Exactly one move must have move_type "rewrite" and include rewrite_text.
- One move of each type: rewrite, double_down, change, go_talk, experiment.
- Be specific. Quote post patterns when possible.
- Do not promise viral lift.
- Do not infer sensitive traits.

Posts: ${JSON.stringify(posts.slice(0, 40))}`
}

function persistPlaybook(
  scanId: string,
  userId: string,
  fit: FitResult,
  parsed: PlaybookOutput
): void {
  db.prepare(
    `UPDATE scans SET
       archetype = ?,
       archetype_description = ?,
       archetype_confidence = ?,
       fit_json = ?,
       status = 'completed',
       stage = 'completed',
       completed_at = ?
     WHERE id = ?`
  ).run(
    parsed.archetype.name,
    parsed.archetype.description,
    parsed.archetype.confidence,
    JSON.stringify(fit),
    new Date().toISOString(),
    scanId
  )

  db.prepare('DELETE FROM findings WHERE scan_id = ?').run(scanId)
  for (const d of parsed.discoveries.slice(0, 3)) {
    db.prepare(
      'INSERT INTO findings (id, scan_id, headline, explanation, confidence, evidence_json) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      randomUUID(),
      scanId,
      d.headline,
      `${d.explanation}\n\nWhy it matters: ${d.why_it_matters}`,
      d.confidence,
      JSON.stringify(d.evidence_post_ids || [])
    )
  }

  db.prepare('DELETE FROM moves WHERE scan_id = ?').run(scanId)
  for (let i = 0; i < parsed.moves.length; i++) {
    const m = parsed.moves[i]
    db.prepare(
      'INSERT INTO moves (id, scan_id, move_type, title, body, rewrite_text, evidence_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      randomUUID(),
      scanId,
      m.move_type,
      m.title,
      m.body,
      m.rewrite_text || null,
      JSON.stringify(m.evidence_post_ids || [])
    )
  }
}
