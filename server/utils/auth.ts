// 密码哈希 & token 工具
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '~/types'
import type { H3Event } from 'h3'
import { getRequestHeader, createError } from 'h3'

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

export function signToken(payload: AuthTokenPayload): string {
  const cfg = useRuntimeConfig()
  return jwt.sign(payload, cfg.jwtSecret as string, { expiresIn: '30d' })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  const cfg = useRuntimeConfig()
  try {
    return jwt.verify(token, cfg.jwtSecret as string) as AuthTokenPayload
  } catch {
    return null
  }
}

export function getAuthUserPayload(event: H3Event): AuthTokenPayload | null {
  const raw = getRequestHeader(event, 'authorization')
  if (!raw) return null
  const token = raw.replace(/^Bearer\s+/i, '')
  return verifyToken(token)
}

export function requireAuth(event: H3Event): AuthTokenPayload {
  const payload = getAuthUserPayload(event)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return payload
}
