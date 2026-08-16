import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from './api'
import { Reveal, Section } from './components/Reveal'
import { Playbook } from './Playbook'

type Scan = {
  id: string
  status: string
  stage: string
  post_count: number
  qualifying_post_count: number
}

const STAGES = [
  { key: 'fetching_posts', label: 'Reading the receipts' },
  { key: 'extracting_patterns', label: 'Figuring out what you keep coming back to' },
  { key: 'building_moves', label: 'Picking your next five moves' },
  { key: 'rendering_playbook', label: 'Writing your playbook' },
]

export function ScanStatus({ scanId }: { scanId: string }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The backend races to the last stage and sits on the LLM call, which made
  // every step flash green at once. Pace the checklist: each step holds for a
  // beat before the display catches up to the real stage.
  const [displayStage, setDisplayStage] = useState(0)

  const actualStage = scan ? Math.max(0, STAGES.findIndex((s) => s.key === scan.stage)) : 0

  useEffect(() => {
    if (displayStage >= actualStage) return
    const t = setTimeout(() => setDisplayStage((s) => Math.min(s + 1, actualStage)), 2400)
    return () => clearTimeout(t)
  }, [displayStage, actualStage])

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/scans/${scanId}`)
        if (!res.ok) throw new Error('scan not found')
        const data = (await res.json()) as Scan
        if (cancelled) return
        setScan(data)
        if (data.status !== 'completed' && data.status !== 'failed') {
          setTimeout(poll, 2000)
        }
      } catch (e) {
        if (!cancelled) setError('Could not load scan status.')
      }
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [scanId])

  if (error) {
    return (
      <Section theme="dark" eyebrow="Something went wrong">
        <Reveal>
          <div className="score-card playbook-card">
            <p className="lede">{error}</p>
            <a className="boxlink" style={{ marginTop: 32, display: 'inline-block' }} href="/">
              Back to home
            </a>
          </div>
        </Reveal>
      </Section>
    )
  }

  if (!scan) {
    return (
      <Section theme="dark" eyebrow="ForYou Playbook">
        <Reveal>
          <div className="score-card playbook-card">
            <h1 className="display">Loading…</h1>
          </div>
        </Reveal>
      </Section>
    )
  }

  if (scan.status === 'completed') {
    return <Playbook scanId={scan.id} />
  }

  if (scan.status === 'failed') {
    return (
      <Section theme="dark" eyebrow="Scan failed">
        <Reveal>
          <div
            className="score-card playbook-card"
            style={{ borderColor: '#c22a2a', boxShadow: '6px 6px 0 #c22a2a' }}
          >
            <span
              className="tag"
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted-on-light)',
              }}
            >
              {scan.post_count} posts read before it stopped
            </span>
            <h1 className="display" style={{ marginTop: 12 }}>
              That one didn't land.
            </h1>
            <p className="lede" style={{ marginTop: 24 }}>
              X didn't give us enough to grade. Start over to run a fresh scan.
            </p>
            <a className="boxlink" style={{ marginTop: 40, display: 'inline-block' }} href="/">
              Start over
            </a>
          </div>
        </Reveal>
      </Section>
    )
  }

  const progress = ((displayStage + 0.5) / STAGES.length) * 100

  return (
    <Section theme="dark" eyebrow="Cooking your scorecard 🍳">
      <Reveal>
        <div className="score-card playbook-card">
          <span
            className="tag"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
          >
            {scan.post_count} posts read so far · usually 10–30 seconds
          </span>
          <h1 className="display" style={{ marginTop: 12 }}>
            Grading your posts.
          </h1>
          <p className="lede" style={{ marginTop: 24 }}>
            We pull your posts from the current For You regime, normalize the metrics, and build
            your five moves.
          </p>

          <div
            className="bar-track score-bar"
            style={{ marginTop: 32, background: 'rgba(0, 0, 0, 0.1)' }}
          >
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', background: 'var(--ink)' }}
            />
          </div>

          <div style={{ marginTop: 24 }}>
            {STAGES.map((s, i) => {
              const state = i < displayStage ? 'done' : i === displayStage ? 'current' : 'pending'
              return (
                <div key={s.key} className={`stage-row ${state}`}>
                  <span className="stage-mark">
                    {state === 'done' ? '✓' : state === 'current' ? '●' : '○'}
                  </span>
                  <span>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
