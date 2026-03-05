import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin.from('music_settings').select('*').limit(1).single()
    return res.json({ music: data || null })
  }
  const user = await requireDeveloper(req, res)
  if (!user) return
  if (req.method === 'PATCH') {
    const { url, type, is_active, volume, title } = req.body
    const { data: existing } = await supabaseAdmin.from('music_settings').select('id').limit(1).single()
    if (existing) {
      await supabaseAdmin.from('music_settings').update({ url: url||'', type: type||'url', is_active: is_active!==false, volume: volume||50, title: title||'AWR Music', updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('music_settings').insert({ url: url||'', type: type||'url', is_active: is_active!==false, volume: volume||50, title: title||'AWR Music' })
    }
    return res.json({ success: true })
  }
  res.status(405).end()
}
