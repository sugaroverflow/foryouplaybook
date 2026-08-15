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
          <div className="score-card" style={{ color: 'var(--ink)' }}>
            <span
              className="tag"
              style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
            >
              {data.postCount} posts studied · {data.archetypeConfidence} confidence
            </span>
            <p className="eyebrow" style={{ marginBottom: 12, color: 'var(--muted-on-light)' }}>
              Apparently {data.displayName}'s X archetype is
            </p>
            <h1 className="display">{data.archetype}</h1>
            <p className="lede" style={{ marginTop: 24, color: 'var(--muted-on-light)' }}>
              {data.archetypeDescription}
            </p>
          </div>
        </Reveal>
      </Section>

      <Section theme="light" eyebrow="ForYou Fit">
        <Reveal>
          <h2 className="display">
            A snapshot of <span className="dim">what's working.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cellgrid" style={{ marginTop: 48 }}>
            {Object.entries(data.fit).map(([dim, val]) => (
              <FitCard key={dim} dim={dim} val={val} />
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
          <div className="score-card" style={{ marginTop: 48, color: 'var(--ink)' }}>
            <span
              className="tag"
              style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
            >
              My weirdest rule
            </span>
            <p className="lede" style={{ marginTop: 12, color: 'var(--muted-on-light)' }}>
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
