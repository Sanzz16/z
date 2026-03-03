import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireReseller } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireReseller(req, res)
  if (!user) return
  const { title, content } = req.body
  if (!title?.trim() || !content?.trim())
    return res.status(400).json({ error: 'Judul dan isi pesan wajib diisi' })

  const fullTitle = `${title.trim()} (by ${user.username})`

  const { error: annErr } = await supabaseAdmin.from('announcements')
    .insert({ title: fullTitle, content: content.trim(), created_by: user.id, is_active: true })
  if (annErr) return res.status(500).json({ error: 'Gagal buat announcement: ' + annErr.message })

  const { data: allUsers } = await supabaseAdmin.from('users').select('id, username')
  if (allUsers?.length) {
    await supabaseAdmin.from('notifications').insert(
      allUsers.map((u: any) => ({
        user_id: u.id,
        title: `📢 ${fullTitle}`,
        message: content.trim(),
        type: 'announcement'
      }))
    )
  }

  res.json({ success: true, message: `Broadcast dikirim ke ${allUsers?.length || 0} user` })
}
