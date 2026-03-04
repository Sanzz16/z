import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

const HTML_UI = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>AWR Verify API — Sanzxmzz</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@300;500;600;700&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
<style>
:root{--bg-deep:#08090a;--glass-bg:rgba(255,255,255,0.03);--glass-border:rgba(255,255,255,0.08);--accent-purple:#ff4dff;--accent-blue:#4facfe;--accent-green:#32ff7e;--gradient-primary:linear-gradient(135deg,#ff4dff 0%,#4facfe 100%);--text-main:#ffffff;--text-silver:#c0c0c0;--text-sub:#8E8E93;--card-shadow:0 8px 32px 0 rgba(0,0,0,0.8)}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:var(--bg-deep);background-image:radial-gradient(circle at top right,rgba(50,255,126,0.05),transparent),radial-gradient(circle at bottom left,rgba(255,77,255,0.05),transparent);color:var(--text-main);font-family:'Outfit',sans-serif;min-height:100vh;overflow-x:hidden;padding-bottom:60px;display:flex;flex-direction:column;align-items:center}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:rgba(255,77,255,0.3);border-radius:99px}
.ambient-glow{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none}
.glow-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.2;animation:float 10s infinite ease-in-out alternate}
.blob-1{top:-10%;left:-20%;width:400px;height:400px;background:var(--accent-purple);animation-delay:-2s}
.blob-2{bottom:10%;right:-20%;width:300px;height:300px;background:var(--accent-blue);animation-delay:-5s}
.blob-3{top:50%;left:40%;width:200px;height:200px;background:var(--accent-green);opacity:0.06;animation-delay:-8s}
@keyframes float{0%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,20px) scale(1.05)}100%{transform:translate(20px,20px) scale(1)}}
.wrap{position:relative;z-index:1;width:100%;max-width:440px;padding:32px 16px 40px}
.page-header{text-align:center;margin-bottom:28px;animation:slideUp 0.5s ease forwards}
.logo{font-family:'Orbitron',sans-serif;font-size:2rem;font-weight:800;letter-spacing:4px;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:logoPulse 2s infinite alternate}
@keyframes logoPulse{0%{opacity:0.8;transform:scale(1)}100%{opacity:1;transform:scale(1.02)}}
.logo-sub{font-family:'Rajdhani',sans-serif;font-size:0.68rem;color:var(--text-sub);letter-spacing:4px;text-transform:uppercase;margin-top:4px}
.status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:30px;background:rgba(79,172,254,0.15);border:1px solid var(--accent-blue);color:#fff;font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:12px}
.status-dot{width:6px;height:6px;background:var(--accent-green);border-radius:50%;box-shadow:0 0 6px var(--accent-green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)}}
@keyframes slideUp{to{opacity:1;transform:translateY(0)}}

.hero-card{background:linear-gradient(135deg,rgba(255,77,255,0.1),rgba(79,172,254,0.08));border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:18px 20px;position:relative;overflow:hidden;margin-bottom:14px;animation:slideUp 0.5s ease 0.05s forwards;opacity:0;transform:translateY(20px)}
.hero-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,var(--accent-purple),var(--accent-blue));z-index:1}
.hero-card::after{content:'';position:absolute;top:0;left:0;width:120%;height:3px;background:linear-gradient(90deg,transparent,#fff,transparent);transform:translateX(-100%);animation:scanline 3s ease infinite;z-index:2}
@keyframes scanline{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(100%)}}
.hero-content{position:relative;z-index:3}
.hero-title{font-family:'Orbitron',sans-serif;font-size:0.7rem;font-weight:700;letter-spacing:3px;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.hero-sub{font-size:0.72rem;color:var(--text-sub);line-height:1.5}

.glass-panel{background:var(--glass-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--glass-border);border-radius:20px;box-shadow:var(--card-shadow);margin-bottom:14px;opacity:0;transform:translateY(20px);animation:slideUp 0.5s ease forwards}
.glass-panel:nth-child(1){animation-delay:0.1s}.glass-panel:nth-child(2){animation-delay:0.18s}.glass-panel:nth-child(3){animation-delay:0.26s}.glass-panel:nth-child(4){animation-delay:0.34s}.glass-panel:nth-child(5){animation-delay:0.42s}

.sec-title{font-family:'Rajdhani',sans-serif;font-size:0.72rem;font-weight:700;color:var(--accent-purple);letter-spacing:2px;text-transform:uppercase;padding:14px 18px 10px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;gap:8px}
.sec-title i{font-size:11px}

.ep-row{padding:12px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.04)}
.method-badge{font-family:'Rajdhani',sans-serif;font-size:0.68rem;font-weight:700;padding:3px 10px;border-radius:8px;letter-spacing:1px;background:rgba(79,172,254,0.15);color:var(--accent-blue);border:1px solid rgba(79,172,254,0.3)}
.ep-url{font-size:0.82rem;color:var(--text-silver);font-family:'Rajdhani',sans-serif;letter-spacing:1px}
.ep-url span{color:var(--text-sub)}

.param-row{display:grid;grid-template-columns:80px 58px 1fr;gap:8px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,0.04);align-items:center}
.param-row:last-child{border-bottom:none}
.param-name{font-family:'Rajdhani',sans-serif;font-size:0.8rem;font-weight:600;color:var(--accent-blue);letter-spacing:1px}
.tag{font-size:0.58rem;font-weight:700;padding:2px 7px;border-radius:8px;letter-spacing:0.5px;text-align:center}
.tag-req{background:rgba(255,59,48,0.15);color:#ff6b6b;border:1px solid rgba(255,59,48,0.3)}
.tag-opt{background:rgba(142,142,147,0.1);color:var(--text-sub);border:1px solid rgba(142,142,147,0.2)}
.param-desc{font-size:0.7rem;color:var(--text-sub);line-height:1.4}

.json-wrap{padding:12px 16px}
.json-block{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;font-family:'Rajdhani',sans-serif;font-size:0.78rem;line-height:1.9;overflow-x:auto;white-space:pre}
.jb{color:rgba(255,255,255,0.25)}.jk{color:var(--accent-blue)}.js{color:var(--accent-green)}.jse{color:#ff6b6b}.jbt{color:var(--accent-green)}.jbf{color:#ff6b6b}.jnum{color:#ffd93d}.jc{color:rgba(255,255,255,0.18);font-style:italic}.jcr{color:var(--accent-blue)}.ln{color:rgba(255,255,255,0.14);user-select:none;margin-right:10px;font-size:0.66rem}

.field-list{padding:4px 8px 12px}
.field-item{padding:10px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:flex-start;gap:10px}
.field-item:last-child{border-bottom:none}
.field-icon{width:28px;height:28px;border-radius:8px;flex-shrink:0;background:rgba(79,172,254,0.1);border:1px solid rgba(79,172,254,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent-blue);margin-top:2px}
.field-key{font-family:'Rajdhani',sans-serif;font-size:0.8rem;font-weight:700;color:var(--text-main);letter-spacing:0.5px}
.field-type{font-size:0.6rem;color:var(--accent-purple);letter-spacing:0.5px;margin-top:1px}
.field-desc{font-size:0.68rem;color:var(--text-sub);margin-top:2px;line-height:1.4}

.err-row{padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:2px}
.err-row:last-child{border-bottom:none}
.err-msg{font-family:'Rajdhani',sans-serif;font-size:0.76rem;font-weight:600;color:#ff6b6b;letter-spacing:0.5px}
.err-desc{font-size:0.68rem;color:var(--text-sub)}

.credit-card{background:linear-gradient(135deg,rgba(255,77,255,0.08),rgba(79,172,254,0.06));border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden;margin-bottom:14px;animation:slideUp 0.5s ease 0.5s forwards;opacity:0;transform:translateY(20px)}
.credit-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;background:var(--gradient-primary)}
.credit-name{font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;letter-spacing:3px;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.credit-role{font-family:'Rajdhani',sans-serif;font-size:0.68rem;color:var(--text-sub);letter-spacing:2px;text-transform:uppercase;margin-top:3px}
.credit-badges{display:flex;flex-direction:column;gap:5px;align-items:flex-end}
.cbadge{font-family:'Rajdhani',sans-serif;font-size:0.62rem;font-weight:700;padding:3px 10px;border-radius:8px;letter-spacing:1px}
.cb-dev{background:rgba(255,77,255,0.12);color:var(--accent-purple);border:1px solid rgba(255,77,255,0.25)}
.cb-ok{background:rgba(50,255,126,0.1);color:var(--accent-green);border:1px solid rgba(50,255,126,0.25)}
.footer{text-align:center;font-family:'Rajdhani',sans-serif;font-size:0.65rem;color:rgba(255,255,255,0.12);letter-spacing:2px;text-transform:uppercase;margin-top:6px}
</style>
</head>
<body>
<div class="ambient-glow">
  <div class="glow-blob blob-1"></div>
  <div class="glow-blob blob-2"></div>
  <div class="glow-blob blob-3"></div>
</div>
<div class="wrap">

  <div class="page-header">
    <div class="logo">AWR</div>
    <div class="logo-sub">Key Verification API &middot; v3</div>
    <div><span class="status-badge"><span class="status-dot"></span>API Online</span></div>
  </div>

  <div class="hero-card">
    <div class="hero-content">
      <div class="hero-title">&#9889; KEY SYSTEM</div>
      <div class="hero-sub">Endpoint verifikasi key AWR Script. Dipanggil otomatis dari executor Roblox.</div>
    </div>
  </div>

  <div class="glass-panel">
    <div class="sec-title"><i class="fa-solid fa-code"></i> Endpoint</div>
    <div class="ep-row"><span class="method-badge">GET</span><span class="ep-url"><span>/api/</span>verify</span></div>
    <div class="param-row"><span class="param-name">key</span><span class="tag tag-req">Required</span><span class="param-desc">Key yang diverifikasi</span></div>
    <div class="param-row"><span class="param-name">user</span><span class="tag tag-opt">Optional</span><span class="param-desc">Username Roblox &mdash; untuk log &amp; leaderboard</span></div>
    <div class="param-row"><span class="param-name">hwid</span><span class="tag tag-opt">Optional</span><span class="param-desc">Hardware ID executor &mdash; untuk HWID binding</span></div>
  </div>

  <div class="glass-panel">
    <div class="sec-title"><i class="fa-solid fa-circle-check" style="color:var(--accent-green)"></i> Response &mdash; Success</div>
    <div class="json-wrap"><div class="json-block"><span class="jb">{</span>
<span class="ln">1</span>  <span class="jk">"success"</span>       : <span class="jbt">true</span>,
<span class="ln">2</span>  <span class="jk">"message"</span>       : <span class="js">"&#10003; Key valid!"</span>,
<span class="ln">3</span>  <span class="jk">"key"</span>           : <span class="js">"ABCDEF-1234-WXYZ-5678-ABCDEF"</span>,
<span class="ln">4</span>  <span class="jk">"username"</span>      : <span class="js">"Sanzxmzz"</span>,
<span class="ln">5</span>  <span class="jk">"expires_at"</span>    : <span class="js">"2025-06-01T00:00:00.000Z"</span>,  <span class="jc">// null = lifetime</span>
<span class="ln">6</span>  <span class="jk">"duration_type"</span> : <span class="js">"7d"</span>,
<span class="ln">7</span>  <span class="jk">"hwid_max"</span>      : <span class="jnum">1</span>,
<span class="ln">8</span>  <span class="jk">"is_free_key"</span>   : <span class="jbf">false</span>,
<span class="ln">9</span>  <span class="jk">"credit"</span>        : <span class="jcr">"Sanzxmzz"</span>
<span class="jb">}</span></div></div>
  </div>

  <div class="glass-panel">
    <div class="sec-title"><i class="fa-solid fa-circle-xmark" style="color:#ff6b6b"></i> Response &mdash; Error</div>
    <div class="json-wrap"><div class="json-block"><span class="jb">{</span>
<span class="ln">1</span>  <span class="jk">"success"</span> : <span class="jbf">false</span>,
<span class="ln">2</span>  <span class="jk">"message"</span> : <span class="jse">"&#10060; Key tidak ditemukan"</span>,
<span class="ln">3</span>  <span class="jk">"credit"</span>  : <span class="jcr">"Sanzxmzz"</span>
<span class="jb">}</span></div></div>
  </div>

  <div class="glass-panel">
    <div class="sec-title"><i class="fa-solid fa-list"></i> Field Reference</div>
    <div class="field-list">
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-check"></i></div><div><div class="field-key">success</div><div class="field-type">boolean</div><div class="field-desc"><code style="color:var(--accent-green)">true</code> = valid &nbsp;/&nbsp; <code style="color:#ff6b6b">false</code> = tidak valid</div></div></div>
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-comment"></i></div><div><div class="field-key">message</div><div class="field-type">string</div><div class="field-desc">Pesan status dari server</div></div></div>
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-clock"></i></div><div><div class="field-key">expires_at</div><div class="field-type">string | null</div><div class="field-desc">Tanggal expired ISO 8601 &mdash; null berarti lifetime</div></div></div>
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-tag"></i></div><div><div class="field-key">duration_type</div><div class="field-type">string</div><div class="field-desc">"24h" / "3d" / "7d" / "30d" / "60d" / "lifetime"</div></div></div>
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-fingerprint"></i></div><div><div class="field-key">hwid_max</div><div class="field-type">number</div><div class="field-desc">Maks device yang bisa bind ke key ini</div></div></div>
      <div class="field-item"><div class="field-icon"><i class="fa-solid fa-user"></i></div><div><div class="field-key">username</div><div class="field-type">string | null</div><div class="field-desc">Username pemilik key di website AWR</div></div></div>
    </div>
  </div>

  <div class="glass-panel">
    <div class="sec-title"><i class="fa-solid fa-triangle-exclamation" style="color:#ffd93d"></i> Possible Errors</div>
    <div class="err-row"><span class="err-msg">&#9888; Key tidak boleh kosong</span><span class="err-desc">Parameter ?key= tidak ada atau kosong</span></div>
    <div class="err-row"><span class="err-msg">&#10060; Key tidak ditemukan</span><span class="err-desc">Key tidak ada di database</span></div>
    <div class="err-row"><span class="err-msg">&#10060; Key sudah dinonaktifkan</span><span class="err-desc">Key di-disable oleh developer / reseller</span></div>
    <div class="err-row"><span class="err-msg">&#10060; Key sudah expired</span><span class="err-desc">Tanggal expires_at sudah lewat</span></div>
    <div class="err-row"><span class="err-msg">&#10060; Akun kamu dibanned</span><span class="err-desc">Pemilik key terkena banned</span></div>
    <div class="err-row"><span class="err-msg">&#10060; HWID limit tercapai</span><span class="err-desc">Jumlah device sudah melebihi hwid_max</span></div>
  </div>

  <div class="credit-card">
    <div>
      <div class="credit-name">Sanzxmzz</div>
      <div class="credit-role">Developer &middot; AWR Key System</div>
    </div>
    <div class="credit-badges">
      <span class="cbadge cb-dev"><i class="fa-solid fa-bolt" style="margin-right:4px"></i>AWR v3</span>
      <span class="cbadge cb-ok"><i class="fa-solid fa-circle-check" style="margin-right:4px"></i>Production</span>
    </div>
  </div>

  <div class="footer">&#169; Sanzxmzz &middot; All Rights Reserved</div>
</div>
</body>
</html>`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key, user: rbxUser, hwid } = req.query as Record<string, string>

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

  if (hwid && k.hwid_max > 0) {
    const { data: bound } = await supabaseAdmin.from('key_hwids').select('hwid').eq('key_id', k.id)
    const list = (bound || []).map((x: any) => x.hwid)
    if (!list.includes(hwid)) {
      if (list.length >= k.hwid_max)
        return res.json({ success: false, message: `❌ HWID limit tercapai (max: ${k.hwid_max})`, credit: 'Sanzxmzz' })
      await supabaseAdmin.from('key_hwids').insert({ key_id: k.id, hwid })
    }
  }

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
