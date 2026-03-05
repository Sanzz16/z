import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireDeveloper(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  if (req.method === 'POST') {
    const { title, content } = req.body
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ error: 'Judul dan isi pesan wajib diisi' })
    const { error: annErr } = await supabaseAdmin.from('announcements')
      .insert({ title: title.trim(), content: content.trim(), created_by: user.id, is_active: true })
    if (annErr) return res.status(500).json({ error: 'Gagal: ' + annErr.message })
    const { data: allUsers } = await supabaseAdmin.from('users').select('id').eq('is_banned', false)
    if (allUsers?.length) {
      await supabaseAdmin.from('notifications').insert(
        allUsers.map((u: any) => ({ user_id: u.id, title: `📢 ${title.trim()}`, message: content.trim(), type: 'announcement' }))
      )
    }
    return res.json({ success: true, message: `Broadcast dikirim ke ${allUsers?.length || 0} user` })
  }

  if (req.method === 'PATCH') {
    const { id, title, content } = req.body
    if (!id) return res.status(400).json({ error: 'ID wajib' })
    const updates: any = {}
    if (title?.trim()) updates.title = title.trim()
    if (content?.trim()) updates.content = content.trim()
    const { error } = await supabaseAdmin.from('announcements').update(updates).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID wajib' })
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).end()
}
