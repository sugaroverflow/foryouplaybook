import { useEffect, useState } from 'react'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'
import { GradeRail, GradeStamp, overallGrade, type FitValue } from './components/Grades'

type PublicData = {
  displayName: string
  username: string
  archetype: string
  archetypeDescription: string
  archetypeConfidence: string
  postCount: number
  fit: Record<string, FitValue>
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
      <Section theme="dark" eyebrow="Not found">
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
            <h1 className="display">Loading scorecard…</h1>
          </div>
        </Reveal>
      </Section>
    )
  }

  const publicUrl = `${window.location.origin}/?p=${slug}`
  const overall = overallGrade(data.fit)

  return (
    <Section id="top" theme="dark" eyebrow={`@${data.username}`}>
      <Reveal>
        <div className="score-card playbook-card">
          {overall && <GradeStamp grade={overall} />}

          <div className="card-head">
            <span
              className="tag"
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted-on-light)',
              }}
            >
              {data.postCount} posts studied · {data.archetypeConfidence} confidence
            </span>
            <p className="eyebrow" style={{ margin: '16px 0 8px' }}>
              Apparently {data.displayName}'s X archetype is
            </p>
            <h1 className="display">{data.archetype}</h1>
            <p className="lede" style={{ marginTop: 20 }}>
              {data.archetypeDescription}
            </p>
          </div>

          <hr className="card-rule" />

          <GradeRail fit={data.fit} />

          <hr className="card-rule" />

          <div className="rewrite-note">
            <span className="tag">My weirdest rule</span>
            <p className="small" style={{ marginTop: 8, color: 'var(--muted-on-dark)' }}>
              "{data.rule}"
            </p>
          </div>

          <hr className="card-rule" />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
              Generate my scorecard
            </a>
          </div>
          <p className="small" style={{ marginTop: 16 }}>
            ForYou Playbook grades your own X posts under the current For You regime. Inspired by
            Nader Dabit's Inside the For You.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
