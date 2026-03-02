import jwt      from 'jsonwebtoken'
import bcrypt   from 'bcryptjs'
import { supabaseAdmin } from './supabase'

const SECRET = process.env.JWT_SECRET || 'fallback-dev-secret'

export const hashPassword    = (pw: string)              => bcrypt.hash(pw, 10)
export const comparePassword = (pw: string, h: string)   => bcrypt.compare(pw, h)
export const signToken       = (payload: object): string => jwt.sign(payload, SECRET, { expiresIn: '7d' })

export function verifyToken(token: string): any {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export async function getUserFromToken(token: string) {
  const d = verifyToken(token)
  if (!d) return null
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', d.userId).single()
  return data
}

export function generateKey(): string {
  const C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = (n: number) => Array.from({ length: n }, () => C[Math.floor(Math.random() * C.length)]).join('')
  return [seg(6), seg(4), seg(4), seg(4), seg(6)].join('-')
}

export function getExpiryDate(type: string): Date | null {
  const map: Record<string, number> = { '24h':1, '3d':3, '5d':5, '7d':7, '30d':30, '60d':60 }
  if (type === 'lifetime') return null
  const d = new Date()
  d.setDate(d.getDate() + (map[type] ?? 1))
  return d
}
