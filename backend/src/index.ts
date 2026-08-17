import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { config } from './config.js'
import { db } from './db.js'
import { auth } from './auth.js'
import { scanBudget } from './budget.js'
import { generateCardPng } from './card.js'
import { isReauthorize, postScorecard } from './post.js'

// Keep card images next to the sqlite file so they live on the persistent
// volume in production (/app/data) instead of the ephemeral container fs.
const cardsDir = join(dirname(resolve(config.databaseUrl)), 'cards')
if (!existsSync(cardsDir)) mkdirSync(cardsDir, { recursive: true })

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

// Enable sharing, render the card server-side (browser captures were at the
// mercy of CORS), persist it, and return everything both share flows need.
async function prepareShare(scanId: string): Promise<{
  userId: string
  username: string
  archetype: string
  shareUrl: string
  imageUrl: string
  publicUrl: string
  png: Buffer | null
} | null> {
  const scan = db
    .prepare('SELECT user_id, archetype, archetype_confidence, post_count, fit_json FROM scans WHERE id = ?')
    .get(scanId) as
    | {
        user_id: string
        archetype: string | null
        archetype_confidence: string | null
        post_count: number
        fit_json: string | null
      }
    | undefined
  if (!scan) return null
  const user = db
    .prepare('SELECT username, display_name, profile_image_url FROM users WHERE id = ?')
    .get(scan.user_id) as {
    username: string
    display_name: string | null
    profile_image_url: string | null
  }
  db.prepare('UPDATE users SET share_enabled = 1, public_slug = ? WHERE id = ?').run(
    user.username,
    scan.user_id
  )
  let png: Buffer | null = null
  try {
    png = await generateCardPng({
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.profile_image_url,
      archetype: scan.archetype || 'Your ForYou scorecard',
      confidence: scan.archetype_confidence || 'medium',
      postCount: scan.post_count,
      fit: scan.fit_json ? JSON.parse(scan.fit_json) : {},
    })
    writeFileSync(join(cardsDir, `${user.username}.png`), png)
  } catch (e) {
    console.error('card generation failed', e)
  }
  // ?v= keeps every share a URL X has never scraped (its per-URL card cache
  // pins whatever it saw first, including past broken states).
  return {
    userId: scan.user_id,
    username: user.username,
    archetype: scan.archetype || 'my ForYou scorecard',
    shareUrl: `${config.frontendUrl}/s/${user.username}?v=${Date.now().toString(36)}`,
    imageUrl: `${config.frontendUrl}/card/${user.username}.png`,
    publicUrl: `${config.frontendUrl}/?p=${user.username}`,
  png,
  }
}

app.post('/api/share', async (c) => {
  const body = (await c.req.json()) as { scanId: string }
  const share = await prepareShare(body.scanId)
  if (!share) return c.json({ error: 'not found' }, 404)
  const { shareUrl, imageUrl, publicUrl } = share
  return c.json({ shareUrl, imageUrl, publicUrl })
})

// Post the tweet on the user's behalf with the card attached as real media —
// X suppresses link-preview cards for young domains, so a preview can't be
// relied on. Requires the tweet.write/media.write scopes.
app.post('/api/post-share', async (c) => {
  const body = (await c.req.json()) as { scanId: string; text?: string }
  const share = await prepareShare(body.scanId)
  if (!share) return c.json({ error: 'not found' }, 404)
  if (!share.png) return c.json({ error: 'card generation failed' }, 500)
  // The user stages and edits the text in the app before posting.
  const text =
    typeof body.text === 'string' && body.text.trim()
      ? body.text.trim().slice(0, 1000)
      : `apparently my X archetype is ${share.archetype}\n\n${share.shareUrl}`
  try {
    const { tweetId } = await postScorecard(share.userId, text, share.png)
    return c.json({
      tweetUrl: `https://x.com/${share.username}/status/${tweetId}`,
      shareUrl: share.shareUrl,
    })
  } catch (e) {
    if (isReauthorize(e)) return c.json({ error: 'reauthorize' }, 403)
    console.error('post-share failed', e)
    return c.json({ error: 'post failed' }, 502)
  }
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

// Read width/height from a PNG's IHDR chunk so the card page can declare
// og:image dimensions (X renders large cards more reliably with them).
function pngSize(file: string): { width: number; height: number } | null {
  try {
    const buf = readFileSync(file)
    if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return null
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  } catch {
    return null
  }
}

function ogPage(username: string): string | null {
  const user = db
    .prepare('SELECT username, display_name FROM users WHERE username = ? AND share_enabled = 1')
    .get(username) as { username: string; display_name: string } | undefined
  if (!user) return null
  const imageUrl = `${config.frontendUrl}/card/${username}.png`
  const publicUrl = `${config.frontendUrl}/?p=${username}`
  // Canonical must be a page WITH card tags: scrapers that follow og:url
  // would otherwise re-scrape the SPA, which has none.
  const selfUrl = `${config.frontendUrl}/s/${username}`
  const dims = pngSize(join(cardsDir, `${username}.png`))
  const displayName = user.display_name || user.username
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ForYou Playbook">
<meta property="og:title" content="ForYou Playbook for @${username}">
<meta property="og:description" content="See how the X For You algorithm works for ${displayName}.">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:type" content="image/png">
${dims ? `<meta property="og:image:width" content="${dims.width}">\n<meta property="og:image:height" content="${dims.height}">` : ''}
<meta property="og:url" content="${selfUrl}">
<link rel="canonical" href="${selfUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ForYou Playbook for @${username}">
<meta name="twitter:description" content="See how the X For You algorithm works for ${displayName}.">
<meta name="twitter:image" content="${imageUrl}">
<meta name="twitter:image:alt" content="@${username}'s ForYou scorecard with letter grades">
<title>ForYou Playbook for @${username}</title>
<style>
  body { margin: 0; background: #050505; font-family: 'Helvetica Neue', Arial, sans-serif;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  .wrap { max-width: 720px; width: 100%; text-align: center; }
  img.card { width: 100%; height: auto; border: 1px solid #050505; border-radius: 16px; box-shadow: 6px 6px 0 rgba(255,255,255,0.45); }
  a.open { display: inline-block; margin-top: 28px; font-family: ui-monospace, monospace; font-size: 13px;
           letter-spacing: 0.1em; text-transform: uppercase; color: #050505; background: #ffffff;
           border: 1px solid rgba(255,255,255,0.6); border-radius: 8px; padding: 13px 22px;
           text-decoration: none; box-shadow: 3px 3px 0 rgba(255,255,255,0.45); }
</style>
</head>
<body>
<div class="wrap">
  <img class="card" src="${imageUrl}" alt="@${username}'s ForYou scorecard">
  <br>
  <a class="open" href="${publicUrl}">Open the full scorecard</a>
</div>
</body>
</html>`
  return html
}

// The share URL: foryouplaybook.com/s/username. Plain path on purpose —
// t.co and crawlers percent-encode "@" in paths, which broke rewrite matching.
app.get('/s/:username', (c) => {
  const html = ogPage(c.req.param('username'))
  if (!html) return c.text('not found', 404)
  return c.html(html)
})

// Older shared links used /@username; keep serving the literal form.
app.get('/:handle{@[A-Za-z0-9_]{1,15}}', (c) => {
  const html = ogPage(c.req.param('handle').slice(1))
  if (!html) return c.text('not found', 404)
  return c.html(html)
})

// Older shared links used /c/username; keep serving them.
app.get('/c/:username', (c) => {
  const html = ogPage(c.req.param('username'))
  if (!html) return c.text('not found', 404)
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
