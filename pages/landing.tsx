import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

// ─── Particles (blue) ────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const pts = Array.from({ length: 75 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 2 + .4, a: Math.random() * .45 + .12
    }))
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(50,160,255,${p.a * .5})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 130) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(30,130,255,${(1 - d / 130) * .13})`; ctx.lineWidth = .6; ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ─── Auth Dialog ──────────────────────────────────────────────
function AuthDialog({ onClose, onAuth }: { onClose: () => void; onAuth: (t: string, u: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email'|'code'>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPw, setForgotNewPw] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  async function submitReset(e: React.FormEvent) {
    e.preventDefault(); setResetLoading(true)
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword: forgotNewPw })
    })
    const d = await r.json(); setResetLoading(false)
    if (d.error) { setResetMsg('Error: ' + d.error) } else { setResetMsg(d.message || 'Password berhasil direset! Silakan login.') }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    const body = mode === 'login'
      ? { username: form.username, password: form.password, rememberMe: remember }
      : form
    const r = await fetch('/api/auth/' + (mode === 'login' ? 'login' : 'register'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const d = await r.json(); setLoading(false)
    if (d.error) { setErr(d.error); return }
    if (remember) localStorage.setItem('awr_token', d.token)
    else sessionStorage.setItem('awr_token', d.token)
    onAuth(d.token, d.user); onClose()
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault(); setForgotLoading(true)
    const r = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail })
    })
    const d = await r.json(); setForgotLoading(false)
    if (d.error) { setForgotMsg('Error: ' + d.error) } else { setForgotMsg(d.message || 'Kode dikirim ke email kamu!') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(14px)', animation: 'ldFadeIn .2s ease', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'linear-gradient(160deg,rgba(10,12,20,.99),rgba(6,8,14,.99))', border: '1px solid rgba(50,140,255,.2)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 420, animation: 'ldSlideUp .35s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 40px 80px rgba(0,0,0,.9)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(50,140,255,.7),transparent)', borderRadius: '24px 24px 0 0' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, padding: '4px 10px', color: 'rgba(150,170,220,.6)', cursor: 'pointer', fontSize: '.85rem' }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#1e90ff,#60c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 3 }}>AWR</div>
          <div style={{ fontSize: '.7rem', color: 'rgba(100,140,200,.5)', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>Key System v3</div>
        </div>

        {!showForgot ? <>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 5, marginBottom: 22 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem', letterSpacing: .5, transition: 'all .2s',
                background: mode === m ? 'linear-gradient(135deg,rgba(30,100,255,.3),rgba(80,160,255,.2))' : 'transparent',
                color: mode === m ? '#60c0ff' : 'rgba(140,160,210,.4)',
                boxShadow: mode === m ? '0 2px 12px rgba(30,100,255,.15),inset 0 1px 0 rgba(255,255,255,.08)' : 'none',
              }}>
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Email</label>
                <input style={inpStyle} type="email" placeholder="email@..." value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Username</label>
              <input style={inpStyle} placeholder="Username..." value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inpStyle, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Password..." value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(120,150,210,.5)', cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
            </div>
            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '.78rem', color: 'rgba(120,150,200,.6)' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#4facfe' }} />
                  Ingat saya
                </label>
                <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: '#4facfe', cursor: 'pointer', fontSize: '.78rem' }}>Lupa password?</button>
              </div>
            )}
            {err && <div style={{ background: 'rgba(255,60,60,.08)', border: '1px solid rgba(255,60,60,.2)', borderRadius: 10, padding: '9px 14px', fontSize: '.8rem', color: '#ff6b6b', marginBottom: 14 }}>{err}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Loading...' : mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
            </button>
          </form>
        </> : <>
          <button onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotStep('email'); setResetMsg('') }} style={{ background: 'none', border: 'none', color: '#4facfe', cursor: 'pointer', fontSize: '.82rem', marginBottom: 18 }}>← Kembali</button>
          <div style={{ marginBottom: 14, fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#c8e0ff' }}>Reset Password</div>
          
          {resetMsg ? (
            <div style={{ background: resetMsg.startsWith('Error') ? 'rgba(255,60,60,.08)' : 'rgba(50,130,255,.08)', border: `1px solid ${resetMsg.startsWith('Error') ? 'rgba(255,60,60,.2)' : 'rgba(50,130,255,.2)'}`, borderRadius: 10, padding: '12px 16px', fontSize: '.84rem', color: resetMsg.startsWith('Error') ? '#ff8888' : '#7ab8ff', lineHeight: 1.5 }}>
              {resetMsg}
              {!resetMsg.startsWith('Error') && <div style={{ marginTop: 10 }}><button onClick={() => { setShowForgot(false); setForgotStep('email'); setResetMsg('') }} style={{ ...btnStyle, padding: '9px 20px', width: 'auto', fontSize: '.85rem', display: 'inline-block' }}>Login Sekarang</button></div>}
            </div>
          ) : forgotStep === 'email' ? (
            forgotMsg ? (
              <div>
                <div style={{ background: 'rgba(50,130,255,.08)', border: '1px solid rgba(50,130,255,.2)', borderRadius: 10, padding: '12px 16px', fontSize: '.84rem', color: '#7ab8ff', lineHeight: 1.5, marginBottom: 16 }}>{forgotMsg}</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Masukkan Kode (6 digit)</label>
                  <input style={inpStyle} placeholder="123456" maxLength={6} value={forgotCode} onChange={e => setForgotCode(e.target.value)} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Password Baru</label>
                  <input style={inpStyle} type="password" placeholder="Password baru (min 6 karakter)..." value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} />
                </div>
                <button onClick={submitReset} disabled={resetLoading || !forgotCode || !forgotNewPw} style={btnStyle}>{resetLoading ? 'Mereset...' : 'Reset Password'}</button>
              </div>
            ) : (
              <form onSubmit={submitForgot}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Email Terdaftar</label>
                  <input style={inpStyle} type="email" placeholder="email@..." value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={forgotLoading} style={btnStyle}>{forgotLoading ? 'Mengirim...' : 'Kirim Kode Reset ke Email'}</button>
              </form>
            )
          ) : null}
        </>}
      </div>
    </div>
  )
}

const inpStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(50,120,255,.15)',
  borderRadius: 12, padding: '11px 14px', color: '#d0e4ff', fontSize: '.875rem',
  fontFamily: 'Outfit,sans-serif', outline: 'none',
}
const btnStyle: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(135deg,#1a5fd4,#3a8fff)', color: '#fff',
  border: 'none', borderRadius: 13, padding: '13px', fontFamily: 'Rajdhani,sans-serif',
  fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', letterSpacing: .5,
  boxShadow: '0 4px 20px rgba(30,100,255,.3)', transition: 'all .2s',
}

// ─── GetScript Modal ──────────────────────────────────────────
function GetScriptModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'waiting' | 'countdown' | 'done'>('waiting')
  const [count, setCount] = useState(12)
  const LINK = 'https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/'
  const SCRIPT = `loadstring(game:HttpGet("https://msanzxmzz.vercel.app/api/script"))()` // placeholder

  function openLink() {
    window.open(LINK, '_blank')
    setPhase('countdown')
    let c = 12
    const t = setInterval(() => {
      c--; setCount(c)
      if (c <= 0) { clearInterval(t); setPhase('done') }
    }, 1000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(16px)', animation: 'ldFadeIn .2s ease', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'linear-gradient(160deg,rgba(8,10,18,.99),rgba(4,6,12,.99))', border: '1px solid rgba(50,140,255,.22)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, animation: 'ldSlideUp .35s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 40px 80px rgba(0,0,0,.95)', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(50,140,255,.7),transparent)', borderRadius: '24px 24px 0 0' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, padding: '4px 10px', color: 'rgba(150,170,220,.6)', cursor: 'pointer', fontSize: '.85rem' }}>✕</button>

        <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📜</div>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#60c0ff', marginBottom: 8 }}>GET SCRIPT AWR</div>

        {phase === 'waiting' && <>
          <div style={{ fontSize: '.85rem', color: 'rgba(140,170,220,.6)', lineHeight: 1.6, marginBottom: 24 }}>
            Klik tombol di bawah untuk membuka link, tunggu <strong style={{ color: '#4facfe' }}>12 detik</strong>, lalu script akan muncul otomatis!
          </div>
          <button onClick={openLink} style={{ ...btnStyle, width: 'auto', padding: '13px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Buka Link Dulu
          </button>
        </>}

        {phase === 'countdown' && <>
          <div style={{ fontSize: '3.5rem', fontFamily: 'Orbitron,sans-serif', fontWeight: 800, color: '#4facfe', margin: '16px 0', textShadow: '0 0 30px rgba(79,172,254,.6)', animation: 'ldPulse 1s ease-in-out infinite' }}>{count}</div>
          <div style={{ fontSize: '.85rem', color: 'rgba(140,170,220,.5)', marginBottom: 16 }}>Tunggu sebentar...</div>
          <div style={{ background: 'rgba(50,140,255,.08)', borderRadius: 12, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#1a5fd4,#4facfe)', width: `${((12 - count) / 12) * 100}%`, transition: 'width .9s linear' }} />
          </div>
        </>}

        {phase === 'done' && <>
          <div style={{ background: 'rgba(30,50,100,.3)', border: '1px solid rgba(50,140,255,.2)', borderRadius: 14, padding: '14px 18px', fontFamily: 'monospace', fontSize: '.85rem', color: '#7ab8ff', textAlign: 'left', wordBreak: 'break-all', marginBottom: 18, lineHeight: 1.6 }}>{SCRIPT}</div>
          <button onClick={() => { navigator.clipboard.writeText(SCRIPT).catch(() => {}) }} style={btnStyle}>
            📋 Copy Script
          </button>
        </>}
      </div>
    </div>
  )
}

// ─── Feedback Page ────────────────────────────────────────────
function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [form, setForm] = useState({ type: 'Feedback', message: '', rating: 5, roblox_username: '', website_username: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/feedback').then(r => r.json()).then(d => { if (d.feedbacks) setFeedbacks(d.feedbacks); setLoading(false) })
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    const r = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        message: form.message,
        rating: form.rating,
        roblox_username: form.roblox_username,
        website_username: form.website_username || undefined,
      })
    })
    const d = await r.json(); setSubmitting(false)
    if (d.error) { alert('Error: ' + d.error); return }
    setSubmitted(true)
    setForm({ type: 'Feedback', message: '', rating: 5, roblox_username: '', website_username: '' })
    // Reload feedbacks
    fetch('/api/feedback').then(r => r.json()).then(d => { if (d.feedbacks) setFeedbacks(d.feedbacks) })
    setTimeout(() => setSubmitted(false), 4000)
  }

  function maskRoblox(name: string) {
    if (!name) return '***'
    if (name.length <= 4) return name[0] + '*'.repeat(name.length - 1)
    const a = Math.ceil(name.length / 3), b = Math.ceil(name.length / 3)
    return name.slice(0, a) + '*'.repeat(name.length - a - b) + name.slice(-b)
  }

  function formatRealtime(dateStr: string) {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const STARS = [1, 2, 3, 4, 5]
  const typeColor: Record<string, string> = { 'Report Bug': '#ff5c6a', 'Saran': '#4facfe', 'Feedback': '#32ff7e' }
  const TYPES = ['Feedback', 'Saran', 'Report Bug']

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#60c0ff', marginBottom: 8 }}>FEEDBACK PENGGUNA</div>
        <div style={{ fontSize: '.84rem', color: 'rgba(120,160,220,.5)' }}>Feedback langsung dari pengguna AWR · public</div>
      </div>

      {/* Form Submit Feedback */}
      <div style={{ maxWidth: 600, margin: '0 auto 40px', background: 'rgba(10,15,30,.7)', border: '1px solid rgba(50,120,255,.18)', borderRadius: 20, padding: '24px 24px 20px' }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#60c0ff', marginBottom: 18 }}>📝 Kirim Feedback / Report</div>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#32ff7e', fontSize: '.9rem' }}>✅ Feedback berhasil dikirim! Terima kasih.</div>
        ) : (
          <form onSubmit={submitFeedback}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Tipe Feedback</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(50,120,255,.15)', borderRadius: 10, padding: '9px 12px', color: '#d0e4ff', fontSize: '.875rem', outline: 'none' }}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Username Akun Website</label>
                <input value={form.website_username} onChange={e => setForm(f => ({ ...f, website_username: e.target.value }))} placeholder="Optional..."
                  style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(50,120,255,.15)', borderRadius: 10, padding: '9px 12px', color: '#d0e4ff', fontSize: '.875rem', outline: 'none' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '.72rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Username Roblox</label>
              <input value={form.roblox_username} onChange={e => setForm(f => ({ ...f, roblox_username: e.target.value }))} placeholder="Username Roblox kamu..." required
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(50,120,255,.15)', borderRadius: 10, padding: '9px 12px', color: '#d0e4ff', fontSize: '.875rem', outline: 'none' }} />
              <div style={{ fontSize: '.68rem', color: 'rgba(100,140,200,.35)', marginTop: 4 }}>🔒 Nama akan otomatis disensor (mis: San***zzz)</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '.72rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 5 }}>Pesan</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tulis feedback kamu..." required
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(50,120,255,.15)', borderRadius: 10, padding: '9px 12px', color: '#d0e4ff', fontSize: '.875rem', outline: 'none', minHeight: 80, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.72rem', color: 'rgba(120,150,210,.6)', fontWeight: 600, marginBottom: 8 }}>Rating</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {STARS.map(s => (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, rating: s }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', opacity: s <= form.rating ? 1 : 0.2, transition: 'all .1s' }}>⭐</button>
                ))}
                <span style={{ fontSize: '.82rem', color: 'rgba(120,160,200,.5)', alignSelf: 'center', marginLeft: 4 }}>{form.rating}/5</span>
              </div>
            </div>
            <button type="submit" disabled={submitting}
              style={{ width: '100%', background: 'linear-gradient(135deg,#1a5fd4,#3a8fff)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(30,100,255,.3)', opacity: submitting ? .6 : 1 }}>
              {submitting ? 'Mengirim...' : '📤 Kirim Feedback'}
            </button>
          </form>
        )}
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(100,140,200,.4)' }}>Memuat...</div>
      ) : feedbacks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(100,140,200,.3)' }}>Belum ada feedback</div>
      ) : (
        <div style={{ display: 'grid', gap: 14, maxWidth: 800, margin: '0 auto' }}>
          {feedbacks.slice(0, 20).map((f, i) => (
            <div key={f.id} style={{
              background: 'rgba(10,15,30,.6)', border: '1px solid rgba(50,120,255,.1)',
              borderRadius: 16, padding: '16px 20px',
              animation: `ldFadeUp .3s ease ${i * .04}s both`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    background: `rgba(${f.type === 'Report Bug' ? '255,92,106' : f.type === 'Saran' ? '79,172,254' : '50,255,126'},.1)`,
                    border: `1px solid rgba(${f.type === 'Report Bug' ? '255,92,106' : f.type === 'Saran' ? '79,172,254' : '50,255,126'},.25)`,
                    color: typeColor[f.type] || '#8888aa', borderRadius: 20, padding: '2px 10px', fontSize: '.68rem', fontWeight: 700, letterSpacing: .5
                  }}>{f.type}</span>
                  {f.website_username && <span style={{ fontSize: '.78rem', color: 'rgba(120,160,200,.5)' }}>@{f.website_username}</span>}
                  <span style={{ fontSize: '.72rem', color: 'rgba(100,140,190,.4)' }}>
                    Roblox: <span style={{ color: 'rgba(160,180,220,.5)' }}>{f.roblox_name_masked || maskRoblox(f.roblox_username || '')}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {STARS.map(s => <span key={s} style={{ fontSize: '.9rem', opacity: s <= f.rating ? 1 : .18 }}>⭐</span>)}
                </div>
              </div>
              <div style={{ fontSize: '.84rem', color: '#b8cce8', lineHeight: 1.6, marginBottom: 10 }}>{f.message}</div>
              <div style={{ fontSize: '.7rem', fontFamily: 'Orbitron,sans-serif', fontWeight: 700, color: '#f5c542', letterSpacing: .5 }}>
                📅 {formatRealtime(f.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Price List ───────────────────────────────────────────────
const PRICES = [
  { dur: '1 Hari', price: 'Rp1.000', tier: 'FREE' },
  { dur: '2 Hari', price: 'Rp3.000', tier: 'FREE' },
  { dur: '3 Hari', price: 'Rp5.000', tier: 'FREE' },
  { dur: '5 Hari', price: 'Rp8.000', tier: 'STANDARD' },
  { dur: '7 Hari', price: 'Rp12.000', tier: 'STANDARD' },
  { dur: '14 Hari', price: 'Rp20.000', tier: 'PREMIUM' },
  { dur: '30 Hari', price: 'Rp30.000', tier: 'PREMIUM' },
  { dur: '60 Hari', price: 'Rp45.000', tier: 'PREMIUM' },
  { dur: 'Lifetime', price: 'Rp50.000', tier: 'VIP' },
]

const tierColor: Record<string, string> = {
  FREE: '#4facfe', STANDARD: '#32ff7e', PREMIUM: '#c77dff', VIP: '#fbbf24'
}
const tierGlow: Record<string, string> = {
  FREE: 'rgba(79,172,254,.12)', STANDARD: 'rgba(50,255,126,.12)', PREMIUM: 'rgba(199,125,255,.12)', VIP: 'rgba(251,191,36,.12)'
}

export default function LandingPage() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showScript, setShowScript] = useState(false)
  const [page, setPage] = useState<'home' | 'harga' | 'feedback'>('home')

  function openAuth(mode: 'login' | 'register') {
    setAuthMode(mode); setShowAuth(true)
  }
  function onAuth(t: string, u: any) {
    setShowAuth(false)
    if (u.role === 'developer') router.push('/developer')
    else if (u.role === 'reseller') router.push('/reseller')
    else router.push('/user')
  }

  const FEATURES = [
    { icon: '🔐', title: 'Key System Canggih', desc: 'HWID binding, durasi fleksibel, auto-expire sistem yang aman' },
    { icon: '⚡', title: 'Performa Tinggi', desc: 'Verifikasi cepat < 100ms, server uptime 99.9%' },
    { icon: '🛡️', title: 'Anti-Abuse', desc: 'Rate limiting, IP monitoring, ban system otomatis' },
    { icon: '📊', title: 'Dashboard Lengkap', desc: 'Statistik real-time, leaderboard, notifikasi' },
    { icon: '🎮', title: 'Route Library', desc: 'Upload & download rute AWR script dengan mudah' },
    { icon: '💬', title: 'Support Aktif', desc: 'Tim support responsif siap bantu 24/7' },
  ]

  return (
    <>
      <Head>
        <title>AWR Key System — by Sanzxmzz</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html,body{background:#040610;color:#d0e4ff;font-family:'Outfit',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#060810}::-webkit-scrollbar-thumb{background:rgba(50,140,255,.3);border-radius:4px}
        @keyframes ldFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ldFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ldSlideUp{from{opacity:0;transform:translateY(30px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes ldFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes ldPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.1)}}
        @keyframes ldGlow{0%,100%{filter:drop-shadow(0 0 12px rgba(30,120,255,.5))}50%{filter:drop-shadow(0 0 28px rgba(30,120,255,.85))}}
        @keyframes ldShimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes ldSpin{to{transform:rotate(360deg)}}
        input,select,textarea{color:#d0e4ff!important;background:rgba(255,255,255,.04)!important}
        input::placeholder{color:rgba(100,140,200,.4)!important}
        input:focus,select:focus,textarea:focus{border-color:rgba(50,140,255,.5)!important;outline:none!important;box-shadow:0 0 0 3px rgba(50,140,255,.1)!important}
      `}</style>

      <Particles />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 80% 10%,rgba(20,80,200,.08),transparent),radial-gradient(ellipse 50% 35% at 10% 90%,rgba(10,60,180,.06),transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(4,6,16,.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(50,140,255,.1)',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div onClick={() => setPage('home')} style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg,#1e90ff,#60c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer', letterSpacing: 2, animation: 'ldGlow 3s ease-in-out infinite' }}>
          AWR
        </div>

        <div style={{ display: 'flex', gap: 4, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {([['home', 'Beranda'], ['harga', 'Harga'], ['feedback', 'Feedback']] as const).map(([p, l]) => (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: page === p ? 'rgba(30,100,255,.2)' : 'transparent',
              color: page === p ? '#60c0ff' : 'rgba(140,170,220,.5)',
              fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem', letterSpacing: .5,
              transition: 'all .2s',
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openAuth('login')} style={{
            padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(50,140,255,.25)',
            background: 'rgba(30,80,200,.1)', color: '#7ab8ff', cursor: 'pointer',
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem', transition: 'all .2s',
          }}>Masuk</button>
          <button onClick={() => openAuth('register')} style={{
            padding: '7px 16px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#1a5fd4,#3a8fff)', color: '#fff', cursor: 'pointer',
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.85rem',
            boxShadow: '0 2px 12px rgba(30,100,255,.25)', transition: 'all .2s',
          }}>Daftar</button>
        </div>
      </nav>

      {/* ─── CONTENT ─── */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 60 }}>

        {/* ── HOME PAGE ── */}
        {page === 'home' && (
          <div>
            {/* Hero */}
            <div style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '.72rem', color: '#4facfe', background: 'rgba(30,100,255,.1)', border: '1px solid rgba(30,100,255,.2)', borderRadius: 20, padding: '5px 14px', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, animation: 'ldFadeUp .5s ease' }}>
                🔥 AWR Key System v3 · Terpercaya
              </div>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, background: 'linear-gradient(135deg,#1e90ff 20%,#60c0ff 50%,#a0d8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 4, lineHeight: 1.1, marginBottom: 16, animation: 'ldFadeUp .6s ease .1s both, ldGlow 4s ease-in-out infinite' }}>
                AWR
              </div>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 'clamp(1.2rem, 4vw, 1.9rem)', fontWeight: 700, color: 'rgba(180,210,255,.7)', letterSpacing: 6, marginBottom: 20, textTransform: 'uppercase', animation: 'ldFadeUp .6s ease .2s both' }}>
                Key System · by Sanzxmzz
              </div>
              <div style={{ fontSize: '.95rem', color: 'rgba(120,160,210,.55)', maxWidth: 520, lineHeight: 1.8, marginBottom: 36, animation: 'ldFadeUp .6s ease .3s both' }}>
                Sistem key terpercaya untuk AWR Script Roblox. Aman, cepat, dan mudah digunakan. Daftar sekarang dan dapatkan key gratis 24 jam!
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', animation: 'ldFadeUp .6s ease .4s both' }}>
                <button onClick={() => setShowScript(true)} style={{
                  padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#1a5fd4,#3a8fff)', color: '#fff',
                  fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: 1,
                  boxShadow: '0 6px 24px rgba(30,100,255,.4)', display: 'flex', alignItems: 'center', gap: 9, transition: 'all .2s',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                  GET SCRIPT
                </button>
                <button onClick={() => openAuth('register')} style={{
                  padding: '14px 32px', borderRadius: 14, border: '1px solid rgba(50,140,255,.3)',
                  background: 'rgba(20,60,160,.12)', color: '#7ab8ff', cursor: 'pointer',
                  fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: 1, transition: 'all .2s',
                }}>
                  DAFTAR GRATIS
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 36, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center', animation: 'ldFadeUp .7s ease .5s both' }}>
                {[['1000+', 'Pengguna'], ['99.9%', 'Uptime'], ['<100ms', 'Respons'], ['24/7', 'Support']].map(([v, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.9rem', fontWeight: 700, color: '#4facfe' }}>{v}</div>
                    <div style={{ fontSize: '.72rem', color: 'rgba(100,140,200,.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#60c0ff', marginBottom: 10 }}>FITUR UNGGULAN</div>
                <div style={{ fontSize: '.86rem', color: 'rgba(100,140,200,.5)' }}>Semua yang kamu butuhkan dalam satu platform</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(8,12,24,.5)', border: '1px solid rgba(50,120,255,.1)',
                    borderRadius: 20, padding: '22px', animation: `ldFadeUp .4s ease ${i * .07}s both`,
                    transition: 'border-color .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(50,140,255,.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(50,120,255,.1)')}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{f.icon}</div>
                    <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#c0d8ff', marginBottom: 7 }}>{f.title}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(100,140,200,.5)', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: '60px 24px 80px', textAlign: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(20,60,160,.2),rgba(10,40,120,.1))', border: '1px solid rgba(50,140,255,.15)', borderRadius: 28, padding: '48px 32px', maxWidth: 600, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(30,100,255,.06), transparent)', pointerEvents: 'none' }} />
                <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#60c0ff', marginBottom: 12, position: 'relative' }}>MULAI SEKARANG</div>
                <div style={{ fontSize: '.88rem', color: 'rgba(120,160,210,.55)', marginBottom: 28, lineHeight: 1.7, position: 'relative' }}>Daftar gratis dan dapatkan key 24 jam untuk mencoba AWR Script. Tidak perlu kartu kredit!</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                  <button onClick={() => openAuth('register')} style={{ ...btnStyle, width: 'auto', padding: '12px 28px', fontSize: '.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Daftar Gratis →
                  </button>
                  <button onClick={() => setPage('harga')} style={{ padding: '12px 28px', borderRadius: 13, border: '1px solid rgba(50,140,255,.25)', background: 'transparent', color: '#7ab8ff', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.95rem', letterSpacing: .5 }}>
                    Lihat Harga
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HARGA PAGE ── */}
        {page === 'harga' && (
          <div style={{ padding: '60px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.7rem', fontWeight: 800, background: 'linear-gradient(135deg,#1e90ff,#60c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 10 }}>DAFTAR HARGA KEY</div>
              <div style={{ fontSize: '.86rem', color: 'rgba(100,140,200,.5)' }}>Pilih paket sesuai kebutuhanmu · Harga terjangkau</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {PRICES.map((p, i) => (
                <div key={i} style={{
                  background: p.tier === 'VIP' ? 'linear-gradient(160deg,rgba(40,30,10,.8),rgba(30,20,5,.8))' : `linear-gradient(160deg,${tierGlow[p.tier]},rgba(4,6,16,.6))`,
                  border: `1px solid ${p.tier === 'VIP' ? 'rgba(251,191,36,.3)' : `rgba(${p.tier === 'FREE' ? '79,172,254' : p.tier === 'STANDARD' ? '50,255,126' : '199,125,255'},.18)`}`,
                  borderRadius: 18, padding: '22px 18px', textAlign: 'center',
                  animation: `ldFadeUp .35s ease ${i * .06}s both`,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: p.tier === 'VIP' ? '0 0 30px rgba(251,191,36,.1)' : 'none',
                }}>
                  {p.tier === 'VIP' && <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />}
                  <div style={{ fontSize: '.65rem', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, letterSpacing: 1.5, color: tierColor[p.tier], marginBottom: 8 }}>{p.tier}</div>
                  <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#c8dcf8', marginBottom: 6 }}>{p.dur}</div>
                  <div style={{
                    fontFamily: p.tier === 'VIP' ? 'Orbitron,sans-serif' : 'Rajdhani,sans-serif',
                    fontSize: p.tier === 'VIP' ? '1.4rem' : '1.3rem', fontWeight: 800,
                    color: p.tier === 'VIP' ? '#fbbf24' : tierColor[p.tier],
                    textShadow: p.tier === 'VIP' ? '0 0 20px rgba(251,191,36,.5)' : 'none',
                    background: p.tier === 'VIP' ? 'linear-gradient(135deg,#f59e0b,#fbbf24,#fde68a)' : 'none',
                    WebkitBackgroundClip: p.tier === 'VIP' ? 'text' : 'unset',
                    WebkitTextFillColor: p.tier === 'VIP' ? 'transparent' : 'unset',
                  }}>{p.price}</div>
                  {p.tier === 'VIP' && <div style={{ fontSize: '.7rem', color: 'rgba(251,191,36,.6)', marginTop: 6, fontStyle: 'italic' }}>Akses Seumur Hidup</div>}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: '.84rem', color: 'rgba(100,140,200,.45)', marginBottom: 20, lineHeight: 1.7 }}>
                Untuk membeli key, hubungi reseller kami atau login ke akun kamu.<br />
                Tersedia juga <strong style={{ color: '#4facfe' }}>key gratis 24 jam</strong> untuk pengguna baru!
              </div>
              <button onClick={() => openAuth('register')} style={{ ...btnStyle, width: 'auto', padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Daftar & Claim Key Gratis →
              </button>
            </div>
          </div>
        )}

        {/* ── FEEDBACK PAGE ── */}
        {page === 'feedback' && (
          <div style={{ padding: '60px 24px 80px' }}>
            <FeedbackSection />
          </div>
        )}
      </div>

      {/* ─── DIALOGS ─── */}
      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} onAuth={onAuth} />}
      {showScript && <GetScriptModal onClose={() => setShowScript(false)} />}
    </>
  )
}
