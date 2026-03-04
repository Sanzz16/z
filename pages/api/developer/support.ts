import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin.from('support_settings').select('*').limit(1).single()
    return res.json({ support: data || null })
  }
  const user = await requireDeveloper(req, res)
  if (!user) return
  if (req.method === 'PATCH') {
    const { whatsapp_url, telegram_url, discord_url, custom_label, is_active } = req.body
    const { data: existing } = await supabaseAdmin.from('support_settings').select('id').limit(1).single()
    if (existing) {
      await supabaseAdmin.from('support_settings').update({ whatsapp_url: whatsapp_url||'', telegram_url: telegram_url||'', discord_url: discord_url||'', custom_label: custom_label||'Hubungi Support', is_active: is_active!==false, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('support_settings').insert({ whatsapp_url: whatsapp_url||'', telegram_url: telegram_url||'', discord_url: discord_url||'', custom_label: custom_label||'Hubungi Support', is_active: is_active!==false })
    }
    return res.json({ success: true })
  }
  res.status(405).end()
}
