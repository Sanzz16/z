import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireReseller } from '../../../lib/middleware'
import { sendBroadcastEmail } from '../../../lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireReseller(req, res)
  if (!user) return
  const { title, content, sendEmail } = req.body
  if (!title || !content) return res.status(400).json({ error: 'Title dan content wajib' })

  const fullTitle = `${title} — by ${user.username}`
  await supabaseAdmin.from('announcements').insert({ title: fullTitle, content, created_by: user.id })

  const { data: allUsers } = await supabaseAdmin.from('users').select('id, email, username')
  if (allUsers?.length) {
    await supabaseAdmin.from('notifications').insert(
      allUsers.map((u: any) => ({ user_id: u.id, title: fullTitle, message: content, type: 'announcement' }))
    )
    if (sendEmail) {
      Promise.allSettled(
        allUsers.map((u: any) => sendBroadcastEmail(u.email, u.username, fullTitle, content, `Reseller ${user.username}`))
      )
    }
  }
  res.json({ success: true, message: `Broadcast dikirim ke ${allUsers?.length || 0} user` })
}
