import type { Author } from './EvidenceTweet'

export function CardAvatar({ author, size = 44 }: { author: Author; size?: number }) {
  if (author.profileImageUrl) {
    return (
      <img
        className="card-avatar"
        src={author.profileImageUrl}
        alt={`@${author.username}`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div className="card-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(author.displayName[0] || '?').toUpperCase()}
    </div>
  )
}
