import { useEffect, useState } from 'react'
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
}

type Tab = 'review' | 'actions'

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
          {overall && <GradeStamp grade={overall} />}

          <div className="card-head">
            <div className="card-identity">
              {data.author && <CardAvatar author={data.author} />}
              <div>
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
              </div>
            </div>
            <h1 className="display" style={{ marginTop: 12 }}>
              {data.scan.archetype}
            </h1>
            <p className="lede" style={{ marginTop: 20 }}>
              {data.scan.archetype_description}
            </p>
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
                {data.findings.map((f) => (
                  <div className="playbook-row" key={f.id}>
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
                      <span className="conf-tag">{f.confidence} confidence</span>
                    </div>
                    <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                      {f.explanation}
                    </p>
                    <EvidenceList posts={f.evidence_posts} author={data.author} />
                  </div>
                ))}
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
              Inspired by Nader Dabit's Inside the For You. Delete wipes your posts and tokens for
              good.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function MoveRow({ move, author }: { move: Move; author: Author | null }) {
  return (
    <div className="playbook-row">
      <span className={`sim-chip ${MOVE_TONE[move.move_type] || ''}`}>
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
