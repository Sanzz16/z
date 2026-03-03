import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword, signToken, generateKey, getExpiryDate } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, email, password } = req.body
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  if (username.length < 3 || username.length > 30)
    return res.status(400).json({ error: 'Username 3–30 karakter' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password min 6 karakter' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Format email tidak valid' })

  const { data: exist } = await supabaseAdmin.from('users').select('id')
    .or(`username.eq.${username},email.eq.${email}`).limit(1).single()
  if (exist) return res.status(400).json({ error: 'Username atau email sudah terdaftar' })

  const password_hash = await hashPassword(password)
  const { data: user, error } = await supabaseAdmin.from('users')
    .insert({ username, email, password_hash, role: 'user' }).select().single()
  if (error || !user) return res.status(500).json({ error: 'Gagal daftar: ' + (error?.message || '') })

  // Auto beri key 24 jam gratis saat daftar
  const keyVal = generateKey()
  const exp = getExpiryDate('24h')
  const { data: newKey } = await supabaseAdmin.from('keys').insert({
    key_value: keyVal, created_by: null, assigned_to: user.id,
    hwid_max: 1, expires_at: exp?.toISOString() ?? null,
    duration_type: '24h', is_active: true, is_free_key: true
  }).select().single()

  if (newKey) {
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id, title: '🎉 Selamat Datang!',
      message: `Halo ${username}! Key 24 jam gratis sudah aktif. Nikmati AWR Script!`,
      type: 'key', key_id: newKey.id
    })
  }

  const token = signToken({ userId: user.id, role: user.role }, false)
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  })
}
