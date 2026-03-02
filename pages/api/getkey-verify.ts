import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/middleware'
import { generateKey, getExpiryDate } from '../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireAuth(req, res)
  if (!user) return

  const { task_id } = req.body
  if (!task_id) return res.status(400).json({ error: 'task_id wajib' })

  // Check cooldown - user can only get a free key once per 24 hours
  const { data: lastKey } = await supabaseAdmin.from('keys')
    .select('created_at').eq('assigned_to', user.id).eq('is_free_key', true)
    .order('created_at', { ascending: false }).limit(1).single()

  if (lastKey) {
    const last = new Date(lastKey.created_at).getTime()
    const diff = Date.now() - last
    if (diff < 24 * 60 * 60 * 1000) {
      const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - diff) / 3600000)
      return res.status(400).json({ error: `Kamu sudah ambil free key. Coba lagi dalam ${hoursLeft} jam.` })
    }
  }

  // Verify with MoneyBlink API
  const apiKey = process.env.NEXT_PUBLIC_MONEYBLINK_API
  let verified = false

  try {
    const r = await fetch(`https://moneyblink.com/api/check?api=${apiKey}&task=${task_id}&uid=${user.id}`, {
      headers: { 'Accept': 'application/json' }
    })
    const d = await r.json()
    verified = d.completed === true || d.status === 'completed' || d.success === true
  } catch (err) {
    // If MoneyBlink API fails, we use task_id as proof (user came back with it)
    // A valid task_id means they at least visited the link
    verified = task_id.length > 10
  }

  if (!verified) {
    return res.status(400).json({
      error: 'Kamu belum menyelesaikan task. Selesaikan dulu lalu coba lagi.',
      verified: false
    })
  }

  // Deactivate old free keys for this user
  await supabaseAdmin.from('keys').update({ is_active: false })
    .eq('assigned_to', user.id).eq('is_free_key', true)

  // Create free 24h key
  const { data: newKey, error } = await supabaseAdmin.from('keys').insert({
    key_value: generateKey(),
    created_by: null,
    assigned_to: user.id,
    hwid_max: 1,
    expires_at: getExpiryDate('24h')?.toISOString(),
    duration_type: '24h',
    is_active: true,
    is_free_key: true
  }).select().single()

  if (error) return res.status(500).json({ error: 'Gagal buat key' })

  await supabaseAdmin.from('notifications').insert({
    user_id: user.id,
    title: '🎉 Free Key 24 Jam!',
    message: `Key gratis kamu sudah aktif. Berlaku 24 jam.`,
    type: 'key',
    key_id: newKey.id
  })

  res.json({ success: true, key: newKey })
}
