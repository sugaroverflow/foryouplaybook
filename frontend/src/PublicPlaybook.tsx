import { useEffect, useState } from 'react'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'

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

  if (error) {
    return (
      <Section theme="light" eyebrow="Not found">
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
          <h1 className="display">Loading public Playbook...</h1>
        </Reveal>
      </Section>
    )
  }

  const publicUrl = `${window.location.origin}/?p=${slug}`

  return (
    <>
      <Section id="top" theme="dark" eyebrow={data.username}>
        <Reveal>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Apparently {data.displayName}'s X archetype is
          </p>
          <h1 className="display">{data.archetype}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede" style={{ marginTop: 24 }}>
            {data.archetypeDescription}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="small" style={{ marginTop: 16 }}>
            {data.postCount} posts studied · {data.archetypeConfidence} confidence
          </p>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="ForYou Fit">
        <Reveal>
          <h2 className="display">
            A snapshot of <span className="dim">what's working.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid cols-3" style={{ marginTop: 48 }}>
            {Object.entries(data.fit)
              .slice(0, 4)
              .map(([dim, val]) => (
                <div className="cell" key={dim}>
                  <span className="tag" style={{ textTransform: 'capitalize' }}>
                    {dim}
                  </span>
                  <div className="cell-title">{val.grade}</div>
                </div>
              ))}
          </div>
        </Reveal>
      </Section>

      <Section theme="dark" eyebrow="Playbook rule">
        <Reveal>
          <h2 className="display">
            A rule worth <span className="dim">stealing.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cell" style={{ marginTop: 48 }}>
            <span className="tag">My weirdest rule</span>
            <p className="lede" style={{ marginTop: 12 }}>
              "{data.rule}"
            </p>
          </div>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="Build yours">
        <Reveal>
          <h2 className="display">
            Get your own <span className="dim">archetype.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede" style={{ marginTop: 24 }}>
            ForYou Playbook reads your own X posts and finds the patterns that are uniquely working
            for you.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
            <a className="boxlink" href="/">
              Build yours
            </a>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
