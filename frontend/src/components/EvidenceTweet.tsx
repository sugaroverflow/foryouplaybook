export type EvidencePost = {
  x_post_id: string
  text: string
  created_at: string
  likes: number | null
  replies: number | null
  reposts: number | null
  impressions: number | null
}

export type Author = {
  username: string
  displayName: string
  profileImageUrl: string | null
}

function formatCount(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="tweet-icon" aria-hidden="true">
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
    </svg>
  )
}

function RepostIcon() {
  return (
    <svg viewBox="0 0 24 24" className="tweet-icon" aria-hidden="true">
      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55v6.34c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v6.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
    </svg>
  )
}

function LikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="tweet-icon" aria-hidden="true">
      <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
    </svg>
  )
}

function ViewsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="tweet-icon" aria-hidden="true">
      <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
    </svg>
  )
}

export function EvidenceTweet({
  post,
  author,
  label,
}: {
  post: EvidencePost
  author: Author
  label: string
}) {
  return (
    <figure className="evidence">
      <figcaption className="evidence-caption">{label}</figcaption>
      <a
        className="tweet tweet-compact"
        href={`https://x.com/${author.username}/status/${post.x_post_id}`}
        target="_blank"
        rel="noreferrer"
      >
        {author.profileImageUrl ? (
          <img className="tweet-avatar" src={author.profileImageUrl} alt="" width={28} height={28} />
        ) : (
          <div className="tweet-avatar" style={{ background: '#1d9bf0' }}>
            {(author.displayName[0] || '?').toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="tweet-head">
            <span className="tweet-name">{author.displayName}</span>
            <span className="tweet-meta">
              @{author.username} · {formatDate(post.created_at)}
            </span>
          </div>
          <p className="tweet-body">{post.text}</p>
          <div className="tweet-actions">
            <span className="tweet-action reply">
              <ReplyIcon /> {formatCount(post.replies)}
            </span>
            <span className="tweet-action repost">
              <RepostIcon /> {formatCount(post.reposts)}
            </span>
            <span className="tweet-action like">
              <LikeIcon /> {formatCount(post.likes)}
            </span>
            <span className="tweet-action views">
              <ViewsIcon /> {formatCount(post.impressions)}
            </span>
          </div>
        </div>
      </a>
    </figure>
  )
}
