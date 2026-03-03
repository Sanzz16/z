import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/middleware'
import { generateKey, getExpiryDate } from '../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin.from('getkey_settings')
      .select('id,name,url,duration_seconds,order_index').eq('is_active', true).order('order_index')
    return res.json({ steps: data || [] })
  }
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireAuth(req, res)
  if (!user) return
  const { completed_steps } = req.body
  const { data: active } = await supabaseAdmin.from('getkey_settings').select('id').eq('is_active', true)
  const activeIds = (active||[]).map((s:any) => s.id)
  const allDone = activeIds.length > 0 && activeIds.every((id:string) => (completed_steps||[]).includes(id))
  if (!allDone) return res.status(400).json({ error: 'Belum semua step selesai' })

  // Expire old free keys
  await supabaseAdmin.from('keys').update({ is_active: false })
    .eq('assigned_to', user.id).eq('is_free_key', true)

  const exp = getExpiryDate('24h')
  const { data: newKey, error } = await supabaseAdmin.from('keys').insert({
    key_value: generateKey(), created_by: null, assigned_to: user.id,
    hwid_max: 1, expires_at: exp?.toISOString()??null,
    duration_type: '24h', is_active: true, is_free_key: true
  }).select().single()
  if (error) return res.status(500).json({ error: 'Gagal buat key: ' + error.message })

  await supabaseAdmin.from('notifications').insert({
    user_id: user.id, title: '🎉 Free Key 24 Jam!',
    message: 'Key gratis kamu sudah aktif. Berlaku 24 jam. Selamat bermain!',
    type: 'key', key_id: newKey.id
  })
  res.json({ success: true, key: newKey })
}
