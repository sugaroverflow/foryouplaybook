import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'
import { GradeRail, GradeStamp, overallGrade, type FitValue } from './components/Grades'

const MOVE_TONE: Record<string, 'good' | 'bad'> = {
  rewrite: 'bad',
  change: 'bad',
  double_down: 'good',
  go_talk: 'good',
  experiment: 'good',
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

type Tab = 'discoveries' | 'moves'

export function Playbook({ scanId }: { scanId: string }) {
  const [data, setData] = useState<PlaybookData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('discoveries')

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

  return (
    <Section id="top" theme="dark" eyebrow="Your ForYou scorecard">
      <Reveal>
        <div className="score-card playbook-card">
          {overall && <GradeStamp grade={overall} />}

          <div className="card-head">
            <span
              className="tag"
              style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
            >
              {data.scan.post_count} posts studied · {data.scan.archetype_confidence} confidence
            </span>
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
              aria-selected={tab === 'discoveries'}
              className={`playbook-tab ${tab === 'discoveries' ? 'on' : ''}`}
              onClick={() => setTab('discoveries')}
            >
              💡 Discoveries · {data.findings.length}
            </button>
            <button
              role="tab"
              aria-selected={tab === 'moves'}
              className={`playbook-tab ${tab === 'moves' ? 'on' : ''}`}
              onClick={() => setTab('moves')}
            >
              🎯 Moves · {data.moves.length}
            </button>
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 8 }}
          >
            {tab === 'discoveries' &&
              data.findings.map((f) => (
                <div className="playbook-row" key={f.id}>
                  <h3 className="cell-title">{f.headline}</h3>
                  <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                    {f.explanation}
                  </p>
                  <p className="small mono" style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                    {f.confidence} confidence
                  </p>
                </div>
              ))}

            {tab === 'moves' &&
              data.moves.map((m) => (
                <div className="playbook-row" key={m.id}>
                  <span className={`sim-chip ${MOVE_TONE[m.move_type] || ''}`}>
                    {m.move_type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="cell-title" style={{ marginTop: 10 }}>
                    {m.title}
                  </h3>
                  <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                    {m.body}
                  </p>
                  {m.rewrite_text && (
                    <div className="rewrite-note">
                      <span className="tag">Try this rewrite</span>
                      <p className="small" style={{ marginTop: 8, color: 'var(--muted-on-dark)', whiteSpace: 'pre-line' }}>
                        {m.rewrite_text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </motion.div>

          <hr className="card-rule" />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ShareSection scanId={data.scan.id} archetype={data.scan.archetype} />
            <DeleteSection scanId={data.scan.id} />
          </div>
          <p className="small" style={{ marginTop: 16, opacity: 0.6 }}>
            Inspired by Nader Dabit's Inside the For You. Delete wipes your posts and tokens for
            good.
          </p>
        </div>
      </Reveal>
    </Section>
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
