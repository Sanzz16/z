import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key, user: rbxUser, hwid } = req.query as Record<string, string>
  if (!key) return res.json({ success: false, message: '⚠ Key tidak boleh kosong' })

  const { data: k } = await supabaseAdmin.from('keys')
    .select('*, owner:users!keys_assigned_to_fkey(username, is_banned)')
    .eq('key_value', key).single()

  if (!k)              return res.json({ success: false, message: '❌ Key tidak ditemukan' })
  if (!k.is_active)    return res.json({ success: false, message: '❌ Key sudah dinonaktifkan' })
  if (k.expires_at && new Date(k.expires_at) < new Date())
                       return res.json({ success: false, message: '❌ Key sudah expired' })
  if (k.owner?.is_banned) return res.json({ success: false, message: '❌ Akun kamu dibanned' })

  // HWID check
  if (hwid && k.hwid_max > 0) {
    const { data: bound } = await supabaseAdmin.from('key_hwids').select('hwid').eq('key_id', k.id)
    const list = (bound || []).map((x: any) => x.hwid)
    if (!list.includes(hwid)) {
      if (list.length >= k.hwid_max)
        return res.json({ success: false, message: `❌ HWID limit tercapai (max: ${k.hwid_max})` })
      await supabaseAdmin.from('key_hwids').insert({ key_id: k.id, hwid })
    }
  }

  // Log execution
  if (rbxUser && k.assigned_to) {
    let robloxId: number | null = null
    try {
      const r = await fetch(`https://api.roblox.com/users/get-by-username?username=${rbxUser}`)
      const d = await r.json(); robloxId = d.Id || null
    } catch {}
    await supabaseAdmin.from('execution_logs').insert({
      user_id: k.assigned_to, key_id: k.id,
      roblox_username: rbxUser, roblox_id: robloxId, hwid: hwid || null
    })
    await supabaseAdmin.rpc('increment_executions', { user_id: k.assigned_to })
  }

  await supabaseAdmin.from('keys')
    .update({ times_used: (k.times_used || 0) + 1, is_used: true }).eq('id', k.id)

  return res.json({
    success: true,
    message: '✅ Key valid!',
    key: k.key_value,
    expires_at: k.expires_at || null,       // null = lifetime
    hwid_max: k.hwid_max,
    duration_type: k.duration_type,         // "24h","3d","7d","30d","60d","lifetime"
    username: k.owner?.username || null,
    is_free_key: k.is_free_key || false
  })
}
