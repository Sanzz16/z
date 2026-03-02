import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { id, password } = req.query
  const { data } = await supabaseAdmin.from('routes').select('*').eq('id', id).single()
  if (!data) return res.status(404).json({ error: 'Route tidak ditemukan' })
  if (!data.is_public && data.has_password) {
    if (!password || password !== data.password)
      return res.status(403).json({ error: 'Password salah', needsPassword: true })
  }
  await supabaseAdmin.from('routes').update({ download_count: (data.download_count || 0) + 1 }).eq('id', id)
  const { password: _, ...safeData } = data
  res.json({ route: safeData })
}
