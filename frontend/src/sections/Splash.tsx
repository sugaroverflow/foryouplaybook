import { API_URL } from '../api'

export function Splash() {
  return (
    <div id="top" style={{ padding: '15vh 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <p className="small mono" style={{ opacity: 0.5, letterSpacing: '0.14em' }}>
        FORYOU PLAYBOOK
      </p>
      <h1 className="display" style={{ marginTop: 24, fontSize: 'clamp(40px, 8vw, 96px)' }}>
        See how For You works.
      </h1>
      <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 96px)' }}>
        Then see how it works for you.
      </h1>
      <p className="lede" style={{ marginTop: 48 }}>
        <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
          Inside the For You
        </a>{' '}
        explains X's open-source ranking algorithm. It's the global rulebook.
      </p>
      <p className="lede" style={{ marginTop: 24 }}>
        But that isn't your algorithm. Your posts, your patterns, your playbook.
      </p>
      <a
        className="boxlink"
        style={{ marginTop: 64, display: 'inline-block' }}
        href={`${API_URL}/api/auth/x/start`}
      >
        Build my ForYou Playbook
      </a>
      <p className="small" style={{ marginTop: 24, opacity: 0.6 }}>
        Read-only X access. Your data, your control.{' '}
        <a href="/?page=privacy">Privacy</a> · <a href="/?page=terms">Terms</a>
      </p>
    </div>
  )
}
