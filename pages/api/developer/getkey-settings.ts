import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin.from('getkey_settings').select('*').order('order_index')
    return res.json({ steps: data || [] })
  }
  const user = await requireDeveloper(req, res)
  if (!user) return

  if (req.method === 'POST') {
    const { name, url, duration_seconds } = req.body
    if (!name || !url) return res.status(400).json({ error: 'Nama dan URL wajib' })
    const { data: existing } = await supabaseAdmin.from('getkey_settings').select('order_index').order('order_index', { ascending: false }).limit(1).single()
    const nextOrder = (existing?.order_index || 0) + 1
    const { data, error } = await supabaseAdmin.from('getkey_settings').insert({ name, url, duration_seconds: duration_seconds || 30, order_index: nextOrder }).select().single()
    if (error) return res.status(500).json({ error: 'Gagal tambah step' })
    return res.json({ step: data })
  }

  if (req.method === 'PATCH') {
    const { id, name, url, duration_seconds, is_active } = req.body
    const upd: any = {}
    if (name !== undefined) upd.name = name
    if (url !== undefined) upd.url = url
    if (duration_seconds !== undefined) upd.duration_seconds = duration_seconds
    if (is_active !== undefined) upd.is_active = is_active
    const { data, error } = await supabaseAdmin.from('getkey_settings').update(upd).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: 'Gagal update' })
    return res.json({ step: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabaseAdmin.from('getkey_settings').delete().eq('id', id)
    return res.json({ success: true })
  }

  res.status(405).end()
}
