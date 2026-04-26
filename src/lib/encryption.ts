import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

// ============================================
// AES-256-GCM Encryption Utility
// Key diambil dari env: ENCRYPTION_SECRET
// ============================================

const ALGORITHM   = 'aes-256-gcm'
const IV_LENGTH   = 16   // bytes
const TAG_LENGTH  = 16   // bytes (auth tag GCM)
const SALT_LENGTH = 32   // bytes
const KEY_LENGTH  = 32   // bytes (256-bit)

// Derive 256-bit key dari secret + salt menggunakan scrypt
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH) as Buffer
}

/**
 * Enkripsi buffer file dengan AES-256-GCM
 * Output format: [salt(32)] + [iv(16)] + [authTag(16)] + [ciphertext]
 */
export function encryptBuffer(plainBuffer: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET tidak diset di .env.local')

  const salt = randomBytes(SALT_LENGTH)
  const iv   = randomBytes(IV_LENGTH)
  const key  = deriveKey(secret, salt)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()])
  const authTag   = cipher.getAuthTag()

  // Gabungkan semua: salt + iv + authTag + ciphertext
  return Buffer.concat([salt, iv, authTag, encrypted])
}

/**
 * Dekripsi buffer yang sudah dienkripsi
 * Input format: [salt(32)] + [iv(16)] + [authTag(16)] + [ciphertext]
 */
export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET tidak diset di .env.local')

  // Ekstrak komponen
  let offset = 0
  const salt    = encryptedBuffer.subarray(offset, offset + SALT_LENGTH); offset += SALT_LENGTH
  const iv      = encryptedBuffer.subarray(offset, offset + IV_LENGTH);   offset += IV_LENGTH
  const authTag = encryptedBuffer.subarray(offset, offset + TAG_LENGTH);  offset += TAG_LENGTH
  const ciphertext = encryptedBuffer.subarray(offset)

  const key = deriveKey(secret, salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Cek apakah buffer terlihat seperti file terenkripsi
 * (minimal harus lebih panjang dari header: salt+iv+tag = 64 bytes)
 */
export function isEncryptedBuffer(buffer: Buffer): boolean {
  return buffer.length > SALT_LENGTH + IV_LENGTH + TAG_LENGTH
}

/**
 * Hitung overhead enkripsi dalam bytes
 */
export const ENCRYPTION_OVERHEAD = SALT_LENGTH + IV_LENGTH + TAG_LENGTH // = 64 bytes
