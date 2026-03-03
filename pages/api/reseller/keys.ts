import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireReseller } from '../../../lib/middleware'
import { generateKey, getExpiryDate } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireReseller(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: keys, error } = await supabaseAdmin
      .from('keys')
      .select('*, owner:users!keys_assigned_to_fkey(username, email)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: 'Gagal ambil keys: ' + error.message })
    return res.json({ keys: keys || [] })
  }

  if (req.method === 'POST') {
    const { target_username, duration_type, hwid_max } = req.body
    if (!target_username || !duration_type)
      return res.status(400).json({ error: 'Pilih username dan durasi' })

    const { data: target, error: userErr } = await supabaseAdmin
      .from('users').select('id, username').eq('username', target_username).single()
    if (userErr || !target)
      return res.status(404).json({ error: 'User tidak ditemukan: ' + target_username })

    if (target.id === user.id)
      return res.status(400).json({ error: 'Tidak bisa kirim key ke diri sendiri' })

    const hmax = Math.min(parseInt(hwid_max) || 1, 999999999999)
    const exp  = getExpiryDate(duration_type)

    const { data: newKey, error } = await supabaseAdmin.from('keys').insert({
      key_value:     generateKey(),
      created_by:    user.id,
      assigned_to:   target.id,
      hwid_max:      hmax,
      expires_at:    exp?.toISOString() ?? null,
      duration_type: duration_type,
      is_active:     true,
      is_free_key:   false
    }).select().single()

    if (error) return res.status(500).json({ error: 'Gagal buat key: ' + error.message })

    await supabaseAdmin.from('notifications').insert({
      user_id: target.id,
      title:   '🔑 Key Baru!',
      message: user.username + ' mengirimkan key untuk kamu. Durasi: ' + duration_type,
      type:    'key',
      key_id:  newKey.id
    })

    return res.json({ key: newKey, message: 'Key berhasil dikirim ke ' + target_username })
  }

  res.status(405).end()
}
