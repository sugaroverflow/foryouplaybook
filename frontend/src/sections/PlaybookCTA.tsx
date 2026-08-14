import { API_URL } from '../api'
import { Reveal, Section } from '../components/Reveal'

export function PlaybookCTA() {
  return (
    <Section id="playbook" theme="dark" eyebrow="okay, but this isn't your algorithm">
      <Reveal>
        <h2 className="display">
          X builds every For You feed differently.{" "}
          <span className="dim">Let's see what happens when people encounter you.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="lede">
          Connect your account and I'll read your own posts under the current For You regime. No
          posting, no spam, no generic dashboard — just five moves for you.
        </p>
      </Reveal>
      <Reveal delay={0.2}>
        <div style={{ marginTop: 40 }}>
          <a className="boxlink" href={`${API_URL}/api/auth/x/start`}>
            Build my ForYou Playbook →
          </a>
        </div>
      </Reveal>
    </Section>
  )
}
