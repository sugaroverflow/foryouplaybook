import { useEffect, useState } from 'react'
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

const STAGE_COPY: Record<string, string> = {
  fetching_posts: 'Reading the receipts',
  extracting_patterns: 'Figuring out what you keep coming back to',
  building_moves: 'Picking your next five moves',
  rendering_playbook: 'Writing your playbook',
  completed: 'Done!',
}

function getScanId(): string | null {
  return new URLSearchParams(window.location.search).get('scan')
}

export function ScanStatus() {
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanId = getScanId()
    if (!scanId) return
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
  }, [])

  if (error) {
    return (
      <Section theme="light" eyebrow="Something went wrong">
        <Reveal>
          <p className="lede">{error}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <a className="boxlink" style={{ marginTop: 32 }} href="/">
            Back to home
          </a>
        </Reveal>
      </Section>
    )
  }

  if (!scan) {
    return (
      <Section theme="dark" eyebrow="Cooking your Playbook">
        <Reveal>
          <h1 className="display">Loading...</h1>
        </Reveal>
      </Section>
    )
  }

  if (scan.status === 'completed') {
    return <Playbook scanId={scan.id} />
  }

  const stageLabel = STAGE_COPY[scan.stage] || scan.stage

  return (
    <Section id="top" theme="dark" eyebrow="Cooking your Playbook 🍳">
      <Reveal>
        <h1 className="display">
          Reading your posts. <span className="dim">Finding your patterns.</span>
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="lede" style={{ marginTop: 24 }}>
          We pull from your current For You regime, normalize your metrics, and build five moves for
          what to try next.
        </p>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="cellgrid cols-3" style={{ marginTop: 56 }}>
          <div className={`cell ${scan.status === 'failed' ? 'filled' : ''}`}>
            <span className="tag">Current step</span>
            <div className="cell-title">{scan.status === 'failed' ? 'Scan failed' : stageLabel}</div>
            <p className="small" style={{ marginTop: 12 }}>
              {scan.post_count} posts read
            </p>
          </div>
          <div className="cell">
            <span className="tag">Posts</span>
            <div className="cell-title">{scan.post_count}</div>
            <p className="small" style={{ marginTop: 12 }}>
              found so far
            </p>
          </div>
          <div className="cell">
            <span className="tag">Status</span>
            <div className="cell-title">{scan.status}</div>
            <p className="small" style={{ marginTop: 12 }}>
              {scan.status === 'failed'
                ? 'Please refresh or start over'
                : 'This usually takes 10–30 seconds'}
            </p>
          </div>
        </div>
      </Reveal>
      {scan.status === 'failed' && (
        <Reveal delay={0.3}>
          <a className="boxlink" style={{ marginTop: 48 }} href="/">
            Try again
          </a>
        </Reveal>
      )}
    </Section>
  )
}
