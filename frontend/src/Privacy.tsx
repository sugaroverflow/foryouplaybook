export function Privacy() {
  return (
    <div style={{ padding: '10vh 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="display">Privacy</h1>
      <p className="lede" style={{ marginTop: 24 }}>
        ForYou Playbook reads your own X posts and metrics to generate a personal strategy Playbook.
        The only thing it ever writes is your scorecard post — and only when you review it and tap
        "Post to X" yourself. It never likes, follows, or sends messages, never posts on its own,
        does not analyze other users' accounts, and does not train AI/ML models on your content.
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
