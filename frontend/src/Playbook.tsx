import { useEffect, useState } from 'react'
import { API_URL } from './api'

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

function FitItem({ dim, val }: { dim: string; val: { grade: string; confidence: string } }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span className="mono" style={{ textTransform: 'capitalize' }}>
        {dim}
      </span>
      <span className="mono">
        {val.grade}{' '}
        <span style={{ opacity: 0.5 }}>({val.confidence})</span>
      </span>
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

  if (error) return <p>{error}</p>
  if (!data) return <p>Loading your Playbook...</p>

  const fit = data.scan.fit_json ? JSON.parse(data.scan.fit_json) : {}

  return (
    <div style={{ padding: '10vh 24px', maxWidth: 760, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
        {data.scan.archetype}
      </h1>
      <p className="lede" style={{ marginTop: 16 }}>
        {data.scan.archetype_description}
      </p>
      <p className="small" style={{ marginTop: 8 }}>
        {data.scan.post_count} posts studied · confidence: {data.scan.archetype_confidence}
      </p>

      <h2 className="display" style={{ marginTop: 64, fontSize: 'clamp(24px, 4vw, 40px)' }}>
        ForYou Fit
      </h2>
      {Object.entries(fit).map(([dim, val]) => (
        <FitItem key={dim} dim={dim} val={val as { grade: string; confidence: string }} />
      ))}

      <h2 className="display" style={{ marginTop: 64, fontSize: 'clamp(24px, 4vw, 40px)' }}>
        Discoveries
      </h2>
      {data.findings.map((f) => (
        <div key={f.id} style={{ marginTop: 24 }}>
          <h3 className="cell-title">{f.headline}</h3>
          <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
            {f.explanation}
          </p>
          <p className="small" style={{ marginTop: 8, opacity: 0.6 }}>
            Confidence: {f.confidence}
          </p>
        </div>
      ))}

      <h2 className="display" style={{ marginTop: 64, fontSize: 'clamp(24px, 4vw, 40px)' }}>
        Your Five Moves
      </h2>
      {data.moves.map((m) => (
        <div
          key={m.id}
          style={{ marginTop: 24, padding: 24, border: '1px solid var(--line)', borderRadius: 8 }}
        >
          <span className="tag" style={{ textTransform: 'uppercase' }}>
            {m.move_type}
          </span>
          <h3 className="cell-title" style={{ marginTop: 8 }}>
            {m.title}
          </h3>
          <p className="small" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
            {m.body}
          </p>
          {m.rewrite_text && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: 'rgba(0,0,0,0.05)',
                borderRadius: 4,
              }}
            >
              <p className="small" style={{ margin: 0 }}>
                {m.rewrite_text}
              </p>
            </div>
          )}
        </div>
      ))}

      <ShareSection scanId={data.scan.id} archetype={data.scan.archetype} />
      <DeleteSection scanId={data.scan.id} />
    </div>
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
      <div style={{ marginTop: 64 }}>
        <p className="lede">All data deleted.</p>
        <a className="boxlink" style={{ marginTop: 16, display: 'inline-block' }} href="/">
          Back to home
        </a>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 64 }}>
      <button className="boxlink" onClick={deleteData} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete my data'}
      </button>
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

  return (
    <div style={{ marginTop: 64 }}>
      {!shareUrl ? (
        <button className="boxlink" onClick={share} disabled={loading}>
          {loading ? 'Sharing...' : 'Share my archetype'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
        </div>
      )}
    </div>
  )
}
