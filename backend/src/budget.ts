import { config } from './config.js'
import { db } from './db.js'

export function monthStartIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

// Every scan burns MAX_POSTS reads from the X developer tier's monthly quota,
// so the app caps how many scans it will run per calendar month.
export function scanBudget(): { total: number; used: number; remaining: number } {
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM scans WHERE started_at >= ?')
    .get(monthStartIso()) as { n: number }
  const total = config.monthlyScanBudget
  return { total, used: row.n, remaining: Math.max(0, total - row.n) }
}
