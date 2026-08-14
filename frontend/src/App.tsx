import { useMemo } from 'react'
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
        <a
          href="https://devin.ai"
          target="_blank"
          rel="noreferrer"
          className="nav-devin"
          title="Built with Devin"
        >
          <img src="/devin.png" alt="Devin" width={18} height={18} />
        </a>
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
            <a href="https://github.com/dabit3/insidetheforyou" target="_blank" rel="noreferrer">
              Inspired by Inside the For You ↗
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
          ForYou Playbook reads your own X posts under the current For You regime and generates a
          personal strategy. It is not affiliated with X. Algorithm insights are based on the
          open-source X ranking snapshot.
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  const scanId = useMemo(() => new URLSearchParams(window.location.search).get('scan'), [])
  const publicSlug = useMemo(() => new URLSearchParams(window.location.search).get('p'), [])
  const page = useMemo(() => new URLSearchParams(window.location.search).get('page'), [])

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

  if (scanId) {
    return (
      <>
        <Nav />
        <ScanStatus />
      </>
    )
  }

  return (
    <>
      <Nav />
      <Splash />
      <Footer />
    </>
  )
}
