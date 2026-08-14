import { useEffect, useState } from 'react'
import { API_URL } from './api'
import { Playbook } from './Playbook'

type Scan = {
  id: string
  status: string
  stage: string
  post_count: number
  qualifying_post_count: number
}

const STAGE_COPY: Record<string, string> = {
  fetching_posts: '🔎 reading the receipts',
  normalizing_metrics: '📐 making likes stop bossing everyone around',
  extracting_patterns: "🧠 figuring out what you won't shut up about",
  testing_hypotheses: '👀 found something weird',
  building_moves: '🎮 picking your next five moves',
  rendering_playbook: '📖 writing your playbook',
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

  if (error) return <p>{error}</p>
  if (!scan) return <p>Loading your Playbook...</p>

  return (
    <div style={{ padding: '20vh 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
        Cooking your Playbook 🍳
      </h1>
      <p className="lede" style={{ marginTop: 16 }}>
        {STAGE_COPY[scan.stage] || scan.stage} — {scan.post_count} posts read
      </p>
      {scan.status === 'completed' && <Playbook scanId={scan.id} />}
    </div>
  )
}
