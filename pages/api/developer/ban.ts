import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireDeveloper(req, res)
  if (!user) return
  const { userId, action, reason } = req.body
  if (!userId || !action) return res.status(400).json({ error: 'userId dan action wajib' })
  if (userId === user.id) return res.status(400).json({ error: 'Tidak bisa ban diri sendiri' })

  const isBan = action === 'ban'
  const upd: any = { is_banned: isBan, ban_reason: isBan ? (reason || 'Melanggar aturan') : null }
  const { error } = await supabaseAdmin.from('users').update(upd).eq('id', userId)
  if (error) return res.status(500).json({ error: error.message })

  if (isBan) {
    await supabaseAdmin.from('keys').update({ is_active: false }).eq('assigned_to', userId)
  }
  res.json({ success: true, message: isBan ? 'User berhasil dibanned' : 'User berhasil di-unban' })
}
