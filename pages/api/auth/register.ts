import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword, signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, email, password } = req.body
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  if (username.length < 3 || username.length > 30)
    return res.status(400).json({ error: 'Username 3–30 karakter' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password minimal 6 karakter' })

  const { data: ex } = await supabaseAdmin.from('users').select('id')
    .or(`username.eq.${username},email.eq.${email}`).limit(1).single()
  if (ex) return res.status(400).json({ error: 'Username atau email sudah dipakai' })

  const { data: user, error } = await supabaseAdmin.from('users')
    .insert({ username, email, password_hash: await hashPassword(password), role: 'user' })
    .select().single()
  if (error) return res.status(500).json({ error: 'Gagal daftar, coba lagi' })

  const token = signToken({ userId: user.id, role: user.role })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
}
