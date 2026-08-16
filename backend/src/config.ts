import { config as dotenvConfig } from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenvConfig({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') })

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var: ${key}`)
  return v
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || './data/foryouplaybook.sqlite',
  frontendUrl: requireEnv('FRONTEND_URL'),
  xClientId: requireEnv('X_CLIENT_ID'),
  xClientSecret: requireEnv('X_CLIENT_SECRET'),
  xRedirectUri: requireEnv('X_REDIRECT_URI'),
  xaiApiKey: requireEnv('XAI_API_KEY'),
  xaiModel: process.env.XAI_MODEL || 'grok-3-latest',
  tokenEncryptionKey: requireEnv('TOKEN_ENCRYPTION_KEY'),
  currentRegimeStart: process.env.CURRENT_REGIME_START || '2026-07-31T00:00:00.000Z',
  maxPosts: Number(process.env.MAX_POSTS) || 100,
  monthlyScanBudget: Number(process.env.MONTHLY_SCAN_BUDGET) || 100,
}
