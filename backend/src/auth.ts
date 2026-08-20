import { Hono } from 'hono'
import { randomBytes, createHash } from 'node:crypto'
import { config } from './config.js'
import { db } from './db.js'
import { encrypt } from './crypto.js'
import { monthStartIso, scanBudget } from './budget.js'
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

// The callback runs inside the auth popup. When an opener exists we hand the
// result back via postMessage and close; otherwise (popup blocked, full-page
// fallback) we redirect like before.
function popupClosePage(payload: { scanId?: string; error?: string }, fallbackUrl: string): string {
  const escape = (s: string) => s.replace(/</g, '\\u003c')
  const message = escape(JSON.stringify({ type: 'foryouplaybook:auth', ...payload }))
  const targetOrigin = JSON.stringify(new URL(config.frontendUrl).origin)
  const fallback = escape(JSON.stringify(fallbackUrl))
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>ForYou Playbook</title></head>
  <body style="font-family: ui-monospace, monospace; background: #f4f4f2; color: #050505; padding: 32px;">
    <p>Finishing up… you can close this window.</p>
    <p><a href="${fallbackUrl}">Continue to ForYou Playbook</a></p>
    <script>
      (function () {
        var payload = ${message};
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, ${targetOrigin});
          window.close();
        } else {
          window.location.replace(${fallback});
        }
      })();
    </script>
  </body>
</html>`
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
  // Read-only scopes: the app never posts on the user's behalf.
  // Sharing is done via X Web Intent and a generated card image.
  url.searchParams.set('scope', 'tweet.read users.read offline.access')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return c.redirect(url.toString())
})

auth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (!code || !state) {
    return c.html(
      popupClosePage(
        { error: 'X authorization was cancelled or incomplete. Try again.' },
        config.frontendUrl
      ),
      400
    )
  }

  const row = db.prepare('SELECT code_verifier FROM oauth_states WHERE state = ?').get(state) as
    | { code_verifier: string }
    | undefined
  if (!row) {
    return c.html(
      popupClosePage({ error: 'That sign-in attempt expired. Try again.' }, config.frontendUrl),
      400
    )
  }
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
    return c.html(
      popupClosePage({ error: 'X sign-in could not be completed. Try again.' }, config.frontendUrl),
      502
    )
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
    return c.html(
      popupClosePage({ error: 'X would not share your profile. Try again.' }, config.frontendUrl),
      502
    )
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

  // One scan per user per month: re-scans re-read the same posts against the
  // same X quota, so hand back the existing scan instead of running a new one.
  const existing = db
    .prepare(
      `SELECT id FROM scans
       WHERE user_id = ? AND started_at >= ? AND status IN ('running', 'completed')
       ORDER BY started_at DESC
       LIMIT 1`
    )
    .get(user.id, monthStartIso()) as { id: string } | undefined
  if (existing) {
    return c.html(popupClosePage({ scanId: existing.id }, `${config.frontendUrl}/?scan=${existing.id}`))
  }

  if (scanBudget().remaining <= 0) {
    return c.html(
      popupClosePage(
        { error: "This month's scan budget is used up. Come back after it resets." },
        config.frontendUrl
      ),
      429
    )
  }

  const scanId = randomId(16)
  db.prepare(
    'INSERT INTO scans (id, user_id, status, stage, started_at) VALUES (?, ?, ?, ?, ?)'
  ).run(scanId, user.id, 'running', 'fetching_posts', now)

  // Run the scan in the background; the frontend will poll for status.
  startScan({ scanId, userId: user.id, accessToken: tokens.access_token })

  return c.html(popupClosePage({ scanId }, `${config.frontendUrl}/?scan=${scanId}`))
})

export { auth }
