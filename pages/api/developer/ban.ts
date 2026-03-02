import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireDeveloper(req, res)
  if (!user) return
  const { userId, action, reason } = req.body
  if (!userId || !action) return res.status(400).json({ error: 'userId dan action wajib' })

  if (action === 'ban') {
    await supabaseAdmin.from('keys').update({ is_active: false }).eq('assigned_to', userId)
    await supabaseAdmin.from('users').update({ is_banned: true, ban_reason: reason || 'Dibanned' }).eq('id', userId)
    return res.json({ success: true, message: 'User dibanned' })
  }
  if (action === 'unban') {
    await supabaseAdmin.from('users').update({ is_banned: false, ban_reason: null }).eq('id', userId)
    return res.json({ success: true, message: 'User di-unban' })
  }
  res.status(400).json({ error: 'Action tidak valid' })
}
