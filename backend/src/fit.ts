export interface FitResult {
  conversation: { grade: string; confidence: 'High' | 'Medium' | 'Low' }
  travels: { grade: string; confidence: 'High' | 'Medium' | 'Low' }
  curiosity: { grade: string; confidence: 'High' | 'Medium' | 'Low' }
  reach: { grade: string; confidence: 'High' | 'Medium' | 'Low' }
  momentum: { grade: string; confidence: 'High' | 'Medium' | 'Low' }
}

function confidence(n: number): 'High' | 'Medium' | 'Low' {
  if (n >= 15) return 'High'
  if (n >= 8) return 'Medium'
  return 'Low'
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function toPerK(n: number, impressions: number): number {
  return impressions > 0 ? (n / impressions) * 1000 : 0
}

function gradeFromRate(rate: number, thresholds: number[], tiny: boolean): string {
  // For tiny samples, soften extreme grades one step toward C.
  let g = 'F'
  if (rate >= thresholds[0]) g = 'A'
  else if (rate >= thresholds[1]) g = 'B'
  else if (rate >= thresholds[2]) g = 'C'
  else if (rate >= thresholds[3]) g = 'D'

  if (tiny) {
    const soften: Record<string, string> = { A: 'B', B: 'C', F: 'D', D: 'C', C: 'C' }
    g = soften[g] || g
  }
  return g
}

export interface PostWithMetrics {
  id: string
  text: string
  x_post_id: string
  post_type: string
  created_at: string
  has_url: number
  media_type: string | null
  conversation_id: string | null
  likes: number
  replies: number
  reposts: number
  quotes: number
  bookmarks: number
  impressions: number | null
  engagements: number | null
  profile_clicks: number | null
  url_clicks: number | null
}

export function computeFit(posts: PostWithMetrics[]): FitResult {
  const postRates = posts
    .map((p) => {
      const imp = p.impressions ?? 0
      if (imp === 0) return null
      return {
        reply: toPerK(p.replies, imp),
        quote: toPerK(p.quotes, imp),
        repost: toPerK(p.reposts, imp),
        bookmark: toPerK(p.bookmarks, imp),
        profileClick: toPerK(p.profile_clicks ?? 0, imp),
        urlClick: toPerK(p.url_clicks ?? 0, imp),
        engagement: toPerK(p.engagements ?? 0, imp),
        impressions: imp,
        createdAt: new Date(p.created_at).getTime(),
      }
    })
    .filter(Boolean) as { reply: number; quote: number; repost: number; bookmark: number; profileClick: number; urlClick: number; engagement: number; impressions: number; createdAt: number }[]

  if (postRates.length === 0) {
    return {
      conversation: { grade: 'C', confidence: 'Low' },
      travels: { grade: 'C', confidence: 'Low' },
      curiosity: { grade: 'C', confidence: 'Low' },
      reach: { grade: 'C', confidence: 'Low' },
      momentum: { grade: 'C', confidence: 'Low' },
    }
  }

  const tiny = posts.length < 8
  const conf = confidence(posts.length)

  const replyRate = median(postRates.map((r) => r.reply))
  const quoteRate = median(postRates.map((r) => r.quote))
  const conversationRate = (replyRate + quoteRate) / 2

  const repostRate = median(postRates.map((r) => r.repost))
  const bookmarkRate = median(postRates.map((r) => r.bookmark))
  const travelsRate = (repostRate + bookmarkRate) / 2

  const profileClickRate = median(postRates.map((r) => r.profileClick))
  const urlClickRate = median(postRates.map((r) => r.urlClick))
  const engagementRate = median(postRates.map((r) => r.engagement))
  const curiosityRate = (profileClickRate + urlClickRate + engagementRate) / 3

  const reachImp = median(postRates.map((r) => r.impressions))
  const reachRate = reachImp / 1000

  const sorted = [...postRates].sort((a, b) => a.createdAt - b.createdAt)
  const half = Math.max(1, Math.ceil(sorted.length / 2))
  const older = sorted.slice(0, sorted.length - half)
  const recent = sorted.slice(-half)
  const olderImp = older.length ? median(older.map((r) => r.impressions)) : reachImp
  const recentImp = median(recent.map((r) => r.impressions))
  const momentumRatio = olderImp > 0 ? recentImp / olderImp : 1

  return {
    conversation: {
      grade: gradeFromRate(conversationRate, [8, 4, 1.5, 0.5], tiny),
      confidence: conf,
    },
    travels: {
      grade: gradeFromRate(travelsRate, [6, 3, 1, 0.3], tiny),
      confidence: conf,
    },
    curiosity: {
      grade: gradeFromRate(curiosityRate, [10, 5, 2, 0.8], tiny),
      confidence: conf,
    },
    reach: {
      grade: gradeFromRate(reachRate, [5, 2, 1, 0.3], tiny),
      confidence: conf,
    },
    momentum: {
      grade: gradeFromRate(momentumRatio, [2, 1.5, 1, 0.7], tiny),
      confidence: conf,
    },
  }
}
