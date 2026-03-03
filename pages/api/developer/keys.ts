import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'
import { generateKey, getExpiryDate } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: keys, error } = await supabaseAdmin.from('keys')
      .select('*, owner:users!keys_assigned_to_fkey(username), creator:users!keys_created_by_fkey(username)')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ keys: keys || [] })
  }

  if (req.method === 'POST') {
    const { target_username, duration_type, hwid_max } = req.body
    if (!target_username || !duration_type)
      return res.status(400).json({ error: 'Pilih username tujuan dan durasi' })
    const { data: target, error: ue } = await supabaseAdmin.from('users')
      .select('id,username').eq('username', target_username).single()
    if (ue || !target) return res.status(404).json({ error: `User "${target_username}" tidak ditemukan` })
    const hmax = Math.min(Math.max(parseInt(hwid_max)||1, 1), 999999999)
    const exp  = getExpiryDate(duration_type)
    const { data: newKey, error } = await supabaseAdmin.from('keys').insert({
      key_value: generateKey(), created_by: user.id, assigned_to: target.id,
      hwid_max: hmax, expires_at: exp?.toISOString()??null,
      duration_type, is_active: true, is_free_key: false
    }).select().single()
    if (error) return res.status(500).json({ error: 'Gagal buat key: ' + error.message })
    await supabaseAdmin.from('notifications').insert({
      user_id: target.id, title: '🔑 Key Baru dari Developer!',
      message: `Developer mengirimkan key ${duration_type} untuk kamu. Segera aktifkan!`,
      type: 'key', key_id: newKey.id
    })
    return res.json({ key: newKey, message: `Key berhasil dikirim ke ${target_username}` })
  }

  if (req.method === 'PATCH') {
    const { keyId, is_active, duration_type, hwid_max, assigned_to_username } = req.body
    if (!keyId) return res.status(400).json({ error: 'keyId wajib' })
    const upd: any = { updated_at: new Date().toISOString() }
    if (is_active    !== undefined) upd.is_active    = is_active
    if (hwid_max     !== undefined) upd.hwid_max     = parseInt(hwid_max)
    if (duration_type)              upd.duration_type = duration_type
    if (assigned_to_username) {
      const { data: t } = await supabaseAdmin.from('users').select('id').eq('username', assigned_to_username).single()
      if (!t) return res.status(404).json({ error: 'User tidak ditemukan' })
      upd.assigned_to = t.id
      const exp = getExpiryDate(upd.duration_type || 'lifetime')
      if (exp) upd.expires_at = exp.toISOString()
    }
    const { data, error } = await supabaseAdmin.from('keys').update(upd).eq('id', keyId).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ key: data })
  }

  if (req.method === 'DELETE') {
    const { keyId } = req.body
    if (!keyId) return res.status(400).json({ error: 'keyId wajib' })
    const { error } = await supabaseAdmin.from('keys').delete().eq('id', keyId)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).end()
}
