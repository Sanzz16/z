import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

function mask(name: string) {
  if (name.length <= 2) return name
  const k = Math.ceil(name.length / 3)
  return name.slice(0, k) + '*'.repeat(Math.max(1, name.length - k * 2)) + name.slice(-k)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { data } = await supabaseAdmin.from('users')
    .select('username, roblox_username, total_executions')
    .eq('is_banned', false).order('total_executions', { ascending: false }).limit(20)

  res.json({
    leaderboard: (data || []).map((u: any, i: number) => ({
      rank: i + 1,
      username: mask(u.username || ''),
      roblox_username: u.roblox_username ? mask(u.roblox_username) : null,
      total_executions: u.total_executions || 0
    }))
  })
}
