import { motion } from 'framer-motion'
import { API_URL } from '../api'
import { Reveal, Section } from '../components/Reveal'

export function Splash() {
  return (
    <Section id="top" theme="light" eyebrow="ForYou Playbook">
      <Reveal>
        <div className="score-card" style={{ maxWidth: 760, margin: '0 auto' }}>
          <span className="tag" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
            The algorithm is global. The Playbook is yours.
          </span>
          <h1 className="display" style={{ marginTop: 12 }}>
            Discover your X.
          </h1>
          <p className="lede" style={{ marginTop: 24 }}>
            <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
              Inside the For You
            </a>{' '}
            explains the global algorithm. ForYou Playbook reads your own posts and discovers the
            patterns that are working for you — then builds five moves.
          </p>

          <div className="bar-track score-bar" style={{ marginTop: 32 }}>
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

          <a
            className="boxlink"
            style={{ marginTop: 40, display: 'inline-block' }}
            href={`${API_URL}/api/auth/x/start`}
          >
            Build my ForYou Playbook →
          </a>
          <p className="small" style={{ marginTop: 16, opacity: 0.6 }}>
            Read-only X access. Your data, your control.{' '}
            <a href="/?page=privacy">Privacy</a> · <a href="/?page=terms">Terms</a>
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
