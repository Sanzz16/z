import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  // GET — status event + top skor
  if (req.method === 'GET') {
    const { data: settings } = await supabaseAdmin
      .from('blockblast_settings')
      .select('event_active')
      .single()

    const { data: scores } = await supabaseAdmin
      .from('blockblast_scores')
      .select('username, score, played_at')
      .order('score', { ascending: false })
      .limit(20)

    return res.json({
      event_active: settings?.event_active ?? false,
      scores: scores || []
    })
  }

  // POST — toggle event + optional notify
  if (req.method === 'POST') {
    const { event_active, notify, event_name } = req.body

    const { error } = await supabaseAdmin
      .from('blockblast_settings')
      .upsert({ id: 1, event_active }, { onConflict: 'id' })

    if (error) return res.status(500).json({ error: error.message })

    // Kirim notifikasi ke semua user kalau event diaktifkan
    if (event_active && notify !== false) {
      const name = event_name || 'Block Blast Tournament'
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_banned', false)
      if (allUsers?.length) {
        await supabaseAdmin.from('notifications').insert(
          allUsers.map((u: any) => ({
            user_id: u.id,
            title: `🎮 Event ${name} Dimulai!`,
            message: `Raih skor tertinggi di Block Blast & menangkan Key AWR! 🏆`,
            type: 'announcement'
          }))
        )
      }
    }

    return res.json({ success: true, event_active })
  }

  // DELETE — reset skor & akhiri event
  if (req.method === 'DELETE') {
    const { send_prizes } = req.body

    if (send_prizes) {
      // Ambil top 3 untuk kirim key hadiah
      const { data: scores } = await supabaseAdmin
        .from('blockblast_scores')
        .select('user_id, username, score')
        .order('score', { ascending: false })
        .limit(3)

      const prizes = ['30d', '7d', '7d']
      const durDays: Record<string,number> = { '24h':1,'3d':3,'5d':5,'7d':7,'20d':20,'30d':30,'60d':60 }

      for (let i = 0; i < (scores || []).length; i++) {
        const s = scores![i]
        const prizeKey = prizes[i]
        const days = durDays[prizeKey] || 30
        const expires = new Date(Date.now() + days * 86400000).toISOString()
        const keyVal = 'AWR-EVT-' + Math.random().toString(36).slice(2,8).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase()

        const { data: newKey } = await supabaseAdmin.from('keys').insert({
          key_value: keyVal,
          assigned_to: s.user_id,
          created_by: user.id,
          duration_type: prizeKey === '30d' ? '30d' : '7d',
          expires_at: expires,
          hwid_max: 3,
          is_active: true
        }).select().single()

        if (newKey) {
          const label = ['Juara 1 🥇','Juara 2 🥈','Juara 3 🥉'][i]
          await supabaseAdmin.from('notifications').insert({
            user_id: s.user_id,
            title: `🏆 Selamat! Kamu ${label} Block Blast!`,
            message: `Key hadiahmu: ${keyVal} (${prizeKey}) — Makasih udah ikut event!`,
            type: 'announcement'
          })
        }
      }
    }

    // Reset skor & matiin event
    await supabaseAdmin.from('blockblast_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('blockblast_settings').upsert({ id: 1, event_active: false }, { onConflict: 'id' })

    return res.json({ success: true })
  }

  res.status(405).end()
}
