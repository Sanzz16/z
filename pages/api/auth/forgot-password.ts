import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { generateCode } from '../../../lib/auth'
import { sendResetCode } from '../../../lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email wajib diisi' })

  const { data: user } = await supabaseAdmin.from('users').select('id, username, email').eq('email', email).single()
  // Always return success to prevent email enumeration
  if (!user) return res.json({ success: true, message: 'Jika email terdaftar, kode akan dikirim' })

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

  // Store code in DB (delete old ones first)
  await supabaseAdmin.from('password_resets').delete().eq('user_id', user.id)
  await supabaseAdmin.from('password_resets').insert({
    user_id: user.id, code, expires_at: expiresAt
  })

  try {
    await sendResetCode(user.email, user.username, code)
  } catch (err) {
    console.error('Email error:', err)
    return res.status(500).json({ error: 'Gagal kirim email, coba lagi' })
  }

  res.json({ success: true, message: 'Kode reset dikirim ke email kamu', username: user.username })
}
