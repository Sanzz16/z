import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { comparePassword, signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Isi username dan password' })

  const { data: user } = await supabaseAdmin.from('users').select('*').eq('username', username).single()
  if (!user) return res.status(401).json({ error: 'Username atau password salah' })
  if (user.is_banned) return res.status(403).json({ error: `Akun kamu dibanned: ${user.ban_reason || '-'}` })
  if (!await comparePassword(password, user.password_hash))
    return res.status(401).json({ error: 'Username atau password salah' })

  const token = signToken({ userId: user.id, role: user.role })
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role,
      roblox_username: user.roblox_username, roblox_id: user.roblox_id,
      avatar_url: user.avatar_url, background_url: user.background_url, background_type: user.background_type }
  })
}
