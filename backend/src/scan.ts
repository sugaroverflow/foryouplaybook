import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { fetchTimeline } from './xapi.js'

export interface StartScanInput {
  scanId: string
  userId: string
  accessToken: string
}

function setStage(scanId: string, stage: string, status: string = 'running') {
  const completedAt = status === 'completed' ? new Date().toISOString() : null
  db.prepare('UPDATE scans SET stage = ?, status = ?, completed_at = ? WHERE id = ?').run(
    stage,
    status,
    completedAt,
    scanId
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function persistPosts(scanId: string, userId: string, posts: Awaited<ReturnType<typeof fetchTimeline>>) {
  const now = new Date().toISOString()
  const insertPost = db.prepare(
    `INSERT OR IGNORE INTO posts (id, user_id, x_post_id, text, post_type, created_at, has_url, conversation_id, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertMetrics = db.prepare(
    `INSERT OR IGNORE INTO metric_snapshots (id, post_id, captured_at, impressions, likes, replies, reposts, quotes, bookmarks, engagements, profile_clicks, url_clicks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const p of posts) {
    const postDbId = randomUUID()
    const text = p.note_tweet?.text || p.text || ''
    insertPost.run(
      postDbId,
      userId,
      p.id,
      text,
      p._type,
      p.created_at,
      text.includes('http') ? 1 : 0,
      p.conversation_id || null,
      now
    )
    const pm = p.public_metrics || {}
    const npm = p.non_public_metrics || {}
    insertMetrics.run(
      randomUUID(),
      postDbId,
      now,
      npm.impressions ?? null,
      pm.likes ?? npm.likes ?? 0,
      pm.replies ?? npm.replies ?? 0,
      pm.reposts ?? npm.retweets ?? npm.reposts ?? 0,
      pm.quotes ?? npm.quotes ?? 0,
      pm.bookmarks ?? npm.bookmarks ?? 0,
      npm.engagements ?? null,
      npm.profile_clicks ?? null,
      npm.url_clicks ?? null
    )
  }

  db.prepare('UPDATE scans SET post_count = ? WHERE id = ?').run(posts.length, scanId)
}

export function startScan(input: StartScanInput) {
  // Fire and forget so the HTTP response can return immediately.
  Promise.resolve().then(async () => {
    try {
      const user = db.prepare('SELECT x_user_id FROM users WHERE id = ?').get(input.userId) as {
        x_user_id: string
      }

      setStage(input.scanId, 'fetching_posts')
      const posts = await fetchTimeline(user.x_user_id, input.accessToken)
      await persistPosts(input.scanId, input.userId, posts)

      setStage(input.scanId, 'normalizing_metrics')
      await delay(500)

      setStage(input.scanId, 'extracting_patterns')
      // TODO: LLM content feature extraction
      await delay(500)

      setStage(input.scanId, 'testing_hypotheses')
      // TODO: detect winners/underperformers/contrasts
      await delay(500)

      setStage(input.scanId, 'building_moves')
      // TODO: generate five moves
      await delay(500)

      setStage(input.scanId, 'rendering_playbook')
      // TODO: persist findings, archetype, moves
      await delay(500)

      setStage(input.scanId, 'completed', 'completed')
    } catch (err) {
      console.error('scan failed', input.scanId, err)
      db.prepare('UPDATE scans SET status = ?, stage = ? WHERE id = ?').run('failed', 'error', input.scanId)
    }
  })
}
