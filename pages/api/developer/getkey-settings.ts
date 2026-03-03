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
    const { data: last } = await supabaseAdmin.from('getkey_settings')
      .select('order_index').order('order_index', { ascending: false }).limit(1).single()
    const { data, error } = await supabaseAdmin.from('getkey_settings')
      .insert({ name, url, duration_seconds: parseInt(duration_seconds)||30, order_index: (last?.order_index||0)+1 }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ step: data })
  }
  if (req.method === 'PATCH') {
    const { id, ...upd } = req.body
    if (!id) return res.status(400).json({ error: 'id wajib' })
    if (upd.duration_seconds) upd.duration_seconds = parseInt(upd.duration_seconds)
    const { data, error } = await supabaseAdmin.from('getkey_settings').update(upd).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ step: data })
  }
  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id wajib' })
    const { error } = await supabaseAdmin.from('getkey_settings').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }
  res.status(405).end()
}
