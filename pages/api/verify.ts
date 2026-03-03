import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

// ─── HTML UI ditampilkan saat buka di browser tanpa key ───────
const HTML_UI = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>AWR Verify API — Sanzxmzz</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#050d1a;color:#c8dff0;font-family:'Inter',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a3a5c;border-radius:99px}
.bg-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,140,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0}
.bg-orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0}
.orb1{width:500px;height:500px;background:rgba(0,80,200,.12);top:-150px;right:-100px}
.orb2{width:400px;height:400px;background:rgba(0,200,255,.07);bottom:-100px;left:-100px}
.wrap{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:48px 24px 80px}
.header{text-align:center;margin-bottom:48px}
.logo{font-family:'Rajdhani',sans-serif;font-size:3.2rem;font-weight:700;letter-spacing:6px;background:linear-gradient(135deg,#00aaff,#0af,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
.logo-sub{font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#3a6a8a;letter-spacing:4px;text-transform:uppercase;margin-top:6px}
.badge-live{display:inline-flex;align-items:center;gap:6px;background:rgba(0,200,80,.08);border:1px solid rgba(0,200,80,.2);border-radius:99px;padding:4px 14px;font-size:.7rem;color:#4ade80;letter-spacing:1px;text-transform:uppercase;margin-top:16px}
.dot{width:7px;height:7px;background:#22c55e;border-radius:50%;animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.sec{font-family:'Rajdhani',sans-serif;font-size:.95rem;font-weight:700;color:#00d4ff;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:10px}
.sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#1a3a5c,transparent)}
.card{background:#0a1628;border:1px solid #1a3a5c;border-radius:16px;overflow:hidden;margin-bottom:20px}
.card-hdr{background:linear-gradient(135deg,rgba(0,60,140,.6),rgba(0,30,80,.6));border-bottom:1px solid #1a3a5c;padding:14px 20px;display:flex;align-items:center;gap:12px}
.method{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.72rem;padding:4px 10px;border-radius:6px;background:rgba(0,170,255,.15);color:#00d4ff;border:1px solid rgba(0,170,255,.25);letter-spacing:1px}
.ep-url{font-family:'JetBrains Mono',monospace;font-size:.88rem;color:#cce4f8}
.ep-url span{color:#5a8ab0}
.card-body{padding:18px 20px}
.ptitle{font-size:.65rem;font-weight:600;color:#3a6a8a;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
.prow{display:grid;grid-template-columns:110px 80px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid rgba(26,58,92,.4);align-items:start}
.prow:last-child{border-bottom:none}
.pname{font-family:'JetBrains Mono',monospace;font-size:.82rem;color:#00d4ff}
.preq{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:.5px;text-align:center;align-self:center}
.req{background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2)}
.opt{background:rgba(100,116,139,.1);color:#94a3b8;border:1px solid rgba(100,116,139,.2)}
.pdesc{font-size:.78rem;color:#6b9db8;line-height:1.5}
.json{background:#04101a;border-radius:12px;padding:20px;font-family:'JetBrains Mono',monospace;font-size:.8rem;line-height:1.9;border:1px solid #162f50;white-space:pre}
.ln{color:#1a4a80;user-select:none;margin-right:12px;font-size:.68rem}
.jb{color:#5a8ab0}.jk{color:#7dd3fc}.js{color:#86efac}.jse{color:#fca5a5}.jbt{color:#34d399}.jbf{color:#f87171}.jn{color:#6b7280;font-style:italic}.jnum{color:#fbbf24}.jc{color:#2a4a6a;font-style:italic}
.rtabs{display:flex;gap:4px;margin-bottom:-1px}
.rtab{font-family:'JetBrains Mono',monospace;font-size:.7rem;padding:6px 14px;border-radius:8px 8px 0 0;border:1px solid transparent;letter-spacing:.5px}
.rtab-ok{background:rgba(34,197,94,.08);color:#4ade80;border-color:rgba(34,197,94,.2)}
.rtab-err{background:rgba(239,68,68,.08);color:#f87171;border-color:rgba(239,68,68,.2)}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:580px){.fgrid{grid-template-columns:1fr}.prow{grid-template-columns:90px 70px 1fr}}
.fcard{background:#04101a;border:1px solid #162f50;border-radius:10px;padding:14px}
.fn{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#00d4ff;margin-bottom:6px}
.ft{font-size:.62rem;background:rgba(0,170,255,.07);color:#3a8ab0;padding:2px 8px;border-radius:99px;border:1px solid rgba(0,170,255,.15);display:inline-block;margin-bottom:8px}
.fd{font-size:.74rem;color:#5a8ab0;line-height:1.5}
.warn{background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.15);border-radius:10px;padding:12px 16px;font-size:.76rem;color:#fbbf24;line-height:1.6;margin-top:14px}
.err-table .erow{display:grid;grid-template-columns:250px 1fr;gap:12px;padding:11px 20px;border-bottom:1px solid rgba(26,58,92,.35)}
.err-table .erow:last-child{border-bottom:none}
.emsg{font-family:'JetBrains Mono',monospace;font-size:.73rem;color:#f87171}
.edesc{font-size:.76rem;color:#5a8ab0}
.credit{background:linear-gradient(135deg,rgba(0,50,130,.3),rgba(0,25,70,.3));border:1px solid rgba(0,90,210,.3);border-radius:14px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
.cname{font-family:'Rajdhani',sans-serif;font-size:1.4rem;font-weight:700;color:#00d4ff;letter-spacing:3px}
.crole{font-size:.7rem;color:#3a6a8a;letter-spacing:1px;text-transform:uppercase;margin-top:3px}
.cbadges{display:flex;flex-direction:column;gap:5px;align-items:flex-end}
.cb{font-family:'JetBrains Mono',monospace;font-size:.66rem;padding:3px 10px;border-radius:6px;border:1px solid}
.cb-dev{color:#a78bfa;border-color:rgba(167,139,250,.25);background:rgba(167,139,250,.08)}
.cb-ok{color:#34d399;border-color:rgba(52,211,153,.25);background:rgba(52,211,153,.08)}
.footer{text-align:center;margin-top:44px;font-size:.7rem;color:#1a3a5c;font-family:'JetBrains Mono',monospace;letter-spacing:1px}
</style>
</head>
<body>
<div class="bg-grid"></div>
<div class="bg-orb orb1"></div>
<div class="bg-orb orb2"></div>
<div class="wrap">

  <div class="header">
    <div class="logo">&#9889; AWR</div>
    <div class="logo-sub">Key Verification API &middot; v3</div>
    <div><span class="badge-live"><span class="dot"></span>API Online</span></div>
  </div>

  <div class="sec">Endpoint</div>
  <div class="card">
    <div class="card-hdr">
      <span class="method">GET</span>
      <span class="ep-url"><span>/api/</span>verify</span>
    </div>
    <div class="card-body">
      <div class="ptitle">Query Parameters</div>
      <div class="prow">
        <span class="pname">key</span>
        <span class="preq req">Required</span>
        <span class="pdesc">Key yang diverifikasi. Format: <code style="color:#00d4ff;font-size:.78rem">XXXXXX-XXXX-XXXX-XXXX-XXXXXX</code></span>
      </div>
      <div class="prow">
        <span class="pname">user</span>
        <span class="preq opt">Optional</span>
        <span class="pdesc">Username Roblox player. Untuk log eksekusi &amp; leaderboard.</span>
      </div>
      <div class="prow">
        <span class="pname">hwid</span>
        <span class="preq opt">Optional</span>
        <span class="pdesc">Hardware ID executor. Untuk binding per device sesuai <code style="color:#fbbf24;font-size:.78rem">hwid_max</code>.</span>
      </div>
    </div>
  </div>

  <div class="sec" style="margin-top:28px">Response</div>
  <div style="margin-bottom:8px"><div class="rtabs"><span class="rtab rtab-ok">&#10003; 200 &mdash; Success</span></div></div>
  <div class="json"><span class="jb">{</span>
<span class="ln"> 1</span>  <span class="jk">"success"</span>    : <span class="jbt">true</span>,
<span class="ln"> 2</span>  <span class="jk">"message"</span>    : <span class="js">"&#10003; Key valid!"</span>,
<span class="ln"> 3</span>  <span class="jk">"key"</span>        : <span class="js">"ABCDEF-1234-5678-WXYZ-ABCDEF"</span>,
<span class="ln"> 4</span>  <span class="jk">"username"</span>   : <span class="js">"Sanzxmzz"</span>,
<span class="ln"> 5</span>  <span class="jk">"expires_at"</span> : <span class="js">"2025-06-01T00:00:00.000Z"</span>,  <span class="jc">// null = lifetime</span>
<span class="ln"> 6</span>  <span class="jk">"duration_type"</span>: <span class="js">"7d"</span>,            <span class="jc">// 24h | 3d | 5d | 7d | 30d | 60d | lifetime</span>
<span class="ln"> 7</span>  <span class="jk">"hwid_max"</span>   : <span class="jnum">1</span>,
<span class="ln"> 8</span>  <span class="jk">"is_free_key"</span>: <span class="jbf">false</span>,
<span class="ln"> 9</span>  <span class="jk">"credit"</span>     : <span class="js" style="color:#7dd3fc">"Sanzxmzz"</span>
<span class="jb">}</span></div>

  <div style="margin-top:12px;margin-bottom:8px"><div class="rtabs"><span class="rtab rtab-err">&#10007; 200 &mdash; Error</span></div></div>
  <div class="json"><span class="jb">{</span>
<span class="ln">1</span>  <span class="jk">"success"</span> : <span class="jbf">false</span>,
<span class="ln">2</span>  <span class="jk">"message"</span> : <span class="jse">"&#10060; Key tidak ditemukan"</span>,
<span class="ln">3</span>  <span class="jk">"credit"</span>  : <span class="js" style="color:#7dd3fc">"Sanzxmzz"</span>
<span class="jb">}</span></div>
  <div class="warn">
    <strong style="color:#fcd34d">Catatan:</strong> Semua response pakai HTTP <strong>200</strong>. Cek field <code style="font-family:JetBrains Mono,monospace">success</code> (boolean) untuk tau valid atau tidak &mdash; bukan dari HTTP status code.
  </div>

  <div class="sec" style="margin-top:28px">Field Reference</div>
  <div class="fgrid">
    <div class="fcard"><div class="fn">success</div><div class="ft">boolean</div><div class="fd"><code style="color:#34d399">true</code> = key valid. <code style="color:#f87171">false</code> = tidak valid.</div></div>
    <div class="fcard"><div class="fn">message</div><div class="ft">string</div><div class="fd">Pesan status dari server. Tampilkan ke user.</div></div>
    <div class="fcard"><div class="fn">expires_at</div><div class="ft">string | null</div><div class="fd">Tanggal expired ISO 8601. <code style="color:#6b7280;font-style:italic">null</code> = lifetime.</div></div>
    <div class="fcard"><div class="fn">duration_type</div><div class="ft">string</div><div class="fd">Durasi key: <code style="color:#fbbf24">"24h"</code> <code style="color:#fbbf24">"7d"</code> <code style="color:#fbbf24">"30d"</code> <code style="color:#fbbf24">"lifetime"</code> dll</div></div>
    <div class="fcard"><div class="fn">hwid_max</div><div class="ft">number</div><div class="fd">Maks device yang bisa bind ke key ini.</div></div>
    <div class="fcard"><div class="fn">username</div><div class="ft">string | null</div><div class="fd">Username pemilik key di AWR website.</div></div>
  </div>

  <div class="sec" style="margin-top:28px">Possible Errors</div>
  <div class="card err-table">
    <div class="erow"><span class="emsg">&#9888; Key tidak boleh kosong</span><span class="edesc">Parameter ?key= tidak ada / kosong</span></div>
    <div class="erow"><span class="emsg">&#10060; Key tidak ditemukan</span><span class="edesc">Key tidak ada di database</span></div>
    <div class="erow"><span class="emsg">&#10060; Key sudah dinonaktifkan</span><span class="edesc">Key di-disable oleh developer/reseller</span></div>
    <div class="erow"><span class="emsg">&#10060; Key sudah expired</span><span class="edesc">Tanggal expires_at sudah lewat</span></div>
    <div class="erow"><span class="emsg">&#10060; Akun kamu dibanned</span><span class="edesc">Pemilik key terkena banned</span></div>
    <div class="erow"><span class="emsg">&#10060; HWID limit tercapai</span><span class="edesc">Jumlah device sudah mencapai hwid_max</span></div>
  </div>

  <div class="sec" style="margin-top:28px">Credit</div>
  <div class="credit">
    <div>
      <div class="cname">Sanzxmzz</div>
      <div class="crole">Developer &middot; AWR Key System</div>
    </div>
    <div class="cbadges">
      <span class="cb cb-dev">&#9889; AWR Key System v3</span>
      <span class="cb cb-ok">&#10003; API Verified &middot; Production</span>
    </div>
  </div>

  <div class="footer">&#169; Sanzxmzz &middot; AWR Key System &middot; All Rights Reserved</div>
</div>
</body>
</html>`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key, user: rbxUser, hwid } = req.query as Record<string, string>

  // Buka di browser tanpa key → tampilkan UI docs
  if (!key) {
    const accept = req.headers['accept'] || ''
    if (accept.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(200).send(HTML_UI)
    }
    return res.json({ success: false, message: '⚠ Key tidak boleh kosong', credit: 'Sanzxmzz' })
  }

  const { data: k } = await supabaseAdmin.from('keys')
    .select('*, owner:users!keys_assigned_to_fkey(username, is_banned)')
    .eq('key_value', key).single()

  if (!k)
    return res.json({ success: false, message: '❌ Key tidak ditemukan', credit: 'Sanzxmzz' })
  if (!k.is_active)
    return res.json({ success: false, message: '❌ Key sudah dinonaktifkan', credit: 'Sanzxmzz' })
  if (k.expires_at && new Date(k.expires_at) < new Date())
    return res.json({ success: false, message: '❌ Key sudah expired', credit: 'Sanzxmzz' })
  if (k.owner?.is_banned)
    return res.json({ success: false, message: '❌ Akun kamu dibanned', credit: 'Sanzxmzz' })

  // HWID check
  if (hwid && k.hwid_max > 0) {
    const { data: bound } = await supabaseAdmin.from('key_hwids').select('hwid').eq('key_id', k.id)
    const list = (bound || []).map((x: any) => x.hwid)
    if (!list.includes(hwid)) {
      if (list.length >= k.hwid_max)
        return res.json({ success: false, message: `❌ HWID limit tercapai (max: ${k.hwid_max})`, credit: 'Sanzxmzz' })
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
    username: k.owner?.username || null,
    expires_at: k.expires_at || null,
    duration_type: k.duration_type,
    hwid_max: k.hwid_max,
    is_free_key: k.is_free_key || false,
    credit: 'Sanzxmzz'
  })
}
