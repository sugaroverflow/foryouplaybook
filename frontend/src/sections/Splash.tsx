import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from '../api'
import { Reveal, Section } from '../components/Reveal'

type AuthState = { status: 'idle' } | { status: 'waiting' } | { status: 'error'; message: string }

export function Splash({ onScanStart }: { onScanStart: (scanId: string) => void }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'idle' })
  const popupRef = useRef<Window | null>(null)
  const settledRef = useRef(false)

  useEffect(() => {
    const apiOrigin = new URL(API_URL, window.location.origin).origin
    function onMessage(e: MessageEvent) {
      if (e.origin !== apiOrigin) return
      const data = e.data as { type?: string; scanId?: string; error?: string }
      if (data?.type !== 'foryouplaybook:auth') return
      settledRef.current = true
      popupRef.current?.close()
      if (data.scanId) {
        onScanStart(data.scanId)
      } else {
        setAuth({ status: 'error', message: data.error || 'X authorization failed. Try again.' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onScanStart])

  function startAuth() {
    const url = `${API_URL}/api/auth/x/start`
    const width = 600
    const height = 740
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2)
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2)
    settledRef.current = false
    const popup = window.open(
      url,
      'foryouplaybook-auth',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`
    )
    if (!popup) {
      // Popup blocked: fall back to the full-page redirect flow.
      window.location.href = url
      return
    }
    popupRef.current = popup
    setAuth({ status: 'waiting' })
    const timer = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(timer)
      // A postMessage sent right before close may still be in flight.
      window.setTimeout(() => {
        if (!settledRef.current) setAuth({ status: 'idle' })
      }, 400)
    }, 500)
  }

  const waiting = auth.status === 'waiting'

  return (
    <Section id="top" theme="dark" eyebrow="ForYou Playbook">
      <Reveal>
        <div
          className="score-card playbook-card"
          style={{ maxWidth: 760, color: 'var(--ink)' }}
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
            The algorithm is global. The playbook is yours.
          </span>
          <h1 className="display" style={{ marginTop: 12 }}>
            Discover your X scorecard.
          </h1>
          <p className="lede" style={{ marginTop: 24 }}>
            We were inspired by{' '}
            <a href="https://x.com/dabit3" target="_blank" rel="noreferrer">
              Nader Dabit
            </a>
            's{' '}
            <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
              Inside the For You
            </a>
            , an interactive tour of how the X algorithm ranks posts — and built a personalized
            version. Connect your account and we grade your own posts under the same ranking rules
            to generate your scorecard.
          </p>

          <div
            className="bar-track score-bar"
            style={{ marginTop: 32, background: 'rgba(0, 0, 0, 0.1)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '50%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', background: 'var(--ink)' }}
            />
          </div>
          <p className="small" style={{ marginTop: 12 }}>
            Global rulebook on the left. Your data completes the picture on the right.
          </p>

          <button
            className="boxlink"
            style={{ marginTop: 40, display: 'inline-block' }}
            onClick={startAuth}
            disabled={waiting}
          >
            {waiting ? 'Waiting for X authorization…' : 'Generate my scorecard →'}
          </button>
          {auth.status === 'error' && (
            <p className="small" style={{ marginTop: 12, color: '#c22a2a' }}>
              {auth.message}
            </p>
          )}
          <p className="small" style={{ marginTop: 16 }}>
            X sign-in opens in a popup — this page stays put. Read-only access. Your data, your
            control. <a href="/?page=privacy">Privacy</a> · <a href="/?page=terms">Terms</a>
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
