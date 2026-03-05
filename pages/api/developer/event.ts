import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

const DUR_DAYS: Record<string,number> = { '24h':1,'3d':3,'5d':5,'7d':7,'30d':30,'60d':60,'lifetime':36500 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  // GET — get active event + leaderboard
  if (req.method === 'GET') {
    const { data: events } = await supabaseAdmin
      .from('game_events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    const event = events?.[0] || null

    let leaderboard: any[] = []
    if (event) {
      const { data: scores } = await supabaseAdmin
        .from('event_scores')
        .select('user_id, score, users(username, roblox_username)')
        .eq('event_id', event.id)
        .order('score', { ascending: false })
        .limit(20)
      leaderboard = (scores || []).map((s: any, i: number) => ({
        user_id: s.user_id,
        username: s.users?.username,
        roblox_username: s.users?.roblox_username,
        score: s.score,
        rank: i + 1
      }))
    }
    return res.json({ event, leaderboard })
  }

  // POST — buat atau update event
  if (req.method === 'POST') {
    const { name, description, duration_days, prize1, prize2, prize3, start_at, end_at } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nama event wajib' })

    // Nonaktifkan event lama dulu
    await supabaseAdmin.from('game_events').update({ is_active: false }).eq('is_active', true)

    const startDate = start_at ? new Date(start_at) : new Date()
    const endDate = end_at ? new Date(end_at) : new Date(startDate.getTime() + duration_days * 86400000)

    const { data: newEvent, error } = await supabaseAdmin.from('game_events').insert({
      name: name.trim(),
      description: description?.trim() || '',
      duration_days: duration_days || 3,
      prize1: prize1 || '30d',
      prize2: prize2 || '20d',
      prize3: prize3 || '15d',
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      created_by: user.id,
      is_active: true
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })

    // Kirim notifikasi ke semua user
    const { data: allUsers } = await supabaseAdmin.from('users').select('id').eq('is_banned', false)
    if (allUsers?.length) {
      await supabaseAdmin.from('notifications').insert(
        allUsers.map((u: any) => ({
          user_id: u.id,
          title: `🎮 Event Block Blast Dimulai!`,
          message: `${name.trim()} — Raih skor tertinggi & menangkan Key AWR! 🏆`,
          type: 'announcement'
        }))
      )
    }
    return res.json({ success: true, event: newEvent })
  }

  // DELETE — akhiri event & kirim hadiah ke top 3
  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID event wajib' })

    const { data: ev } = await supabaseAdmin.from('game_events').select('*').eq('id', id).single()
    if (!ev) return res.status(404).json({ error: 'Event tidak ditemukan' })

    // Ambil top 3
    const { data: scores } = await supabaseAdmin
      .from('event_scores')
      .select('user_id, score')
      .eq('event_id', id)
      .order('score', { ascending: false })
      .limit(3)

    const prizes = [ev.prize1, ev.prize2, ev.prize3]
    const durMap: Record<string,number|null> = {
      '24h': 1,'3d': 3,'5d': 5,'7d': 7,'30d': 30,'60d': 60,'lifetime': null
    }
    const winners = scores || []
    for (let i = 0; i < winners.length; i++) {
      const prizeKey = prizes[i] || '7d'
      const days = durMap[prizeKey] !== undefined ? durMap[prizeKey] : 7
      const expires = days === null ? null : new Date(Date.now() + days * 86400000).toISOString()
      const keyVal = 'AWR-EVT-' + Math.random().toString(36).slice(2,10).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase()
      const { data: newKey } = await supabaseAdmin.from('keys').insert({
        key_value: keyVal,
        assigned_to: winners[i].user_id,
        created_by: user.id,
        duration_type: prizeKey,
        expires_at: expires,
        hwid_max: 3,
        is_active: true
      }).select().single()
      if (newKey) {
        const placeLabel = ['Juara 1 🥇','Juara 2 🥈','Juara 3 🥉'][i]
        await supabaseAdmin.from('notifications').insert({
          user_id: winners[i].user_id,
          title: `🏆 Selamat! Kamu ${placeLabel} Event Block Blast!`,
          message: `Key hadiahmu: ${keyVal} (${prizeKey}) — Terima kasih sudah ikut event!`,
          type: 'key_received'
        })
      }
    }

    await supabaseAdmin.from('game_events').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', id)
    return res.json({ success: true, distributed: winners.length })
  }

  res.status(405).end()
}
