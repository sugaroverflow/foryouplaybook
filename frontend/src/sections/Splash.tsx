import { motion } from 'framer-motion'
import { API_URL } from '../api'
import { Reveal, Section } from '../components/Reveal'

export function Splash() {
  return (
    <Section id="top" theme="dark" eyebrow="ForYou Playbook">
      <Reveal>
        <div
          className="score-card"
          style={{ maxWidth: 760, margin: '0 auto', color: 'var(--ink)' }}
        >
          <span
            className="tag"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}
          >
            The algorithm is global. The Playbook is yours.
          </span>
          <h1 className="display" style={{ marginTop: 12 }}>
            Discover your X scorecard.
          </h1>
          <p className="lede" style={{ marginTop: 24, color: 'var(--muted-on-light)' }}>
            Inspired by{' '}
            <a href="https://insidetheforyou.com" target="_blank" rel="noreferrer">
              Nader's Inside the For You
            </a>
            , the ForYou Playbook analyzes your own posts under the current For You regime and
            generates a scorecard and recommendations!
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
          <p className="small" style={{ marginTop: 12, color: 'var(--muted-on-light)' }}>
            Global rulebook on the left. Your data completes the picture on the right.
          </p>

          <a
            className="boxlink"
            style={{ marginTop: 40, display: 'inline-block' }}
            href={`${API_URL}/api/auth/x/start`}
          >
            Build my ForYou Playbook →
          </a>
          <p className="small" style={{ marginTop: 16, color: 'var(--muted-on-light)', opacity: 0.6 }}>
            Read-only X access. Your data, your control.{' '}
            <a href="/?page=privacy">Privacy</a> · <a href="/?page=terms">Terms</a>
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
