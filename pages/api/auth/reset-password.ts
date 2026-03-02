import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, code, newPassword } = req.body
  if (!email || !code || !newPassword)
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password minimal 6 karakter' })

  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
  if (!user) return res.status(400).json({ error: 'Email tidak ditemukan' })

  const { data: reset } = await supabaseAdmin.from('password_resets')
    .select('*').eq('user_id', user.id).eq('code', code).single()

  if (!reset) return res.status(400).json({ error: 'Kode tidak valid' })
  if (new Date(reset.expires_at) < new Date())
    return res.status(400).json({ error: 'Kode sudah expired (20 menit)' })

  await supabaseAdmin.from('users').update({
    password_hash: await hashPassword(newPassword),
    updated_at: new Date().toISOString()
  }).eq('id', user.id)

  await supabaseAdmin.from('password_resets').delete().eq('user_id', user.id)

  res.json({ success: true, message: 'Password berhasil direset!' })
}
