export function Terms() {
  return (
    <div style={{ padding: '10vh 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="display">Terms</h1>
      <p className="lede" style={{ marginTop: 24 }}>
        ForYou Playbook is an experimental tool. It is not a guaranteed growth service. It does not
        promise virality. It never posts or interacts on X autonomously — the only write it can make
        is your scorecard post, after you review it and tap "Post to X" yourself.
      </p>

      <h2 className="cell-title" style={{ marginTop: 48 }}>
        What you get
      </h2>
      <p className="small">
        A personalized, evidence-based Playbook derived from your own posts and X's published
        algorithm incentives. The advice is a suggestion, not a guarantee.
      </p>

      <h2 className="cell-title" style={{ marginTop: 32 }}>
        What you agree to
      </h2>
      <p className="small">
        You authorize us to read your own X content and metrics via OAuth. You will not use the tool
        to harass, spam, or manipulate the X platform. You are responsible for your own posts.
      </p>

      <a className="boxlink" style={{ marginTop: 48, display: 'inline-block' }} href="/">
        Back
      </a>
    </div>
  )
}
