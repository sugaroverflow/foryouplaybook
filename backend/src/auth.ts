import { Hono } from 'hono'
import { randomBytes, createHash } from 'node:crypto'
import { config } from './config.js'
import { db } from './db.js'
import { encrypt } from './crypto.js'
import { startScan } from './scan.js'

const auth = new Hono()

function base64url(bytes: Buffer): string {
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function randomId(len = 32): string {
  return base64url(randomBytes(len))
}

function sha256Base64url(s: string): string {
  return base64url(createHash('sha256').update(s).digest())
}

auth.get('/start', (c) => {
  const codeVerifier = randomId(32)
  const state = randomId(16)
  const codeChallenge = sha256Base64url(codeVerifier)
  db.prepare('INSERT INTO oauth_states (state, code_verifier, created_at) VALUES (?, ?, ?)').run(
    state,
    codeVerifier,
    Date.now()
  )

  const url = new URL('https://x.com/i/oauth2/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', config.xClientId)
  url.searchParams.set('redirect_uri', config.xRedirectUri)
  url.searchParams.set('scope', 'tweet.read users.read offline.access')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return c.redirect(url.toString())
})

auth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (!code || !state) return c.text('missing code or state', 400)

  const row = db.prepare('SELECT code_verifier FROM oauth_states WHERE state = ?').get(state) as
    | { code_verifier: string }
    | undefined
  if (!row) return c.text('invalid or expired state', 400)
  db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state)

  const basic = Buffer.from(`${config.xClientId}:${config.xClientSecret}`).toString('base64')
  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.xRedirectUri,
      code_verifier: row.code_verifier,
    }).toString(),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('X token exchange failed', tokenRes.status, err)
    return c.text(`X token exchange failed: ${tokenRes.status}`, 502)
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string
    refresh_token?: string
    scope: string
    token_type: string
  }

  const meRes = await fetch(
    'https://api.x.com/2/users/me?user.fields=public_metrics,profile_image_url',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  if (!meRes.ok) {
    const err = await meRes.text()
    console.error('X users/me failed', meRes.status, err)
    return c.text(`X users/me failed: ${meRes.status}`, 502)
  }

  const me = (await meRes.json()) as {
    data: {
      id: string
      username: string
      name: string
      profile_image_url?: string
      public_metrics?: { followers_count?: number }
    }
  }
  const u = me.data
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO users (id, x_user_id, username, display_name, profile_image_url, follower_count, oauth_token_encrypted, oauth_refresh_token_encrypted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(x_user_id) DO UPDATE SET
       display_name = excluded.display_name,
       profile_image_url = excluded.profile_image_url,
       follower_count = excluded.follower_count,
       oauth_token_encrypted = excluded.oauth_token_encrypted,
       oauth_refresh_token_encrypted = excluded.oauth_refresh_token_encrypted`
  ).run(
    randomId(16),
    u.id,
    u.username,
    u.name,
    u.profile_image_url || null,
    u.public_metrics?.followers_count || 0,
    encrypt(tokens.access_token),
    tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    now
  )

  const user = db.prepare('SELECT id FROM users WHERE x_user_id = ?').get(u.id) as { id: string }
  const scanId = randomId(16)
  db.prepare(
    'INSERT INTO scans (id, user_id, status, stage, started_at) VALUES (?, ?, ?, ?, ?)'
  ).run(scanId, user.id, 'running', 'fetching_posts', now)

  // Run the scan in the background; the frontend will poll for status.
  startScan({ scanId, userId: user.id, accessToken: tokens.access_token })

  return c.redirect(`${config.frontendUrl}/?scan=${scanId}`)
})

export { auth }
