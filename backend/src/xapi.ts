import { config } from './config.js'

export interface FetchedPost {
  id: string
  text: string
  created_at: string
  _type: 'original' | 'quote' | 'reply' | 'repost'
  public_metrics?: Record<string, number>
  non_public_metrics?: Record<string, number>
  referenced_tweets?: Array<{ type: string; id: string }>
  conversation_id?: string
  entities?: unknown
  lang?: string
  note_tweet?: { text: string }
  attachments?: { media_keys?: string[] }
}

export async function fetchTimeline(xUserId: string, accessToken: string): Promise<FetchedPost[]> {
  const tweets: FetchedPost[] = []
  let nextToken: string | null = null
  let count = 0
  const maxPages = 4 // soft cap at ~400 posts

  const baseParams = new URLSearchParams({
    start_time: new Date(config.currentRegimeStart).toISOString().replace(/\.\d+Z$/, 'Z'),
    max_results: '100',
    'tweet.fields': 'created_at,public_metrics,non_public_metrics,referenced_tweets,conversation_id,entities,lang,note_tweet',
    expansions: 'attachments.media_keys',
    'media.fields': 'type,url,alt_text',
  })

  do {
    const url = new URL(`https://api.x.com/2/users/${xUserId}/tweets`)
    for (const [k, v] of baseParams) url.searchParams.set(k, v)
    if (nextToken) url.searchParams.set('pagination_token', nextToken)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`X timeline fetch failed: ${res.status} ${text}`)
    }

    const json = (await res.json()) as {
      data?: FetchedPost[]
      meta?: { next_token?: string }
    }

    if (json.data) {
      for (const t of json.data) {
        const refs = t.referenced_tweets
        let type: FetchedPost['_type'] = 'original'
        if (refs) {
          if (refs.some((r) => r.type === 'retweeted')) type = 'repost'
          else if (refs.some((r) => r.type === 'quoted')) type = 'quote'
          else if (refs.some((r) => r.type === 'replied_to')) type = 'reply'
        }
        tweets.push({ ...t, _type: type })
      }
      count += json.data.length
    }

    nextToken = json.meta?.next_token || null
  } while (nextToken && count < 400)

  return tweets
}
