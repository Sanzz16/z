import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireDeveloper(req, res)
  if (!user) return
  const { title, content, sendEmail } = req.body
  if (!title?.trim() || !content?.trim())
    return res.status(400).json({ error: 'Judul dan isi pesan wajib diisi' })

  const { error: annErr } = await supabaseAdmin.from('announcements')
    .insert({ title: title.trim(), content: content.trim(), created_by: user.id, is_active: true })
  if (annErr) return res.status(500).json({ error: 'Gagal buat announcement: ' + annErr.message })

  const { data: allUsers, error: usersErr } = await supabaseAdmin.from('users').select('id, email, username')
  if (usersErr) return res.status(500).json({ error: 'Gagal ambil users: ' + usersErr.message })

  if (allUsers?.length) {
    const { error: notifErr } = await supabaseAdmin.from('notifications').insert(
      allUsers.map((u: any) => ({
        user_id: u.id,
        title: `📢 ${title.trim()}`,
        message: content.trim(),
        type: 'announcement'
      }))
    )
    if (notifErr) console.error('Notif error:', notifErr.message)
  }

  res.json({ success: true, message: `Broadcast dikirim ke ${allUsers?.length || 0} user` })
}
