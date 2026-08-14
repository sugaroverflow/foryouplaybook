import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'
import { config } from './config.js'

const ALG = 'aes-256-gcm'

function keyBuf(): Buffer {
  const key = config.tokenEncryptionKey
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32')
  }
  return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALG, keyBuf(), iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':')
}

export function decrypt(token: string): string {
  const [ivB64, tagB64, encB64] = token.split(':')
  if (!ivB64 || !tagB64 || !encB64) throw new Error('Invalid encrypted token format')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const enc = Buffer.from(encB64, 'base64')
  const decipher = createDecipheriv(ALG, keyBuf(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
