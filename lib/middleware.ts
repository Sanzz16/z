import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromToken } from './auth'

export function getToken(req: NextApiRequest): string | null {
  const h = req.headers.authorization
  if (h?.startsWith('Bearer ')) return h.slice(7)
  return req.cookies?.token || null
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const t = getToken(req)
  if (!t) { res.status(401).json({ error: 'Unauthorized' }); return null }
  const u = await getUserFromToken(t)
  if (!u) { res.status(401).json({ error: 'Token tidak valid' }); return null }
  if (u.is_banned) { res.status(403).json({ error: 'Akun kamu dibanned' }); return null }
  return u
}

export async function requireReseller(req: NextApiRequest, res: NextApiResponse) {
  const u = await requireAuth(req, res)
  if (!u) return null
  if (u.role !== 'reseller' && u.role !== 'developer') {
    res.status(403).json({ error: 'Butuh akses reseller' }); return null
  }
  return u
}

export async function requireDeveloper(req: NextApiRequest, res: NextApiResponse) {
  const u = await requireAuth(req, res)
  if (!u) return null
  if (u.role !== 'developer') { res.status(403).json({ error: 'Butuh akses developer' }); return null }
  return u
}
