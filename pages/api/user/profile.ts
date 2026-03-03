import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'
import { hashPassword } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    // Get active key (not expired)
    const { data: activeKey } = await supabaseAdmin.from('keys')
      .select('*').eq('assigned_to', user.id).eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single()

    // Get expired keys too (to show)
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
    const { username, roblox_username, avatar_url, background_url, background_type, password } = req.body
    const upd: any = { updated_at: new Date().toISOString() }

    if (username !== undefined && username !== user.username) {
      if (!username || username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Username 3–30 karakter' })
      const { data: ex } = await supabaseAdmin.from('users').select('id')
        .eq('username', username).neq('id', user.id).limit(1).single()
      if (ex) return res.status(400).json({ error: 'Username sudah dipakai' })
      upd.username = username
    }
    if (roblox_username !== undefined) upd.roblox_username = roblox_username || null
    if (avatar_url      !== undefined) upd.avatar_url       = avatar_url || null
    if (background_url  !== undefined) upd.background_url   = background_url || null
    if (background_type !== undefined) upd.background_type  = background_type || 'image'
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password min 6 karakter' })
      upd.password_hash = await hashPassword(password)
    }

    // updated_at selalu ada, jadi minimal harus ada 2 keys
    if (Object.keys(upd).length <= 1)
      return res.status(400).json({ error: 'Tidak ada perubahan' })

    const { data, error } = await supabaseAdmin.from('users')
      .update(upd).eq('id', user.id).select().single()
    if (error) return res.status(500).json({ error: 'Gagal update: ' + error.message })
    return res.json({ user: data, message: 'Profil berhasil diupdate' })
  }

  res.status(405).end()
}
