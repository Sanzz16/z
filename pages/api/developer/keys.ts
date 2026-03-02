import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: keys } = await supabaseAdmin.from('keys')
      .select('*, owner:users!keys_assigned_to_fkey(username), creator:users!keys_created_by_fkey(username)')
      .order('created_at', { ascending: false })
    return res.json({ keys: keys || [] })
  }

  if (req.method === 'PATCH') {
    const { keyId, is_active, duration_type, hwid_max, assigned_to_username, expires_at } = req.body
    const upd: any = { updated_at: new Date().toISOString() }
    if (is_active   !== undefined) upd.is_active    = is_active
    if (hwid_max    !== undefined) upd.hwid_max      = Math.min(parseInt(hwid_max), 999999999999)
    if (expires_at  !== undefined) upd.expires_at    = expires_at
    if (duration_type)             upd.duration_type = duration_type
    if (assigned_to_username) {
      const { data: t } = await supabaseAdmin.from('users').select('id').eq('username', assigned_to_username).single()
      if (t) upd.assigned_to = t.id
    }
    const { data, error } = await supabaseAdmin.from('keys').update(upd).eq('id', keyId).select().single()
    if (error) return res.status(500).json({ error: 'Gagal update key' })
    return res.json({ key: data })
  }

  if (req.method === 'DELETE') {
    const { keyId } = req.body
    await supabaseAdmin.from('keys').delete().eq('id', keyId)
    return res.json({ success: true })
  }

  res.status(405).end()
}
