import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'
import { CardAvatar } from './components/Avatar'
import { GradeRail, GradeStamp, overallGrade, type FitValue } from './components/Grades'
import { EvidenceTweet, type Author, type EvidencePost } from './components/EvidenceTweet'

const MOVE_TONE: Record<string, 'good' | 'bad'> = {
  rewrite: 'bad',
  change: 'bad',
  double_down: 'good',
  go_talk: 'good',
  experiment: 'good',
}

// Bad-tone moves lead: fix what's sinking before leaning into what works.
const MOVE_ORDER: Record<string, number> = {
  change: 0,
  rewrite: 1,
  double_down: 2,
  go_talk: 3,
  experiment: 4,
}

type Finding = {
  id: string
  headline: string
  explanation: string
  confidence: string
  evidence_posts: EvidencePost[]
}

type Move = {
  id: string
  move_type: string
  title: string
  body: string
  rewrite_text: string | null
  evidence_posts: EvidencePost[]
}

type Post = {
  id: string
  x_post_id: string
  text: string
  post_type: string
  created_at: string
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

type PlaybookData = {
  scan: {
    id: string
    archetype: string
    archetype_description: string
    archetype_confidence: string
    post_count: number
    fit_json: string | null
    completed_at: string | null
  }
  author: Author | null
  findings: Finding[]
  moves: Move[]
  posts: Post[]
}

type Tab = 'review' | 'actions' | 'playground'

const TONE_COLOR: Record<string, string> = { good: '#0c6434', bad: '#c22a2a' }
const CONF_COLOR: Record<string, string> = {
  high: '#0c6434',
  medium: '#a16207',
  low: '#c22a2a',
}

// Engagement multipliers from the open-source X heavy-ranker snapshot —
// the same numbers Nader's weight bars visualize.
const RULEBOOK_WEIGHTS = [
  { label: 'You reply to a reply', value: 75 },
  { label: 'Reply', value: 13.5 },
  { label: 'Profile click', value: 12 },
  { label: 'Repost', value: 1 },
  { label: 'Like', value: 0.5 },
  { label: 'Report', value: -369 },
]

function Rulebook() {
  return (
    <div className="rulebook">
      <span className="tag">The rulebook · what one action is worth to the ranker</span>
      {RULEBOOK_WEIGHTS.map((w) => (
        <div className="rulebook-row" key={w.label}>
          <span>{w.label}</span>
          <div className="rulebook-bar">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, (Math.abs(w.value) / 75) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', background: w.value >= 0 ? '#3ecf70' : '#e5484d' }}
            />
          </div>
          <span className="rulebook-value">{w.value}×</span>
        </div>
      ))}
    </div>
  )
}

function exhibitLabel(index: number, total: number): string {
  if (total <= 1) return 'Exhibit · from your posts'
  return `Exhibit ${String.fromCharCode(65 + index)}`
}

function EvidenceList({ posts, author }: { posts: EvidencePost[]; author: Author | null }) {
  if (!author || posts.length === 0) return null
  return (
    <>
      {posts.slice(0, 2).map((p, i) => (
        <EvidenceTweet
          key={p.x_post_id}
          post={p}
          author={author}
          label={exhibitLabel(i, Math.min(posts.length, 2))}
        />
      ))}
    </>
  )
}

export function Playbook({
  scanId,
  username,
}: {
  scanId?: string
  username?: string
}) {
  const [data, setData] = useState<PlaybookData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('review')
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = scanId
      ? `${API_URL}/api/playbook/${scanId}`
      : `${API_URL}/api/playbook/user/${encodeURIComponent(username || '')}`
    fetch(url)
      .then(async (r) => {
        const d = (await r.json()) as { error?: string } & PlaybookData
        if (!r.ok) throw new Error(d.error || 'not found')
        setData(d)
        if (scanId && d.author?.username) {
          window.history.replaceState(null, '', `/?u=${encodeURIComponent(d.author.username)}`)
        }
      })
      .catch(() => setError('Could not load playbook.'))
  }, [scanId, username])

  if (error) {
    return (
      <Section theme="dark" eyebrow="Error">
        <Reveal>
          <div className="score-card playbook-card">
            <p className="lede">{error}</p>
          </div>
        </Reveal>
      </Section>
    )
  }

  if (!data) {
    return (
      <Section theme="dark" eyebrow="ForYou Playbook">
        <Reveal>
          <div className="score-card playbook-card">
            <h1 className="display">Loading your scorecard…</h1>
          </div>
        </Reveal>
      </Section>
    )
  }

  const fit = (data.scan.fit_json ? JSON.parse(data.scan.fit_json) : {}) as Record<string, FitValue>
  const overall = overallGrade(fit)
  const sortedMoves = [...data.moves].sort(
    (a, b) => (MOVE_ORDER[a.move_type] ?? 9) - (MOVE_ORDER[b.move_type] ?? 9)
  )
  const fixFirst = sortedMoves.filter((m) => MOVE_TONE[m.move_type] === 'bad')
  const leanIn = sortedMoves.filter((m) => MOVE_TONE[m.move_type] !== 'bad')
  const issuedDate = new Date(data.scan.completed_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Section id="top" theme="dark" eyebrow="Your ForYou scorecard">
      <Reveal>
        <div className="score-card playbook-card" ref={cardRef}>
          <div className="card-identity-row">
            {data.author && <CardAvatar author={data.author} size={96} />}
            <div className="card-identity-text">
              {data.author && <span className="card-handle">@{data.author.username}</span>}
              <span
                className="tag"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-on-light)',
                  display: 'block',
                  marginTop: 4,
                }}
              >
                {data.scan.post_count} posts studied · {data.scan.archetype_confidence} confidence
              </span>
            </div>
            {overall && <GradeStamp grade={overall} />}
          </div>

          <h1 className="display">{data.scan.archetype}</h1>
          <p className="lede" style={{ marginTop: 16 }}>
            {data.scan.archetype_description}
          </p>

          <hr className="card-rule" />

          <GradeRail fit={fit} />

          <hr className="card-rule" />

          <div className="playbook-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'review'}
              className={`playbook-tab ${tab === 'review' ? 'on' : ''}`}
              onClick={() => setTab('review')}
            >
              <span className="tab-kicker">What we found</span>
              <span>Review · {data.findings.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === 'actions'}
              className={`playbook-tab ${tab === 'actions' ? 'on' : ''}`}
              onClick={() => setTab('actions')}
            >
              <span className="tab-kicker">What to try</span>
              <span>Actions · {data.moves.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === 'playground'}
              className={`playbook-tab ${tab === 'playground' ? 'on' : ''}`}
              onClick={() => setTab('playground')}
            >
              <span className="tab-kicker">What if</span>
              <span>Playground · 5</span>
            </button>
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'review' && (
              <>
                <p className="panel-note">
                  Patterns from your last {data.scan.post_count} posts, receipts included
                </p>
                <Rulebook />
                {data.findings.map((f) => {
                  const confColor = CONF_COLOR[f.confidence?.toLowerCase()] || 'var(--ink)'
                  return (
                    <div
                      className="playbook-row"
                      key={f.id}
                      style={{ borderLeftColor: confColor }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <h3 className="cell-title" style={{ marginBottom: 0 }}>
                          {f.headline}
                        </h3>
                        <span className="conf-tag" style={{ color: confColor, borderColor: confColor }}>
                          {f.confidence} confidence
                        </span>
                      </div>
                      <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                        {f.explanation}
                      </p>
                      <EvidenceList posts={f.evidence_posts} author={data.author} />
                    </div>
                  )
                })}
              </>
            )}

            {tab === 'actions' && (
              <>
                <p className="panel-note">Five moves · fix first, then lean in</p>
                {fixFirst.length > 0 && <span className="group-label">Fix first</span>}
                {fixFirst.map((m) => (
                  <MoveRow key={m.id} move={m} author={data.author} />
                ))}
                {leanIn.length > 0 && <span className="group-label">Then lean in</span>}
                {leanIn.map((m) => (
                  <MoveRow key={m.id} move={m} author={data.author} />
                ))}
              </>
            )}

            {tab === 'playground' && (
              <>
                <p className="panel-note">
                  Pulled from{' '}
                  <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
                    Nader's Inside the For You
                  </a>{' '}
                  — drag the knobs to re-rank your top 5 posts. Each post starts with a small
                  baseline, then your real counts are multiplied by the weight.
                </p>
                <PostPlayground posts={data.posts} author={data.author} />
              </>
            )}
          </motion.div>

          <div className="card-stub">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <ShareSection scanId={data.scan.id} archetype={data.scan.archetype} />
              <DeleteSection scanId={data.scan.id} />
            </div>
            <p className="stub-meta">
              Issued {data.author ? `to @${data.author.username} ` : ''}
              {issuedDate} · {data.scan.post_count} posts · ForYouPlaybook
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              Delete wipes your posts and tokens for good.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

type SimAction = {
  id: string
  label: string
  weight: number
  metric: keyof Post | null
  metricScale?: number
}

const SIM_ACTIONS: SimAction[] = [
  { id: 'fav', label: 'Like', weight: 0.5, metric: 'likes' },
  { id: 'reply', label: 'Reply', weight: 5.0, metric: 'replies' },
  { id: 'repost', label: 'Repost', weight: 1.0, metric: 'reposts' },
  { id: 'quote', label: 'Quote', weight: 5.0, metric: 'quotes' },
  { id: 'share', label: 'Share', weight: 2.0, metric: 'bookmarks' },
  { id: 'copy_link', label: 'Copy the link', weight: 20.0, metric: 'url_clicks' },
  { id: 'follow', label: 'Follow the author', weight: 4.0, metric: 'profile_clicks' },
  { id: 'click', label: 'Open the post', weight: 0.4, metric: 'impressions', metricScale: 0.0001 },
  { id: 'video', label: 'Watch the video', weight: 0.05, metric: null },
  { id: 'not_interested', label: '"Not interested"', weight: -43.2, metric: null },
  { id: 'block', label: 'Block the author', weight: -31.2, metric: null },
  { id: 'mute', label: 'Mute the author', weight: -58.8, metric: null },
  { id: 'report', label: 'Report', weight: -234.0, metric: null },
]

function computeScore(post: Post, weights: Record<string, number>): number {
  return SIM_ACTIONS.reduce((sum, a) => {
    if (!a.metric) return sum
    const scale = a.metricScale ?? 1
    const raw = (post[a.metric] as number | null) ?? 0
    // Add a small baseline so every post responds to every knob, even when the count is zero.
    const count = raw * scale + 0.1
    return sum + count * (weights[a.id] ?? a.weight)
  }, 0)
}

const KNOBS = SIM_ACTIONS.filter((a) => a.metric)
const DEFAULT_WEIGHTS = Object.fromEntries(SIM_ACTIONS.map((a) => [a.id, a.weight]))

function PostPlayground({ posts, author }: { posts: Post[]; author: Author | null }) {
  const [weights, setWeights] = useState<Record<string, number>>(() => DEFAULT_WEIGHTS)

  const rankedPosts = useMemo(() => {
    const withScore = posts.map((p) => ({
      ...p,
      text: p.text || '(no text)',
      score: computeScore(p, weights),
    }))
    withScore.sort((a, b) => b.score - a.score)
    return withScore.slice(0, 5)
  }, [posts, weights])

  const maxScore = useMemo(() => {
    if (rankedPosts.length === 0) return 1
    return Math.max(...rankedPosts.map((p) => Math.abs(p.score))) || 1
  }, [rankedPosts])

  return (
    <div className="playground-panel">
      <div className="playground-knobs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span
            className="tag"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
          >
            The knobs
          </span>
          <button className="fx-btn" onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>
            Factory settings
          </button>
        </div>

        <div className="knob-list">
          {KNOBS.map((a) => (
            <div key={a.id} className="knob-row">
              <div className="knob-label-line">
                <span className="small" style={{ fontWeight: 500 }}>
                  {a.label}
                </span>
                <span className="small mono" style={{ opacity: 0.7 }}>
                  {weights[a.id] > 0 ? '+' : ''}
                  {Number(weights[a.id].toFixed(1))}
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={0.1}
                value={weights[a.id]}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [a.id]: Number(e.target.value) }))
                }
                style={{ width: '100%', accentColor: '#0f7b3e' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <span
          className="tag"
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
            display: 'block',
            marginBottom: 12,
          }}
        >
          Your feed, ranked
        </span>
        {rankedPosts.map((post, i) => (
          <RankedPost
            key={post.id}
            post={post}
            rank={i + 1}
            maxScore={maxScore}
            author={author ?? { username: 'unknown', displayName: 'Unknown', profileImageUrl: null }}
          />
        ))}
      </div>
    </div>
  )
}

type RankedPostData = Post & { score: number }

function RankedPost({
  post,
  rank,
  maxScore,
  author,
}: {
  post: RankedPostData
  rank: number
  maxScore: number
  author: Author
}) {
  const score = post.score
  const negative = score < 0
  const accent = negative ? '#e5484d' : '#3ecf70'
  const width = maxScore ? Math.min((Math.abs(score) / maxScore) * 100, 100) : 0

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="ranked-row"
      style={{ borderLeftColor: accent }}
    >
      <div className="ranked-top">
        <span className="ranked-rank">{rank}</span>
        {author.profileImageUrl ? (
          <img className="ranked-avatar" src={author.profileImageUrl} alt="" />
        ) : (
          <div className="ranked-avatar">{(author.displayName[0] || '?').toUpperCase()}</div>
        )}
        <span className="ranked-text">{post.text}</span>
        <span className="ranked-score" style={{ color: accent }}>
          {score > 0 ? '+' : ''}
          {Number(score.toFixed(1))}
        </span>
      </div>
      <div className="ranked-bar">
        <motion.div
          animate={{ width: `${width}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ height: '100%', background: accent }}
        />
      </div>
    </motion.div>
  )
}

function MoveRow({ move, author }: { move: Move; author: Author | null }) {
  const tone = MOVE_TONE[move.move_type]
  return (
    <div
      className="playbook-row"
      style={{ borderLeftColor: (tone && TONE_COLOR[tone]) || 'var(--ink)' }}
    >
      <span className={`sim-chip ${tone || ''}`}>
        {move.move_type.replace(/_/g, ' ')}
      </span>
      <h3 className="cell-title" style={{ marginTop: 10 }}>
        {move.title}
      </h3>
      <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
        {move.body}
      </p>
      <EvidenceList posts={move.evidence_posts} author={author} />
      {move.rewrite_text && (
        <div className="rewrite-note">
          <span className="tag">Try this rewrite</span>
          <p
            className="small"
            style={{ marginTop: 8, color: 'var(--muted-on-dark)', whiteSpace: 'pre-line' }}
          >
            {move.rewrite_text}
          </p>
        </div>
      )}
    </div>
  )
}

// X weights every URL as 23 characters regardless of length.
function tweetLength(text: string): number {
  return text.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).length
}

function ShareSection({ scanId, archetype }: { scanId: string; archetype: string }) {
  const [state, setState] = useState<
    'idle' | 'loading' | 'composing' | 'posting' | 'reauth' | 'done'
  >('idle')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [tweetUrl, setTweetUrl] = useState<string | null>(null)

  const chars = tweetLength(text)
  const overLimit = chars > 280

  async function openComposer() {
    setState('loading')
    try {
      const res = await fetch(`${API_URL}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      })
      if (!res.ok) throw new Error('share failed')
      const j = await res.json()
      setImageUrl(j.imageUrl)
      setText(`apparently my X archetype is ${archetype}\n\n${j.shareUrl}`)
      setState('composing')
    } catch {
      alert('Could not prepare your card. Try again.')
      setState('idle')
    }
  }

  async function post() {
    setState('posting')
    try {
      const res = await fetch(`${API_URL}/api/post-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, text }),
      })
      if (res.status === 403) {
        // Stored token predates the write scope: re-run the OAuth popup.
        setState('reauth')
        return
      }
      if (!res.ok) throw new Error('post failed')
      const j = await res.json()
      setTweetUrl(j.tweetUrl)
      setState('done')
    } catch {
      alert('Could not post to X. Try again.')
      setState('composing')
    }
  }

  function reconnect() {
    const apiOrigin = new URL(API_URL, window.location.origin).origin
    const popup = window.open(
      `${API_URL}/api/auth/x/start`,
      'foryouplaybook-auth',
      'popup=yes,width=600,height=740'
    )
    function onMessage(e: MessageEvent) {
      if (e.origin !== apiOrigin) return
      const data = e.data as { type?: string; scanId?: string }
      if (data?.type !== 'foryouplaybook:auth') return
      window.removeEventListener('message', onMessage)
      popup?.close()
      // Re-auth reuses the existing scan and refreshes tokens; post again.
      if (data.scanId) post()
      else setState('composing')
    }
    window.addEventListener('message', onMessage)
  }

  if (state === 'done' && tweetUrl) {
    return (
      <a className="boxlink" href={tweetUrl} target="_blank" rel="noreferrer">
        Posted — view on X
      </a>
    )
  }

  if (state === 'reauth') {
    return (
      <button className="boxlink" onClick={reconnect}>
        Allow posting on X to share
      </button>
    )
  }

  if (state === 'composing' || state === 'posting') {
    return (
      <div className="compose-box">
        <span className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-on-light)' }}>
          Your post — edit before it goes out
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={state === 'posting'}
        />
        {imageUrl && <img className="compose-img" src={imageUrl} alt="Your scorecard card" />}
        <div className="compose-meta">
          <span className={`compose-count ${overLimit ? 'over' : ''}`}>{chars}/280</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="boxlink" onClick={() => setState('idle')} disabled={state === 'posting'}>
              Cancel
            </button>
            <button className="boxlink" onClick={post} disabled={state === 'posting' || overLimit || !text.trim()}>
              {state === 'posting' ? 'Posting\u2026' : 'Post to X'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button className="boxlink" onClick={openComposer} disabled={state === 'loading'}>
      {state === 'loading' ? 'Preparing your card\u2026' : 'Share my scorecard'}
    </button>
  )
}

function DeleteSection({ scanId }: { scanId: string }) {
  const [loading, setLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function deleteData() {
    if (!window.confirm('Delete your Playbook and all stored X data? This cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/settings/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, confirm: true }),
      })
      if (res.ok) setDeleted(true)
    } finally {
      setLoading(false)
    }
  }

  if (deleted) {
    return (
      <a className="boxlink" href="/">
        Back to home
      </a>
    )
  }

  return (
    <button className="boxlink" onClick={deleteData} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete my data'}
    </button>
  )
}
