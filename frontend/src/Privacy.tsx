export function Privacy() {
  return (
    <div style={{ padding: '10vh 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="display">Privacy</h1>
      <p className="lede" style={{ marginTop: 24 }}>
        ForYou Playbook reads your own X posts and metrics to generate a personal strategy Playbook.
        We do not post, like, follow, or send messages on your behalf. We do not analyze other users'
        accounts. We do not train AI/ML models on your content.
      </p>

      <h2 className="cell-title" style={{ marginTop: 48 }}>
        What we collect
      </h2>
      <p className="small">
        Your X profile, posts, public metrics, and available creator non-public metrics from the last
        30 days. We store OAuth tokens encrypted with a key you control.
      </p>

      <h2 className="cell-title" style={{ marginTop: 32 }}>
        How we use it
      </h2>
      <p className="small">
        To generate your Playbook, compute your ForYou Fit, and produce recommendations. Optional
        public sharing is strictly opt-in and share-safe: it never exposes private metrics or your
        full post archive.
      </p>

      <h2 className="cell-title" style={{ marginTop: 32 }}>
        Retention and deletion
      </h2>
      <p className="small">
        Data persists while your account is connected. You can delete all data at any time from your
        Playbook page. Deletion is immediate and irreversible.
      </p>

      <a className="boxlink" style={{ marginTop: 48, display: 'inline-block' }} href="/">
        Back
      </a>
    </div>
  )
}
