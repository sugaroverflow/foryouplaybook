import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { db } from './db.js'
import { auth } from './auth.js'
import { scanBudget } from './budget.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: config.frontendUrl,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type'],
    credentials: true,
  })
)

app.route('/api/auth/x', auth)

app.get('/health', (c) => c.text('ok'))

app.get('/api/scan-budget', (c) => c.json(scanBudget()))

app.get('/api/scans/:id', (c) => {
  const id = c.req.param('id')
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(id)
  if (!scan) return c.json({ error: 'not found' }, 404)
  return c.json(scan)
})

// Older scans have LLM text that cites raw post IDs; the evidence post is
// embedded right below the text, so point there instead. Post IDs are 13-20
// digit numbers — engagement counts never get that long.
function scrubPostIds<T>(value: T): T {
  if (typeof value !== 'string') return value
  return value
    .replace(/(?:your|the|this)\s+post\s+(?:id\s+)?\d{13,20}/gi, 'the post below')
    .replace(/\bpost\s+\d{13,20}/gi, 'the post below')
    .replace(/\s*\(?\b\d{13,20}\b\)?/g, '')
    .replace(/(^|[.!?]\s+)the post below/g, '$1The post below') as T
}

// Resolve LLM-chosen evidence x_post_ids to real posts with their latest metrics
// so the frontend can embed them instead of citing raw IDs.
function evidencePosts(evidenceJson: string | null, userId: string) {
  let ids: string[] = []
  try {
    ids = JSON.parse(evidenceJson || '[]')
  } catch {
    return []
  }
  return ids
    .slice(0, 2)
    .map((xPostId) =>
      db
        .prepare(
          `SELECT p.x_post_id, p.text, p.created_at,
                  ms.likes, ms.replies, ms.reposts, ms.impressions
           FROM posts p
           LEFT JOIN metric_snapshots ms ON ms.post_id = p.id
           WHERE p.x_post_id = ? AND p.user_id = ?
           ORDER BY ms.captured_at DESC
           LIMIT 1`
        )
        .get(xPostId, userId)
    )
    .filter(Boolean)
}

app.get('/api/playbook/:scanId', (c) => {
  const scanId = c.req.param('scanId')
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId) as
    | { user_id: string }
    | undefined
  if (!scan) return c.json({ error: 'not found' }, 404)
  const user = db
    .prepare('SELECT username, display_name, profile_image_url FROM users WHERE id = ?')
    .get(scan.user_id) as
    | { username: string; display_name: string | null; profile_image_url: string | null }
    | undefined
  const findings = db
    .prepare('SELECT * FROM findings WHERE scan_id = ?')
    .all(scanId) as Array<Record<string, unknown> & { evidence_json: string | null }>
  const moves = db
    .prepare('SELECT * FROM moves WHERE scan_id = ? ORDER BY move_type')
    .all(scanId) as Array<Record<string, unknown> & { evidence_json: string | null }>
  const posts = db
    .prepare(
      `SELECT p.id, p.x_post_id, p.text, p.post_type, p.created_at,
              ms.likes, ms.replies, ms.reposts, ms.quotes, ms.bookmarks,
              ms.impressions, ms.engagements, ms.profile_clicks, ms.url_clicks
       FROM posts p
       LEFT JOIN (
         SELECT post_id, MAX(captured_at) as max_captured
         FROM metric_snapshots
         GROUP BY post_id
       ) latest ON latest.post_id = p.id
       LEFT JOIN metric_snapshots ms ON ms.post_id = p.id AND ms.captured_at = latest.max_captured
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 100`
    )
    .all(scan.user_id) as Array<Record<string, unknown>>
  return c.json({
    scan,
    author: user
      ? {
          username: user.username,
          displayName: user.display_name || user.username,
          profileImageUrl: user.profile_image_url,
        }
      : null,
    posts,
    findings: findings.map((f) => ({
      ...f,
      headline: scrubPostIds(f.headline),
      explanation: scrubPostIds(f.explanation),
      evidence_posts: evidencePosts(f.evidence_json, scan.user_id),
    })),
    moves: moves.map((m) => ({
      ...m,
      title: scrubPostIds(m.title),
      body: scrubPostIds(m.body),
      evidence_posts: evidencePosts(m.evidence_json, scan.user_id),
    })),
  })
})

app.post('/api/share', async (c) => {
  const body = (await c.req.json()) as { scanId: string; shareEnabled: boolean }
  const scan = db.prepare('SELECT user_id FROM scans WHERE id = ?').get(body.scanId) as
    | { user_id: string }
    | undefined
  if (!scan) return c.json({ error: 'not found' }, 404)
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(scan.user_id) as {
    username: string
  }
  db.prepare('UPDATE users SET share_enabled = ?, public_slug = ? WHERE id = ?').run(
    body.shareEnabled ? 1 : 0,
    user.username,
    scan.user_id
  )
  return c.json({ publicUrl: `${config.frontendUrl}/?p=${user.username}` })
})

app.post('/api/settings/delete', async (c) => {
  const body = (await c.req.json()) as { scanId: string; confirm: boolean }
  if (!body.scanId || !body.confirm) return c.json({ error: 'bad request' }, 400)
  const scan = db.prepare('SELECT user_id FROM scans WHERE id = ?').get(body.scanId) as
    | { user_id: string }
    | undefined
  if (!scan) return c.json({ error: 'not found' }, 404)

  db.prepare('DELETE FROM findings WHERE scan_id IN (SELECT id FROM scans WHERE user_id = ?)').run(scan.user_id)
  db.prepare('DELETE FROM moves WHERE scan_id IN (SELECT id FROM scans WHERE user_id = ?)').run(scan.user_id)
  db.prepare('DELETE FROM metric_snapshots WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)').run(scan.user_id)
  db.prepare('DELETE FROM post_features WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)').run(scan.user_id)
  db.prepare('DELETE FROM posts WHERE user_id = ?').run(scan.user_id)
  db.prepare('DELETE FROM scans WHERE user_id = ?').run(scan.user_id)
  db.prepare('DELETE FROM playbook_rules WHERE user_id = ?').run(scan.user_id)
  db.prepare('DELETE FROM experiments WHERE user_id = ?').run(scan.user_id)
  db.prepare('DELETE FROM users WHERE id = ?').run(scan.user_id)

  return c.json({ ok: true })
})

app.get('/api/public/:slug', (c) => {
  const slug = c.req.param('slug')
  const user = db
    .prepare('SELECT * FROM users WHERE public_slug = ? AND share_enabled = 1')
    .get(slug) as
    | { id: string; display_name: string; username: string; profile_image_url: string | null }
    | undefined
  if (!user) return c.json({ error: 'not found' }, 404)
  const scan = db
    .prepare(
      `SELECT id, archetype, archetype_description, archetype_confidence, post_count, fit_json
       FROM scans
       WHERE user_id = ?
       ORDER BY started_at DESC
       LIMIT 1`
    )
    .get(user.id) as {
      id: string
      archetype: string
      archetype_description: string
      archetype_confidence: string
      post_count: number
      fit_json: string | null
    }
  if (!scan) return c.json({ error: 'no scan' }, 404)
  const rule = db
    .prepare('SELECT headline FROM findings WHERE scan_id = ? ORDER BY RANDOM() LIMIT 1')
    .get(scan.id) as { headline: string } | undefined
  return c.json({
    displayName: user.display_name,
    username: user.username,
    profileImageUrl: user.profile_image_url,
    archetype: scan.archetype,
    archetypeDescription: scan.archetype_description,
    archetypeConfidence: scan.archetype_confidence,
    postCount: scan.post_count,
    fit: scan.fit_json ? JSON.parse(scan.fit_json) : {},
    rule: rule?.headline,
  })
})

serve({
  fetch: app.fetch,
  port: config.port,
})

console.log(`ForYou Playbook API running on http://localhost:${config.port}`)
