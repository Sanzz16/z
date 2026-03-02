import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── TYPES ────────────────────────────────────────────────────
type User = {
  id:string; username:string; email:string; role:string
  roblox_username?:string; roblox_id?:number
  avatar_url?:string; background_url?:string; background_type?:string
  total_executions?:number; created_at?:string
  is_banned?:boolean; ban_reason?:string
}
type KeyData = {
  id:string; key_value:string; expires_at:string|null
  hwid_max:number; duration_type:string; times_used:number
  is_active:boolean; is_free_key?:boolean
  owner?:{username:string}; creator?:{username:string}
}
type Notif = {id:string;title:string;message:string;type:string;is_read:boolean;created_at:string;key_id?:string}
type Route = {id:string;name:string;description:string;game_name:string;download_count:number;created_at:string;is_public:boolean;has_password:boolean;thumbnail_url?:string;uploader?:{username:string}}

// ─── CONSTANTS ────────────────────────────────────────────────
const DURATIONS = ['24h','3d','5d','7d','30d','60d','lifetime']
const DUR_LABEL:Record<string,string> = {'24h':'1 Hari','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const MONEYBLINK_URL = `https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=${encodeURIComponent('https://msanzxmzz.vercel.app/')}`

// ─── API ──────────────────────────────────────────────────────
async function api(path:string, method='GET', body?:any, token?:string|null) {
  try {
    const r = await fetch('/api'+path, {
      method,
      headers: {'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token}:{})},
      body: body ? JSON.stringify(body) : undefined
    })
    return r.json()
  } catch { return {error:'Network error'} }
}

function fmtDate(d:string|null) {
  if (!d) return '∞ Lifetime'
  return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
function timeLeft(d:string|null) {
  if (!d) return '∞'
  const diff = new Date(d).getTime() - Date.now()
  if (diff<=0) return 'Expired'
  const days=Math.floor(diff/86400000), hrs=Math.floor((diff%86400000)/3600000)
  return days>0 ? `${days}h ${hrs}j` : `${hrs}j`
}
function copyText(t:string) {
  navigator.clipboard.writeText(t).catch(()=>{
    const el=document.createElement('textarea'); el.value=t
    document.body.appendChild(el); el.select(); document.execCommand('copy'); el.remove()
  })
}

// ─── TOAST ────────────────────────────────────────────────────
type ToastItem = {id:number;msg:string;type:string;title:string}
let _toast:(m:string,t?:string,ttl?:string)=>void = ()=>{}
function toast(m:string,t='info',ttl='') { _toast(m,t,ttl) }

function ToastRoot() {
  const [items,setItems] = useState<ToastItem[]>([])
  const id = useRef(0)
  useEffect(()=>{
    _toast=(msg,type='info',title='')=>{
      const n = ++id.current
      const tl = title||(type==='error'?'❌ Error':type==='success'?'✅ Sukses':type==='warn'?'⚠️ Peringatan':'ℹ️ Info')
      setItems(p=>[...p,{id:n,msg,type,title:tl}])
      setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),3800)
    }
  },[])
  const ICONS:Record<string,string>={success:'✅',error:'❌',info:'ℹ️',warn:'⚠️',key:'🔑'}
  return <div id="toast-root">
    {items.map(t=>(
      <div key={t.id} className={`toast ${t.type}`}>
        <span className="toast-icon">{ICONS[t.type]||'💬'}</span>
        <div><div className="toast-title">{t.title}</div><div className="toast-msg">{t.msg}</div></div>
      </div>
    ))}
  </div>
}

// ─── MODAL ────────────────────────────────────────────────────
function Modal({open,onClose,title,children,size=''}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;size?:string}) {
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    if(open) window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  },[open])
  if(!open) return null
  return <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className={`modal ${size}`}>
      <div className="flex-between mb-4">
        <div className="modal-title">{title}</div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>
      {children}
    </div>
  </div>
}

// ─── PARTICLES ────────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c = ref.current; if(!c) return
    const ctx = c.getContext('2d')!
    let W=c.width=window.innerWidth, H=c.height=window.innerHeight
    const pts = Array.from({length:70},()=>({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      r:Math.random()*1.5+.5, a:Math.random()
    }))
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw(){
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=W; if(p.x>W)p.x=0
        if(p.y<0)p.y=H; if(p.y>H)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(0,170,255,${p.a*0.4})`; ctx.fill()
      })
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<120){
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y)
          ctx.strokeStyle=`rgba(0,102,204,${(1-d/120)*0.15})`; ctx.lineWidth=.5; ctx.stroke()
        }
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} id="particle-canvas"/>
}

// ─── LOADING SCREEN ───────────────────────────────────────────
function LoadingScreen({done}:{done:boolean}) {
  return <div id="loading-screen" className={done?'gone':''}>
    <div className="ls-logo">⚡ AWR</div>
    <div className="ls-sub">Key System v3 · by Sanzxmzz</div>
    <div className="ls-bar-wrap mt-4"><div className="ls-bar"/></div>
    <div className="ls-dots mt-4">
      <div className="ls-dot"/><div className="ls-dot"/><div className="ls-dot"/>
    </div>
  </div>
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────
function ForgotPasswordModal({open,onClose}:{open:boolean;onClose:()=>void}) {
  const [step,setStep] = useState<'email'|'code'>('email')
  const [email,setEmail] = useState('')
  const [username,setUsername] = useState('')
  const [code,setCode] = useState('')
  const [newPw,setNewPw] = useState('')
  const [showPw,setShowPw] = useState(false)
  const [loading,setLoading] = useState(false)

  async function sendCode(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/forgot-password','POST',{email})
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    setUsername(d.username||'')
    setStep('code')
    toast('Kode dikirim ke email kamu!','success')
  }

  async function resetPw(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/reset-password','POST',{email,code,newPassword:newPw})
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    toast('Password berhasil direset!','success')
    onClose(); setStep('email'); setEmail(''); setCode(''); setNewPw('')
  }

  return <Modal open={open} onClose={onClose} title="🔑 Lupa Password" size="modal-sm">
    {step==='email' ? (
      <form onSubmit={sendCode}>
        <p className="text-sm text-muted mb-4">Masukkan email akun kamu. Kami akan kirim kode verifikasi.</p>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="Email kamu..."
            value={email} onChange={e=>setEmail(e.target.value)} required/>
        </div>
        <button className="btn btn-primary btn-full mt-3" disabled={loading}>
          {loading?<><span className="spinner spinner-sm"/>Mengirim...</>:'📧 Kirim Kode'}
        </button>
      </form>
    ) : (
      <form onSubmit={resetPw}>
        <div style={{background:'rgba(0,0,0,0.4)',border:'1px solid var(--border2)',borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{fontSize:'0.75rem',color:'var(--text2)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>
            KODE VERIFIKASI
          </div>
          <div style={{fontSize:'0.9rem',color:'var(--text3)',marginBottom:16}}>Nama Akun: <strong style={{color:'var(--accent3)'}}>{username||email}</strong></div>
          <input className="form-input reset-code" placeholder="000000"
            value={code} onChange={e=>setCode(e.target.value.slice(0,6))}
            style={{fontFamily:'Rajdhani,monospace',fontSize:'2rem',fontWeight:700,letterSpacing:8,textAlign:'center',color:'var(--accent3)'}}
            maxLength={6} required/>
          <div style={{textAlign:'center',marginTop:8,fontSize:'0.72rem',color:'var(--text3)'}}>
            ⏰ Kode berlaku 20 menit · ©Sanzxmzz
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password Baru</label>
          <div className="input-wrap">
            <input className="form-input" type={showPw?'text':'password'} placeholder="Password baru..."
              value={newPw} onChange={e=>setNewPw(e.target.value)} required minLength={6}/>
            <button type="button" className="eye-btn" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
          </div>
        </div>
        <div className="flex-gap mt-3 gap-2">
          <button className="btn btn-primary flex-1" disabled={loading}>
            {loading?<><span className="spinner spinner-sm"/>Loading...</>:'🔓 Reset Password'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={()=>setStep('email')}>← Kembali</button>
        </div>
      </form>
    )}
  </Modal>
}

// ─── GET KEY MODAL ────────────────────────────────────────────
function GetKeyModal({open,onClose,token,onKeyReceived}:{open:boolean;onClose:()=>void;token:string;onKeyReceived:()=>void}) {
  const [step,setStep] = useState<'info'|'verify'|'done'>('info')
  const [loading,setLoading] = useState(false)
  const [taskId,setTaskId] = useState('')
  const [key,setKey] = useState<any>(null)

  function openLink() {
    const uid = Date.now().toString(36)
    setTaskId(uid)
    window.open(MONEYBLINK_URL+'&uid='+uid,'_blank')
    setTimeout(()=>setStep('verify'),2000)
  }

  async function verify() {
    setLoading(true)
    const d = await api('/getkey-verify','POST',{task_id:taskId},token)
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    setKey(d.key)
    setStep('done')
    onKeyReceived()
    toast('🎉 Free key 24 jam didapat!','success','Key Gratis!')
  }

  function close() {
    onClose(); setStep('info'); setTaskId(''); setKey(null)
  }

  return <Modal open={open} onClose={close} title="🎁 Get Free Key" size="modal-sm">
    {step==='info' && <>
      <div style={{textAlign:'center',padding:'8px 0 20px'}}>
        <div style={{fontSize:'2.5rem',marginBottom:12}}>⚡</div>
        <div style={{fontFamily:'Rajdhani',fontSize:'1.4rem',fontWeight:700,color:'var(--accent3)',marginBottom:8}}>
          Free Key 24 Jam
        </div>
        <p className="text-sm text-muted mb-4">
          Selesaikan task singkat untuk mendapatkan key gratis selama 24 jam.
          Key berlaku untuk 1 perangkat.
        </p>
      </div>
      <div className="getkey-step">
        <div className="step-badge">1</div>
        <div className="text-sm">Klik tombol di bawah, selesaikan task di halaman yang muncul</div>
      </div>
      <div className="getkey-step">
        <div className="step-badge">2</div>
        <div className="text-sm">Setelah selesai, kembali ke sini dan klik "Verifikasi"</div>
      </div>
      <div className="getkey-step">
        <div className="step-badge">3</div>
        <div className="text-sm">Key 24 jam langsung aktif di akun kamu!</div>
      </div>
      <div className="flex-gap mt-4 gap-2">
        <button className="btn btn-primary flex-1" onClick={openLink}>🚀 Mulai Get Key</button>
        <button className="btn btn-ghost" onClick={close}>Batal</button>
      </div>
    </>}

    {step==='verify' && <>
      <p className="text-sm text-muted mb-4">
        Sudah selesaikan task? Klik "Verifikasi" untuk mengecek dan mendapatkan key kamu.
      </p>
      <div className="flex-gap gap-2">
        <button className="btn btn-primary flex-1" onClick={verify} disabled={loading}>
          {loading?<><span className="spinner spinner-sm"/>Mengecek...</>:'✅ Verifikasi'}
        </button>
        <button className="btn btn-ghost" onClick={openLink}>🔄 Ulangi Task</button>
      </div>
    </>}

    {step==='done' && key && <>
      <div style={{textAlign:'center',padding:'12px 0 20px'}}>
        <div style={{fontSize:'2rem',marginBottom:8}}>🎉</div>
        <div style={{fontFamily:'Rajdhani',fontSize:'1.2rem',fontWeight:700,color:'var(--success)',marginBottom:16}}>
          Key Berhasil Didapat!
        </div>
        <div className="key-box" onClick={()=>{copyText(key.key_value);toast('Key disalin!','success')}}>
          {key.key_value}
          <span className="key-copy-hint">klik copy</span>
        </div>
        <div className="mt-3 text-sm text-muted">Berlaku: {fmtDate(key.expires_at)}</div>
      </div>
      <button className="btn btn-ghost btn-full" onClick={close}>Tutup</button>
    </>}
  </Modal>
}

// ─── AUTH PAGE ────────────────────────────────────────────────
function AuthPage({onAuth}:{onAuth:(t:string,u:User)=>void}) {
  const [mode,setMode] = useState<'login'|'register'>('login')
  const [form,setForm] = useState({username:'',email:'',password:''})
  const [remember,setRemember] = useState(false)
  const [showPw,setShowPw] = useState(false)
  const [loading,setLoading] = useState(false)
  const [showForgot,setShowForgot] = useState(false)

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const path = mode==='login' ? '/auth/login' : '/auth/register'
    const body = mode==='login' ? {username:form.username,password:form.password,rememberMe:remember} : form
    const d = await api(path,'POST',body)
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    if(remember) localStorage.setItem('awr_token',d.token)
    else sessionStorage.setItem('awr_token',d.token)
    onAuth(d.token,d.user)
    toast('Selamat datang, '+d.user.username+'!','success')
  }

  return <>
    <ForgotPasswordModal open={showForgot} onClose={()=>setShowForgot(false)}/>
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">⚡ AWR</div>
          <div className="auth-logo-sub">Key System v3 · by Sanzxmzz</div>
        </div>
        <div className="card">
          <div className="tab-bar">
            <button className={`tab-item ${mode==='login'?'act':''}`} onClick={()=>setMode('login')}>🔑 Login</button>
            <button className={`tab-item ${mode==='register'?'act':''}`} onClick={()=>setMode('register')}>✨ Daftar</button>
          </div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Username kamu" value={form.username}
                onChange={e=>setForm(f=>({...f,username:e.target.value}))} required/>
            </div>
            {mode==='register'&&<div className="form-group" style={{animation:'fade-up 0.25s ease'}}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="Email kamu" value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
            </div>}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <input className="form-input" type={showPw?'text':'password'} placeholder="Password kamu"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
                <button type="button" className="eye-btn" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
              </div>
            </div>
            {mode==='login'&&<div className="flex-between mt-2 mb-4">
              <label className="checkbox-wrap text-sm text-muted">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
                Ingat saya 30 hari
              </label>
              <span className="text-sm" style={{color:'var(--accent3)',cursor:'pointer'}} onClick={()=>setShowForgot(true)}>
                Lupa password?
              </span>
            </div>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading?<><span className="spinner spinner-sm"/>Loading...</>:mode==='login'?'🔑 Masuk':'✨ Daftar'}
            </button>
          </form>
          {mode==='login'&&<div className="text-center mt-3 text-sm text-muted">
            Belum punya akun?{' '}
            <span style={{color:'var(--accent3)',cursor:'pointer'}} onClick={()=>setMode('register')}>Daftar →</span>
          </div>}
        </div>
      </div>
    </div>
  </>
}

// ─── USER DASHBOARD ───────────────────────────────────────────
function UserDash({token,user,onLogout}:{token:string;user:User;onLogout:()=>void}) {
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [tab,setTab] = useState('dash')
  const [editOpen,setEditOpen] = useState(false)
  const [ef,setEf] = useState({username:'',roblox_username:'',avatar_url:'',background_url:'',background_type:'image',password:''})
  const [showPw,setShowPw] = useState(false)
  const [getkeyOpen,setGetkeyOpen] = useState(false)

  const load = useCallback(async()=>{
    setLoading(true)
    const d = await api('/user/profile','GET',undefined,token)
    if(d.user) {
      setData(d)
      setEf({username:d.user.username,roblox_username:d.user.roblox_username||'',avatar_url:d.user.avatar_url||'',background_url:d.user.background_url||'',background_type:d.user.background_type||'image',password:''})
    }
    setLoading(false)
  },[token])

  useEffect(()=>{load()},[load])

  async function saveProfile() {
    const b:any={}
    if(ef.username!==data.user.username) b.username=ef.username
    if(ef.roblox_username!==(data.user.roblox_username||'')) b.roblox_username=ef.roblox_username
    if(ef.avatar_url!==(data.user.avatar_url||'')) b.avatar_url=ef.avatar_url
    if(ef.background_url!==(data.user.background_url||'')) b.background_url=ef.background_url
    if(ef.background_type!==(data.user.background_type||'image')) b.background_type=ef.background_type
    if(ef.password) b.password=ef.password
    const r = await api('/user/profile','PATCH',b,token)
    if(r.error){toast(r.error,'error');return}
    toast('Profil diupdate!','success'); setEditOpen(false); load()
  }

  if(loading) return <div className="flex-center" style={{height:'60vh'}}>
    <div className="flex-col flex-center gap-3">
      <div className="spinner" style={{width:36,height:36}}/>
      <div className="text-sm text-muted">Loading...</div>
    </div>
  </div>
  if(!data) return null

  const {user:u,key,notifications,announcements} = data
  const unread = notifications?.filter((n:Notif)=>!n.is_read).length||0

  return <>
    <GetKeyModal open={getkeyOpen} onClose={()=>setGetkeyOpen(false)} token={token} onKeyReceived={load}/>

    <div className="tab-bar">
      <button className={`tab-item ${tab==='dash'?'act':''}`} onClick={()=>setTab('dash')}>🏠 Dashboard</button>
      <button className={`tab-item ${tab==='notifs'?'act':''}`} onClick={()=>{setTab('notifs');api('/user/read-notifs','POST',{},token).then(load)}}>
        🔔 Notif {unread>0&&<span className="nav-badge">{unread}</span>}
      </button>
      <button className={`tab-item ${tab==='profile'?'act':''}`} onClick={()=>setTab('profile')}>👤 Profil</button>
    </div>

    {tab==='dash'&&<div>
      <div className="grid-2 mb-4">
        <div className="card anim-delay-1" style={{animation:'fade-up 0.35s ease both'}}>
          <div className="card-title">📊 Statistik</div>
          <div className="grid-2">
            <div className="stat-card"><div className="stat-num">{u.total_executions||0}</div><div className="stat-label">Total Exec</div></div>
            <div className="stat-card"><div className="stat-num">{key?'1':'0'}</div><div className="stat-label">Key Aktif</div></div>
          </div>
        </div>
        <div className="card anim-delay-2" style={{animation:'fade-up 0.35s ease both'}}>
          <div className="card-title">👤 Info Akun</div>
          <div className="text-sm mb-2"><span className="text-muted">Username:</span> <strong>{u.username}</strong></div>
          <div className="text-sm mb-2"><span className="text-muted">Email:</span> {u.email}</div>
          <div className="text-sm"><span className="text-muted">Role:</span>{' '}
            <span className={`badge ${u.role==='developer'?'badge-purple':u.role==='reseller'?'badge-gold':'badge-blue'}`}>
              {u.role==='developer'?'👑 Developer':u.role==='reseller'?'🏪 Reseller':'👤 User'}
            </span>
          </div>
        </div>
      </div>

      {key ? (
        <div className="card card-glow mb-4" style={{animation:'fade-up 0.4s ease both anim-delay-3'}}>
          <div className="flex-between mb-3" style={{flexWrap:'wrap',gap:8}}>
            <div className="card-title" style={{margin:0}}>🔑 Key Kamu</div>
            <div className="flex-gap gap-2">
              <span className={`badge ${key.is_active?'badge-green':'badge-red'}`}>{key.is_active?'● Aktif':'● Mati'}</span>
              <span className="badge badge-blue">{DUR_LABEL[key.duration_type]||key.duration_type}</span>
              {key.is_free_key&&<span className="badge badge-gold">🎁 Free</span>}
            </div>
          </div>
          <div className="key-box mb-4" onClick={()=>{copyText(key.key_value);toast('Key disalin!','success')}}>
            {key.key_value}<span className="key-copy-hint">klik copy</span>
          </div>
          <div className="grid-3">
            <div><div className="text-xs text-muted mb-1">EXPIRED</div>
              <div className="text-sm" style={{color:key.expires_at&&new Date(key.expires_at)<new Date()?'var(--danger)':'var(--text)'}}>{fmtDate(key.expires_at)}</div></div>
            <div><div className="text-xs text-muted mb-1">SISA WAKTU</div>
              <div className="text-sm text-accent">{timeLeft(key.expires_at)}</div></div>
            <div><div className="text-xs text-muted mb-1">KEY TERPAKAI</div>
              <div className="text-sm">{key.times_used} kali</div></div>
          </div>
          <div className="mt-3 text-xs text-muted">HWID Max: {key.hwid_max} perangkat</div>
        </div>
      ) : (
        <div className="card mb-4 text-center" style={{padding:40,borderStyle:'dashed',animation:'fade-up 0.4s ease both'}}>
          <div style={{fontSize:'2.5rem',marginBottom:12}}>🔒</div>
          <div className="fw-bold mb-2">Kamu belum punya key</div>
          <div className="text-sm text-muted mb-4">Hubungi reseller atau developer untuk mendapatkan key AWR</div>
          <button className="btn btn-primary" onClick={()=>setGetkeyOpen(true)}>🎁 Get Free Key 24 Jam</button>
        </div>
      )}

      {announcements?.length>0&&<div className="card" style={{animation:'fade-up 0.45s ease both'}}>
        <div className="card-title">📢 Pengumuman</div>
        {announcements.map((a:any)=>(
          <div key={a.id} className="announce-card">
            <div className="fw-bold text-sm mb-1">{a.title}</div>
            <div className="text-sm text-muted">{a.content}</div>
            <div className="text-xs text-muted mt-2">{fmtDate(a.created_at)}</div>
          </div>
        ))}
      </div>}
    </div>}

    {tab==='notifs'&&<div className="card">
      <div className="card-title">🔔 Notifikasi</div>
      {!notifications?.length&&<div className="text-center text-muted" style={{padding:40}}>Tidak ada notifikasi</div>}
      {notifications?.map((n:Notif,i:number)=>(
        <div key={n.id} style={{
          padding:14,borderRadius:10,marginBottom:8,transition:'all 0.2s',
          background:n.is_read?'transparent':'rgba(0,102,204,0.07)',
          border:`1px solid ${n.is_read?'transparent':'rgba(0,170,255,0.14)'}`,
          animation:`fade-up 0.3s ease ${i*0.04}s both`
        }}>
          <div className="flex-between">
            <div className="fw-bold text-sm">{n.title}</div>
            {!n.is_read&&<span className="notif-dot"/>}
          </div>
          <div className="text-sm text-muted mt-1">{n.message}</div>
          <div className="text-xs text-muted mt-1">{fmtDate(n.created_at)}</div>
        </div>
      ))}
    </div>}

    {tab==='profile'&&<div>
      <div className="card mb-4" style={{padding:0,overflow:'hidden',animation:'scale-in 0.3s ease'}}>
        <div className="profile-bg">
          {u.background_url
            ? u.background_type==='video'
              ? <video src={u.background_url} autoPlay loop muted playsInline/>
              : <img src={u.background_url} alt="bg"/>
            : <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,var(--card2),var(--bg3))'}}/>}
        </div>
        <div style={{padding:'0 24px 24px',marginTop:-40}}>
          <div className="flex-gap mb-3" style={{alignItems:'flex-end'}}>
            <div className="profile-avatar">
              {u.avatar_url?<img src={u.avatar_url} alt="av"/>:'👤'}
            </div>
            <div style={{paddingBottom:4}}>
              <div style={{fontFamily:'Rajdhani',fontSize:'1.4rem',fontWeight:700}}>{u.username}</div>
              <div className="text-sm text-muted">{u.email}</div>
            </div>
          </div>
          <div className="grid-3 mb-4">
            <div><div className="text-xs text-muted mb-1">Role</div>
              <span className={`badge ${u.role==='developer'?'badge-purple':u.role==='reseller'?'badge-gold':'badge-blue'}`}>{u.role}</span></div>
            <div><div className="text-xs text-muted mb-1">Roblox</div>
              <div className="text-sm">{u.roblox_username||'-'}</div></div>
            <div><div className="text-xs text-muted mb-1">Bergabung</div>
              <div className="text-sm">{u.created_at?new Date(u.created_at).toLocaleDateString('id-ID'):'-'}</div></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setEditOpen(true)}>✏️ Edit Profil</button>
        </div>
      </div>
    </div>}

    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="✏️ Edit Profil">
      <div className="form-group"><label className="form-label">Username</label>
        <input className="form-input" value={ef.username} onChange={e=>setEf(f=>({...f,username:e.target.value}))}/></div>
      <div className="form-group"><label className="form-label">Roblox Username</label>
        <input className="form-input" placeholder="Username Roblox..." value={ef.roblox_username} onChange={e=>setEf(f=>({...f,roblox_username:e.target.value}))}/></div>
      <div className="divider"/>
      <div className="form-group"><label className="form-label">URL Avatar (foto profil)</label>
        <input className="form-input" placeholder="https://..." value={ef.avatar_url} onChange={e=>setEf(f=>({...f,avatar_url:e.target.value}))}/></div>
      <div className="form-group"><label className="form-label">URL Background</label>
        <input className="form-input" placeholder="https://.../image-or-video" value={ef.background_url} onChange={e=>setEf(f=>({...f,background_url:e.target.value}))}/></div>
      <div className="form-group"><label className="form-label">Tipe Background</label>
        <select className="form-select" value={ef.background_type} onChange={e=>setEf(f=>({...f,background_type:e.target.value}))}>
          <option value="image">🖼️ Gambar</option>
          <option value="video">🎥 Video</option>
        </select></div>
      <div className="divider"/>
      <div className="form-group"><label className="form-label">Password Baru (kosong = tidak ganti)</label>
        <div className="input-wrap">
          <input className="form-input" type={showPw?'text':'password'} placeholder="Password baru..." value={ef.password} onChange={e=>setEf(f=>({...f,password:e.target.value}))}/>
          <button type="button" className="eye-btn" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
        </div></div>
      <div className="flex-gap mt-4 gap-2">
        <button className="btn btn-primary flex-1" onClick={saveProfile}>💾 Simpan</button>
        <button className="btn btn-ghost" onClick={()=>setEditOpen(false)}>Batal</button>
      </div>
    </Modal>
  </>
}

// ─── RESELLER PANEL ───────────────────────────────────────────
function ResellerPanel({token,user}:{token:string;user:User}) {
  const [tab,setTab] = useState('send')
  const [users,setUsers] = useState<User[]>([])
  const [keys,setKeys] = useState<KeyData[]>([])
  const [form,setForm] = useState({target_username:'',duration_type:'24h',hwid_max:'1'})
  const [bc,setBc] = useState({title:'',content:'',sendEmail:false})
  const [search,setSearch] = useState('')
  const [loading,setLoading] = useState(false)

  useEffect(()=>{
    api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
    api('/reseller/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  },[token])

  async function send(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/reseller/keys','POST',form,token)
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    toast(`Key dikirim ke ${form.target_username}!`,'success')
    setForm(f=>({...f,target_username:'',hwid_max:'1'}))
    api('/reseller/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  }

  async function sendBc(e:React.FormEvent) {
    e.preventDefault()
    const d = await api('/reseller/broadcast','POST',bc,token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success'); setBc({title:'',content:'',sendEmail:false})
  }

  const fu = users.filter(u=>u.username.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))

  return <>
    <div className="tab-bar">
      <button className={`tab-item ${tab==='send'?'act':''}`} onClick={()=>setTab('send')}>🔑 Kirim Key</button>
      <button className={`tab-item ${tab==='hist'?'act':''}`} onClick={()=>setTab('hist')}>📋 History</button>
      <button className={`tab-item ${tab==='bc'?'act':''}`} onClick={()=>setTab('bc')}>📢 Broadcast</button>
      <button className={`tab-item ${tab==='users'?'act':''}`} onClick={()=>setTab('users')}>👥 List User</button>
    </div>

    {tab==='send'&&<div className="card" style={{maxWidth:520,animation:'fade-up 0.3s ease'}}>
      <div className="card-title">🔑 Kirim Key ke User</div>
      <form onSubmit={send}>
        <div className="form-group"><label className="form-label">Username Tujuan</label>
          <select className="form-select" value={form.target_username} onChange={e=>setForm(f=>({...f,target_username:e.target.value}))} required>
            <option value="">— Pilih Username —</option>
            {users.map(u=><option key={u.id} value={u.username}>{u.username}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Durasi Key</label>
          <select className="form-select" value={form.duration_type} onChange={e=>setForm(f=>({...f,duration_type:e.target.value}))}>
            {DURATIONS.map(d=><option key={d} value={d}>{DUR_LABEL[d]}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Max HWID (1 – 999999999999)</label>
          <input className="form-input" type="number" min={1} max={999999999999} value={form.hwid_max} onChange={e=>setForm(f=>({...f,hwid_max:e.target.value}))} required/></div>
        <button className="btn btn-primary btn-full" disabled={loading}>
          {loading?<><span className="spinner spinner-sm"/>Mengirim...</>:'🚀 Kirim Key'}
        </button>
      </form>
    </div>}

    {tab==='hist'&&<div className="card" style={{animation:'fade-up 0.3s ease'}}>
      <div className="card-title">📋 History Key</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Key</th><th>Dikirim ke</th><th>Durasi</th><th>Expired</th><th>Status</th><th>Terpakai</th></tr></thead>
          <tbody>
            {keys.map(k=><tr key={k.id}>
              <td><div className="key-box" style={{fontSize:'0.68rem',padding:'5px 8px'}} onClick={()=>{copyText(k.key_value);toast('Disalin!','success')}}>{k.key_value}</div></td>
              <td>{(k as any).owner?.username||'-'}</td>
              <td><span className="badge badge-blue">{DUR_LABEL[k.duration_type]||k.duration_type}</span></td>
              <td className="text-sm">{fmtDate(k.expires_at)}</td>
              <td><span className={`badge ${k.is_active?'badge-green':'badge-red'}`}>{k.is_active?'Aktif':'Mati'}</span></td>
              <td>{k.times_used}x</td>
            </tr>)}
            {!keys.length&&<tr><td colSpan={6} className="text-center text-muted" style={{padding:30}}>Belum ada key</td></tr>}
          </tbody>
        </table>
      </div>
    </div>}

    {tab==='bc'&&<div className="card" style={{maxWidth:520,animation:'fade-up 0.3s ease'}}>
      <div className="card-title">📢 Broadcast ke Semua User</div>
      <div className="mb-3 text-sm text-muted">Pesan akan dikirim sebagai: <strong style={{color:'var(--accent3)'}}>by {user.username}</strong></div>
      <form onSubmit={sendBc}>
        <div className="form-group"><label className="form-label">Judul</label>
          <input className="form-input" placeholder="Judul pesan..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
        <div className="form-group"><label className="form-label">Teks</label>
          <textarea className="form-textarea" placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required/></div>
        <label className="checkbox-wrap text-sm mb-4">
          <input type="checkbox" checked={bc.sendEmail} onChange={e=>setBc(b=>({...b,sendEmail:e.target.checked}))}/>
          Kirim juga via Email ke semua user
        </label>
        <button className="btn btn-primary btn-full" type="submit">📢 Kirim Broadcast</button>
      </form>
    </div>}

    {tab==='users'&&<div className="card" style={{animation:'fade-up 0.3s ease'}}>
      <div className="flex-between mb-4" style={{flexWrap:'wrap',gap:12}}>
        <div className="card-title" style={{margin:0}}>👥 List User ({users.length})</div>
        <input className="form-input" style={{width:220}} placeholder="🔍 Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Key</th><th>Bergabung</th></tr></thead>
          <tbody>
            {fu.map(u=><tr key={u.id}>
              <td className="fw-bold">{u.username}</td>
              <td className="text-sm text-muted">{u.email}</td>
              <td>{(u as any).keys?.[0]?.key_value?<span className="badge badge-green">Ada Key</span>:<span className="badge badge-gray">No Key</span>}</td>
              <td className="text-sm">{u.created_at?new Date(u.created_at).toLocaleDateString('id-ID'):'-'}</td>
            </tr>)}
            {!fu.length&&<tr><td colSpan={4} className="text-center text-muted" style={{padding:30}}>Tidak ada user</td></tr>}
          </tbody>
        </table>
      </div>
    </div>}
  </>
}

// ─── DEVELOPER PANEL ──────────────────────────────────────────
function DevPanel({token,user}:{token:string;user:User}) {
  const [tab,setTab] = useState('users')
  const [users,setUsers] = useState<any[]>([])
  const [keys,setKeys] = useState<KeyData[]>([])
  const [search,setSearch] = useState('')
  const [bc,setBc] = useState({title:'',content:'',sendEmail:false})
  const [gk,setGk] = useState({duration_type:'24h',hwid_max:'1'})
  const [editU,setEditU] = useState<any>(null)
  const [editK,setEditK] = useState<any>(null)
  const [banModal,setBanModal] = useState<any>(null)
  const [banReason,setBanReason] = useState('')
  const [resellerName,setResellerName] = useState('')
  const [showPw,setShowPw] = useState(false)

  const loadUsers = ()=>api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
  const loadKeys  = ()=>api('/developer/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})

  useEffect(()=>{loadUsers();loadKeys()},[])

  async function sendBc(e:React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/broadcast','POST',bc,token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success'); setBc({title:'',content:'',sendEmail:false})
  }

  async function sendKeyAll(e:React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/send-key-all','POST',gk,token)
    if(d.error){toast(d.error,'error');return}
    toast(`Key dikirim! ${d.notified} user dinotifikasi`,'success')
  }

  async function doBan(action:string) {
    const d = await api('/developer/ban','POST',{userId:banModal.id,action,reason:banReason},token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success'); setBanModal(null); setBanReason(''); loadUsers()
  }

  async function saveEditU() {
    const d = await api('/developer/users','PATCH',editU,token)
    if(d.error){toast(d.error,'error');return}
    toast('User diupdate!','success'); setEditU(null); loadUsers()
  }

  async function saveEditK() {
    const d = await api('/developer/keys','PATCH',editK,token)
    if(d.error){toast(d.error,'error');return}
    toast('Key diupdate!','success'); setEditK(null); loadKeys()
  }

  async function delKey(id:string) {
    if(!confirm('Hapus key ini?')) return
    await api('/developer/keys','DELETE',{keyId:id},token)
    toast('Key dihapus','info'); loadKeys()
  }

  async function setReseller(uname:string,role:string) {
    const t = users.find(u=>u.username===uname)
    if(!t){toast('User tidak ditemukan','error');return}
    const d = await api('/developer/users','PATCH',{userId:t.id,role},token)
    if(d.error){toast(d.error,'error');return}
    toast(`${uname} dijadikan ${role}!`,'success'); setResellerName(''); loadUsers()
  }

  const fu = users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))

  return <>
    <div className="tab-bar" style={{flexWrap:'wrap'}}>
      {[['users','👥 Users'],['keys','🔑 Keys'],['bc','📢 Broadcast'],['gk','🎁 Key Global'],['rs','🏪 Reseller']].map(([v,l])=>(
        <button key={v} className={`tab-item ${tab===v?'act':''}`} onClick={()=>setTab(v)}>{l}</button>
      ))}
    </div>

    {tab==='users'&&<div className="card" style={{animation:'fade-up 0.3s ease'}}>
      <div className="flex-between mb-4" style={{flexWrap:'wrap',gap:12}}>
        <div className="card-title" style={{margin:0}}>👥 Semua User ({users.length})</div>
        <input className="form-input" style={{width:220}} placeholder="🔍 Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Key</th><th>Roblox</th><th>Exec</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {fu.map((u,i)=><tr key={u.id} style={{animation:`fade-up 0.25s ease ${i*0.03}s both`}}>
              <td className="fw-bold">{u.username}</td>
              <td className="text-sm text-muted">{u.email}</td>
              <td><span className={`badge ${u.role==='developer'?'badge-purple':u.role==='reseller'?'badge-gold':'badge-blue'}`}>{u.role}</span></td>
              <td className="text-sm" style={{maxWidth:160}}>
                {u.keys?.[0]?.key_value
                  ? <div>
                      <div style={{fontFamily:'Rajdhani',fontSize:'0.68rem',color:'var(--accent3)',letterSpacing:1,cursor:'pointer'}}
                        onClick={()=>{copyText(u.keys[0].key_value);toast('Key disalin!','success')}}>
                        {u.keys[0].key_value.slice(0,14)}...
                      </div>
                      <div className="text-xs text-muted">{fmtDate(u.keys[0].expires_at)}</div>
                    </div>
                  : <span className="badge badge-gray">No key</span>}
              </td>
              <td>
                {u.roblox_username
                  ? <div>
                      <a href={`https://www.roblox.com/users/${u.roblox_id}/profile`} target="_blank" rel="noreferrer"
                        style={{color:'var(--accent3)',textDecoration:'none',fontSize:'0.8rem'}}>
                        {u.roblox_username} ↗
                      </a>
                      {u.last_execution&&<div className="text-xs text-muted">Exec: {new Date(u.last_execution.executed_at).toLocaleDateString('id-ID')}</div>}
                    </div>
                  : <span className="text-muted text-sm">-</span>}
              </td>
              <td style={{fontFamily:'Rajdhani',fontWeight:700}}>{u.execution_count||0}</td>
              <td><span className={`badge ${u.is_banned?'badge-red':'badge-green'}`}>{u.is_banned?'Banned':'Aktif'}</span></td>
              <td>
                <div className="flex-gap gap-2">
                  <button className="btn btn-ghost btn-sm" title="Edit" onClick={()=>setEditU({userId:u.id,username:u.username,email:u.email,role:u.role,roblox_username:u.roblox_username||'',roblox_id:u.roblox_id||'',password:''})}>✏️</button>
                  {u.is_banned
                    ? <button className="btn btn-success btn-sm" title="Unban" onClick={()=>{setBanModal(u);setBanReason('')}}>✅</button>
                    : <button className="btn btn-danger btn-sm" title="Ban" onClick={()=>{setBanModal(u);setBanReason('')}}>🚫</button>}
                </div>
              </td>
            </tr>)}
            {!fu.length&&<tr><td colSpan={8} className="text-center text-muted" style={{padding:30}}>Tidak ada user</td></tr>}
          </tbody>
        </table>
      </div>
    </div>}

    {tab==='keys'&&<div className="card" style={{animation:'fade-up 0.3s ease'}}>
      <div className="card-title">🔑 Semua Key ({keys.length})</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Key</th><th>Assign to</th><th>Dibuat oleh</th><th>Durasi</th><th>Expired</th><th>HWID</th><th>Pakai</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {keys.map(k=><tr key={k.id}>
              <td><div className="key-box" style={{fontSize:'0.66rem',padding:'4px 7px',cursor:'pointer'}} onClick={()=>{copyText(k.key_value);toast('Disalin!','success')}}>{k.key_value}</div></td>
              <td className="text-sm">{(k as any).owner?.username||<span className="badge badge-yellow">Shared</span>}</td>
              <td className="text-sm">{(k as any).creator?.username||'-'}</td>
              <td><span className="badge badge-blue">{DUR_LABEL[k.duration_type]||k.duration_type}</span></td>
              <td className="text-sm">{fmtDate(k.expires_at)}</td>
              <td>{k.hwid_max}</td>
              <td>{k.times_used}x</td>
              <td><span className={`badge ${k.is_active?'badge-green':'badge-red'}`}>{k.is_active?'Aktif':'Mati'}</span></td>
              <td>
                <div className="flex-gap gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditK({keyId:k.id,is_active:k.is_active,hwid_max:k.hwid_max,duration_type:k.duration_type,expires_at:k.expires_at||'',assigned_to_username:(k as any).owner?.username||''})}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>delKey(k.id)}>🗑️</button>
                </div>
              </td>
            </tr>)}
            {!keys.length&&<tr><td colSpan={9} className="text-center text-muted" style={{padding:30}}>Belum ada key</td></tr>}
          </tbody>
        </table>
      </div>
    </div>}

    {tab==='bc'&&<div className="card" style={{maxWidth:520,animation:'fade-up 0.3s ease'}}>
      <div className="card-title">📢 Broadcast ke Semua User</div>
      <div className="mb-3 text-sm text-muted">Pesan akan dikirim sebagai: <strong style={{color:'var(--accent3)'}}>by Developer</strong></div>
      <form onSubmit={sendBc}>
        <div className="form-group"><label className="form-label">Judul</label>
          <input className="form-input" placeholder="Judul..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
        <div className="form-group"><label className="form-label">Teks</label>
          <textarea className="form-textarea" placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required/></div>
        <label className="checkbox-wrap text-sm mb-4">
          <input type="checkbox" checked={bc.sendEmail} onChange={e=>setBc(b=>({...b,sendEmail:e.target.checked}))}/>
          Kirim juga via Gmail ke semua user
        </label>
        <button className="btn btn-primary btn-full" type="submit">📢 Kirim Broadcast</button>
      </form>
    </div>}

    {tab==='gk'&&<div className="card" style={{maxWidth:480,animation:'fade-up 0.3s ease'}}>
      <div className="card-title">🎁 Kirim Key ke Semua User</div>
      <div style={{background:'rgba(251,191,36,0.07)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:'0.82rem',color:'#fbbf24'}}>
        ⚠️ Key ini akan jadi shared key yang bisa diakses semua orang. Semua user dinotifikasi.
      </div>
      <form onSubmit={sendKeyAll}>
        <div className="form-group"><label className="form-label">Durasi</label>
          <select className="form-select" value={gk.duration_type} onChange={e=>setGk(g=>({...g,duration_type:e.target.value}))}>
            {DURATIONS.map(d=><option key={d} value={d}>{DUR_LABEL[d]}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Max HWID</label>
          <input className="form-input" type="number" min={1} max={999999999999} value={gk.hwid_max} onChange={e=>setGk(g=>({...g,hwid_max:e.target.value}))}/></div>
        <button className="btn btn-primary btn-full" type="submit">🚀 Kirim ke Semua</button>
      </form>
    </div>}

    {tab==='rs'&&<div className="card" style={{maxWidth:520,animation:'fade-up 0.3s ease'}}>
      <div className="card-title">🏪 Manajemen Reseller</div>
      <div className="form-group"><label className="form-label">Jadikan Reseller</label>
        <div className="flex-gap gap-2">
          <select className="form-select" value={resellerName} onChange={e=>setResellerName(e.target.value)}>
            <option value="">— Pilih User —</option>
            {users.filter(u=>u.role==='user').map(u=><option key={u.id} value={u.username}>{u.username}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>resellerName&&setReseller(resellerName,'reseller')}>✅ Set</button>
        </div>
      </div>
      <div className="divider"/>
      <div className="card-title" style={{marginBottom:12}}>📋 Daftar Reseller</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.filter(u=>u.role==='reseller').map(u=><tr key={u.id}>
              <td>{u.username}</td>
              <td className="text-sm text-muted">{u.email}</td>
              <td><button className="btn btn-ghost btn-sm" onClick={()=>setReseller(u.username,'user')}>Copot</button></td>
            </tr>)}
            {!users.filter(u=>u.role==='reseller').length&&<tr><td colSpan={3} className="text-center text-muted" style={{padding:20}}>Belum ada reseller</td></tr>}
          </tbody>
        </table>
      </div>
    </div>}

    {/* Edit User Modal */}
    <Modal open={!!editU} onClose={()=>setEditU(null)} title="✏️ Edit User">
      {editU&&<>
        <div className="form-group"><label className="form-label">Username</label>
          <input className="form-input" value={editU.username} onChange={e=>setEditU((u:any)=>({...u,username:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Email</label>
          <input className="form-input" value={editU.email} onChange={e=>setEditU((u:any)=>({...u,email:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Role</label>
          <select className="form-select" value={editU.role} onChange={e=>setEditU((u:any)=>({...u,role:e.target.value}))}>
            <option value="user">User</option><option value="reseller">Reseller</option><option value="developer">Developer</option>
          </select></div>
        <div className="form-group"><label className="form-label">Roblox Username</label>
          <input className="form-input" value={editU.roblox_username} onChange={e=>setEditU((u:any)=>({...u,roblox_username:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Password Baru (kosong = tidak ganti)</label>
          <div className="input-wrap">
            <input className="form-input" type={showPw?'text':'password'} value={editU.password} onChange={e=>setEditU((u:any)=>({...u,password:e.target.value}))}/>
            <button type="button" className="eye-btn" onClick={()=>setShowPw(!showPw)}>{showPw?'🙈':'👁️'}</button>
          </div></div>
        <div className="flex-gap mt-4 gap-2">
          <button className="btn btn-primary flex-1" onClick={saveEditU}>💾 Simpan</button>
          <button className="btn btn-ghost" onClick={()=>setEditU(null)}>Batal</button>
        </div>
      </>}
    </Modal>

    {/* Edit Key Modal */}
    <Modal open={!!editK} onClose={()=>setEditK(null)} title="✏️ Edit Key">
      {editK&&<>
        <div className="form-group"><label className="form-label">Assign ke Username</label>
          <input className="form-input" placeholder="Username..." value={editK.assigned_to_username} onChange={e=>setEditK((k:any)=>({...k,assigned_to_username:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Durasi</label>
          <select className="form-select" value={editK.duration_type} onChange={e=>setEditK((k:any)=>({...k,duration_type:e.target.value}))}>
            {DURATIONS.map(d=><option key={d} value={d}>{DUR_LABEL[d]}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Max HWID</label>
          <input className="form-input" type="number" value={editK.hwid_max} onChange={e=>setEditK((k:any)=>({...k,hwid_max:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-select" value={editK.is_active?'true':'false'} onChange={e=>setEditK((k:any)=>({...k,is_active:e.target.value==='true'}))}>
            <option value="true">Aktif</option><option value="false">Nonaktif</option>
          </select></div>
        <div className="flex-gap mt-4 gap-2">
          <button className="btn btn-primary flex-1" onClick={saveEditK}>💾 Simpan</button>
          <button className="btn btn-ghost" onClick={()=>setEditK(null)}>Batal</button>
        </div>
      </>}
    </Modal>

    {/* Ban Modal */}
    <Modal open={!!banModal} onClose={()=>setBanModal(null)} title={banModal?.is_banned?'✅ Unban User':'🚫 Ban User'} size="modal-sm">
      {banModal&&<>
        <p className="text-sm text-muted mb-4">
          {banModal.is_banned
            ? <>Unban <strong>{banModal.username}</strong>?</>
            : <>Ban <strong>{banModal.username}</strong>? Semua key akan dimatikan.</>}
        </p>
        {!banModal.is_banned&&<div className="form-group"><label className="form-label">Alasan</label>
          <input className="form-input" placeholder="Alasan ban..." value={banReason} onChange={e=>setBanReason(e.target.value)}/></div>}
        <div className="flex-gap mt-4 gap-2">
          {banModal.is_banned
            ? <button className="btn btn-success flex-1" onClick={()=>doBan('unban')}>✅ Unban</button>
            : <button className="btn btn-danger flex-1" onClick={()=>doBan('ban')}>🚫 Ban</button>}
          <button className="btn btn-ghost" onClick={()=>setBanModal(null)}>Batal</button>
        </div>
      </>}
    </Modal>
  </>
}

// ─── ROUTES PAGE ──────────────────────────────────────────────
function RoutesPage({token,user}:{token:string|null;user:User|null}) {
  const [routes,setRoutes] = useState<Route[]>([])
  const [loading,setLoading] = useState(true)
  const [uploadOpen,setUploadOpen] = useState(false)
  const [detail,setDetail] = useState<any>(null)
  const [pwModal,setPwModal] = useState<{id:string;name:string}|null>(null)
  const [pw,setPw] = useState('')
  const [form,setForm] = useState({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''})
  const [fileContent,setFileContent] = useState('')

  const load = ()=>{
    setLoading(true)
    api('/routes','GET',undefined,token).then(d=>{
      if(d.routes)setRoutes(d.routes)
      setLoading(false)
    })
  }

  useEffect(()=>{load()},[])

  async function openRoute(r:Route) {
    if(!r.is_public&&r.has_password) { setPwModal({id:r.id,name:r.name}); return }
    const d = await api('/routes/'+r.id,'GET',undefined,token)
    if(d.route) setDetail(d.route)
    else toast('Gagal load route','error')
  }

  async function openWithPw() {
    const r = await fetch('/api/routes/'+pwModal!.id+'?password='+encodeURIComponent(pw))
    const d = await r.json()
    if(d.error){toast(d.error,'error');return}
    setDetail(d.route); setPwModal(null); setPw('')
  }

  function onFileChange(e:React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if(!f) return
    const reader = new FileReader()
    reader.onload = ev=>{ setFileContent(ev.target?.result as string||''); setForm(f=>({...f,data:ev.target?.result as string||''})) }
    reader.readAsText(f)
  }

  async function upload(e:React.FormEvent) {
    e.preventDefault()
    if(!token){toast('Login dulu!','error');return}
    let parsed
    try { parsed = JSON.parse(form.data) } catch { toast('Data JSON tidak valid','error'); return }
    const d = await api('/routes','POST',{...form,data:parsed},token)
    if(d.error){toast(d.error,'error');return}
    toast('Route berhasil diupload!','success')
    setUploadOpen(false); setForm({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''}); setFileContent(''); load()
  }

  return <>
    <div className="flex-between mb-4" style={{flexWrap:'wrap',gap:12}}>
      <div><div className="section-title">🗺️ Route Library</div><div className="section-sub">Download &amp; upload rute AWR Script</div></div>
      {user&&<button className="btn btn-primary" onClick={()=>setUploadOpen(true)}>⬆️ Upload Route</button>}
    </div>

    {loading
      ? <div className="routes-grid">{[1,2,3,4,5,6].map(i=><div key={i} className="skel" style={{height:130,borderRadius:14}}/>)}</div>
      : <div className="routes-grid">
          {routes.map((r,i)=>(
            <div key={r.id} className="route-card" style={{animation:`fade-up 0.3s ease ${i*0.04}s both`}} onClick={()=>openRoute(r)}>
              {r.thumbnail_url&&<img src={r.thumbnail_url} alt={r.name} className="route-thumb"/>}
              <div className="flex-between mb-1">
                <div className="route-card-name">{r.name}</div>
                {!r.is_public&&<span className="badge badge-yellow">{r.has_password?'🔐 Private':'🔒 Private'}</span>}
              </div>
              {r.game_name&&<div className="text-xs text-muted mb-2">🎮 {r.game_name}</div>}
              {r.description&&<div className="text-sm text-muted mb-3" style={{lineHeight:1.4,overflow:'hidden',maxHeight:42}}>{r.description}</div>}
              <div className="flex-between mt-2">
                <div className="text-xs text-muted">by {r.uploader?.username||'anonymous'}</div>
                <span className="badge badge-blue">⬇️ {r.download_count}</span>
              </div>
            </div>
          ))}
          {!routes.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text2)'}}>
            <div style={{fontSize:'2.5rem',marginBottom:12}}>🗺️</div>
            Belum ada route. Upload yang pertama!
          </div>}
        </div>}

    {/* Upload Modal */}
    <Modal open={uploadOpen} onClose={()=>setUploadOpen(false)} title="⬆️ Upload Route" size="modal-lg">
      <form onSubmit={upload}>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Nama Route *</label>
            <input className="form-input" placeholder="Nama route..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Nama Game</label>
            <input className="form-input" placeholder="Nama game Roblox..." value={form.game_name} onChange={e=>setForm(f=>({...f,game_name:e.target.value}))}/></div>
        </div>
        <div className="form-group"><label className="form-label">Deskripsi</label>
          <input className="form-input" placeholder="Deskripsi singkat..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Thumbnail (URL gambar/video)</label>
          <input className="form-input" placeholder="https://..." value={form.thumbnail_url} onChange={e=>setForm(f=>({...f,thumbnail_url:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Data Route *</label>
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
            <label className="btn btn-ghost btn-sm cursor-pointer" style={{cursor:'pointer'}}>
              📁 Upload File JSON
              <input type="file" accept=".json,.txt" style={{display:'none'}} onChange={onFileChange}/>
            </label>
            {fileContent&&<span className="text-xs text-success">✅ File dimuat</span>}
          </div>
          <textarea className="form-textarea" rows={5} placeholder='[{"x":0,"y":5,"z":0}, ...]'
            value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} required
            style={{fontFamily:'monospace',fontSize:'0.78rem'}}/></div>
        <div className="form-group"><label className="form-label">Visibilitas</label>
          <select className="form-select" value={form.is_public?'public':'private'} onChange={e=>setForm(f=>({...f,is_public:e.target.value==='public'}))}>
            <option value="public">🌐 Public — semua user bisa lihat</option>
            <option value="private">🔒 Private — perlu password</option>
          </select></div>
        {!form.is_public&&<div className="form-group" style={{animation:'fade-up 0.2s ease'}}>
          <label className="form-label">Password Akses</label>
          <input className="form-input" placeholder="Password untuk akses route ini..." value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>}
        <div className="flex-gap mt-4 gap-2">
          <button className="btn btn-primary flex-1" type="submit">⬆️ Upload</button>
          <button type="button" className="btn btn-ghost" onClick={()=>setUploadOpen(false)}>Batal</button>
        </div>
      </form>
    </Modal>

    {/* Route detail */}
    <Modal open={!!detail} onClose={()=>setDetail(null)} title={`📥 ${detail?.name||''}`} size="modal-lg">
      {detail&&<>
        {detail.game_name&&<div className="text-sm text-muted mb-1">🎮 {detail.game_name}</div>}
        {detail.description&&<div className="text-sm text-muted mb-3">{detail.description}</div>}
        <textarea className="form-textarea" rows={8} readOnly value={JSON.stringify(detail.data,null,2)}
          style={{fontFamily:'monospace',fontSize:'0.74rem'}}/>
        <div className="flex-gap mt-4 gap-2" style={{flexWrap:'wrap'}}>
          <button className="btn btn-primary flex-1" onClick={()=>{copyText(JSON.stringify(detail.data));toast('Data disalin!','success')}}>📋 Copy Data</button>
          <button className="btn btn-ghost" onClick={()=>{
            const blob=new Blob([JSON.stringify(detail.data,null,2)],{type:'application/json'})
            const a=document.createElement('a'); a.href=URL.createObjectURL(blob)
            a.download=`${detail.name.replace(/\s/g,'_')}.json`; a.click()
            toast('File didownload!','success')
          }}>⬇️ Download .json</button>
        </div>
      </>}
    </Modal>

    {/* Password modal for private routes */}
    <Modal open={!!pwModal} onClose={()=>{setPwModal(null);setPw('')}} title={`🔐 ${pwModal?.name||''}`} size="modal-sm">
      <p className="text-sm text-muted mb-4">Route ini private. Masukkan password untuk akses.</p>
      <div className="form-group"><label className="form-label">Password</label>
        <input className="form-input" type="password" placeholder="Password route..." value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&openWithPw()}/></div>
      <div className="flex-gap mt-4 gap-2">
        <button className="btn btn-primary flex-1" onClick={openWithPw}>🔓 Akses</button>
        <button className="btn btn-ghost" onClick={()=>{setPwModal(null);setPw('')}}>Batal</button>
      </div>
    </Modal>
  </>
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────
function LeaderboardPage() {
  const [lb,setLb] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  useEffect(()=>{ api('/leaderboard').then(d=>{if(d.leaderboard)setLb(d.leaderboard);setLoading(false)}) },[])
  const medals=['🥇','🥈','🥉']
  const colors=['#ffd700','#c0c0c0','#cd7f32']
  return <>
    <div className="section-header">
      <div className="section-title">🏆 Leaderboard</div>
      <div className="section-sub">Top executor AWR Script</div>
    </div>
    <div style={{maxWidth:640}}>
      {loading
        ? [1,2,3,4,5].map(i=><div key={i} className="skel mb-3" style={{height:64,borderRadius:14}}/>)
        : lb.map((u,i)=>(
          <div key={i} className="lb-row" style={{
            animation:`fade-up 0.3s ease ${i*0.05}s both`,
            background:i<3?`linear-gradient(135deg,rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.06),transparent)`:undefined,
            borderColor:i<3?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.2)`:undefined
          }}>
            <div className="lb-rank" style={{color:i<3?colors[i]:'var(--text2)'}}>{i<3?medals[i]:`#${u.rank}`}</div>
            <div className="lb-info">
              <div className="lb-name" style={{color:i<3?colors[i]:'var(--text)'}}>{u.username}</div>
              {u.roblox_username&&<div className="lb-roblox">Roblox: {u.roblox_username}</div>}
            </div>
            <div className="lb-count">
              {u.total_executions.toLocaleString()}
              <div className="lb-count-sub">executions</div>
            </div>
          </div>
        ))}
      {!loading&&!lb.length&&<div className="text-center text-muted" style={{padding:60}}>
        <div style={{fontSize:'2.5rem',marginBottom:12}}>🏆</div>
        Belum ada data leaderboard
      </div>}
    </div>
  </>
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [ready,setReady] = useState(false)
  const [token,setToken] = useState<string|null>(null)
  const [user,setUser] = useState<User|null>(null)
  const [page,setPage] = useState('dash')
  const [transitioning,setTransitioning] = useState(false)

  useEffect(()=>{
    // Loading screen
    const t = setTimeout(()=>setReady(true), 2000)

    // Restore session (check both storage)
    const saved = localStorage.getItem('awr_token') || sessionStorage.getItem('awr_token')
    if(saved) {
      api('/user/profile','GET',undefined,saved).then(d=>{
        if(d.user) { setToken(saved); setUser(d.user) }
        else { localStorage.removeItem('awr_token'); sessionStorage.removeItem('awr_token') }
      })
    }
    return ()=>clearTimeout(t)
  },[])

  function changePage(p:string) {
    if(p===page) return
    setTransitioning(true)
    setTimeout(()=>{ setPage(p); setTransitioning(false) }, 250)
  }

  function onAuth(t:string,u:User) {
    setToken(t); setUser(u)
    changePage(u.role==='developer'?'dev':u.role==='reseller'?'reseller':'dash')
  }

  function logout() {
    localStorage.removeItem('awr_token'); sessionStorage.removeItem('awr_token')
    setToken(null); setUser(null); setPage('dash')
    toast('Sampai jumpa!','info')
  }

  const isReseller = user?.role==='reseller'||user?.role==='developer'
  const isDev = user?.role==='developer'

  return <>
    <Head>
      <title>AWR Key System — by Sanzxmzz</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>
    </Head>

    <LoadingScreen done={ready}/>
    <ToastRoot/>
    <Particles/>
    <div className="bg-grid"/>
    <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/><div className="bg-orb bg-orb-3"/>

    {!token ? (
      <AuthPage onAuth={onAuth}/>
    ) : (
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand" onClick={()=>changePage('dash')}>⚡ AWR</div>
          <div className="nav-links">
            <button className={`nav-btn ${page==='dash'?'act':''}`} onClick={()=>changePage('dash')}>🏠 Dashboard</button>
            {isReseller&&<button className={`nav-btn ${page==='reseller'?'act':''}`} onClick={()=>changePage('reseller')}>🏪 Reseller</button>}
            {isDev&&<button className={`nav-btn ${page==='dev'?'act':''}`} onClick={()=>changePage('dev')}>👑 Developer</button>}
            <button className={`nav-btn ${page==='routes'?'act':''}`} onClick={()=>changePage('routes')}>🗺️ Routes</button>
            <button className={`nav-btn ${page==='lb'?'act':''}`} onClick={()=>changePage('lb')}>🏆 LB</button>
            <button className="nav-btn" onClick={logout} style={{color:'var(--danger)'}}>🚪</button>
          </div>
        </nav>

        <div className="page-wrap">
          <div className={`page ${transitioning?'exiting':'entering active'}`}>
            {page==='dash'&&<UserDash token={token} user={user!} onLogout={logout}/>}
            {page==='reseller'&&isReseller&&<ResellerPanel token={token} user={user!}/>}
            {page==='dev'&&isDev&&<DevPanel token={token} user={user!}/>}
            {page==='routes'&&<RoutesPage token={token} user={user}/>}
            {page==='lb'&&<LeaderboardPage/>}
          </div>
        </div>
      </div>
    )}
  </>
}
