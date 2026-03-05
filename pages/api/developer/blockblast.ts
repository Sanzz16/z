import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  // GET — scores + event status
  if (req.method === 'GET') {
    const { data: settings } = await supabaseAdmin
      .from('blockblast_settings')
      .select('event_active')
      .single()

    const { data: scores } = await supabaseAdmin
      .from('blockblast_scores')
      .select('id, username, score, played_at')
      .order('score', { ascending: false })
      .limit(50)

    return res.json({
      event_active: settings?.event_active ?? false,
      scores: scores || []
    })
  }

  // PATCH — toggle event
  if (req.method === 'PATCH') {
    const { event_active } = req.body
    const { error } = await supabaseAdmin
      .from('blockblast_settings')
      .upsert({ id: 1, event_active }, { onConflict: 'id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  // DELETE — reset all scores
  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('blockblast_scores').delete().neq('id', '')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, message: 'Semua skor direset' })
  }

  return res.status(405).end()
}
