import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'
import { hashPassword } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const [{ data: key }, { data: notifs }, { data: ann }, { count: execCount }] = await Promise.all([
      supabaseAdmin.from('keys').select('*').eq('assigned_to', user.id).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(30),
      supabaseAdmin.from('announcements').select('*').eq('is_active', true)
        .order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('execution_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ])
    return res.json({
      user: { ...user, total_executions: execCount || 0 },
      key: key || null,
      notifications: notifs || [],
      announcements: ann || []
    })
  }

  if (req.method === 'PATCH') {
    const { username, roblox_username, avatar_url, background_url, background_type, password } = req.body
    const upd: any = { updated_at: new Date().toISOString() }

    if (username) {
      if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Username 3–30 karakter' })
      const { data: ex } = await supabaseAdmin.from('users').select('id')
        .eq('username', username).neq('id', user.id).single()
      if (ex) return res.status(400).json({ error: 'Username sudah dipakai' })
      upd.username = username
    }
    if (roblox_username !== undefined) upd.roblox_username = roblox_username
    if (avatar_url       !== undefined) upd.avatar_url       = avatar_url
    if (background_url   !== undefined) upd.background_url   = background_url
    if (background_type  !== undefined) upd.background_type  = background_type
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password min 6 karakter' })
      upd.password_hash = await hashPassword(password)
    }

    const { data, error } = await supabaseAdmin.from('users').update(upd).eq('id', user.id).select().single()
    if (error) return res.status(500).json({ error: 'Gagal update profil' })
    return res.json({ user: data })
  }

  res.status(405).end()
}
