import { useEffect, useState } from 'react'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'

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
          <h1 className="display">{data.scan.archetype}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede" style={{ marginTop: 24 }}>
            {data.scan.archetype_description}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="small" style={{ marginTop: 16 }}>
            {data.scan.post_count} posts studied · confidence: {data.scan.archetype_confidence}
          </p>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="ForYou Fit">
        <Reveal>
          <h2 className="display">
            Your A–F profile across <span className="dim">five dimensions.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid cols-3" style={{ marginTop: 48 }}>
            {Object.entries(fit).map(([dim, val]) => {
              const v = val as { grade: string; confidence: string }
              return (
                <div className="cell" key={dim}>
                  <span className="tag" style={{ textTransform: 'capitalize' }}>
                    {dim}
                  </span>
                  <div className="cell-title">{v.grade}</div>
                  <p className="small" style={{ marginTop: 8 }}>
                    {v.confidence} confidence
                  </p>
                </div>
              )
            })}
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
                <span className="tag">Discovery</span>
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
                <span className="tag" style={{ textTransform: 'uppercase' }}>
                  {m.move_type}
                </span>
                <h3 className="cell-title">{m.title}</h3>
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
