import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { db } from './db.js'
import { auth } from './auth.js'

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

app.get('/api/scans/:id', (c) => {
  const id = c.req.param('id')
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(id)
  if (!scan) return c.json({ error: 'not found' }, 404)
  return c.json(scan)
})

app.get('/api/playbook/:scanId', (c) => {
  const scanId = c.req.param('scanId')
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId)
  if (!scan) return c.json({ error: 'not found' }, 404)
  const findings = db.prepare('SELECT * FROM findings WHERE scan_id = ?').all(scanId)
  const moves = db.prepare('SELECT * FROM moves WHERE scan_id = ? ORDER BY move_type').all(scanId)
  return c.json({ scan, findings, moves })
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
    .get(slug) as { id: string; display_name: string; username: string } | undefined
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
    archetype: scan.archetype,
    archetypeDescription: scan.archetype_description,
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
