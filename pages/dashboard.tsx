import Head from 'next/head'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

// ─── Types ───────────────────────────────────────────────────
type User = { id:string; username:string; email:string; role:string; roblox_username?:string; avatar_url?:string; background_url?:string; background_type?:string; total_executions?:number; created_at?:string }
type KeyData = { id:string; key_value:string; expires_at:string|null; hwid_max:number; duration_type:string; times_used:number; is_active:boolean; is_free_key?:boolean; created_at:string }

const DUR:Record<string,string> = {'24h':'24 Jam','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const DURS = Object.keys(DUR)

async function api(path:string, method='GET', body?:any, token?:string|null) {
  try {
    const r = await fetch('/api'+path, {
      method,
      headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
      body: body ? JSON.stringify(body) : undefined
    })
    return r.json()
  } catch(e) { return { error: 'Koneksi gagal, coba lagi' } }
}

function fmtDate(d:string|null) {
  if (!d) return '∞ Lifetime'
  return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
function timeLeft(d:string|null) {
  if (!d) return '∞'
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff/86400000), hrs = Math.floor((diff%86400000)/3600000), mins = Math.floor((diff%3600000)/60000)
  if (days > 0) return `${days}h ${hrs}j`
  if (hrs > 0) return `${hrs}j ${mins}m`
  return `${mins}m`
}
function isExpired(d:string|null) { if (!d) return false; return new Date(d) < new Date() }
function copyText(t:string) { navigator.clipboard.writeText(t).catch(()=>{}) }

// ─── Toast ───────────────────────────────────────────────────
let _addToast:(m:string,t?:string,title?:string)=>void = ()=>{}
function toast(msg:string, type='info', title='') { _addToast(msg, type, title) }

function ToastRoot() {
  const [items, setItems] = useState<any[]>([])
  const id = useRef(0)
  useEffect(()=>{
    _addToast = (msg, type='info', title='') => {
      const n = ++id.current
      const tl = title || (type==='error'?'Error':type==='success'?'Sukses':type==='warn'?'Peringatan':'Info')
      const icon = type==='error'?'error':type==='success'?'success':type==='warn'?'warn':'info'
      setItems(p=>[...p,{id:n,msg,type,title:tl,icon}])
      setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)), 4000)
    }
  },[])
  return (
    <div className="toast-root">
      {items.map(t=>(
        <div key={t.id} className={`toast-item ${t.type}`}>
          
          <div><div className="toast-title">{t.title}</div><div className="toast-msg">{t.msg}</div></div>
        </div>
      ))}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────
function Modal({open,onClose,title,children,size=''}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;size?:string}) {
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    if(open) window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  },[open])
  if(!open) return null
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className={`modal-box ${size}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Particles ───────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c = ref.current; if(!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const pts = Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*1.6+.4,a:Math.random()*.35+.12}))
    const resize = ()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw() {
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,77,255,${p.a*.32})`; ctx.fill()
      })
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<130){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(79,172,254,${(1-d/130)*.07})`;ctx.lineWidth=.5;ctx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} className="particles-canvas"/>
}

// ─── Enhanced Loading Screen ──────────────────────────────────
function LoadingScreen({done}:{done:boolean}) {
  const [stepIdx, setStepIdx] = useState(0)
  const steps = [
    { icon: 'connect', text: 'MENGHUBUNGKAN SERVER...' },
    { icon: 'shield', text: 'MEMUAT KEAMANAN...' },
    { icon: 'done', text: 'SISTEM SIAP!' },
  ]

  useEffect(()=>{
    const t1 = setTimeout(()=>setStepIdx(1), 700)
    const t2 = setTimeout(()=>setStepIdx(2), 1400)
    return ()=>{ clearTimeout(t1); clearTimeout(t2) }
  },[])

  return (
    <div className={`ls-wrap ${done?'done':''}`}>
      <div className="ls-logo">AWR</div>
      <div className="ls-sub">Key System v3 · by Sanzxmzz</div>
      <div className="ls-container">
        <div className="ls-steps">
          {steps.map((s,i)=>{
            const isDone = i < stepIdx
            const isActive = i === stepIdx
            const isWait = i > stepIdx
            return (
              <div key={i} className={`ls-step ${isDone?'done':isActive?'active':'wait'}`}>
                <div className="ls-step-icon">{isDone ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : s.icon==='connect' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> : s.icon==='shield' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                <div className="ls-step-text">{s.text}</div>
              </div>
            )
          })}
        </div>
        <div className="ls-bar"><div className="ls-bar-fill"/></div>
        <div className="ls-status">INITIALIZING AWR SYSTEM...</div>
      </div>
      <div className="ls-dots">
        <div className="ls-dot"/><div className="ls-dot"/><div className="ls-dot"/>
      </div>
    </div>
  )
}

// ─── Auth Page ───────────────────────────────────────────────
function AuthPage({onAuth}:{onAuth:(t:string,u:User)=>void}) {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [form, setForm] = useState({username:'',email:'',password:''})
  const [remember, setRemember] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api(mode==='login'?'/auth/login':'/auth/register','POST',
      mode==='login'?{username:form.username,password:form.password,rememberMe:remember}:form)
    setLoading(false)
    if(d.error){toast(d.error,'error'); return}
    if(remember) localStorage.setItem('awr_token',d.token)
    else sessionStorage.setItem('awr_token',d.token)
    onAuth(d.token, d.user)
    toast(`Selamat datang, ${d.user.username}!`,'success','Login Berhasil')
  }

  return (
    <>
      <ForgotModal open={showForgot} onClose={()=>setShowForgot(false)}/>
      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-logo">
            <div className="auth-logo-text">AWR</div>
            <div className="auth-logo-sub">Key System v3 · by Sanzxmzz</div>
          </div>
          <div className="card" style={{background:'linear-gradient(160deg,rgba(255,77,255,.06),rgba(79,172,254,.04))',border:'1px solid rgba(255,77,255,.15)'}}>
            <div className="tabs" style={{marginBottom:20}}>
              {(['login','register'] as const).map(m=>(
                <button key={m} className={`tab-btn ${mode===m?'active':''}`} onClick={()=>setMode(m)}>
                  <span className="tab-icon">{m==='login'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="M17.5 8.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"/><path d="M10.5 12.5L14 9"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}</span>
                  <span className="tab-lbl">{m==='login'?'Masuk':'Daftar'}</span>
                </button>
              ))}
            </div>

            {/* Form Login / Register */}
            {mode==='login'?(
              <div>
                <div className="form-group"><label className="form-label">Username</label><input className="form-input" autoComplete="username" placeholder="Username kamu..." value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Password</label>
                  <div className="form-pw-wrap">
                    <input className="form-input" type={showPw?'text':'password'} autoComplete="current-password" placeholder="Password..." value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                    <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>{showPw?(<><path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94'/><path d='M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19'/><line x1='1' y1='1' x2='23' y2='23'/></>):(<><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></>)}</svg></button>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'.8rem',color:'var(--text2)',cursor:'pointer'}}>
                    <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                    Ingat saya 30 hari
                  </label>
                  <button type="button" style={{background:'none',border:'none',color:'var(--accent)',fontSize:'.8rem',cursor:'pointer',padding:0}} onClick={()=>setShowForgot(true)}>Lupa password?</button>
                </div>
                <button className="btn btn-primary" style={{width:'100%'}} onClick={submit} disabled={loading}>
                  {loading?<><span className="spinner"/>Masuk...</>:<>Masuk ke Dashboard</>}
                </button>
              </div>
            ):(
              <div>
                <div className="form-group"><label className="form-label">Username</label><input className="form-input" autoComplete="username" placeholder="Pilih username..." value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" autoComplete="email" placeholder="Email aktif..." value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Password</label>
                  <div className="form-pw-wrap">
                    <input className="form-input" type={showPw?'text':'password'} autoComplete="new-password" placeholder="Min. 6 karakter..." value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                    <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>{showPw?(<><path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94'/><path d='M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19'/><line x1='1' y1='1' x2='23' y2='23'/></>):(<><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></>)}</svg></button>
                  </div>
                </div>
                <button className="btn btn-primary" style={{width:'100%'}} onClick={submit} disabled={loading}>
                  {loading?<><span className="spinner"/>Mendaftar...</>:<>Daftar Sekarang</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}



// ─── Feedback Page (embedded) ────────────────────────────────
function FeedbackPage() {
  const [feedbacks, setFeedbacks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState('Semua')
  const [search, setSearch] = React.useState('')
  const [stats, setStats] = React.useState({total:0,bugs:0,saran:0,avgRating:0})
  const [now, setNow] = React.useState(new Date())

  React.useEffect(()=>{
    const iv = setInterval(()=>setNow(new Date()),1000)
    return ()=>clearInterval(iv)
  },[])

  const loadFeed = () => {
    api('/feedback').then(d=>{
      const fb = d.feedbacks||[]
      setFeedbacks(fb); setLoading(false)
      const bugs=fb.filter((x:any)=>x.type==='Report Bug').length
      const saran=fb.filter((x:any)=>x.type==='Saran').length
      const avgR=fb.length?(fb.reduce((s:number,x:any)=>s+x.rating,0)/fb.length):0
      setStats({total:fb.length,bugs,saran,avgRating:Math.round(avgR*10)/10})
    })
  }
  React.useEffect(()=>{
    loadFeed()
    const iv=setInterval(loadFeed,30000)
    return ()=>clearInterval(iv)
  },[])

  const pad=(n:number)=>String(n).padStart(2,'0')
  const liveTime=`${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  function fmtDate(iso:string){
    const d=new Date(iso)
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const FILTERS=['Semua','Saran','Report Bug','Feedback']
  const typeColor:Record<string,{bg:string;color:string;icon:string}>={
    'Report Bug':{bg:'rgba(239,68,68,.15)',color:'#f87171',icon:'🐛'},
    'Saran':{bg:'rgba(59,130,246,.15)',color:'#60a5fa',icon:'💡'},
    'Feedback':{bg:'rgba(168,85,247,.15)',color:'#c084fc',icon:'💬'},
  }

  const filtered=feedbacks.filter(f=>{
    if(filter!=='Semua'&&f.type!==filter)return false
    if(search&&!f.message?.toLowerCase().includes(search.toLowerCase())&&
       !f.roblox_name_masked?.toLowerCase().includes(search.toLowerCase())&&
       !f.website_username?.toLowerCase().includes(search.toLowerCase()))return false
    return true
  })

  return (
    <>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.9rem',fontWeight:700,background:'var(--gradient-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Feedback Board
            </div>
            <div style={{color:'var(--text3)',fontSize:'.85rem',marginTop:2,display:'flex',alignItems:'center',gap:8}}>
              Feedback & report dari pengguna AWR Script — public
              <a href="/feedback" target="_blank" style={{color:'var(--accent)',fontSize:'.75rem',border:'1px solid rgba(0,140,255,.2)',borderRadius:6,padding:'2px 8px',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4}}>
                ↗ Buka di tab baru
              </a>
            </div>
          </div>
          {/* Real-time clock EMAS */}
          <div style={{background:'rgba(245,197,66,.08)',border:'1px solid rgba(245,197,66,.25)',borderRadius:10,padding:'8px 16px',textAlign:'center'}}>
            <div style={{fontSize:'.6rem',color:'rgba(245,197,66,.5)',letterSpacing:2,marginBottom:2}}>WAKTU SEKARANG</div>
            <div style={{fontWeight:900,color:'#f5c542',fontFamily:'Orbitron,sans-serif',fontSize:'.82rem',letterSpacing:1}}>{liveTime}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          {val:stats.total,lbl:'Total',icon:'📋',c:'var(--accent)'},
          {val:stats.bugs,lbl:'Bug Report',icon:'🐛',c:'#f87171'},
          {val:stats.saran,lbl:'Saran',icon:'💡',c:'#60a5fa'},
          {val:stats.avgRating>0?`${stats.avgRating}★`:'—',lbl:'Avg Rating',icon:'⭐',c:'#f5c542'},
        ].map((s,i)=>(
          <div key={i} className="stat-box" style={{animationDelay:`${i*.06}s`}}>
            <div className="stat-val" style={{color:s.c,fontSize:'1.3rem'}}>{loading?'—':s.val}</div>
            <div className="stat-lbl">{s.icon} {s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{background:filter===f?'linear-gradient(135deg,var(--accent-dark),var(--accent))':'var(--card2)',
              border:`1px solid ${filter===f?'transparent':'var(--border)'}`,borderRadius:8,color:filter===f?'#fff':'var(--text2)',
              padding:'6px 12px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.82rem',transition:'all .2s'}}>
            {f}{f!=='Semua'&&!loading?` (${feedbacks.filter(x=>x.type===f).length})`:''}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari..."
          className="form-input" style={{flex:1,minWidth:160,padding:'6px 12px',fontSize:'.82rem'}}/>
        <button className="btn btn-ghost btn-sm" onClick={loadFeed} style={{padding:'6px 12px',fontSize:'.8rem'}}>🔄</button>
      </div>

      {/* List */}
      {loading ? (
        [1,2,3].map(i=><div key={i} className="skeleton" style={{height:110,marginBottom:10}}/>)
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:'70px 0',color:'var(--text2)'}}>
          <div style={{fontSize:'2.8rem',marginBottom:12,opacity:.2}}>💬</div>
          <div>Belum ada feedback</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((fb,i)=>{
            const tc=typeColor[fb.type]||typeColor['Feedback']
            return (
              <div key={fb.id} className="card" style={{animationDelay:`${i*.04}s`,animation:'fadeUp .3s ease both',padding:'16px 18px'}}>
                {/* Top row */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8,marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    {/* Type badge */}
                    <span style={{background:tc.bg,color:tc.color,border:`1px solid ${tc.color}44`,borderRadius:99,padding:'2px 10px',fontSize:'.7rem',fontWeight:700,fontFamily:'Rajdhani,sans-serif',letterSpacing:.5}}>
                      {tc.icon} {fb.type}
                    </span>
                    {/* Stars */}
                    <span style={{fontSize:'.95rem',letterSpacing:2}}>
                      {Array.from({length:5},(_,si)=>(
                        <span key={si} style={{color:si<fb.rating?'#f5c542':'rgba(255,255,255,.12)'}}>★</span>
                      ))}
                    </span>
                  </div>
                  {/* Tanggal BOLD EMAS */}
                  <span style={{fontWeight:900,color:'#f5c542',fontFamily:'Orbitron,sans-serif',fontSize:'.68rem',letterSpacing:.5,whiteSpace:'nowrap'}}>
                    📅 {fmtDate(fb.created_at)}
                  </span>
                </div>

                {/* Pesan */}
                <p style={{color:'var(--text)',fontSize:'.88rem',lineHeight:1.65,margin:'0 0 12px',wordBreak:'break-word'}}>
                  {fb.message}
                </p>

                {/* Footer: nama */}
                <div style={{display:'flex',gap:14,flexWrap:'wrap',borderTop:'1px solid var(--border)',paddingTop:10}}>
                  {fb.website_username&&(
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{fontSize:'.68rem',color:'var(--text3)'}}>Akun Website:</span>
                      <span style={{fontSize:'.78rem',fontWeight:700,color:'var(--accent)',fontFamily:'Rajdhani,sans-serif'}}>👤 {fb.website_username}</span>
                    </div>
                  )}
                  {fb.roblox_name_masked&&(
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{fontSize:'.68rem',color:'var(--text3)'}}>Roblox:</span>
                      <span style={{fontSize:'.78rem',fontWeight:700,color:'var(--text2)',fontFamily:'Rajdhani,sans-serif',letterSpacing:1}}>🎮 {fb.roblox_name_masked}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!loading&&feedbacks.length>0&&(
        <div style={{textAlign:'center',marginTop:16,color:'var(--text3)',fontSize:'.75rem'}}>
          {filtered.length} dari {feedbacks.length} feedback · auto-refresh 30 detik
        </div>
      )}
    </>
  )
}

// ─── Routes Page ─────────────────────────────────────────────
function RoutesPage({token,user}:{token:string|null;user:User|null}) {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [pwModal, setPwModal] = useState<any>(null)
  const [pw, setPw] = useState('')
  const [form, setForm] = useState({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''})

  const load = ()=>{
    setLoading(true)
    api('/routes','GET',undefined,token).then(d=>{if(d.routes)setRoutes(d.routes);setLoading(false)})
  }
  useEffect(()=>{load()},[] as any)

  async function openRoute(r:any) {
    if(!r.is_public&&r.has_password){setPwModal(r);return}
    const d = await api('/routes/'+r.id,'GET',undefined,token)
    if(d.route) setDetail(d.route); else toast('Gagal load route','error')
  }
  async function openWithPw() {
    const r = await fetch('/api/routes/'+pwModal.id+'?password='+encodeURIComponent(pw))
    const d = await r.json()
    if(d.error){toast(d.error,'error');return}
    setDetail(d.route); setPwModal(null); setPw('')
  }
  function onFileChange(e:React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if(!f) return
    if(f.size > 5*1024*1024){toast('File terlalu besar (max 5MB)','error');return}
    const reader = new FileReader()
    reader.onload = ev => {
      const txt = ev.target?.result as string || ''
      // Validasi JSON sebelum set state
      try { JSON.parse(txt) } catch { toast('Format JSON tidak valid','error'); return }
      setForm(prev=>({...prev,data:txt}))
      toast('File berhasil dibaca!','success')
    }
    reader.readAsText(f)
  }
  async function upload(e:React.FormEvent) {
    e.preventDefault(); if(!token){toast('Login dulu!','error');return}
    if(!form.data.trim()){toast('Data JSON wajib diisi','error');return}
    let parsed; try{parsed=JSON.parse(form.data)}catch{toast('Format JSON tidak valid — pastikan format benar','error');return}
    const d = await api('/routes','POST',{...form,data:parsed},token)
    if(d.error){toast(d.error,'error');return}
    toast('Route berhasil diupload!','success'); setUploadOpen(false)
    setForm({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''}); load()
  }

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:28}}>
        <div>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.9rem',fontWeight:700,background:'var(--gradient-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Route Library</div>
          <div style={{color:'var(--text3)',fontSize:'.85rem',marginTop:4}}>Download & upload rute AWR Script</div>
        </div>
        {user&&<button className="btn btn-primary" onClick={()=>setUploadOpen(true)}>⬆️ Upload Route</button>}
      </div>
      <div className="route-grid">
        {loading?[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{height:120}}/>):routes.map((r,i)=>(
          <div key={r.id} className="route-card" onClick={()=>openRoute(r)} style={{animationDelay:`${i*.04}s`,animation:'fadeUp .3s ease both',cursor:'pointer',userSelect:'none'}}>
            {r.thumbnail_url&&<img className="route-thumb" src={r.thumbnail_url} alt={r.name}/>}
            <div className="route-body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div className="route-name">{r.name}</div>
                {!r.is_public&&<span className="badge badge-yellow" style={{fontSize:'.6rem'}}>{r.has_password?'locked':'locked'}</span>}
              </div>
              {r.game_name&&<div className="route-game">{r.game_name}</div>}
              {r.description&&<div className="route-desc">{r.description}</div>}
              <div className="route-footer">
                <div style={{fontSize:'.72rem',color:'var(--text3)'}}>by {r.uploader?.username||'anon'}</div>
                <span className="badge badge-blue">⬇️ {r.download_count}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading&&!routes.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'70px 0',color:'var(--text2)'}}><div style={{fontSize:'2.8rem',marginBottom:14,animation:'float 3s ease-in-out infinite',opacity:.2,display:'flex',justifyContent:'center'}}><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></div>Belum ada route</div>}
      </div>

      {/* Upload */}
      <Modal open={uploadOpen} onClose={()=>setUploadOpen(false)} title="⬆️ Upload Route" size="lg">
        <form onSubmit={upload}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group"><label className="form-label">Nama *</label><input className="form-input" placeholder="Nama route..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
            <div className="form-group"><label className="form-label">Nama Game</label><input className="form-input" placeholder="Game..." value={form.game_name} onChange={e=>setForm(f=>({...f,game_name:e.target.value}))}/></div>
          </div>
          <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" placeholder="Deskripsi singkat..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Thumbnail URL</label><input className="form-input" placeholder="https://..." value={form.thumbnail_url} onChange={e=>setForm(f=>({...f,thumbnail_url:e.target.value}))}/></div>
          <div className="form-group">
            <label className="form-label">Data JSON *</label>
            <label style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:'.82rem',marginBottom:8}}>
              📁 Upload File <input type="file" accept=".json,.txt" style={{display:'none'}} onChange={onFileChange}/>
            </label>
            <textarea className="form-textarea" placeholder='[{"x":0,"y":5,"z":0}]' value={form.data}
              onChange={e=>{
                const v=e.target.value
                setForm(f=>({...f,data:v}))
              }}
              required style={{fontFamily:'monospace',fontSize:'.78rem',minHeight:120}}/>
            <div style={{fontSize:'.7rem',color:'var(--text3)',marginTop:4}}>💡 Paste JSON disini atau upload file di atas. Validasi dilakukan saat submit.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Visibilitas</label>
            <select className="form-select" value={form.is_public?'pub':'priv'} onChange={e=>setForm(f=>({...f,is_public:e.target.value==='pub'}))}>
              <option value="pub">Public</option><option value="priv">Private</option>
            </select>
          </div>
          {!form.is_public&&<div className="form-group"><label className="form-label">Password Akses</label><input className="form-input" placeholder="Password..." value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>}
          <div style={{display:'flex',gap:10}}>
            <button type="submit" className="btn btn-primary" style={{flex:1}}>⬆️ Upload</button>
            <button type="button" className="btn btn-ghost" onClick={()=>setUploadOpen(false)}>Batal</button>
          </div>
        </form>
      </Modal>

      {/* Detail */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title={`📥 ${detail?.name||''}`} size="lg">
        {detail&&<>
          {detail.description&&<p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:14}}>{detail.description}</p>}
          <textarea rows={8} readOnly value={JSON.stringify(detail.data,null,2)} className="form-textarea" style={{fontFamily:'monospace',fontSize:'.74rem'}}/>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>{copyText(JSON.stringify(detail.data));toast('Data disalin!','success')}}>Copy Data</button>
            <button className="btn btn-ghost" onClick={()=>{const b=new Blob([JSON.stringify(detail.data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${detail.name}.json`;a.click();toast('Downloaded!','success')}}>⬇️ .json</button>
          </div>
        </>}
      </Modal>

      {/* Password */}
      <Modal open={!!pwModal} onClose={()=>{setPwModal(null);setPw('')}} title={pwModal?.name||''}>
        <p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:14}}>Route ini private. Masukkan password.</p>
        <div className="form-group"><input className="form-input" type="password" placeholder="Password..." value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&openWithPw()}/></div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={openWithPw}>Akses</button>
          <button className="btn btn-ghost" onClick={()=>{setPwModal(null);setPw('')}}>Batal</button>
        </div>
      </Modal>
    </>
  )
}

// ─── Leaderboard ─────────────────────────────────────────────
function LeaderboardPage() {
  const [lb, setLb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profileModal, setProfileModal] = useState<any>(null)
  useEffect(()=>{api('/leaderboard').then(d=>{if(d.leaderboard)setLb(d.leaderboard);setLoading(false)})},[] as any)
  const medals=['🥇','🥈','🥉'], colors=['var(--gold)','#c0c0c0','#cd7f32']
  return (
    <>
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.9rem',fontWeight:700,background:'var(--gradient-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Leaderboard</div>
        <div style={{color:'var(--text3)',fontSize:'.85rem',marginTop:4}}>Top executor AWR Script</div>
      </div>
      <div style={{maxWidth:640}}>
        {loading?[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:68,marginBottom:10}}/>):lb.map((u,i)=>(
          <div key={i} className="lb-row" onClick={()=>setProfileModal(u)} style={{animationDelay:`${i*.05}s`,cursor:'pointer',background:i<3?`linear-gradient(135deg,rgba(${i===0?'251,191,36':i===1?'192,192,192':'205,127,50'},.06),transparent)`:'var(--card)',borderColor:i<3?`rgba(${i===0?'251,191,36':i===1?'192,192,192':'205,127,50'},.2)`:'var(--border)'}}>
            <div className="lb-rank" style={{color:i<3?colors[i]:'var(--text2)'}}>{i<3?medals[i]:`#${u.rank}`}</div>
            {/* Avatar */}
            {u.avatar ? <img src={u.avatar} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:`2px solid ${i<3?colors[i]:'rgba(0,140,255,.25)'}`,flexShrink:0}}/> : <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,140,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0}}>👤</div>}
            <div style={{flex:1}}>
              <div className="lb-name" style={{color:i<3?colors[i]:'var(--text)'}}>{u.username}</div>
              {u.roblox_username&&<div style={{fontSize:'.75rem',color:'var(--text2)',marginTop:2}}>Roblox: {u.roblox_username}</div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div className="lb-exec">{u.total_executions?.toLocaleString()}</div>
              <div style={{fontSize:'.65rem',color:'var(--text3)',marginTop:1}}>executions</div>
            </div>
          </div>
        ))}
        {!loading&&!lb.length&&<div style={{textAlign:'center',color:'var(--text2)',padding:'70px 0'}}><div style={{marginBottom:14,animation:'float 3s ease-in-out infinite',opacity:.2,display:'flex',justifyContent:'center'}}><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21H5a2 2 0 01-2-2v-5"/><path d="M16 21h3a2 2 0 002-2v-9"/><path d="M12 21V11"/><path d="M3 10l9-7 9 7"/></svg></div>Belum ada data</div>}
      </div>
      {/* Profile Modal */}
      <Modal open={!!profileModal} onClose={()=>setProfileModal(null)} title="👤 Profil Player">
        {profileModal&&<div style={{textAlign:'center',padding:'8px 0'}}>
          {profileModal.avatar?<img src={profileModal.avatar} alt="" style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(0,140,255,.4)',marginBottom:12}}/>:<div style={{width:72,height:72,borderRadius:'50%',background:'rgba(0,140,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',margin:'0 auto 12px'}}>👤</div>}
          <div style={{fontSize:'1.2rem',fontWeight:700,color:'var(--text)',marginBottom:4}}>{profileModal.username}</div>
          {profileModal.roblox_username&&<div style={{color:'var(--text2)',fontSize:'.85rem',marginBottom:12}}>Roblox: {profileModal.roblox_username}</div>}
          <div style={{background:'var(--card2)',borderRadius:10,padding:'12px 20px',display:'inline-block'}}>
            <div style={{fontSize:'1.6rem',fontWeight:800,color:'var(--gold)'}}>{profileModal.total_executions?.toLocaleString()}</div>
            <div style={{fontSize:'.75rem',color:'var(--text3)'}}>Total Executions</div>
          </div>
          {!profileModal.leaderboard_public&&<div style={{marginTop:12,color:'var(--text3)',fontSize:'.8rem',background:'rgba(255,255,255,.04)',borderRadius:8,padding:'6px 12px'}}>🔒 Profil ini semi-private</div>}
        </div>}
      </Modal>
    </>
  )
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string|null>(null)
  const [user, setUser] = useState<User|null>(null)
  const [page, setPage] = useState('dash')

  useEffect(()=>{
    const t = setTimeout(()=>setReady(true), 2400)
    const saved = localStorage.getItem('awr_token')||sessionStorage.getItem('awr_token')
    if(saved) {
      api('/user/profile','GET',undefined,saved).then(d=>{
        if(d.user){setToken(saved);setUser(d.user)}
        else{localStorage.removeItem('awr_token');sessionStorage.removeItem('awr_token');router.push('/')}
      })
    } else {
      // Tidak ada token, redirect ke halaman info
      router.push('/')
    }
    return ()=>clearTimeout(t)
  },[])

  function onAuth(t:string,u:User){setToken(t);setUser(u);setPage('dash')}
  function logout(){localStorage.removeItem('awr_token');sessionStorage.removeItem('awr_token');setToken(null);setUser(null);toast('Sampai jumpa!','info')}

  return (
    <>
      <Head>
        <title>AWR Key System — by Sanzxmzz</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@300;500;600;700&family=Outfit:wght@300;400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
      </Head>
      <LoadingScreen done={ready}/>
      <ToastRoot/>
      <Particles/>
      <div className="bg-grid"/>
      <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/>

      {!token
        ?<AuthPage onAuth={onAuth}/>
        :<div style={{position:'relative',zIndex:1,minHeight:'100vh'}}>
          <nav className="navbar">
            <div className="navbar-brand" onClick={()=>setPage('dash')}>AWR</div>
            <div className="navbar-nav">
              <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:'.75rem',color:'rgba(140,140,160,.5)',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:8,padding:'3px 10px',letterSpacing:.5}}>{user!.username}</span>
            </div>
          </nav>
          <div className="content" key={page}>
            {page==='dash'&&<UserDash token={token} user={user!} onLogout={logout}/>}
            {page==='routes'&&<RoutesPage token={token} user={user}/>}
            {page==='lb'&&<LeaderboardPage/>}
            {page==='feedback'&&<FeedbackPage/>}
          </div>

          {/* Bottom Tab Bar */}
          <nav className="bottom-tabbar">
            {/* Dashboard */}
            <button className={`btab ${page==='dash'?'active':''}`} onClick={()=>setPage('dash')}>
              <div className="btab-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
              <span className="btab-lbl">Dashboard</span>
            </button>
            {/* Routes */}
            <button className={`btab t-routes ${page==='routes'?'active':''}`} onClick={()=>setPage('routes')}>
              <div className="btab-icon"><svg viewBox="0 0 24 24"><path d="M3 17c0-2 4-8 9-8s9 6 9 6"/><circle cx="8" cy="17" r="2"/><circle cx="18" cy="13" r="2"/><path d="M3 7h4l2 4H5"/></svg></div>
              <span className="btab-lbl">Routes</span>
            </button>
            {/* Leaderboard */}
            <button className={`btab t-lb ${page==='lb'?'active':''}`} onClick={()=>setPage('lb')}>
              <div className="btab-icon"><svg viewBox="0 0 24 24"><path d="M8 21H5a2 2 0 01-2-2v-5"/><path d="M16 21h3a2 2 0 002-2v-9"/><path d="M12 21V11"/><path d="M3 10l9-7 9 7"/></svg></div>
              <span className="btab-lbl">Leaderboard</span>
            </button>
            {/* Feedback */}
            <button className={`btab t-feedback ${page==='feedback'?'active':''}`} onClick={()=>setPage('feedback')}>
              <div className="btab-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
              <span className="btab-lbl">Feedback</span>
            </button>
            {/* Reseller */}
            {(user!.role==='reseller'||user!.role==='developer')&&(
              <button className="btab t-rs" onClick={()=>router.push('/reseller')}>
                <div className="btab-icon"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
                <span className="btab-lbl">Reseller</span>
              </button>
            )}
            {/* Dev */}
            {user!.role==='developer'&&(
              <button className="btab t-dev" onClick={()=>router.push('/developer')}>
                <div className="btab-icon"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                <span className="btab-lbl">Dev</span>
              </button>
            )}
            {/* Logout */}
            <button className="btab t-logout" onClick={logout}>
              <div className="btab-icon"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
              <span className="btab-lbl">Logout</span>
            </button>
          </nav>
        </div>
      }
    </>
  )
}
