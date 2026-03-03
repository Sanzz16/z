import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
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
      const icon = type==='error'?'❌':type==='success'?'✅':type==='warn'?'⚠️':'ℹ️'
      setItems(p=>[...p,{id:n,msg,type,title:tl,icon}])
      setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)), 4000)
    }
  },[])
  return (
    <div className="toast-root">
      {items.map(t=>(
        <div key={t.id} className={`toast-item ${t.type}`}>
          <span className="toast-icon">{t.icon}</span>
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
    const pts = Array.from({length:55},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.5+.4,a:Math.random()*.4+.15}))
    const resize = ()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw() {
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(0,170,255,${p.a*.4})`; ctx.fill()
      })
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,102,204,${(1-d/120)*.1})`;ctx.lineWidth=.5;ctx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} className="particles-canvas"/>
}

// ─── Loading Screen ──────────────────────────────────────────
function LoadingScreen({done}:{done:boolean}) {
  return (
    <div className={`ls-wrap ${done?'done':''}`}>
      <div className="ls-logo">⚡ AWR</div>
      <div className="ls-sub">Key System v3 · by Sanzxmzz</div>
      <div className="ls-bar"><div className="ls-bar-fill"/></div>
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
            <div className="auth-logo-text">⚡ AWR</div>
            <div className="auth-logo-sub">Key System v3 · by Sanzxmzz</div>
          </div>
          <div className="card">
            <div className="tabs" style={{marginBottom:20}}>
              {(['login','register'] as const).map(m=>(
                <button key={m} className={`tab-btn ${mode===m?'active':''}`} onClick={()=>setMode(m)}>
                  {m==='login'?'🔑 Login':'✨ Daftar'}
                </button>
              ))}
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="Username kamu" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required/>
              </div>
              {mode==='register'&&(
                <div className="form-group" style={{animation:'fadeUp .25s ease'}}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="Email kamu" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-pw-wrap">
                  <input className="form-input" type={showPw?'text':'password'} placeholder="Password kamu" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
                  <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
                </div>
              </div>
              {mode==='login'&&(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <label className="form-check"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Ingat 30 hari</label>
                  <span style={{fontSize:'.83rem',color:'var(--accent)',cursor:'pointer'}} onClick={()=>setShowForgot(true)}>Lupa password?</span>
                </div>
              )}
              {mode==='register'&&(
                <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:'.82rem',color:'#4ade80'}}>
                  🎁 Daftar sekarang → dapat key 24 jam gratis otomatis!
                </div>
              )}
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading?<><span className="spinner"/>Loading...</>:mode==='login'?'🔑 Masuk':'✨ Daftar Sekarang'}
              </button>
            </form>
            <div style={{textAlign:'center',marginTop:14,fontSize:'.83rem',color:'var(--text2)'}}>
              {mode==='login'?<>Belum punya akun? <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>setMode('register')}>Daftar →</span></>:<>Sudah punya akun? <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>setMode('login')}>Login →</span></>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Forgot Password Modal ───────────────────────────────────
function ForgotModal({open,onClose}:{open:boolean;onClose:()=>void}) {
  const [step, setStep] = useState<'email'|'code'>('email')
  const [email, setEmail] = useState('')
  const [uname, setUname] = useState('')
  const [code, setCode] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function reset() { setStep('email'); setEmail(''); setCode(''); setNewPw('') }

  async function sendCode(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/forgot-password','POST',{email})
    setLoading(false)
    if(d.error){toast(d.error,'error'); return}
    setUname(d.username||email); setStep('code')
    toast('Kode dikirim ke email kamu!','success')
  }

  async function resetPw(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/reset-password','POST',{email,code,newPassword:newPw})
    setLoading(false)
    if(d.error){toast(d.error,'error'); return}
    toast('Password berhasil direset!','success','Reset Berhasil')
    onClose(); reset()
  }

  return (
    <Modal open={open} onClose={()=>{onClose();reset()}} title="🔑 Lupa Password">
      {step==='email'?(
        <form onSubmit={sendCode}>
          <p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:16}}>Masukkan email akun kamu. Kode verifikasi akan dikirim.</p>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="Email kamu..." value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading?<><span className="spinner"/>Mengirim...</>:'📧 Kirim Kode'}
          </button>
        </form>
      ):(
        <form onSubmit={resetPw}>
          <div style={{background:'rgba(0,0,0,.3)',border:'1px solid var(--border2)',borderRadius:12,padding:18,marginBottom:16}}>
            <div style={{fontSize:'.72rem',color:'var(--text2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Kode Verifikasi</div>
            <div style={{fontSize:'.83rem',color:'var(--text2)',marginBottom:12}}>Akun: <strong style={{color:'var(--accent)'}}>{uname}</strong></div>
            <input className="form-input" style={{fontFamily:'Rajdhani,monospace',fontSize:'2rem',fontWeight:700,letterSpacing:8,textAlign:'center',color:'var(--accent)'}}
              placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} required/>
            <div style={{textAlign:'center',marginTop:8,fontSize:'.7rem',color:'var(--text3)'}}>⏰ Berlaku 20 menit</div>
          </div>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <div className="form-pw-wrap">
              <input className="form-input" type={showPw?'text':'password'} placeholder="Password baru min 6 karakter" value={newPw} onChange={e=>setNewPw(e.target.value)} required minLength={6}/>
              <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-primary" style={{flex:1}} disabled={loading}>
              {loading?<><span className="spinner"/>Reset...</>:'🔓 Reset Password'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={()=>setStep('email')}>← Back</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── GetKey Modal ────────────────────────────────────────────
function GetKeyModal({open,onClose,token,onDone}:{open:boolean;onClose:()=>void;token:string;onDone:()=>void}) {
  const [steps, setSteps] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<string[]>([])
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [key, setKey] = useState<any>(null)
  const [claiming, setClaiming] = useState(false)
  const timerRef = useRef<any>(null)

  useEffect(()=>{
    if(open) {
      api('/getkey-verify').then(d=>{ if(d.steps) setSteps(d.steps) })
      setCurrentStep(0); setCompleted([]); setKey(null); setTimer(0); setTimerRunning(false)
    }
    return ()=>clearTimeout(timerRef.current)
  },[open])

  useEffect(()=>{
    if(timerRunning && timer > 0) {
      timerRef.current = setTimeout(()=>setTimer(t=>t-1), 1000)
    } else if(timerRunning && timer === 0) {
      setTimerRunning(false)
      const step = steps[currentStep]
      if(step && !completed.includes(step.id)) {
        const newCompleted = [...completed, step.id]
        setCompleted(newCompleted)
        if(currentStep < steps.length-1) setCurrentStep(s=>s+1)
      }
    }
    return ()=>clearTimeout(timerRef.current)
  },[timer, timerRunning])

  function openStep(step:any) {
    window.open(step.url,'_blank')
    setTimer(step.duration_seconds)
    setTimerRunning(true)
  }

  async function claim() {
    setClaiming(true)
    const d = await api('/getkey-verify','POST',{completed_steps:completed},token)
    setClaiming(false)
    if(d.error){toast(d.error,'error'); return}
    setKey(d.key); onDone()
    toast('Key 24 jam berhasil didapat!','success','🎉 Yeay!')
  }

  const allDone = steps.length > 0 && steps.every(s=>completed.includes(s.id))

  return (
    <Modal open={open} onClose={()=>{if(!timerRunning){onClose();setKey(null)}}} title="🎁 Get Free Key 24 Jam">
      {key?(
        <div style={{textAlign:'center',padding:'8px 0'}}>
          <div style={{fontSize:'3rem',marginBottom:12,animation:'float 3s ease-in-out infinite'}}>🎉</div>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.4rem',fontWeight:700,color:'var(--green)',marginBottom:16}}>Key Berhasil Didapat!</div>
          <div className="key-box" style={{marginBottom:12,textAlign:'left'}} onClick={()=>{copyText(key.key_value);toast('Key disalin!','success')}}>
            {key.key_value}<span className="copy-hint">klik copy</span>
          </div>
          <div style={{fontSize:'.82rem',color:'var(--text2)',marginBottom:20}}>Berlaku: {fmtDate(key.expires_at)}</div>
          <button className="btn btn-ghost btn-full" onClick={()=>{onClose();setKey(null)}}>Tutup</button>
        </div>
      ):(
        <>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',color:'var(--text2)',marginBottom:6}}>
              <span>Progress</span><span>{completed.length}/{steps.length} selesai</span>
            </div>
            <div className="gk-progress">
              <div className="gk-progress-fill" style={{width:`${steps.length?completed.length/steps.length*100:0}%`}}/>
            </div>
          </div>

          {steps.map((step,i)=>{
            const done = completed.includes(step.id)
            const isCurrent = i===currentStep && !done
            const isLocked = i>currentStep && !done
            return (
              <div key={step.id} className={`gk-step ${done?'done':isCurrent?'active':''}`}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div className={`gk-num ${done?'done':isCurrent?'active':'waiting'}`}>
                    {done?'✓':isLocked?'🔒':i+1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'.9rem',color:done?'var(--green)':isCurrent?'var(--text)':'var(--text3)'}}>{step.name}</div>
                    <div style={{fontSize:'.72rem',color:'var(--text3)',marginTop:2}}>⏱️ Tunggu {step.duration_seconds} detik</div>
                  </div>
                  {!done&&!isLocked&&(
                    isCurrent&&timerRunning
                      ?<div style={{textAlign:'center',minWidth:52}}>
                        <div style={{fontFamily:'Rajdhani',fontSize:'1.5rem',fontWeight:700,color:'var(--accent)',lineHeight:1}}>{timer}</div>
                        <div style={{fontSize:'.65rem',color:'var(--text3)'}}>detik</div>
                      </div>
                      :<button className="btn btn-primary btn-sm" onClick={()=>openStep(step)} disabled={isLocked||timerRunning}>Buka →</button>
                  )}
                  {done&&<span style={{color:'var(--green)',fontWeight:700}}>✓</span>}
                </div>
                {isCurrent&&timerRunning&&(
                  <div className="gk-progress" style={{marginTop:10}}>
                    <div className="gk-progress-fill" style={{width:`${(1-timer/step.duration_seconds)*100}%`}}/>
                  </div>
                )}
              </div>
            )
          })}
          {!steps.length&&<div style={{textAlign:'center',color:'var(--text2)',padding:'20px 0'}}>⏳ Loading steps...</div>}
          <div style={{marginTop:16,display:'flex',gap:10}}>
            <button className={`btn btn-full ${allDone?'btn-success':'btn-ghost'}`} onClick={claim} disabled={!allDone||claiming}>
              {claiming?<><span className="spinner"/>Memproses...</>:allDone?'🎁 Ambil Key Sekarang!':'⏳ Selesaikan Semua Step Dulu'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ─── User Dashboard ──────────────────────────────────────────
function UserDash({token,user,onLogout}:{token:string;user:User;onLogout:()=>void}) {
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState('dash')
  const [loading, setLoading] = useState(true)
  const [getkeyOpen, setGetkeyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [ef, setEf] = useState({username:'',roblox_username:'',avatar_url:'',background_url:'',background_type:'image',password:''})
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async()=>{
    setLoading(true)
    const d = await api('/user/profile','GET',undefined,token)
    if(d.user) {
      setData(d)
      setEf({username:d.user.username,roblox_username:d.user.roblox_username||'',avatar_url:d.user.avatar_url||'',background_url:d.user.background_url||'',background_type:d.user.background_type||'image',password:''})
    } else if(d.error) {
      toast(d.error,'error')
    }
    setLoading(false)
  },[token])

  useEffect(()=>{load()},[load])

  async function saveProfile() {
    setSaving(true)
    const payload:any = {
      username: ef.username,
      roblox_username: ef.roblox_username,
      avatar_url: ef.avatar_url,
      background_url: ef.background_url,
      background_type: ef.background_type,
    }
    if (ef.password && ef.password.length >= 6) payload.password = ef.password
    const d = await api('/user/profile','PATCH',payload,token)
    setSaving(false)
    if(d.error){toast(d.error,'error'); return}
    toast('Profil berhasil diupdate!','success')
    setEditOpen(false); load()
  }

  if(loading) return (
    <div style={{height:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{width:36,height:36,border:'2px solid rgba(255,255,255,.1)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <div style={{fontSize:'.85rem',color:'var(--text2)'}}>Memuat data...</div>
    </div>
  )
  if(!data) return null

  const {key, allKeys, notifications, announcements} = data
  const u = data.user
  const unread = notifications?.filter((n:any)=>!n.is_read).length||0
  const expiredKeys = (allKeys||[]).filter((k:KeyData)=>isExpired(k.expires_at)||!k.is_active)

  return (
    <>
      <GetKeyModal open={getkeyOpen} onClose={()=>setGetkeyOpen(false)} token={token} onDone={load}/>

      <div className="tabs">
        {[['dash','🏠 Dashboard'],[`notifs${unread>0?` (${unread})`:''}`, `🔔 Notif${unread>0?` (${unread})`:''}`],['profile','👤 Profil']].map((item,i)=>{
          const v = i===0?'dash':i===1?'notifs':'profile'
          const l = item[1] as string
          return (
            <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={()=>{setTab(v);if(v==='notifs')api('/user/read-notifs','POST',{},token).then(load)}}>{l}</button>
          )
        })}
      </div>

      {/* DASHBOARD */}
      {tab==='dash'&&(
        <div style={{animation:'fadeUp .3s ease'}}>
          {/* Key aktif */}
          {key?(
            <div className="card card-key" style={{animation:'fadeUp .35s ease'}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:16}}>
                <div className="sec-title" style={{margin:0}}>🔑 Key Aktif Kamu</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <span className={`badge ${key.is_active&&!isExpired(key.expires_at)?'badge-green':'badge-red'}`}>{key.is_active&&!isExpired(key.expires_at)?'● Aktif':'● Expired'}</span>
                  <span className="badge badge-blue">{DUR[key.duration_type]||key.duration_type}</span>
                  {key.is_free_key&&<span className="badge badge-yellow">🎁 Free</span>}
                </div>
              </div>
              <div className="key-box" style={{marginBottom:16}} onClick={()=>{copyText(key.key_value);toast('Key berhasil disalin!','success')}}>
                {key.key_value}<span className="copy-hint">klik copy</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[['EXPIRED',fmtDate(key.expires_at),isExpired(key.expires_at)?'var(--red)':'var(--text)'],['SISA WAKTU',timeLeft(key.expires_at),'var(--accent)'],['DIPAKAI',`${key.times_used}×`,'var(--text)']].map(([l,v,c])=>(
                  <div key={l as string}>
                    <div style={{fontSize:'.7rem',color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{l}</div>
                    <div style={{fontSize:'.9rem',color:c as string,fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,fontSize:'.75rem',color:'var(--text3)'}}>Max HWID: {key.hwid_max} perangkat</div>
            </div>
          ):(
            <div className="card" style={{textAlign:'center',padding:'40px 24px',animation:'fadeUp .35s ease'}}>
              <div style={{fontSize:'2.5rem',marginBottom:12}}>🔒</div>
              <div style={{fontWeight:700,fontSize:'1rem',marginBottom:8}}>Kamu belum punya key aktif</div>
              <div style={{fontSize:'.84rem',color:'var(--text2)',marginBottom:20}}>Beli dari reseller atau klaim key gratis 24 jam</div>
              <button className="btn btn-primary" onClick={()=>setGetkeyOpen(true)}>🎁 Get Free Key 24 Jam</button>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-box"><div className="stat-val" style={{color:'var(--accent)'}}>{u.total_executions||0}</div><div className="stat-lbl">Total Exec</div></div>
            <div className="stat-box"><div className="stat-val" style={{color:key&&key.is_active&&!isExpired(key.expires_at)?'var(--green)':'var(--red)'}}>{key&&key.is_active&&!isExpired(key.expires_at)?'✓':'✗'}</div><div className="stat-lbl">Key Aktif</div></div>
            <div className="stat-box"><div className="stat-val" style={{color:'var(--text)'}}>{expiredKeys.length}</div><div className="stat-lbl">Key Expired</div></div>
            <div className="stat-box"><div className="stat-val" style={{color:'var(--yellow)'}}>{unread}</div><div className="stat-lbl">Notif Baru</div></div>
          </div>

          {/* Expired keys */}
          {expiredKeys.length>0&&(
            <div className="card" style={{animation:'fadeUp .45s ease'}}>
              <div className="sec-title">📋 Riwayat Key</div>
              {expiredKeys.slice(0,5).map((k:KeyData)=>(
                <div key={k.id} className="expired-key">
                  <span style={{fontSize:'1.2rem'}}>{k.is_free_key?'🎁':'🔑'}</span>
                  <div className="expired-key-val">{k.key_value}</div>
                  <div>
                    <div className="expired-key-info">{!k.is_active?'Dinonaktifkan':'Expired'}</div>
                    <div style={{fontSize:'.7rem',color:'var(--text3)',marginTop:2}}>{DUR[k.duration_type]||k.duration_type}</div>
                  </div>
                </div>
              ))}
              {key&&<button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={()=>setGetkeyOpen(true)}>🎁 Klaim Key Baru</button>}
            </div>
          )}

          {/* Announcements */}
          {announcements?.length>0&&(
            <div className="card" style={{animation:'fadeUp .5s ease'}}>
              <div className="sec-title">📢 Pengumuman</div>
              {announcements.map((a:any)=>(
                <div key={a.id} className="ann-item">
                  <div className="ann-title">{a.title}</div>
                  <div className="ann-body">{a.content}</div>
                  <div className="ann-meta">
                    {fmtDate(a.created_at)}
                    {a.creator&&<span className={`ann-by-${a.creator.role==='developer'?'dev':'reseller'}`}> · by {a.creator.username} ({a.creator.role})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTIFS */}
      {tab==='notifs'&&(
        <div className="card" style={{animation:'fadeUp .3s ease'}}>
          <div className="sec-title">🔔 Notifikasi</div>
          {!notifications?.length&&<div style={{textAlign:'center',color:'var(--text2)',padding:40}}>Tidak ada notifikasi</div>}
          {notifications?.map((n:any,i:number)=>(
            <div key={n.id} style={{padding:'12px 14px',borderRadius:10,marginBottom:8,background:n.is_read?'transparent':'rgba(0,102,204,.06)',border:`1px solid ${n.is_read?'transparent':'rgba(0,170,255,.14)'}`,animation:`fadeUp .25s ease ${i*.04}s both`,transition:'all .2s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700,fontSize:'.88rem'}}>{n.title}</div>
                {!n.is_read&&<span style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>}
              </div>
              <div style={{fontSize:'.82rem',color:'var(--text2)',marginTop:5,lineHeight:1.5}}>{n.message}</div>
              <div style={{fontSize:'.72rem',color:'var(--text3)',marginTop:6}}>{fmtDate(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* PROFILE */}
      {tab==='profile'&&(
        <div style={{animation:'fadeUp .3s ease'}}>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="profile-bg">
              {u.background_url?(
                u.background_type==='video'
                  ?<video src={u.background_url} autoPlay loop muted playsInline/>
                  :<img src={u.background_url} alt=""/>
              ):null}
              <div className="profile-bg-overlay"/>
            </div>
            <div className="profile-info">
              <div className="profile-row">
                <div className="profile-avatar">
                  {u.avatar_url?<img src={u.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
                </div>
                <div style={{flex:1}}>
                  <div className="profile-name">{u.username}</div>
                  <div className="profile-email">{u.email}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>setEditOpen(true)}>✏️ Edit Profil</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12}}>
                {[['Role',u.role==='developer'?'👑 Developer':u.role==='reseller'?'🏪 Reseller':'👤 User',u.role==='developer'?'var(--purple)':u.role==='reseller'?'var(--yellow)':'var(--accent)'],['Roblox',u.roblox_username||'-','var(--text)'],['Bergabung',u.created_at?new Date(u.created_at).toLocaleDateString('id-ID'):'-','var(--text)'],['Total Exec',u.total_executions||0,'var(--accent)']].map(([l,v,c])=>(
                  <div key={l as string} className="stat-box">
                    <div style={{fontSize:'.7rem',color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>{l}</div>
                    <div style={{fontWeight:700,color:c as string,fontSize:'.92rem'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="✏️ Edit Profil">
        <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={ef.username} onChange={e=>setEf(f=>({...f,username:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Roblox Username</label><input className="form-input" placeholder="Username Roblox..." value={ef.roblox_username} onChange={e=>setEf(f=>({...f,roblox_username:e.target.value}))}/></div>
        <div className="divider"/>
        <div className="form-group"><label className="form-label">URL Avatar (foto profil)</label><input className="form-input" placeholder="https://...jpg" value={ef.avatar_url} onChange={e=>setEf(f=>({...f,avatar_url:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">URL Background</label><input className="form-input" placeholder="https://..." value={ef.background_url} onChange={e=>setEf(f=>({...f,background_url:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Tipe Background</label>
          <select className="form-select" value={ef.background_type} onChange={e=>setEf(f=>({...f,background_type:e.target.value}))}>
            <option value="image">🖼️ Gambar</option><option value="video">🎥 Video</option>
          </select>
        </div>
        <div className="divider"/>
        <div className="form-group"><label className="form-label">Password Baru (kosong = tidak ganti)</label>
          <div className="form-pw-wrap">
            <input className="form-input" type={showPw?'text':'password'} placeholder="Password baru..." value={ef.password} onChange={e=>setEf(f=>({...f,password:e.target.value}))}/>
            <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={saveProfile} disabled={saving}>
            {saving?<><span className="spinner"/>Menyimpan...</>:'💾 Simpan'}
          </button>
          <button className="btn btn-ghost" onClick={()=>setEditOpen(false)}>Batal</button>
        </div>
      </Modal>
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
  useEffect(()=>{load()},[])

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
    new FileReader().onload = ev=>setForm(f=>({...f,data:ev.target?.result as string||''}))
    const reader = new FileReader(); reader.onload = ev=>setForm(f=>({...f,data:ev.target?.result as string||''})); reader.readAsText(f)
  }
  async function upload(e:React.FormEvent) {
    e.preventDefault(); if(!token){toast('Login dulu!','error');return}
    let parsed; try{parsed=JSON.parse(form.data)}catch{toast('Format JSON tidak valid','error');return}
    const d = await api('/routes','POST',{...form,data:parsed},token)
    if(d.error){toast(d.error,'error');return}
    toast('Route berhasil diupload!','success'); setUploadOpen(false)
    setForm({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''}); load()
  }

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:24}}>
        <div><div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.8rem',fontWeight:700}}>🗺️ Route Library</div><div style={{color:'var(--text2)',fontSize:'.88rem',marginTop:4}}>Download & upload rute AWR Script</div></div>
        {user&&<button className="btn btn-primary" onClick={()=>setUploadOpen(true)}>⬆️ Upload Route</button>}
      </div>
      <div className="route-grid">
        {loading?[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{height:120}}/>):routes.map((r,i)=>(
          <div key={r.id} className="route-card" onClick={()=>openRoute(r)} style={{animationDelay:`${i*.04}s`,animation:'fadeUp .3s ease both'}}>
            {r.thumbnail_url&&<img className="route-thumb" src={r.thumbnail_url} alt={r.name}/>}
            <div className="route-body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div className="route-name">{r.name}</div>
                {!r.is_public&&<span className="badge badge-yellow" style={{fontSize:'.6rem'}}>{r.has_password?'🔐':'🔒'}</span>}
              </div>
              {r.game_name&&<div className="route-game">🎮 {r.game_name}</div>}
              {r.description&&<div className="route-desc">{r.description}</div>}
              <div className="route-footer">
                <div style={{fontSize:'.72rem',color:'var(--text3)'}}>by {r.uploader?.username||'anon'}</div>
                <span className="badge badge-blue">⬇️ {r.download_count}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading&&!routes.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px 0',color:'var(--text2)'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>🗺️</div>Belum ada route</div>}
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
            <textarea className="form-textarea" placeholder='[{"x":0,"y":5,"z":0}]' value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} required style={{fontFamily:'monospace',fontSize:'.78rem'}}/>
          </div>
          <div className="form-group">
            <label className="form-label">Visibilitas</label>
            <select className="form-select" value={form.is_public?'pub':'priv'} onChange={e=>setForm(f=>({...f,is_public:e.target.value==='pub'}))}>
              <option value="pub">🌐 Public</option><option value="priv">🔒 Private</option>
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
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>{copyText(JSON.stringify(detail.data));toast('Data disalin!','success')}}>📋 Copy Data</button>
            <button className="btn btn-ghost" onClick={()=>{const b=new Blob([JSON.stringify(detail.data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${detail.name}.json`;a.click();toast('Downloaded!','success')}}>⬇️ .json</button>
          </div>
        </>}
      </Modal>

      {/* Password */}
      <Modal open={!!pwModal} onClose={()=>{setPwModal(null);setPw('')}} title={`🔐 ${pwModal?.name||''}`}>
        <p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:14}}>Route ini private. Masukkan password.</p>
        <div className="form-group"><input className="form-input" type="password" placeholder="Password..." value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&openWithPw()}/></div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={openWithPw}>🔓 Akses</button>
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
  useEffect(()=>{api('/leaderboard').then(d=>{if(d.leaderboard)setLb(d.leaderboard);setLoading(false)})},[])
  const medals=['🥇','🥈','🥉'], colors=['var(--gold)','#c0c0c0','#cd7f32']
  return (
    <>
      <div style={{marginBottom:24}}><div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.8rem',fontWeight:700}}>🏆 Leaderboard</div><div style={{color:'var(--text2)',fontSize:'.88rem',marginTop:4}}>Top executor AWR Script</div></div>
      <div style={{maxWidth:640}}>
        {loading?[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:64,marginBottom:10}}/>):lb.map((u,i)=>(
          <div key={i} className="lb-row" style={{animationDelay:`${i*.05}s`,background:i<3?`linear-gradient(135deg,rgba(${i===0?'251,191,36':i===1?'192,192,192':'205,127,50'},.05),transparent)`:'var(--card)',borderColor:i<3?`rgba(${i===0?'251,191,36':i===1?'192,192,192':'205,127,50'},.2)`:'var(--border)'}}>
            <div className="lb-rank" style={{color:i<3?colors[i]:'var(--text2)'}}>{i<3?medals[i]:`#${u.rank}`}</div>
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
        {!loading&&!lb.length&&<div style={{textAlign:'center',color:'var(--text2)',padding:'60px 0'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>🏆</div>Belum ada data</div>}
      </div>
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
    const t = setTimeout(()=>setReady(true), 2200)
    const saved = localStorage.getItem('awr_token')||sessionStorage.getItem('awr_token')
    if(saved) {
      api('/user/profile','GET',undefined,saved).then(d=>{
        if(d.user){setToken(saved);setUser(d.user)}
        else{localStorage.removeItem('awr_token');sessionStorage.removeItem('awr_token')}
      })
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
            <div className="navbar-brand" onClick={()=>setPage('dash')}>⚡ AWR</div>
            <div className="navbar-nav">
              {[['dash','🏠'],['routes','🗺️'],['lb','🏆']].map(([v,l])=>(
                <button key={v} className={`nav-btn ${page===v?'active':''}`} onClick={()=>setPage(v)}>{l} {v==='dash'?'Dashboard':v==='routes'?'Routes':'Leaderboard'}</button>
              ))}
              {(user!.role==='reseller'||user!.role==='developer')&&(
                <button className="nav-btn reseller" onClick={()=>router.push('/reseller')}>🏪 Reseller</button>
              )}
              {user!.role==='developer'&&(
                <button className="nav-btn dev" onClick={()=>router.push('/developer')}>👑 Developer</button>
              )}
              <button className="nav-btn danger" onClick={logout}>🚪</button>
            </div>
          </nav>
          <div className="content" key={page}>
            {page==='dash'&&<UserDash token={token} user={user!} onLogout={logout}/>}
            {page==='routes'&&<RoutesPage token={token} user={user}/>}
            {page==='lb'&&<LeaderboardPage/>}
          </div>
        </div>
      }
    </>
  )
}
