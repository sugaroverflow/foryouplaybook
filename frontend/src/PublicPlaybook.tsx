import { useEffect, useState } from 'react'
import { API_URL } from './api'

type PublicData = {
  displayName: string
  username: string
  archetype: string
  archetypeDescription: string
  archetypeConfidence: string
  postCount: number
  fit: Record<string, { grade: string; confidence: string }>
  rule: string
}

function tweetUrl(data: PublicData, publicUrl: string): string {
  const text = `apparently my X archetype is ${data.archetype}\n\nMy weirdest rule: "${data.rule}"\n\n`
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`
}

export function PublicPlaybook({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/public/${slug}`)
      .then(async (r) => {
        const d = await r.json()
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message || 'Failed to load public Playbook.'))
  }, [slug])

  if (error) return <p>{error}</p>
  if (!data) return <p>Loading public Playbook...</p>

  const publicUrl = `${window.location.origin}/?p=${slug}`

  return (
    <div style={{ padding: '10vh 24px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <p className="small mono" style={{ opacity: 0.5 }}>
        apparently my X archetype is
      </p>
      <h1 className="display" style={{ marginTop: 12, fontSize: 'clamp(32px, 5vw, 56px)' }}>
        {data.archetype}
      </h1>
      <p className="lede" style={{ marginTop: 16 }}>
        {data.archetypeDescription}
      </p>
      <p className="small" style={{ marginTop: 8 }}>
        {data.postCount} posts studied · {data.archetypeConfidence} confidence
      </p>

      <div style={{ marginTop: 48, textAlign: 'left' }}>
        {Object.entries(data.fit)
          .slice(0, 4)
          .map(([dim, val]) => (
            <div
              key={dim}
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
              <span className="mono">{val.grade}</span>
            </div>
          ))}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 24,
          border: '1px solid var(--line)',
          borderRadius: 8,
          textAlign: 'left',
        }}
      >
        <p className="small" style={{ opacity: 0.6 }}>
          My weirdest rule:
        </p>
        <p className="lede" style={{ marginTop: 8 }}>
          "{data.rule}"
        </p>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <a className="boxlink" href={tweetUrl(data, publicUrl)} target="_blank" rel="noreferrer">
          Share to X
        </a>
        <button
          className="boxlink"
          onClick={() => {
            navigator.clipboard.writeText(publicUrl)
            alert('Link copied')
          }}
        >
          Copy link
        </button>
      </div>

      <p className="small" style={{ marginTop: 48, opacity: 0.5 }}>
        Build yours at foryouplaybook.com
      </p>
    </div>
  )
}
