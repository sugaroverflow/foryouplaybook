import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'

const GRADE_COLOR: Record<string, string> = {
  A: '#0f7b3e',
  B: '#16a34a',
  C: '#ca8a04',
  D: '#ea580c',
  F: '#c22a2a',
}

const GRADE_PERCENT: Record<string, string> = {
  A: '100%',
  B: '75%',
  C: '50%',
  D: '25%',
  F: '5%',
}

const FIT_ICON: Record<string, string> = {
  conversation: '💬',
  travels: '🚀',
  curiosity: '🔍',
  reach: '📣',
  momentum: '📈',
}

const MOVE_COLOR: Record<string, string> = {
  rewrite: '#c22a2a',
  double_down: '#0f7b3e',
  change: '#c22a2a',
  go_talk: '#0f7b3e',
  experiment: '#0f7b3e',
}

type PlaybookData = {
  scan: {
    id: string
    archetype: string
    archetype_description: string
    archetype_confidence: string
    post_count: number
    fit_json: string | null
  }
  findings: Array<{
    id: string
    headline: string
    explanation: string
    confidence: string
  }>
  moves: Array<{
    id: string
    move_type: string
    title: string
    body: string
    rewrite_text: string | null
  }>
}

function FitCard({ dim, val }: { dim: string; val: { grade: string; confidence: string } }) {
  const color = GRADE_COLOR[val.grade] || '#888'
  return (
    <div className="score-card" style={{ borderColor: color, boxShadow: `6px 6px 0 ${color}` }}>
      <span
        className="tag"
        style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
      >
        {FIT_ICON[dim]} {dim}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
        <span className="display score-value" style={{ color }}>
          {val.grade}
        </span>
        <span className="small">{val.confidence} confidence</span>
      </div>
      <div className="bar-track score-bar">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: GRADE_PERCENT[val.grade] || '0%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: color }}
        />
      </div>
    </div>
  )
}

export function Playbook({ scanId }: { scanId: string }) {
  const [data, setData] = useState<PlaybookData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/playbook/${scanId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError('Could not load playbook.'))
  }, [scanId])

  if (error) {
    return (
      <Section theme="light" eyebrow="Error">
        <Reveal>
          <p className="lede">{error}</p>
        </Reveal>
      </Section>
    )
  }

  if (!data) {
    return (
      <Section theme="dark" eyebrow="ForYou Playbook">
        <Reveal>
          <h1 className="display">Loading your Playbook...</h1>
        </Reveal>
      </Section>
    )
  }

  const fit = data.scan.fit_json ? JSON.parse(data.scan.fit_json) : {}

  return (
    <>
      <Section id="top" theme="dark" eyebrow="Your archetype">
        <Reveal>
          <div className="score-card" style={{ color: 'var(--ink)' }}>
            <span
              className="tag"
              style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
            >
              {data.scan.post_count} posts studied · {data.scan.archetype_confidence} confidence
            </span>
            <h1 className="display" style={{ marginTop: 12 }}>
              {data.scan.archetype}
            </h1>
            <p className="lede" style={{ marginTop: 24, color: 'var(--muted-on-light)' }}>
              {data.scan.archetype_description}
            </p>
          </div>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="ForYou Fit">
        <Reveal>
          <h2 className="display">
            Your A–F profile across <span className="dim">five dimensions.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid" style={{ marginTop: 48 }}>
            {Object.entries(fit).map(([dim, val]) => (
              <FitCard key={dim} dim={dim} val={val as { grade: string; confidence: string }} />
            ))}
          </div>
        </Reveal>
      </Section>

      <Section theme="dark" eyebrow="Three discoveries">
        <Reveal>
          <h2 className="display">
            What your data <span className="dim">keeps saying.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid" style={{ marginTop: 48 }}>
            {data.findings.map((f) => (
              <div className="cell" key={f.id}>
                <span className="tag">💡 Discovery</span>
                <h3 className="cell-title">{f.headline}</h3>
                <p className="small" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>
                  {f.explanation}
                </p>
                <p className="small" style={{ marginTop: 12, opacity: 0.6 }}>
                  Confidence: {f.confidence}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="Your five moves">
        <Reveal>
          <h2 className="display">
            What to try <span className="dim">next.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid" style={{ marginTop: 48 }}>
            {data.moves.map((m) => (
              <div className="cell" key={m.id}>
                <span
                  className="tag"
                  style={{
                    color: MOVE_COLOR[m.move_type] || 'inherit',
                    border: `1px solid ${MOVE_COLOR[m.move_type] || 'currentColor'}`,
                    borderRadius: 6,
                    padding: '4px 8px',
                    display: 'inline-block',
                    fontSize: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  {m.move_type}
                </span>
                <h3 className="cell-title" style={{ marginTop: 12 }}>
                  {m.title}
                </h3>
                <p className="small" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>
                  {m.body}
                </p>
                {m.rewrite_text && (
                  <div className="cell filled" style={{ marginTop: 24 }}>
                    <span className="tag">Try this rewrite</span>
                    <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                      {m.rewrite_text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section theme="dark" eyebrow="Share or delete">
        <Reveal>
          <h2 className="display">
            Keep it. <span className="dim">Or wipe it.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ShareSection scanId={data.scan.id} archetype={data.scan.archetype} />
            <DeleteSection scanId={data.scan.id} />
          </div>
        </Reveal>
      </Section>
    </>
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
      {loading ? 'Sharing...' : 'Share my archetype'}
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
