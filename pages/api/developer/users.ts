import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'
import { hashPassword } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: users } = await supabaseAdmin.from('users').select(`
      id, username, email, role, is_banned, ban_reason, roblox_username, roblox_id,
      total_executions, created_at,
      keys:keys!keys_assigned_to_fkey(key_value, expires_at, is_active, duration_type, times_used)
    `).order('created_at', { ascending: false })

    const withStats = await Promise.all((users || []).map(async (u: any) => {
      const { count } = await supabaseAdmin.from('execution_logs')
        .select('*', { count: 'exact', head: true }).eq('user_id', u.id)
      const { data: last } = await supabaseAdmin.from('execution_logs')
        .select('roblox_username, roblox_id, executed_at').eq('user_id', u.id)
        .order('executed_at', { ascending: false }).limit(1).single()
      return { ...u, execution_count: count || 0, last_execution: last || null }
    }))

    return res.json({ users: withStats })
  }

  if (req.method === 'PATCH') {
    const { userId, username, email, password, role, roblox_username, roblox_id } = req.body
    if (!userId) return res.status(400).json({ error: 'userId wajib' })
    const upd: any = { updated_at: new Date().toISOString() }
    if (username)              upd.username          = username
    if (email)                 upd.email             = email
    if (role)                  upd.role              = role
    if (roblox_username !== undefined) upd.roblox_username = roblox_username
    if (roblox_id       !== undefined) upd.roblox_id       = roblox_id
    if (password)              upd.password_hash     = await hashPassword(password)
    const { data, error } = await supabaseAdmin.from('users').update(upd).eq('id', userId).select().single()
    if (error) return res.status(500).json({ error: 'Gagal update' })
    return res.json({ user: data })
  }

  res.status(405).end()
}
