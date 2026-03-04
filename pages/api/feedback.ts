import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Aktifkan CORS agar bisa dipanggil dari Roblox HttpService
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET - ambil semua feedback (public, tanpa auth)
  if (req.method === 'GET') {
    const { data } = await supabaseAdmin
      .from('feedbacks')
      .select('id, type, message, rating, roblox_name_masked, website_username, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    return res.json({ feedbacks: data || [] })
  }

  // POST - kirim feedback baru (dari Lua script Roblox)
  if (req.method === 'POST') {
    const { type, message, rating, roblox_name, website_username, hwid } = req.body

    // Validasi wajib
    if (!type || !message || !rating) {
      return res.status(400).json({ error: 'type, message, rating wajib' })
    }
    if (!['Saran', 'Report Bug', 'Feedback'].includes(type)) {
      return res.status(400).json({ error: 'type tidak valid' })
    }
    if (message.length < 3 || message.length > 1000) {
      return res.status(400).json({ error: 'message harus 3-1000 karakter' })
    }

    // Sensor nama Roblox: "Sanzxmzz" → "San***zz"
    function maskName(name: string): string {
      if (!name || name.length === 0) return '***'
      if (name.length <= 2) return name[0] + '*'
      if (name.length <= 4) return name.slice(0,2) + '*'.repeat(name.length-2)
      // Panjang 5+: 3 awal + *** + 2 akhir
      const stars = Math.max(2, name.length - 5)
      return name.slice(0,3) + '*'.repeat(stars) + name.slice(-2)
    }

    const maskedRoblox = maskName(roblox_name || 'Anonymous')

    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .insert({
        type,
        message: message.slice(0, 1000),
        rating: Math.min(5, Math.max(1, Number(rating))),
        roblox_name_masked: maskedRoblox,
        website_username: website_username ? String(website_username).slice(0, 100) : null,
        hwid: hwid ? String(hwid).slice(0, 200) : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Feedback insert error:', error)
      return res.status(500).json({ error: 'Gagal simpan feedback' })
    }

    return res.json({ success: true, id: data?.id })
  }

  res.status(405).end()
}
