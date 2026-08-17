import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { config } from './config.js'
import { db } from './db.js'
import { auth } from './auth.js'
import { scanBudget } from './budget.js'

// Keep card images next to the sqlite file so they live on the persistent
// volume in production (/app/data) instead of the ephemeral container fs.
const cardsDir = join(dirname(resolve(config.databaseUrl)), 'cards')
if (!existsSync(cardsDir)) mkdirSync(cardsDir, { recursive: true })

const app = new Hono()

// Behind Railway's proxy TLS terminates at the edge, so c.req.url says http;
// trust x-forwarded-proto so share/OG links don't point at http://.
function requestOrigin(c: { req: { url: string; header: (name: string) => string | undefined } }): string {
  const url = new URL(c.req.url)
  const proto = c.req.header('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.replace(':', '')
  return `${proto}://${url.host}`
}

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

function buildPlaybookResponse(scan: { id: string; user_id: string }) {
  const user = db
    .prepare('SELECT username, display_name, profile_image_url FROM users WHERE id = ?')
    .get(scan.user_id) as
    | { username: string; display_name: string | null; profile_image_url: string | null }
    | undefined
  const findings = db
    .prepare('SELECT * FROM findings WHERE scan_id = ?')
    .all(scan.id) as Array<Record<string, unknown> & { evidence_json: string | null }>
  const moves = db
    .prepare('SELECT * FROM moves WHERE scan_id = ? ORDER BY move_type')
    .all(scan.id) as Array<Record<string, unknown> & { evidence_json: string | null }>
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
  return {
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
  }
}

app.get('/api/playbook/:scanId', (c) => {
  const scanId = c.req.param('scanId')
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId) as
    | { id: string; user_id: string }
    | undefined
  if (!scan) return c.json({ error: 'not found' }, 404)
  return c.json(buildPlaybookResponse(scan))
})

app.get('/api/playbook/user/:username', (c) => {
  const username = c.req.param('username')
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as
    | { id: string }
    | undefined
  if (!user) return c.json({ error: 'not found' }, 404)
  const scan = db
    .prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY started_at DESC LIMIT 1')
    .get(user.id) as { id: string; user_id: string } | undefined
  if (!scan) return c.json({ error: 'not found' }, 404)
  return c.json(buildPlaybookResponse(scan))
})

app.post('/api/share', async (c) => {
  const body = (await c.req.json()) as { scanId: string; shareEnabled: boolean; image: string }
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
  if (body.image) {
    const base64 = body.image.replace(/^data:image\/png;base64,/, '')
    const buf = Buffer.from(base64, 'base64')
    writeFileSync(join(cardsDir, `${user.username}.png`), buf)
  }
  const origin = requestOrigin(c)
  const shareUrl = `${origin}/c/${user.username}`
  const imageUrl = `${origin}/card/${user.username}.png`
  const publicUrl = `${config.frontendUrl}/?p=${user.username}`
  return c.json({ shareUrl, imageUrl, publicUrl })
})

// Hono treats ":username.png" as a param literally named "username.png",
// so match the whole filename and validate it (also blocks path traversal).
app.get('/card/:file', async (c) => {
  const fileName = c.req.param('file')
  if (!/^[A-Za-z0-9_]{1,30}\.png$/.test(fileName)) return c.json({ error: 'not found' }, 404)
  const file = join(cardsDir, fileName)
  if (!existsSync(file)) return c.json({ error: 'not found' }, 404)
  const buf = readFileSync(file)
  c.header('Content-Type', 'image/png')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(buf)
})

app.get('/c/:username', async (c) => {
  const username = c.req.param('username')
  const user = db
    .prepare('SELECT username, display_name FROM users WHERE username = ? AND share_enabled = 1')
    .get(username) as { username: string; display_name: string } | undefined
  if (!user) return c.text('not found', 404)
  const origin = requestOrigin(c)
  const imageUrl = `${origin}/card/${username}.png`
  const publicUrl = `${config.frontendUrl}/?p=${username}`
  const displayName = user.display_name || user.username
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:title" content="ForYou Playbook for @${username}">
<meta property="og:description" content="See how the X For You algorithm works for ${displayName}.">
<meta property="og:image" content="${imageUrl}">
<meta property="og:url" content="${publicUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ForYou Playbook for @${username}">
<meta name="twitter:description" content="See how the X For You algorithm works for ${displayName}.">
<meta name="twitter:image" content="${imageUrl}">
<title>ForYou Playbook for @${username}</title>
<script>window.location.replace("${publicUrl}")</script>
</head>
<body>
<p>ForYou Playbook for @${username}</p>
<p><a href="${publicUrl}">Open scorecard</a></p>
</body>
</html>`
  return c.html(html)
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
