import { useEffect, useMemo, useState } from 'react'
import { Playbook } from './Playbook'
import { Privacy } from './Privacy'
import { PublicPlaybook } from './PublicPlaybook'
import { ScanStatus } from './ScanStatus'
import { Splash } from './sections/Splash'
import { Terms } from './Terms'

function Nav() {
  return (
    <div className="nav-bar">
      <div className="nav-inner">
        <a href="/" className="mono nav-brand">
          foryouplaybook
        </a>
        <div className="nav-spacer" />
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="section dark" style={{ borderBottom: 'none' }}>
      <div className="section-inner footer-inner">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'baseline',
          }}
        >
          <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em' }}>
            FORYOUPLAYBOOK
          </span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="small mono">
            <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
              Inspired by Inside the For You ↗
            </a>
            <a href="https://github.com/sugaroverflow/foryouplaybook" target="_blank" rel="noreferrer">
              Source ↗
            </a>
            <a href="https://deepwiki.com/xai-org/x-algorithm/" target="_blank" rel="noreferrer">
              DeepWiki ↗
            </a>
            <a href="/?page=privacy">Privacy</a>
            <a href="/?page=terms">Terms</a>
            <a
              href="https://devin.ai"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <img
                src="/devin.png"
                alt="Devin"
                width={16}
                height={16}
                style={{ filter: 'invert(1)', display: 'block' }}
              />
              Built with Devin ↗
            </a>
          </div>
        </div>
        <p className="small" style={{ marginTop: 24, maxWidth: 640 }}>
          Forked from Nader Dabit's Inside the For You. ForYou Playbook reads your X posts under
          the current algorithm and scores your engagement. It is not affiliated with X and uses
          the open-source{' '}
          <a href="https://github.com/xai-org/x-algorithm" target="_blank" rel="noreferrer">
            X ranking snapshot
          </a>
          .
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  const [scanId, setScanId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('scan')
  )
  const [privateSlug, setPrivateSlug] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('u')
  )
  const publicSlug = useMemo(() => new URLSearchParams(window.location.search).get('p'), [])
  const page = useMemo(() => new URLSearchParams(window.location.search).get('page'), [])

  useEffect(() => {
    const onPop = () => {
      setScanId(new URLSearchParams(window.location.search).get('scan'))
      setPrivateSlug(new URLSearchParams(window.location.search).get('u'))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
    if (!websiteId) return
    const src =
      import.meta.env.VITE_UMAMI_SRC || 'https://sugaroverflow-analytics.up.railway.app/script.js'
    if (document.querySelector(`script[data-website-id="${websiteId}"]`)) return
    const script = document.createElement('script')
    script.defer = true
    script.src = src
    script.setAttribute('data-website-id', websiteId)
    document.head.appendChild(script)
  }, [])

  function handleScanStart(id: string) {
    window.history.pushState(null, '', `/?scan=${encodeURIComponent(id)}`)
    setScanId(id)
  }

  if (page === 'privacy') {
    return (
      <>
        <Nav />
        <Privacy />
      </>
    )
  }

  if (page === 'terms') {
    return (
      <>
        <Nav />
        <Terms />
      </>
    )
  }

  if (publicSlug) {
    return (
      <>
        <Nav />
        <PublicPlaybook slug={publicSlug} />
      </>
    )
  }

  if (privateSlug) {
    return (
      <>
        <Nav />
        <Playbook username={privateSlug} />
      </>
    )
  }

  if (scanId) {
    return (
      <>
        <Nav />
        <ScanStatus scanId={scanId} />
      </>
    )
  }

  return (
    <>
      <Nav />
      <Splash onScanStart={handleScanStart} />
      <Footer />
    </>
  )
}
