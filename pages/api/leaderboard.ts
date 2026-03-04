import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data } = await supabaseAdmin.from('users')
    .select('username, roblox_username, total_executions, avatar_url, avatar_file_url, leaderboard_public')
    .eq('is_banned', false)
    .gt('total_executions', 0)
    .order('total_executions', { ascending: false })
    .limit(50)
  
  const lb = (data || []).map((u, i) => ({
    rank: i + 1,
    username: u.username,
    roblox_username: u.roblox_username,
    total_executions: u.total_executions,
    avatar_url: u.avatar_url || null,
    avatar_file_url: u.avatar_file_url || null,
    leaderboard_public: u.leaderboard_public !== false  // default true
  }))
  
  res.json({ leaderboard: lb })
}
