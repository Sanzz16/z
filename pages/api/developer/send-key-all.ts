import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'
import { generateKey, getExpiryDate } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireDeveloper(req, res)
  if (!user) return
  const { duration_type, hwid_max } = req.body
  if (!duration_type) return res.status(400).json({ error: 'Durasi wajib dipilih' })
  const hmax = Math.min(parseInt(hwid_max)||1, 999999999)
  const exp = getExpiryDate(duration_type)
  const { data: newKey, error } = await supabaseAdmin.from('keys').insert({
    key_value: generateKey(), created_by: user.id, hwid_max: hmax,
    expires_at: exp?.toISOString()??null, duration_type, is_active: true
  }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  const { data: allUsers } = await supabaseAdmin.from('users').select('id').eq('is_banned', false)
  if (allUsers?.length) {
    await supabaseAdmin.from('notifications').insert(
      allUsers.map((u: any) => ({
        user_id: u.id, title: '🎁 Key Global Tersedia!',
        message: `Developer membagikan key ${duration_type} untuk semua user! Key: ${newKey.key_value}`,
        type: 'key', key_id: newKey.id
      }))
    )
  }
  res.json({ key: newKey, notified: allUsers?.length || 0 })
}
