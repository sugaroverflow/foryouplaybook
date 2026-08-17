import { config } from './config.js'
import { db } from './db.js'
import { decrypt, encrypt } from './crypto.js'

class ReauthorizeError extends Error {}
export function isReauthorize(e: unknown): boolean {
  return e instanceof ReauthorizeError
}

type TokenRow = {
  oauth_token_encrypted: string
  oauth_refresh_token_encrypted: string | null
}

function loadTokens(userId: string): TokenRow {
  const row = db
    .prepare('SELECT oauth_token_encrypted, oauth_refresh_token_encrypted FROM users WHERE id = ?')
    .get(userId) as TokenRow | undefined
  if (!row) throw new ReauthorizeError('no tokens')
  return row
}

// X OAuth2 access tokens expire after ~2h; refresh tokens rotate on use.
async function refreshAccessToken(userId: string): Promise<string> {
  const row = loadTokens(userId)
  if (!row.oauth_refresh_token_encrypted) throw new ReauthorizeError('no refresh token')
  const basic = Buffer.from(`${config.xClientId}:${config.xClientSecret}`).toString('base64')
  const res = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decrypt(row.oauth_refresh_token_encrypted),
      client_id: config.xClientId,
    }).toString(),
  })
  if (!res.ok) {
    console.error('token refresh failed', res.status, await res.text())
    throw new ReauthorizeError('refresh failed')
  }
  const tokens = (await res.json()) as { access_token: string; refresh_token?: string }
  db.prepare(
    'UPDATE users SET oauth_token_encrypted = ?, oauth_refresh_token_encrypted = ? WHERE id = ?'
  ).run(
    encrypt(tokens.access_token),
    tokens.refresh_token ? encrypt(tokens.refresh_token) : row.oauth_refresh_token_encrypted,
    userId
  )
  return tokens.access_token
}

async function uploadMedia(accessToken: string, png: Buffer): Promise<string> {
  const form = new FormData()
  form.append('media', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'scorecard.png')
  form.append('media_category', 'tweet_image')
  const res = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (res.status === 401) throw new ReauthorizeError('unauthorized')
  if (res.status === 403) throw new ReauthorizeError('missing media.write scope')
  if (!res.ok) {
    const err = await res.text()
    console.error('media upload failed', res.status, err)
    throw new Error(`media upload failed: ${res.status}`)
  }
  const j = (await res.json()) as { data?: { id?: string }; media_id_string?: string }
  const id = j.data?.id || j.media_id_string
  if (!id) throw new Error('media upload returned no id')
  return id
}

async function createTweet(accessToken: string, text: string, mediaId: string): Promise<string> {
  const res = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, media: { media_ids: [mediaId] } }),
  })
  if (res.status === 401) throw new ReauthorizeError('unauthorized')
  if (res.status === 403) throw new ReauthorizeError('missing tweet.write scope')
  if (!res.ok) {
    const err = await res.text()
    console.error('tweet create failed', res.status, err)
    throw new Error(`tweet create failed: ${res.status}`)
  }
  const j = (await res.json()) as { data?: { id?: string } }
  if (!j.data?.id) throw new Error('tweet create returned no id')
  return j.data.id
}

// Post the scorecard tweet on the user's behalf. Tries the stored access
// token first; on expiry, refreshes once and retries. Scope problems and
// dead refresh tokens surface as ReauthorizeError so the frontend can
// re-run the OAuth popup.
export async function postScorecard(
  userId: string,
  text: string,
  png: Buffer
): Promise<{ tweetId: string }> {
  let accessToken = decrypt(loadTokens(userId).oauth_token_encrypted)
  const attempt = async (token: string) => {
    const mediaId = await uploadMedia(token, png)
    const tweetId = await createTweet(token, text, mediaId)
    return { tweetId }
  }
  try {
    return await attempt(accessToken)
  } catch (e) {
    if (!(e instanceof ReauthorizeError) || e.message !== 'unauthorized') throw e
    accessToken = await refreshAccessToken(userId)
    return await attempt(accessToken)
  }
}
