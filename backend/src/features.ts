export interface PostFeatures {
  char_count: number
  long_form: boolean
  has_url: boolean
  media_type: string
  thread_starter: boolean
  question: boolean
  mentions: number
  hashtags: number
  day_of_week: string
  hour: number
}

export function extractPostFeatures(post: {
  text: string
  x_post_id: string
  conversation_id: string | null
  post_type: string
  has_url: number
  media_type: string | null
  created_at: string
}): PostFeatures {
  const text = post.text || ''
  const created = new Date(post.created_at)
  const isThreadStarter = Boolean(
    post.conversation_id && post.conversation_id !== post.x_post_id
  )
  const isNote = text.length > 280

  return {
    char_count: text.length,
    long_form: isNote,
    has_url: Boolean(post.has_url),
    media_type: post.media_type || 'none',
    thread_starter: isThreadStarter,
    question: /\?/.test(text),
    mentions: (text.match(/@\w+/g) || []).length,
    hashtags: (text.match(/#\w+/g) || []).length,
    day_of_week: created.toLocaleDateString('en-US', { weekday: 'long' }),
    hour: created.getUTCHours(),
  }
}
