import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const token = req.headers.authorization?.slice(7)
    let userId: string | null = null
    if (token) {
      const { getUserFromToken } = await import('../../../lib/auth')
      const u = await getUserFromToken(token)
      userId = u?.id || null
    }
    let query = supabaseAdmin.from('routes')
      .select('id, name, description, game_name, download_count, created_at, is_public, has_password, thumbnail_url, uploader:users!routes_uploaded_by_fkey(username)')
      .order('created_at', { ascending: false })
    if (userId) {
      query = (query as any).or(`is_public.eq.true,uploaded_by.eq.${userId}`)
    } else {
      query = query.eq('is_public', true)
    }
    const { data } = await query
    return res.json({ routes: data || [] })
  }
  if (req.method === 'POST') {
    const user = await requireAuth(req, res)
    if (!user) return
    const { name, description, game_name, data, is_public, password, thumbnail_url } = req.body
    if (!name || !data) return res.status(400).json({ error: 'Nama dan data wajib' })
    const { data: route, error } = await supabaseAdmin.from('routes').insert({
      name, description, game_name, data, uploaded_by: user.id,
      is_public: is_public !== false,
      password: (!is_public && password) ? password : null,
      has_password: !is_public && !!password,
      thumbnail_url: thumbnail_url || null
    }).select().single()
    if (error) return res.status(500).json({ error: 'Gagal upload route' })
    return res.json({ route })
  }
  res.status(405).end()
}
