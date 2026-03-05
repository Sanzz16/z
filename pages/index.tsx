import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

// ══════════════════════════════════════════════════════════════
//  PARTICLES – bright blue, animated, connected
// ══════════════════════════════════════════════════════════════
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 2.2 + .5, a: Math.random() * .55 + .15,
      pulse: Math.random() * Math.PI * 2,
    }))
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += .018
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        const glow = p.a * (.8 + Math.sin(p.pulse) * .2)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(32,160,255,${glow})`; ctx.fill()
        // Glow halo
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
        grad.addColorStop(0, `rgba(0,140,255,${glow * .3})`); grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 140) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(0,140,255,${.18 * (1 - d / 140)})`; ctx.lineWidth = .7; ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
const pad = (n: number) => String(n).padStart(2, '0')
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function maskName(name: string) {
  if (!name || name.length === 0) return '***'
  if (name.length <= 2) return name[0] + '*'
  if (name.length <= 4) return name.slice(0, 2) + '*'.repeat(name.length - 2)
  return name.slice(0, 3) + '*'.repeat(Math.max(2, name.length - 5)) + name.slice(-2)
}

// ══════════════════════════════════════════════════════════════
//  AUTH MODAL
// ══════════════════════════════════════════════════════════════
function AuthModal({ mode, onClose, onSuccess }: { mode: 'login' | 'register' | null, onClose: () => void, onSuccess: (token: string, user: any) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>(mode || 'login')
  const [form, setForm] = useState({ username: '', email: '', password: '', rememberMe: true })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [fpMode, setFpMode] = useState(false)
  const [fpEmail, setFpEmail] = useState('')
  const [fpSent, setFpSent] = useState(false)

  useEffect(() => { if (mode) setTab(mode) }, [mode])

  async function doLogin(e: any) {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, password: form.password, rememberMe: form.rememberMe }) })
      const d = await r.json()
      if (d.error) { setErr(d.error); setLoading(false); return }
      if (form.rememberMe) localStorage.setItem('awr_token', d.token)
      else sessionStorage.setItem('awr_token', d.token)
      onSuccess(d.token, d.user)
    } catch { setErr('Koneksi gagal'); setLoading(false) }
  }

  async function doRegister(e: any) {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, email: form.email, password: form.password }) })
      const d = await r.json()
      if (d.error) { setErr(d.error); setLoading(false); return }
      if (d.token) { localStorage.setItem('awr_token', d.token); onSuccess(d.token, d.user) }
    } catch { setErr('Koneksi gagal'); setLoading(false) }
  }

  async function doForgotPw(e: any) {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const r = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) })
      const d = await r.json()
      if (d.error) { setErr(d.error); setLoading(false); return }
      setFpSent(true); setLoading(false)
    } catch { setErr('Koneksi gagal'); setLoading(false) }
  }

  if (!mode) return null
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,4,14,.9)', backdropFilter: 'blur(10px)', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'linear-gradient(145deg,#060f1e,#030810)', border: '1px solid rgba(0,160,255,.3)', borderRadius: 20, padding: '32px 28px', width: 370, maxWidth: '95vw', boxShadow: '0 0 60px rgba(0,120,255,.25), inset 0 1px 0 rgba(255,255,255,.05)', animation: 'slideUp .25s ease' }}>

        {!fpMode ? <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(0,0,0,.3)', borderRadius: 12, padding: 4 }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr('') }} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 9, background: tab === t ? 'linear-gradient(135deg,#0044bb,#00aaff)' : 'transparent', color: tab === t ? '#fff' : '#5a9fd4', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontSize: '.95rem', transition: 'all .2s' }}>
                {t === 'login' ? '🔑 Login' : '✨ Daftar'}
              </button>
            ))}
          </div>

          {err && <div style={{ background: 'rgba(220,50,50,.12)', border: '1px solid rgba(220,50,50,.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ {err}</div>}

          <form onSubmit={tab === 'login' ? doLogin : doRegister}>
            {[
              { placeholder: 'Username', key: 'username', type: 'text' },
              ...(tab === 'register' ? [{ placeholder: 'Email', key: 'email', type: 'email' }] : []),
            ].map(({ placeholder, key, type }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required
                  style={{ width: '100%', background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 11, color: '#cce4f8', padding: '12px 16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif', fontSize: '.9rem', transition: 'border-color .2s' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,160,255,.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,140,255,.2)')} />
              </div>
            ))}
            <div style={{ marginBottom: 14, position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" required
                style={{ width: '100%', background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 11, color: '#cce4f8', padding: '12px 44px 12px 16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif', fontSize: '.9rem', transition: 'border-color .2s' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,160,255,.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,140,255,.2)')} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a9fd4', cursor: 'pointer', fontSize: '1rem' }}>{showPw ? '🙈' : '👁'}</button>
            </div>
            {tab === 'login' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5a9fd4', fontSize: '.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.rememberMe} onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))} style={{ accentColor: '#00aaff' }} /> Ingat saya 30 hari
              </label>
              <button type="button" onClick={() => { setFpMode(true); setErr('') }} style={{ background: 'none', border: 'none', color: '#00aaff', cursor: 'pointer', fontSize: '.8rem', textDecoration: 'underline' }}>Lupa password?</button>
            </div>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#0e2040' : 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 11, color: '#fff', padding: '13px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(0,140,255,.35)' }}>
              {loading ? '⏳ Loading...' : tab === 'login' ? '🚀 Login' : '✨ Daftar Sekarang'}
            </button>
          </form>
        </> : <>
          {/* Forgot Password */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { setFpMode(false); setFpSent(false); setErr('') }} style={{ background: 'none', border: 'none', color: '#5a9fd4', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#00aaff', fontSize: '1.1rem' }}>🔒 Lupa Password</div>
          </div>
          {fpSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📧</div>
              <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>Email terkirim!</div>
              <div style={{ color: '#5a9fd4', fontSize: '.85rem' }}>Cek inbox {fpEmail} untuk reset password (berlaku 20 menit)</div>
            </div>
          ) : (
            <form onSubmit={doForgotPw}>
              {err && <div style={{ background: 'rgba(220,50,50,.12)', border: '1px solid rgba(220,50,50,.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '.85rem', marginBottom: 16 }}>⚠️ {err}</div>}
              <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="Email kamu" required
                style={{ width: '100%', background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 11, color: '#cce4f8', padding: '12px 16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif', marginBottom: 14 }} />
              <button type="submit" disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 11, color: '#fff', padding: '13px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                {loading ? '⏳ Loading...' : '📧 Kirim Reset Link'}
              </button>
            </form>
          )}
        </>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  GET SCRIPT MODAL
// ══════════════════════════════════════════════════════════════
function ScriptModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'link' | 'wait' | 'done'>('link')
  const [secs, setSecs] = useState(12)
  const SCRIPT = `loadstring(game:HttpGet("https://marksanzxmzz.vercel.app/api/script"))()`

  function goWait() {
    window.open('https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/', '_blank')
    setStep('wait')
    let t = 12
    const iv = setInterval(() => { t--; setSecs(t); if (t <= 0) { clearInterval(iv); setStep('done') } }, 1000)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,4,14,.92)', backdropFilter: 'blur(12px)', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'linear-gradient(145deg,#060f1e,#030810)', border: '1px solid rgba(0,160,255,.3)', borderRadius: 22, padding: '36px 30px', width: 430, maxWidth: '95vw', boxShadow: '0 0 60px rgba(0,120,255,.3)', animation: 'slideUp .25s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg,#00aaff,#00ffcc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Orbitron,sans-serif', letterSpacing: 2 }}>⚡ GET SCRIPT</div>
          <div style={{ color: '#5a9fd4', fontSize: '.85rem', marginTop: 6 }}>AWR Auto Walk Recorder</div>
        </div>

        {step === 'link' && <>
          <div style={{ background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.15)', borderRadius: 14, padding: '18px 20px', marginBottom: 22, color: '#8ab8d8', fontSize: '.9rem', lineHeight: 1.7 }}>
            📋 Untuk mendapatkan script, kamu perlu melewati halaman iklan singkat. Ini membantu mendukung developer AWR.
          </div>
          <button onClick={goWait} style={{ width: '100%', background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 12, color: '#fff', padding: '15px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,140,255,.4)', transition: 'transform .15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            🚀 Buka Link & Lanjutkan
          </button>
        </>}

        {step === 'wait' && <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: '#00aaff', fontFamily: 'Orbitron,sans-serif', marginBottom: 10, textShadow: '0 0 30px rgba(0,170,255,.6)' }}>{secs}</div>
          <div style={{ color: '#5a9fd4', fontSize: '.9rem', marginBottom: 20 }}>⏳ Mohon tunggu, script akan muncul otomatis...</div>
          <div style={{ width: '100%', height: 6, background: 'rgba(0,140,255,.15)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#00aaff,#00ffcc)', width: `${((12 - secs) / 12) * 100}%`, transition: 'width 1s linear' }} />
          </div>
        </div>}

        {step === 'done' && <>
          <div style={{ marginBottom: 12, color: '#8ab8d8', fontSize: '.85rem' }}>✅ Script siap! Copy & paste di executor kamu:</div>
          <div style={{ background: '#020810', border: '1px solid rgba(0,160,255,.25)', borderRadius: 12, padding: '16px 14px', fontFamily: 'monospace', fontSize: '.82rem', color: '#00d4ff', wordBreak: 'break-all', marginBottom: 16, position: 'relative' }}>
            {SCRIPT}
            <button onClick={() => navigator.clipboard.writeText(SCRIPT)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,160,255,.2)', border: '1px solid rgba(0,160,255,.3)', borderRadius: 7, color: '#00aaff', padding: '4px 10px', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700 }}>Copy</button>
          </div>
          <button onClick={onClose} style={{ width: '100%', background: 'rgba(0,140,255,.1)', border: '1px solid rgba(0,140,255,.25)', borderRadius: 12, color: '#00aaff', padding: '13px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Tutup</button>
        </>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  BAN DIALOG
// ══════════════════════════════════════════════════════════════
function BanDialog({ reason, support, onClose }: { reason: string, support: any, onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.95)', backdropFilter: 'blur(16px)', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'linear-gradient(145deg,#120008,#0a0014)', border: '1px solid rgba(220,50,80,.5)', borderRadius: 22, padding: '40px 32px', maxWidth: 420, width: '95vw', textAlign: 'center', boxShadow: '0 0 80px rgba(200,30,60,.3)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🚫</div>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#f87171', marginBottom: 8 }}>AKUN DIBANNED</div>
        <div style={{ color: '#9ca3af', fontSize: '.88rem', marginBottom: 20 }}>Akun kamu telah diblokir oleh administrator AWR.</div>
        {reason && (
          <div style={{ background: 'rgba(220,50,80,.1)', border: '1px solid rgba(220,50,80,.25)', borderRadius: 12, padding: '14px 18px', color: '#fca5a5', fontSize: '.88rem', marginBottom: 24, textAlign: 'left', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 6, fontSize: '.8rem', letterSpacing: 1 }}>ALASAN BAN:</div>
            {reason}
          </div>
        )}
        {support?.is_active && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#6b7280', fontSize: '.8rem', marginBottom: 12 }}>Hubungi support untuk banding:</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {support.whatsapp && <a href={support.whatsapp} target="_blank" rel="noreferrer" style={{ background: 'rgba(37,211,102,.15)', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, color: '#4ade80', padding: '10px 18px', textDecoration: 'none', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem' }}>💬 WhatsApp</a>}
              {support.telegram && <a href={support.telegram} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,136,204,.15)', border: '1px solid rgba(0,136,204,.3)', borderRadius: 10, color: '#60a5fa', padding: '10px 18px', textDecoration: 'none', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem' }}>✈️ Telegram</a>}
              {support.discord && <a href={support.discord} target="_blank" rel="noreferrer" style={{ background: 'rgba(88,101,242,.15)', border: '1px solid rgba(88,101,242,.3)', borderRadius: 10, color: '#818cf8', padding: '10px 18px', textDecoration: 'none', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem' }}>🎮 Discord</a>}
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ background: 'rgba(220,50,80,.15)', border: '1px solid rgba(220,50,80,.3)', borderRadius: 11, color: '#f87171', padding: '12px 28px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700 }}>Keluar</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SUPPORT FLOATING BUTTON
// ══════════════════════════════════════════════════════════════
function SupportButton({ support }: { support: any }) {
  const [open, setOpen] = useState(false)
  if (!support?.is_active) return null
  const hasLinks = support.whatsapp || support.telegram || support.discord
  if (!hasLinks) return null

  return (
    <div style={{ position: 'fixed', bottom: 28, left: 28, zIndex: 8000 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: '56px', left: 0, display: 'flex', flexDirection: 'column', gap: 8, animation: 'slideUp .2s ease' }}>
          {support.whatsapp && <a href={support.whatsapp} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(37,211,102,.2)', border: '1px solid rgba(37,211,102,.4)', borderRadius: 10, color: '#4ade80', padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.88rem', backdropFilter: 'blur(10px)' }}>💬 WhatsApp</a>}
          {support.telegram && <a href={support.telegram} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,136,204,.2)', border: '1px solid rgba(0,136,204,.4)', borderRadius: 10, color: '#60a5fa', padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.88rem', backdropFilter: 'blur(10px)' }}>✈️ Telegram</a>}
          {support.discord && <a href={support.discord} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(88,101,242,.2)', border: '1px solid rgba(88,101,242,.4)', borderRadius: 10, color: '#818cf8', padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.88rem', backdropFilter: 'blur(10px)' }}>🎮 Discord</a>}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ width: 48, height: 48, borderRadius: 14, background: open ? 'linear-gradient(135deg,#0044bb,#00aaff)' : 'rgba(0,140,255,.15)', border: '1px solid rgba(0,140,255,.4)', color: '#00aaff', cursor: 'pointer', fontSize: '1.2rem', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,.4)', transition: 'all .2s' }}>
        {open ? '✕' : '🎧'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════
function useToast() {
  const [toasts, setToasts] = useState<{ id: number, msg: string, type: string }[]>([])
  const show = useCallback((msg: string, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  return { toasts, show }
}

// ══════════════════════════════════════════════════════════════
//  PRICES DATA
// ══════════════════════════════════════════════════════════════
const PRICES = [
  { dur: '1 Hari', price: 'Rp1.000', hot: false, tier: 'FREE' },
  { dur: '2 Hari', price: 'Rp3.000', hot: false, tier: 'FREE' },
  { dur: '3 Hari', price: 'Rp5.000', hot: false, tier: 'FREE' },
  { dur: '5 Hari', price: 'Rp8.000', hot: false, tier: 'BASIC' },
  { dur: '7 Hari', price: 'Rp12.000', hot: true, tier: 'BASIC' },
  { dur: '14 Hari', price: 'Rp20.000', hot: false, tier: 'PRO' },
  { dur: '30 Hari', price: 'Rp30.000', hot: true, tier: 'PRO' },
  { dur: '60 Hari', price: 'Rp50.000', hot: false, tier: 'VIP' },
  { dur: 'Lifetime', price: 'Rp100.000', hot: true, tier: 'VIP' },
]

const TIER_CFG: any = {
  FREE: { color: '#8ab8d8', border: 'rgba(138,184,216,.2)', bg: 'rgba(138,184,216,.04)' },
  BASIC: { color: '#4ade80', border: 'rgba(74,222,128,.25)', bg: 'rgba(74,222,128,.05)' },
  PRO: { color: '#00aaff', border: 'rgba(0,170,255,.35)', bg: 'rgba(0,170,255,.08)' },
  VIP: { color: '#f5c542', border: 'rgba(245,197,66,.45)', bg: 'rgba(245,197,66,.1)' },
}

const TYPE_CFG: any = {
  'Report Bug': { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', color: '#f87171', icon: '🐛' },
  'Saran': { bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)', color: '#60a5fa', icon: '💡' },
  'Feedback': { bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.3)', color: '#c084fc', icon: '💬' },
}

// ══════════════════════════════════════════════════════════════
//  LEADERBOARD PROFILE MODAL
// ══════════════════════════════════════════════════════════════
function ProfileModal({ user, onClose }: { user: any, onClose: () => void }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,4,14,.88)', backdropFilter: 'blur(10px)', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'linear-gradient(145deg,#060f1e,#030810)', border: '1px solid rgba(0,160,255,.3)', borderRadius: 22, padding: '36px 30px', width: 340, maxWidth: '95vw', textAlign: 'center', boxShadow: '0 0 60px rgba(0,120,255,.25)', animation: 'slideUp .25s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', overflow: 'hidden', border: `3px solid ${user.rank <= 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][user.rank - 1] : 'rgba(0,140,255,.3)'}`, boxShadow: user.rank === 1 ? '0 0 20px rgba(255,215,0,.4)' : 'none' }}>
          {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0044bb,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#fff', fontFamily: 'Rajdhani,sans-serif' }}>
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#cce4f8', marginBottom: 4 }}>
          {user.rank <= 3 ? medals[user.rank - 1] : `#${user.rank}`} {user.username}
        </div>
        {user.roblox_username && <div style={{ color: '#5a9fd4', fontSize: '.82rem', marginBottom: 20 }}>🎮 {user.roblox_username}</div>}
        <div style={{ background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.15)', borderRadius: 14, padding: '18px', marginBottom: 20 }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00aaff', fontFamily: 'Orbitron,sans-serif' }}>{user.total_executions?.toLocaleString()}</div>
          <div style={{ color: '#5a9fd4', fontSize: '.8rem', marginTop: 4 }}>Total Eksekusi</div>
        </div>
        {!user.leaderboard_public && <div style={{ color: '#9ca3af', fontSize: '.8rem', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🔒 Profil Privat</div>}
        <button onClick={onClose} style={{ background: 'rgba(0,140,255,.1)', border: '1px solid rgba(0,140,255,.25)', borderRadius: 11, color: '#00aaff', padding: '11px 28px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700 }}>Tutup</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  STARS
// ══════════════════════════════════════════════════════════════
function Stars({ rating }: { rating: number }) {
  return <>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < rating ? '#f5c542' : 'rgba(255,255,255,.15)', fontSize: '.95rem' }}>★</span>
  ))}</>
}

// ══════════════════════════════════════════════════════════════
//  SECTION: BERANDA — Info / Artikel
// ══════════════════════════════════════════════════════════════
function SectionLanding({ setAuthMode, setShowScript }: any) {
  const FEATURES = [
    { icon: '🎯', t: 'Record & Replay', d: 'Rekam rute berjalan lalu putar ulang otomatis tanpa henti' },
    { icon: '⚡', t: 'Multi Executor', d: 'Support Synapse X, Fluxus, Delta, Arceus X & semua executor populer' },
    { icon: '🔒', t: 'Key System', d: 'Sistem key aman dengan verifikasi HWID — satu key satu device' },
    { icon: '🗺️', t: 'Route Library', d: 'Simpan berbagai rute farming & kelola dari dashboard' },
    { icon: '📊', t: 'Leaderboard Global', d: 'Bersaing dengan ribuan player di papan skor global AWR' },
    { icon: '🆓', t: 'Key Gratis Harian', d: 'Claim key gratis 24 jam setiap hari tanpa syarat apapun' },
    { icon: '💬', t: 'Community Feedback', d: 'Kirim saran, laporan bug & review langsung dari platform ini' },
    { icon: '🏆', t: 'Event & Turnamen', d: 'Ikut event Block Blast berkala — menang & dapat key VIP gratis!' },
  ]

  const HOWTO = [
    { n: '01', t: 'Daftar Akun', d: 'Buat akun gratis di pojok kanan atas. Tidak perlu email verifikasi.', c: '#00aaff' },
    { n: '02', t: 'Dapatkan Key', d: 'Claim key gratis harian atau beli key premium sesuai kebutuhan farming kamu.', c: '#00ffcc' },
    { n: '03', t: 'Pasang Script', d: 'Copy script AWR lalu paste di executor Roblox favoritmu. Masukkan key saat diminta.', c: '#a78bfa' },
    { n: '04', t: 'Farming Otomatis', d: 'Rekam rute sekali, putar ulang berkali-kali. Nikmati farming tanpa capek!', c: '#f59e0b' },
  ]

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: '90px 24px 60px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,140,255,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,100,.08)', border: '1px solid rgba(0,200,100,.25)', borderRadius: 99, padding: '5px 16px 5px 10px', marginBottom: 26, animation: 'fadeDown .4s ease .05s both' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
          <span style={{ color: '#4ade80', fontSize: '.78rem', fontWeight: 700, letterSpacing: .5 }}>AKTIF & ONLINE 24/7</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.8rem,8vw,5.5rem)', fontWeight: 900, fontFamily: 'Orbitron,sans-serif', background: 'linear-gradient(135deg,#00aaff 0%,#00ffcc 45%,#ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 18, lineHeight: 1.05, animation: 'fadeDown .4s ease .1s both', letterSpacing: -1 }}>
          AUTO WALK<br />RECORDER
        </h1>

        <p style={{ color: '#5a9fd4', fontSize: 'clamp(.95rem,2.2vw,1.1rem)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.85, animation: 'fadeDown .4s ease .15s both' }}>
          Script Roblox paling canggih untuk merekam & memutar rute berjalan otomatis. Farming jadi efisien, akun aman, & komunitas aktif.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeDown .4s ease .2s both', marginBottom: 60 }}>
          <button onClick={() => setShowScript(true)} style={{ background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 14, color: '#fff', padding: '15px 34px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 28px rgba(0,120,255,.45)', transition: 'all .2s', letterSpacing: .5 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(0,120,255,.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(0,120,255,.45)' }}>
            ⚡ GET SCRIPT GRATIS
          </button>
          <button onClick={() => setAuthMode('register')} style={{ background: 'rgba(0,140,255,.07)', border: '1.5px solid rgba(0,140,255,.3)', borderRadius: 14, color: '#00aaff', padding: '15px 34px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all .2s', letterSpacing: .5 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,140,255,.14)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,140,255,.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            ✨ Daftar Gratis
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp .4s ease .25s both', background: 'rgba(0,140,255,.04)', border: '1px solid rgba(0,140,255,.1)', borderRadius: 20, padding: '22px 32px', maxWidth: 600, margin: '0 auto' }}>
          {[{ v: '1000+', l: 'Pengguna Aktif' }, { v: '50K+', l: 'Total Eksekusi' }, { v: '99.9%', l: 'Uptime' }, { v: '24/7', l: 'Support' }].map((s, i) => (
            <div key={s.l} style={{ textAlign: 'center', flex: 1, minWidth: 100, padding: '0 8px', borderRight: i < 3 ? '1px solid rgba(0,140,255,.12)' : 'none' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00aaff', fontFamily: 'Orbitron,sans-serif', letterSpacing: -1 }}>{s.v}</div>
              <div style={{ color: '#3a6a8a', fontSize: '.72rem', marginTop: 4, letterSpacing: .5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TENTANG AWR — Artikel ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 60px' }}>
        <div style={{ background: 'linear-gradient(145deg,rgba(0,140,255,.05),rgba(0,255,204,.03))', border: '1px solid rgba(0,140,255,.15)', borderRadius: 24, padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(0,170,255,.5),transparent)' }} />
          <div style={{ display: 'inline-block', background: 'rgba(0,140,255,.1)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 99, padding: '3px 14px', color: '#00aaff', fontSize: '.7rem', fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>TENTANG AWR</div>
          <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#cce4f8', marginBottom: 16, lineHeight: 1.3 }}>Apa itu AWR Script?</h2>
          <p style={{ color: '#8ab8d8', fontSize: '.95rem', lineHeight: 1.9, marginBottom: 16 }}>
            <strong style={{ color: '#00aaff' }}>AWR (Auto Walk Recorder)</strong> adalah script Roblox yang memungkinkan kamu merekam rute perjalanan karaktermu, lalu memutarnya ulang secara otomatis tanpa henti. Cocok untuk farming item, grinding quest, atau apapun yang butuh pergerakan berulang di game Roblox.
          </p>
          <p style={{ color: '#8ab8d8', fontSize: '.95rem', lineHeight: 1.9, marginBottom: 24 }}>
            Script ini dilengkapi sistem <strong style={{ color: '#00ffcc' }}>Key Protection</strong> berbasis HWID untuk melindungi dari penyalahgunaan, serta dashboard web lengkap untuk manajemen akun, melihat statistik, dan mengikuti event komunitas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {[
              { icon: '🎮', t: 'Untuk Semua Game Roblox', d: 'Bisa digunakan di game Roblox apapun yang membutuhkan pergerakan otomatis' },
              { icon: '🔐', t: 'Aman & Terproteksi', d: 'Key system HWID memastikan hanya kamu yang bisa pakai key milikmu' },
              { icon: '🌐', t: 'Dashboard Online', d: 'Kelola key, lihat statistik, dan ikut event dari mana saja via web' },
            ].map(item => (
              <div key={item.t} style={{ background: 'rgba(0,140,255,.05)', border: '1px solid rgba(0,140,255,.1)', borderRadius: 14, padding: '16px 18px', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,.3)'; e.currentTarget.style.background = 'rgba(0,140,255,.09)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,140,255,.1)'; e.currentTarget.style.background = 'rgba(0,140,255,.05)' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#cce4f8', marginBottom: 6, fontSize: '.95rem' }}>{item.t}</div>
                <div style={{ color: '#3a6a8a', fontSize: '.8rem', lineHeight: 1.6 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARA PAKAI ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,255,204,.08)', border: '1px solid rgba(0,255,204,.2)', borderRadius: 99, padding: '3px 14px', color: '#00ffcc', fontSize: '.7rem', fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>CARA PAKAI</div>
          <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#cce4f8' }}>Mulai dalam 4 langkah mudah</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
          {HOWTO.map((step, i) => (
            <div key={step.n} style={{ background: 'rgba(255,255,255,.02)', border: `1px solid rgba(${step.c === '#00aaff' ? '0,170,255' : step.c === '#00ffcc' ? '0,255,204' : step.c === '#a78bfa' ? '167,139,250' : '245,158,11'},.15)`, borderRadius: 18, padding: '24px 20px', position: 'relative', overflow: 'hidden', animation: `fadeUp .4s ease ${i * .08}s both`, transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '2.4rem', fontWeight: 900, color: step.c, opacity: .18, position: 'absolute', top: 12, right: 16, lineHeight: 1 }}>{step.n}</div>
              <div style={{ background: `rgba(${step.c === '#00aaff' ? '0,170,255' : step.c === '#00ffcc' ? '0,255,204' : step.c === '#a78bfa' ? '167,139,250' : '245,158,11'},.12)`, border: `1px solid rgba(${step.c === '#00aaff' ? '0,170,255' : step.c === '#00ffcc' ? '0,255,204' : step.c === '#a78bfa' ? '167,139,250' : '245,158,11'},.25)`, borderRadius: 99, display: 'inline-flex', padding: '3px 12px', marginBottom: 14 }}>
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '.72rem', color: step.c, letterSpacing: 1 }}>STEP {step.n}</span>
              </div>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#cce4f8', fontSize: '1.05rem', marginBottom: 8 }}>{step.t}</div>
              <div style={{ color: '#3a6a8a', fontSize: '.82rem', lineHeight: 1.7 }}>{step.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FITUR LENGKAP ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,140,255,.1)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 99, padding: '3px 14px', color: '#00aaff', fontSize: '.7rem', fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>FITUR</div>
          <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#cce4f8', marginBottom: 6 }}>Semua yang kamu butuhkan</h2>
          <div style={{ color: '#3a6a8a', fontSize: '.85rem' }}>Platform terlengkap untuk farming otomatis Roblox</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={f.t} style={{ background: 'rgba(0,140,255,.03)', border: '1px solid rgba(0,140,255,.09)', borderRadius: 16, padding: '20px 18px', transition: 'all .22s', animation: `fadeUp .35s ease ${i * .04}s both` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,.35)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(0,140,255,.07)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,140,255,.09)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(0,140,255,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: '#cce4f8', marginBottom: 6, fontFamily: 'Rajdhani,sans-serif', fontSize: '1rem' }}>{f.t}</div>
              <div style={{ color: '#3a6a8a', fontSize: '.8rem', lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(145deg,rgba(0,68,187,.12),rgba(0,170,255,.08))', border: '1px solid rgba(0,140,255,.2)', borderRadius: 24, padding: '44px 36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00aaff,#00ffcc,transparent)' }} />
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '1.6rem', color: '#cce4f8', marginBottom: 12, lineHeight: 1.2 }}>Siap mulai farming<br />otomatis?</h2>
          <p style={{ color: '#5a9fd4', fontSize: '.9rem', marginBottom: 28, lineHeight: 1.7 }}>Daftar gratis sekarang dan dapatkan key 24 jam pertama tanpa biaya. Mulai farming lebih cerdas hari ini!</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setAuthMode('register')} style={{ background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 13, color: '#fff', padding: '14px 32px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,140,255,.4)', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,140,255,.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,140,255,.4)' }}>
              ✨ Daftar Gratis Sekarang
            </button>
            <button onClick={() => setShowScript(true)} style={{ background: 'rgba(0,140,255,.09)', border: '1px solid rgba(0,140,255,.3)', borderRadius: 13, color: '#00aaff', padding: '14px 28px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,140,255,.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,140,255,.09)'}>
              ⚡ Coba Script Dulu
            </button>
          </div>
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SECTION: HARGA
// ══════════════════════════════════════════════════════════════
function SectionHarga() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', animation: 'fadeUp .4s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-block', background: 'rgba(245,197,66,.1)', border: '1px solid rgba(245,197,66,.25)', borderRadius: 99, padding: '4px 14px', color: '#f5c542', fontSize: '.75rem', fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>HARGA</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Rajdhani,sans-serif', color: '#cce4f8', marginBottom: 8 }}>💎 Harga Key VIP</h2>
        <div style={{ color: '#3a6a8a', fontSize: '.88rem' }}>Harga terjangkau · Akses penuh tanpa batas · Transfer QRIS / OVO / GoPay</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
        {PRICES.map((p, i) => {
          const tc = TIER_CFG[p.tier]
          const isLifetime = p.dur === 'Lifetime'
          return (
            <div key={p.dur} style={{ position: 'relative', background: isLifetime ? 'linear-gradient(145deg,rgba(245,197,66,.12),rgba(255,140,0,.06))' : tc.bg, border: `1.5px solid ${isLifetime ? 'rgba(245,197,66,.5)' : tc.border}`, borderRadius: 16, padding: '22px 14px', textAlign: 'center', transition: 'all .2s', animation: `fadeUp .4s ease ${i * .04}s both`, boxShadow: isLifetime ? '0 0 20px rgba(245,197,66,.15)' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = isLifetime ? '0 8px 30px rgba(245,197,66,.25)' : '0 8px 24px rgba(0,0,0,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isLifetime ? '0 0 20px rgba(245,197,66,.15)' : 'none' }}>

              {p.hot && !isLifetime && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#0044bb,#00aaff)', borderRadius: 99, padding: '2px 12px', fontSize: '.65rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(0,120,255,.4)' }}>🔥 POPULER</div>}
              {isLifetime && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f5c542,#ff8c00)', borderRadius: 99, padding: '3px 14px', fontSize: '.68rem', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', boxShadow: '0 2px 14px rgba(245,197,66,.5)', letterSpacing: .5 }}>👑 BEST VALUE</div>}

              <div style={{ display: 'inline-block', background: isLifetime ? 'rgba(245,197,66,.15)' : 'rgba(0,0,0,.2)', borderRadius: 8, padding: '2px 10px', fontSize: '.65rem', fontWeight: 700, color: tc.color, letterSpacing: 1, marginBottom: 10 }}>{p.tier}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: tc.color, fontFamily: 'Rajdhani,sans-serif', marginBottom: 8 }}>{p.dur}</div>
              <div style={{ fontSize: isLifetime ? '1.5rem' : '1.35rem', fontWeight: 900, fontFamily: 'Orbitron,sans-serif', color: isLifetime ? '#ffd700' : '#cce4f8', textShadow: isLifetime ? '0 0 16px rgba(255,215,0,.4)' : 'none' }}>{p.price}</div>
              {isLifetime && <div style={{ color: '#f5c542', fontSize: '.7rem', marginTop: 6, fontWeight: 600 }}>Akses Seumur Hidup ✨</div>}
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32, padding: '20px', background: 'rgba(0,140,255,.04)', border: '1px solid rgba(0,140,255,.12)', borderRadius: 16 }}>
        <div style={{ color: '#5a9fd4', fontSize: '.9rem', marginBottom: 10 }}>🛒 Cara beli key:</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://t.me/sanzxmzz" target="_blank" rel="noreferrer" style={{ background: 'rgba(0,136,204,.15)', border: '1px solid rgba(0,136,204,.3)', borderRadius: 10, color: '#60a5fa', padding: '10px 20px', textDecoration: 'none', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem' }}>✈️ Telegram @sanzxmzz</a>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" style={{ background: 'rgba(37,211,102,.15)', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, color: '#4ade80', padding: '10px 20px', textDecoration: 'none', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem' }}>💬 WhatsApp</a>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SECTION: FEEDBACK PUBLIC
// ══════════════════════════════════════════════════════════════
function SectionFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const loadFeedbacks = useCallback(() => {
    fetch('/api/feedback').then(r => r.json()).then(d => { setFeedbacks(d.feedbacks || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadFeedbacks(); const iv = setInterval(loadFeedbacks, 30000); return () => clearInterval(iv) }, [])

  const total = feedbacks.length
  const bugs = feedbacks.filter(f => f.type === 'Report Bug').length
  const saran = feedbacks.filter(f => f.type === 'Saran').length
  const avgR = total ? Math.round(feedbacks.reduce((s, f) => s + f.rating, 0) / total * 10) / 10 : 0

  const FILTERS = ['Semua', 'Saran', 'Report Bug', 'Feedback']
  const filtered = feedbacks.filter(f => {
    if (filter !== 'Semua' && f.type !== filter) return false
    const q = search.toLowerCase()
    if (q && !f.message?.toLowerCase().includes(q) && !f.roblox_name_masked?.toLowerCase().includes(q) && !f.website_username?.toLowerCase().includes(q)) return false
    return true
  })

  const liveTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px', animation: 'fadeUp .4s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 99, padding: '4px 14px', color: '#c084fc', fontSize: '.75rem', fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>FEEDBACK BOARD</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Rajdhani,sans-serif', color: '#cce4f8', marginBottom: 6 }}>💬 Feedback Pengguna</h2>
          <div style={{ color: '#3a6a8a', fontSize: '.85rem' }}>Feedback & laporan bug dari pengguna AWR — auto-refresh 30 detik</div>
        </div>
        <div style={{ background: 'rgba(245,197,66,.07)', border: '1.5px solid rgba(245,197,66,.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 190 }}>
          <div style={{ fontSize: '.6rem', color: 'rgba(245,197,66,.5)', letterSpacing: 3, marginBottom: 4, fontFamily: 'Rajdhani,sans-serif', fontWeight: 700 }}>⏱ WAKTU SEKARANG</div>
          <div style={{ fontWeight: 900, color: '#f5c542', fontFamily: 'Orbitron,sans-serif', fontSize: '.85rem', letterSpacing: 1.5, textShadow: '0 0 12px rgba(245,197,66,.4)' }}>{liveTime}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { v: loading ? '–' : total, l: 'Total', c: '#00aaff', i: '📋' },
          { v: loading ? '–' : bugs, l: 'Bug Report', c: '#f87171', i: '🐛' },
          { v: loading ? '–' : saran, l: 'Saran', c: '#60a5fa', i: '💡' },
          { v: loading ? '–' : (avgR > 0 ? `${avgR}★` : '–'), l: 'Avg Rating', c: '#f5c542', i: '⭐' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(0,140,255,.05)', border: '1px solid rgba(0,140,255,.12)', borderRadius: 14, padding: '16px 10px', textAlign: 'center', transition: 'border-color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,140,255,.3)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,140,255,.12)')}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c, fontFamily: 'Orbitron,sans-serif' }}>{s.v}</div>
            <div style={{ fontSize: '.72rem', color: '#3a6a8a', marginTop: 4 }}>{s.i} {s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'linear-gradient(135deg,#0044bb,#00aaff)' : 'rgba(0,140,255,.07)', border: `1px solid ${filter === f ? 'transparent' : 'rgba(0,140,255,.2)'}`, borderRadius: 9, color: filter === f ? '#fff' : '#5a9fd4', padding: '7px 16px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.82rem', transition: 'all .2s' }}>
            {f}{f !== 'Semua' && !loading ? <span style={{ marginLeft: 5, opacity: .7, fontSize: '.72rem' }}>({feedbacks.filter(x => x.type === f).length})</span> : null}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari feedback..."
          style={{ flex: 1, minWidth: 160, background: 'rgba(0,140,255,.06)', border: '1px solid rgba(0,140,255,.18)', borderRadius: 9, color: '#cce4f8', padding: '8px 14px', outline: 'none', fontFamily: 'Outfit,sans-serif', fontSize: '.83rem' }} />
        <button onClick={loadFeedbacks} style={{ background: 'rgba(0,140,255,.07)', border: '1px solid rgba(0,140,255,.2)', borderRadius: 9, color: '#5a9fd4', padding: '8px 14px', cursor: 'pointer', transition: 'all .2s' }} title="Refresh">🔄</button>
      </div>

      {/* List */}
      {loading ? [1, 2, 3].map(i => (
        <div key={i} style={{ background: 'rgba(0,140,255,.04)', border: '1px solid rgba(0,140,255,.1)', borderRadius: 16, height: 100, marginBottom: 12, opacity: .5 }} />
      )) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#3a6a8a' }}>
          <div style={{ fontSize: '3rem', marginBottom: 14, opacity: .3 }}>💬</div>
          <div>Belum ada feedback{filter !== 'Semua' ? ` untuk "${filter}"` : ''}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((fb, i) => {
            const tc = TYPE_CFG[fb.type] || TYPE_CFG['Feedback']
            return (
              <div key={fb.id} style={{ background: 'rgba(0,140,255,.03)', border: '1px solid rgba(0,140,255,.12)', borderRadius: 18, padding: '18px 20px', animation: `fadeUp .3s ease ${i * .04}s both`, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,140,255,.12)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, borderRadius: 99, padding: '3px 12px', fontSize: '.72rem', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', letterSpacing: .5 }}>{tc.icon} {fb.type}</span>
                    <span><Stars rating={fb.rating} /></span>
                    <span style={{ fontSize: '.72rem', color: 'rgba(245,197,66,.6)' }}>({fb.rating}/5)</span>
                  </div>
                  <div style={{ fontWeight: 900, color: '#f5c542', fontFamily: 'Orbitron,sans-serif', fontSize: '.65rem', letterSpacing: 1, textShadow: '0 0 8px rgba(245,197,66,.3)', background: 'rgba(245,197,66,.06)', border: '1px solid rgba(245,197,66,.2)', borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap' }}>📅 {fmtDate(fb.created_at)}</div>
                </div>
                <p style={{ color: '#b0ccdf', fontSize: '.9rem', lineHeight: 1.7, margin: '0 0 14px', wordBreak: 'break-word' }}>{fb.message}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '1px solid rgba(0,140,255,.1)', paddingTop: 12 }}>
                  {fb.website_username && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.68rem', color: '#3a6a8a', fontFamily: 'Rajdhani,sans-serif', letterSpacing: .5 }}>AKUN</span>
                    <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#00aaff', background: 'rgba(0,170,255,.08)', border: '1px solid rgba(0,170,255,.2)', borderRadius: 6, padding: '2px 8px' }}>👤 {fb.website_username}</span>
                  </div>}
                  {fb.roblox_name_masked && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.68rem', color: '#3a6a8a', fontFamily: 'Rajdhani,sans-serif', letterSpacing: .5 }}>ROBLOX</span>
                    <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#8ab8d8', background: 'rgba(138,184,216,.06)', border: '1px solid rgba(138,184,216,.15)', borderRadius: 6, padding: '2px 8px', letterSpacing: 1 }}>🎮 {fb.roblox_name_masked}</span>
                  </div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && feedbacks.length > 0 && <div style={{ textAlign: 'center', marginTop: 20, color: '#1e3a5a', fontSize: '.75rem' }}>Menampilkan {filtered.length} dari {feedbacks.length} feedback · auto-refresh 30 detik</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SECTION: LEADERBOARD
// ══════════════════════════════════════════════════════════════
function SectionLeaderboard() {
  const [lb, setLb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => { setLb(d.leaderboard || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px', animation: 'fadeUp .4s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'inline-block', background: 'rgba(245,197,66,.1)', border: '1px solid rgba(245,197,66,.25)', borderRadius: 99, padding: '4px 14px', color: '#f5c542', fontSize: '.75rem', fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>LEADERBOARD</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Rajdhani,sans-serif', color: '#cce4f8', marginBottom: 8 }}>🏆 Top Players</h2>
        <div style={{ color: '#3a6a8a', fontSize: '.85rem' }}>Ranking berdasarkan total eksekusi script</div>
      </div>

      {loading ? [1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ background: 'rgba(0,140,255,.04)', border: '1px solid rgba(0,140,255,.1)', borderRadius: 14, height: 72, marginBottom: 10, opacity: .5 }} />
      )) : lb.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a6a8a' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12, opacity: .3 }}>🏆</div>
          <div>Belum ada data leaderboard</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lb.map((u, i) => (
            <div key={u.username} onClick={() => setSelected(u)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: i < 3 ? `rgba(${['255,215,0', '192,192,192', '205,127,50'][i]},.05)` : 'rgba(0,140,255,.04)', border: `1px solid ${i < 3 ? `rgba(${['255,215,0', '192,192,192', '205,127,50'][i]},.25)` : 'rgba(0,140,255,.12)'}`, borderRadius: 14, padding: '12px 16px', cursor: 'pointer', transition: 'all .2s', animation: `fadeUp .3s ease ${i * .04}s both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = i < 3 ? `rgba(${['255,215,0', '192,192,192', '205,127,50'][i]},.5)` : 'rgba(0,160,255,.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = i < 3 ? `rgba(${['255,215,0', '192,192,192', '205,127,50'][i]},.25)` : 'rgba(0,140,255,.12)' }}>

              {/* Rank */}
              <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? '1.4rem' : '.95rem', fontWeight: 900, color: i < 3 ? rankColors[i] : '#5a9fd4', fontFamily: 'Orbitron,sans-serif', flexShrink: 0 }}>
                {i < 3 ? medals[i] : u.rank}
              </div>

              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${i < 3 ? rankColors[i] : 'rgba(0,140,255,.3)'}`, flexShrink: 0, boxShadow: i === 0 ? '0 0 14px rgba(255,215,0,.4)' : 'none' }}>
                {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0044bb,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem' }}>
                    {u.leaderboard_public ? u.username[0]?.toUpperCase() : '?'}
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#cce4f8', fontFamily: 'Rajdhani,sans-serif', fontSize: '1rem' }}>{u.username}</div>
                {u.roblox_username && <div style={{ fontSize: '.75rem', color: '#3a6a8a' }}>🎮 {u.roblox_username}</div>}
              </div>

              {/* Executions */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, color: i < 3 ? rankColors[i] : '#00aaff', fontFamily: 'Orbitron,sans-serif', fontSize: '.9rem' }}>{u.total_executions?.toLocaleString()}</div>
                <div style={{ fontSize: '.7rem', color: '#3a6a8a' }}>eksekusi</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <ProfileModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  NAVBAR TABS
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'beranda', label: '🏠 Beranda' },
  { id: 'harga', label: '💎 Harga' },
  { id: 'feedback', label: '💬 Feedback' },
  { id: 'leaderboard', label: '🏆 Ranking' },
]

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter()
  const [tab, setTab] = useState('beranda')
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [showScript, setShowScript] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [bannedData, setBannedData] = useState<{ reason: string, support: any } | null>(null)
  const [support, setSupport] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const { toasts, show: showToast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('awr_token') || sessionStorage.getItem('awr_token')
    if (token) {
      // Verify token and check ban
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            if (d.user.is_banned) {
              // Fetch support settings then show ban dialog
              fetch('/api/developer/support').then(r => r.json()).then(s => {
                setBannedData({ reason: d.user.ban_reason || '', support: s.settings || {} })
              }).catch(() => setBannedData({ reason: d.user.ban_reason || '', support: {} }))
            } else {
              setLoggedIn(true)
            }
          }
        }).catch(() => {})
    }

    // Load support settings
    fetch('/api/developer/support').then(r => r.json()).then(d => setSupport(d.settings)).catch(() => {})

    // Scroll detection
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Handle hash tab from URL
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (TABS.find(t => t.id === hash)) setTab(hash)
  }, [])

  function handleAuthSuccess(token: string, user: any) {
    setAuthMode(null)
    setLoggedIn(true)
    showToast(`Selamat datang, ${user.username}! 🎉`, 'success')
    setTimeout(() => router.push('/dashboard'), 800)
  }

  function handleBanClose() {
    localStorage.removeItem('awr_token')
    sessionStorage.removeItem('awr_token')
    setBannedData(null)
  }

  function switchTab(id: string) {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Head>
        <title>AWR Key System — Auto Walk Recorder</title>
        <meta name="description" content="AWR Script - Auto Walk Recorder untuk Roblox. Script terbaik untuk farming otomatis!" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#020810', color: '#cce4f8', fontFamily: 'Outfit,sans-serif', position: 'relative', overflowX: 'hidden' }}>
        <Particles />

        {/* ── NAVBAR ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 60,
          background: scrolled ? 'rgba(2,8,16,.95)' : 'rgba(2,8,16,.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(0,140,255,.2)' : 'rgba(0,140,255,.08)'}`,
          transition: 'all .3s ease',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,.5)' : 'none',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0044bb,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 0 14px rgba(0,140,255,.4)' }}>⚡</div>
            <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '1.1rem', background: 'linear-gradient(135deg,#00aaff,#00ffcc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1 }}>AWR</span>
          </div>

          {/* Tabs - center */}
          <div style={{ display: 'flex', gap: 4, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{
                background: tab === t.id ? 'rgba(0,140,255,.15)' : 'transparent',
                border: `1px solid ${tab === t.id ? 'rgba(0,140,255,.35)' : 'transparent'}`,
                borderRadius: 9, color: tab === t.id ? '#00aaff' : '#5a9fd4',
                padding: '7px 14px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif',
                fontWeight: 700, fontSize: '.85rem', transition: 'all .2s', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Auth buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {loggedIn ? (
              <button onClick={() => router.push('/dashboard')} style={{ background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 9, color: '#fff', padding: '8px 18px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem', boxShadow: '0 2px 14px rgba(0,120,255,.35)' }}>
                Dashboard →
              </button>
            ) : <>
              <button onClick={() => setAuthMode('login')} style={{ background: 'rgba(0,140,255,.1)', border: '1px solid rgba(0,140,255,.25)', borderRadius: 9, color: '#00aaff', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem', transition: 'all .2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,140,255,.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,140,255,.1)')}>
                Login
              </button>
              <button onClick={() => setAuthMode('register')} style={{ background: 'linear-gradient(135deg,#0044bb,#00aaff)', border: 'none', borderRadius: 9, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem', boxShadow: '0 2px 14px rgba(0,120,255,.35)' }}>
                Daftar
              </button>
            </>}
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <div style={{ position: 'relative', zIndex: 1, paddingTop: 60 }}>
          {tab === 'beranda' && <SectionLanding setAuthMode={setAuthMode} setShowScript={setShowScript} />}
          {tab === 'harga' && <SectionHarga />}
          {tab === 'feedback' && <SectionFeedback />}
          {tab === 'leaderboard' && <SectionLeaderboard />}
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(0,140,255,.1)', padding: '28px 24px', textAlign: 'center', color: '#3a6a8a', fontSize: '.82rem', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: '.95rem', background: 'linear-gradient(135deg,#00aaff,#00ffcc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ AWR KEY SYSTEM</span>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            {TABS.map(t => <span key={t.id} onClick={() => switchTab(t.id)} style={{ cursor: 'pointer', color: '#5a9fd4', transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#00aaff')} onMouseLeave={e => (e.currentTarget.style.color = '#5a9fd4')}>{t.label}</span>)}
            <span style={{ color: '#1e3a5a' }}>|</span>
            <a href="https://t.me/sanzxmzz" target="_blank" rel="noreferrer" style={{ color: '#5a9fd4', textDecoration: 'none' }}>Telegram</a>
            <a href="https://tiktok.com/@sanzxmzz" target="_blank" rel="noreferrer" style={{ color: '#5a9fd4', textDecoration: 'none' }}>TikTok</a>
          </div>
          <div>© 2024 Sanzxmzz · AWR Key System · All Rights Reserved</div>
        </footer>
      </div>

      {/* ── TOASTS ── */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'success' ? 'rgba(74,222,128,.15)' : 'rgba(0,140,255,.15)', border: `1px solid ${t.type === 'success' ? 'rgba(74,222,128,.4)' : 'rgba(0,140,255,.4)'}`, borderRadius: 12, padding: '12px 18px', color: t.type === 'success' ? '#4ade80' : '#60a5fa', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, backdropFilter: 'blur(10px)', animation: 'slideUp .25s ease', boxShadow: '0 4px 20px rgba(0,0,0,.4)', maxWidth: 280, fontSize: '.9rem' }}>{t.msg}</div>
        ))}
      </div>

      {/* ── SUPPORT BUTTON ── */}
      <SupportButton support={support} />

      {/* ── MODALS ── */}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleAuthSuccess} />}
      {showScript && <ScriptModal onClose={() => setShowScript(false)} />}
      {bannedData && <BanDialog reason={bannedData.reason} support={bannedData.support} onClose={handleBanClose} />}

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%,100% { opacity:.5 } 50% { opacity:.9 } }
        * { box-sizing:border-box; margin:0; padding:0 }
        html { scroll-behavior:smooth }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:#020810 }
        ::-webkit-scrollbar-thumb { background:rgba(0,140,255,.35); border-radius:99px }
        ::-webkit-scrollbar-thumb:hover { background:rgba(0,140,255,.55) }
        input::placeholder { color:rgba(90,159,212,.55) }
        a { transition: color .2s }
        @media (max-width:600px) {
          nav > div:nth-child(2) { display:none }
        }
      `}</style>
    </>
  )
}
