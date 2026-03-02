import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireDeveloper } from '../../../lib/middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireDeveloper(req, res)
  if (!user) return
  const { title, content } = req.body
  if (!title || !content) return res.status(400).json({ error: 'Title dan content wajib' })

  await supabaseAdmin.from('announcements').insert({ title, content, created_by: user.id })

  const { data: allUsers } = await supabaseAdmin.from('users').select('id')
  if (allUsers?.length) {
    await supabaseAdmin.from('notifications').insert(
      allUsers.map((u: any) => ({ user_id: u.id, title, message: content, type: 'announcement' }))
    )
  }
  res.json({ success: true, message: `Broadcast dikirim ke ${allUsers?.length || 0} user` })
}
