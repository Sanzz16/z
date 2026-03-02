import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin.from('routes')
      .select('id, name, description, game_name, download_count, created_at, uploader:users!routes_uploaded_by_fkey(username)')
      .eq('is_public', true).order('created_at', { ascending: false })
    return res.json({ routes: data || [] })
  }

  if (req.method === 'POST') {
    const user = await requireAuth(req, res)
    if (!user) return
    const { name, description, game_name, data } = req.body
    if (!name || !data) return res.status(400).json({ error: 'Nama dan data wajib' })
    const { data: route, error } = await supabaseAdmin.from('routes')
      .insert({ name, description, game_name, data, uploaded_by: user.id }).select().single()
    if (error) return res.status(500).json({ error: 'Gagal upload route' })
    return res.json({ route })
  }

  res.status(405).end()
}
