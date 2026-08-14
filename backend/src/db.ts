import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function initDb() {
  const path = config.databaseUrl
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  return db
}

export const db = initDb()

const schema = readFileSync(join(__dirname, '../migrations/001-init.sql'), 'utf8')
db.exec(schema)
