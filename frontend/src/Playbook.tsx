import { useEffect, useMemo, useState } from 'react'
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

export function Playbook({ scanId }: { scanId: string }) {
  const [data, setData] = useState<PlaybookData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('review')

  useEffect(() => {
    fetch(`${API_URL}/api/playbook/${scanId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError('Could not load playbook.'))
  }, [scanId])

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
        <div className="score-card playbook-card">
          <div className="card-head-grid">
            <div className="card-left">
              {overall && <GradeStamp grade={overall} />}
              {data.author && <CardAvatar author={data.author} size={96} />}
            </div>
            <div className="card-right">
              {data.author && <span className="card-handle">@{data.author.username}</span>}
              <span
                className="tag"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-on-light)',
                  display: 'block',
                  marginTop: 2,
                }}
              >
                {data.scan.post_count} posts studied · {data.scan.archetype_confidence} confidence
              </span>
              <h1 className="display" style={{ marginTop: 12 }}>
                {data.scan.archetype}
              </h1>
              <p className="lede" style={{ marginTop: 16 }}>
                {data.scan.archetype_description}
              </p>
            </div>
          </div>

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
                  Scoring playground pulled from{' '}
                  <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
                    Nader's Inside the For You
                  </a>{' '}
                  — pointed at your top 5 posts. You can toggle the actions and watch the score
                  move.
                </p>
                <PostPlayground posts={data.posts} />
              </>
            )}
          </motion.div>

          <div className="card-stub">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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

const SIM_ACTIONS = [
  { id: 'fav', label: 'Like', weight: 0.5, metric: 'likes' },
  { id: 'reply', label: 'Reply', weight: 5.0, metric: 'replies' },
  { id: 'repost', label: 'Repost', weight: 1.0, metric: 'reposts' },
  { id: 'quote', label: 'Quote', weight: 5.0, metric: 'quotes' },
  { id: 'not_interested', label: 'Not interested', weight: -43.2, metric: null },
  { id: 'block', label: 'Block', weight: -31.2, metric: null },
  { id: 'mute', label: 'Mute', weight: -58.8, metric: null },
  { id: 'report', label: 'Report', weight: -234.0, metric: null },
]

function baseScore(post: Post): number {
  return (
    (post.likes || 0) * 0.5 +
    (post.replies || 0) * 5.0 +
    (post.reposts || 0) * 1.0 +
    (post.quotes || 0) * 5.0
  )
}

const MAX_SCORE = 200

function PostPlayground({ posts }: { posts: Post[] }) {
  const topPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => baseScore(b) - baseScore(a))
        .slice(0, 5)
        .map((p) => ({ ...p, text: p.text || '(no text)' })),
    [posts]
  )

  return (
    <>
      {topPosts.map((post) => (
        <PostSim key={post.id} post={post} />
      ))}
    </>
  )
}

function PostSim({ post }: { post: Post }) {
  const [extra, setExtra] = useState<Set<string>>(new Set())

  const extraScore = SIM_ACTIONS.reduce(
    (sum, a) => (extra.has(a.id) ? sum + a.weight : sum),
    0
  )
  const score = baseScore(post) + extraScore

  function toggle(id: string) {
    setExtra((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function preset(mode: 'max' | 'negative' | 'reset') {
    if (mode === 'reset') return setExtra(new Set())
    setExtra(
      new Set(
        SIM_ACTIONS.filter((a) =>
          mode === 'max' ? a.weight > 0 : a.weight < 0
        ).map((a) => a.id)
      )
    )
  }

  return (
    <div className="playbook-row" style={{ borderLeftColor: score >= 0 ? '#0f7b3e' : '#c22a2a' }}>
      <p className="small" style={{ opacity: 0.7, marginBottom: 8 }}>
        {new Date(post.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="cell-title" style={{ marginBottom: 12, lineHeight: 1.4 }}>
        {post.text}
      </p>

      <div className="score-card" style={{ padding: 20 }}>
        <span className="tag" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Post score
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
          <motion.span
            key={score}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="display score-value"
          >
            {score > 0 ? '+' : ''}
            {Number(score.toFixed(1))}
          </motion.span>
          <span className="small">
            {score >= 20
              ? 'competes for the top of the feed'
              : score > 0
                ? 'competes for a spot'
                : score === 0
                  ? 'invisible to the ranker'
                  : 'buried'}
          </span>
        </div>
        <div className="bar-track score-bar">
          <motion.div
            animate={{
              width: `${Math.min(Math.abs(score) / MAX_SCORE, 1) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              height: '100%',
              backgroundColor: score >= 0 ? 'var(--ink)' : 'transparent',
              backgroundImage:
                score < 0
                  ? 'repeating-linear-gradient(45deg, #c22a2a 0 6px, transparent 6px 12px)'
                  : undefined,
            }}
          />
        </div>
      </div>

      <div className="aura-row" style={{ marginTop: 16 }}>
        <button className="aura-btn good" onClick={() => preset('max')}>
          Max aura
        </button>
        <button className="aura-btn bad" onClick={() => preset('negative')}>
          Negative aura
        </button>
        <button className="aura-btn neutral" onClick={() => preset('reset')}>
          Reset
        </button>
      </div>

      <div className="pill-grid" style={{ marginTop: 12 }}>
        {SIM_ACTIONS.map((a) => {
          const metric = a.metric ? (post as any)[a.metric] || 0 : 0
          const active = extra.has(a.id)
          return (
            <button
              key={a.id}
              className={`pill-toggle ${active ? 'on' : ''} ${a.weight < 0 ? 'negative' : ''}`}
              onClick={() => toggle(a.id)}
            >
              {a.label}
              {a.metric && metric > 0 ? (
                <span style={{ opacity: 0.55 }}>+1</span>
              ) : (
                <span style={{ opacity: 0.55 }}>{a.weight > 0 ? `+${a.weight}` : a.weight}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
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

function ShareSection({ scanId, archetype }: { scanId: string; archetype: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function share() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, shareEnabled: true }),
      })
      const j = await res.json()
      setShareUrl(j.publicUrl)
    } finally {
      setLoading(false)
    }
  }

  if (shareUrl) {
    return (
      <>
        <a
          className="boxlink"
          href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`apparently my X archetype is ${archetype}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Share to X
        </a>
        <button
          className="boxlink"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl)
            alert('Link copied')
          }}
        >
          Copy link
        </button>
      </>
    )
  }

  return (
    <button className="boxlink" onClick={share} disabled={loading}>
      {loading ? 'Sharing...' : 'Share my scorecard'}
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
