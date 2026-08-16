import { motion } from 'framer-motion'

// Darkened from the fill palette so every grade passes WCAG AA as text on white
// (C was 2.94:1 at #ca8a04; B/D failed at small sizes) while keeping the hue story.
export const GRADE_COLOR: Record<string, string> = {
  A: '#0c6434',
  B: '#15803d',
  C: '#a16207',
  D: '#c2410c',
  F: '#c22a2a',
}

export const GRADE_PERCENT: Record<string, string> = {
  A: '100%',
  B: '75%',
  C: '50%',
  D: '25%',
  F: '5%',
}

export const FIT_ICON: Record<string, string> = {
  conversation: '💬',
  travels: '🚀',
  curiosity: '🔍',
  reach: '📣',
  momentum: '📈',
}

export type FitValue = { grade: string; confidence: string }

const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 }

export function overallGrade(fit: Record<string, FitValue>): string | null {
  const points = Object.values(fit)
    .map((v) => GRADE_POINTS[v.grade])
    .filter((n) => n !== undefined)
  if (points.length === 0) return null
  const avg = points.reduce((a, b) => a + b, 0) / points.length
  if (avg >= 3.5) return 'A'
  if (avg >= 2.5) return 'B'
  if (avg >= 1.5) return 'C'
  if (avg >= 0.5) return 'D'
  return 'F'
}

export function GradeStamp({ grade }: { grade: string }) {
  const color = GRADE_COLOR[grade] || '#888'
  return (
    <motion.div
      className="grade-stamp"
      style={{ color }}
      initial={{ opacity: 0, scale: 1.6, rotate: 18 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 5 }}
      viewport={{ once: true }}
      transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="grade-stamp-letter">{grade}</span>
      <span className="grade-stamp-label">Overall</span>
    </motion.div>
  )
}

export function GradeTile({ dim, val }: { dim: string; val: FitValue }) {
  const color = GRADE_COLOR[val.grade] || '#888'
  return (
    <div className="grade-tile" style={{ color }}>
      <span className="grade-tile-label">
        {FIT_ICON[dim]} {dim}
      </span>
      <span className="grade-tile-letter">{val.grade}</span>
      <div className="grade-tile-bar">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: GRADE_PERCENT[val.grade] || '0%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: 'currentColor' }}
        />
      </div>
      <span className="grade-tile-conf">{val.confidence} confidence</span>
    </div>
  )
}

export function GradeRail({ fit }: { fit: Record<string, FitValue> }) {
  return (
    <div className="grade-rail">
      {Object.entries(fit).map(([dim, val]) => (
        <GradeTile key={dim} dim={dim} val={val} />
      ))}
    </div>
  )
}
