import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'
import { hashPassword } from '../../../lib/auth'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: activeKey } = await supabaseAdmin.from('keys')
      .select('*').eq('assigned_to', user.id).eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single()

    const { data: allKeys } = await supabaseAdmin.from('keys')
      .select('*').eq('assigned_to', user.id)
      .order('created_at', { ascending: false }).limit(10)

    const { data: notifs } = await supabaseAdmin.from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(30)

    const { data: ann } = await supabaseAdmin.from('announcements')
      .select('*, creator:users!announcements_created_by_fkey(username, role)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(10)

    const { count: execCount } = await supabaseAdmin.from('execution_logs')
      .select('*', { count: 'exact', head: true }).eq('user_id', user.id)

    return res.json({
      user: { ...user, total_executions: execCount || 0 },
      key: activeKey || null,
      allKeys: allKeys || [],
      notifications: notifs || [],
      announcements: ann || []
    })
  }

  if (req.method === 'PATCH') {
    const { username, roblox_username, avatar_url, avatar_file_url, background_url, background_type, password, leaderboard_public } = req.body
    const upd: any = { updated_at: new Date().toISOString() }
    if (username !== undefined)          upd.username = username
    if (roblox_username !== undefined)   upd.roblox_username = roblox_username
    if (avatar_url !== undefined)        upd.avatar_url = avatar_url
    if (avatar_file_url !== undefined)   upd.avatar_file_url = avatar_file_url  // base64/url dari upload internal
    if (background_url !== undefined)    upd.background_url = background_url
    if (background_type !== undefined)   upd.background_type = background_type
    if (leaderboard_public !== undefined) upd.leaderboard_public = leaderboard_public
    if (password && password.length >= 6) upd.password_hash = await hashPassword(password)

    if (Object.keys(upd).length <= 1)
      return res.status(400).json({ error: 'Tidak ada perubahan' })

    const { error } = await supabaseAdmin.from('users').update(upd).eq('id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).end()
}
