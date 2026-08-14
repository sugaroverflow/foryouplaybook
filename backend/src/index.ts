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

serve({
  fetch: app.fetch,
  port: config.port,
})

console.log(`ForYou Playbook API running on http://localhost:${config.port}`)
