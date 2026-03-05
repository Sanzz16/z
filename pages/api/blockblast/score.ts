import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const user = await requireAuth(req, res)
  if (!user) return

  // Cek apakah event aktif
  const { data: settings } = await supabaseAdmin
    .from('blockblast_settings')
    .select('event_active')
    .single()
  
  if (!settings?.event_active) {
    return res.status(400).json({ error: 'Event Block Blast sedang tidak aktif' })
  }

  const { score } = req.body
  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Skor tidak valid' })
  }

  // Upsert — hanya simpan jika skor lebih tinggi dari sebelumnya
  const { data: existing } = await supabaseAdmin
    .from('blockblast_scores')
    .select('score')
    .eq('user_id', user.id)
    .single()
    .catch(() => ({ data: null }))

  if (existing && existing.score >= score) {
    return res.json({ success: true, best_score: existing.score, message: 'Skor lamamu lebih tinggi!' })
  }

  const { error } = await supabaseAdmin
    .from('blockblast_scores')
    .upsert({
      user_id: user.id,
      username: user.username,
      score,
      played_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ success: true, best_score: score, message: '🎉 Skor baru tersimpan!' })
}
