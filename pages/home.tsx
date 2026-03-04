import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

// ─── Particles ──────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current; if(!c) return
    const ctx=c.getContext('2d')!
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight
    const pts=Array.from({length:80},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*2+.5,a:Math.random()*.4+.1}))
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw(){
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>W)p.vx*=-1
        if(p.y<0||p.y>H)p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(0,170,255,${p.a})`; ctx.fill()
      })
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,120,255,${.15*(1-d/120)})`;ctx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>
}

// ─── Modal Login/Daftar ─────────────────────────────────────
function AuthModal({mode, onClose, onSuccess}: {mode:'login'|'register'|null, onClose:()=>void, onSuccess:(token:string,user:any)=>void}) {
  const [tab, setTab] = useState<'login'|'register'>(mode||'login')
  const [form, setForm] = useState({username:'',email:'',password:'',rememberMe:true})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [fpStep, setFpStep] = useState<''>('')

  useEffect(()=>{ if(mode) setTab(mode) },[mode])

  async function doLogin(e:any) {
    e.preventDefault(); setLoading(true); setErr('')
    const r = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username,password:form.password,rememberMe:form.rememberMe})})
    const d = await r.json()
    if(d.error){setErr(d.error);setLoading(false);return}
    if(form.rememberMe) localStorage.setItem('awr_token',d.token)
    else sessionStorage.setItem('awr_token',d.token)
    onSuccess(d.token, d.user)
  }

  async function doRegister(e:any) {
    e.preventDefault(); setLoading(true); setErr('')
    const r = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username,email:form.email,password:form.password})})
    const d = await r.json()
    if(d.error){setErr(d.error);setLoading(false);return}
    if(d.token){
      localStorage.setItem('awr_token',d.token)
      onSuccess(d.token, d.user)
    }
  }

  if(!mode) return null
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,4,14,.85)',backdropFilter:'blur(8px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#06101e',border:'1px solid rgba(0,140,255,.3)',borderRadius:18,padding:'32px 28px',width:360,maxWidth:'95vw',boxShadow:'0 0 40px rgba(0,120,255,.2)'}}>
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {(['login','register'] as const).map(t=>(
            <button key={t} onClick={()=>{setTab(t);setErr('')}} style={{flex:1,padding:'10px',border:'none',borderRadius:10,background:tab===t?'linear-gradient(135deg,#0055cc,#00aaff)':'rgba(0,140,255,.08)',color:tab===t?'#fff':'#5a9fd4',fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',transition:'all .2s'}}>
              {t==='login'?'Login':'Daftar'}
            </button>
          ))}
        </div>
        {err&&<div style={{background:'rgba(220,50,50,.12)',border:'1px solid rgba(220,50,50,.3)',borderRadius:8,padding:'10px 14px',color:'#f87171',fontSize:'.85rem',marginBottom:16}}>{err}</div>}
        <form onSubmit={tab==='login'?doLogin:doRegister}>
          <div style={{marginBottom:12}}>
            <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="Username" required
              style={{width:'100%',background:'rgba(0,140,255,.06)',border:'1px solid rgba(0,140,255,.2)',borderRadius:10,color:'#cce4f8',padding:'11px 14px',outline:'none',boxSizing:'border-box',fontFamily:'Outfit,sans-serif'}}/>
          </div>
          {tab==='register'&&<div style={{marginBottom:12}}>
            <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" required
              style={{width:'100%',background:'rgba(0,140,255,.06)',border:'1px solid rgba(0,140,255,.2)',borderRadius:10,color:'#cce4f8',padding:'11px 14px',outline:'none',boxSizing:'border-box',fontFamily:'Outfit,sans-serif'}}/>
          </div>}
          <div style={{marginBottom:16,position:'relative'}}>
            <input type={showPw?'text':'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password" required
              style={{width:'100%',background:'rgba(0,140,255,.06)',border:'1px solid rgba(0,140,255,.2)',borderRadius:10,color:'#cce4f8',padding:'11px 42px 11px 14px',outline:'none',boxSizing:'border-box',fontFamily:'Outfit,sans-serif'}}/>
            <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a9fd4',cursor:'pointer',fontSize:'1rem'}}>
              {showPw?'🙈':'👁'}
            </button>
          </div>
          {tab==='login'&&<label style={{display:'flex',alignItems:'center',gap:8,color:'#5a9fd4',fontSize:'.82rem',marginBottom:16,cursor:'pointer'}}>
            <input type="checkbox" checked={form.rememberMe} onChange={e=>setForm(f=>({...f,rememberMe:e.target.checked}))} style={{accentColor:'#00aaff'}}/> Ingat saya 30 hari
          </label>}
          <button type="submit" disabled={loading}
            style={{width:'100%',background:loading?'#0e2040':'linear-gradient(135deg,#0055cc,#00aaff)',border:'none',borderRadius:10,color:'#fff',padding:'13px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.05rem',cursor:loading?'not-allowed':'pointer',transition:'all .2s'}}>
            {loading?'Loading...':(tab==='login'?'Login':'Daftar')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Harga Key ──────────────────────────────────────────────
const PRICES = [
  { dur:'1 Hari',   price:'Rp1.000',   hot:false },
  { dur:'2 Hari',   price:'Rp3.000',   hot:false },
  { dur:'3 Hari',   price:'Rp5.000',   hot:false },
  { dur:'5 Hari',   price:'Rp8.000',   hot:false },
  { dur:'7 Hari',   price:'Rp12.000',  hot:true  },
  { dur:'14 Hari',  price:'Rp20.000',  hot:false },
  { dur:'30 Hari',  price:'Rp30.000',  hot:true  },
  { dur:'60 Hari',  price:'Rp50.000',  hot:false },
  { dur:'Lifetime', price:'Rp50.000',  hot:true  },
]

// ─── Get Script Modal ────────────────────────────────────────
function ScriptModal({onClose}:{onClose:()=>void}) {
  const [step, setStep] = useState<'link'|'wait'|'done'>('link')
  const [secs, setSecs] = useState(12)
  const SCRIPT = `loadstring(game:HttpGet("https://marksanzxmzz.vercel.app/api/script"))() `

  function goWait() {
    window.open('https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/', '_blank')
    setStep('wait')
    let t = 12
    const iv = setInterval(()=>{ t--; setSecs(t); if(t<=0){ clearInterval(iv); setStep('done') } }, 1000)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,4,14,.9)',backdropFilter:'blur(8px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#06101e',border:'1px solid rgba(0,140,255,.3)',borderRadius:18,padding:'32px 28px',width:420,maxWidth:'95vw',boxShadow:'0 0 40px rgba(0,120,255,.2)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:'1.6rem',fontWeight:800,background:'linear-gradient(135deg,#00aaff,#00ffcc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontFamily:'Orbitron,sans-serif'}}>⚡ GET SCRIPT</div>
          <div style={{color:'#5a9fd4',fontSize:'.85rem',marginTop:4}}>AWR Auto Walk Recorder</div>
        </div>
        {step==='link'&&<>
          <div style={{background:'rgba(0,140,255,.06)',border:'1px solid rgba(0,140,255,.15)',borderRadius:12,padding:20,marginBottom:20,color:'#8ab8d8',fontSize:'.88rem',lineHeight:1.6}}>
            Untuk mendapatkan script, kamu perlu melewati halaman link iklan terlebih dahulu. Ini membantu mendukung developer AWR Script.
          </div>
          <button onClick={goWait} style={{width:'100%',background:'linear-gradient(135deg,#0055cc,#00aaff)',border:'none',borderRadius:10,color:'#fff',padding:'13px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.05rem',cursor:'pointer'}}>
            🚀 Buka Link & Lanjutkan
          </button>
        </>}
        {step==='wait'&&<>
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:'3.5rem',fontWeight:900,color:'#00aaff',fontFamily:'Orbitron,sans-serif',marginBottom:8}}>{secs}</div>
            <div style={{color:'#5a9fd4',fontSize:'.9rem'}}>Mohon tunggu... script akan muncul otomatis</div>
            <div style={{width:'100%',height:6,background:'rgba(0,140,255,.15)',borderRadius:99,marginTop:16,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#00aaff,#00ffcc)',width:`${((12-secs)/12)*100}%`,transition:'width 1s linear'}}/>
            </div>
          </div>
        </>}
        {step==='done'&&<>
          <div style={{marginBottom:12,color:'#8ab8d8',fontSize:'.82rem'}}>Copy script berikut dan paste di executor kamu:</div>
          <div style={{background:'#020810',border:'1px solid rgba(0,140,255,.25)',borderRadius:10,padding:16,fontFamily:'monospace',fontSize:'.8rem',color:'#00d4ff',wordBreak:'break-all',marginBottom:16,position:'relative'}}>
            {SCRIPT}
            <button onClick={()=>navigator.clipboard.writeText(SCRIPT)} style={{position:'absolute',top:8,right:8,background:'rgba(0,140,255,.2)',border:'1px solid rgba(0,140,255,.3)',borderRadius:6,color:'#00aaff',padding:'3px 8px',cursor:'pointer',fontSize:'.7rem'}}>Copy</button>
          </div>
          <button onClick={onClose} style={{width:'100%',background:'rgba(0,140,255,.1)',border:'1px solid rgba(0,140,255,.25)',borderRadius:10,color:'#00aaff',padding:'11px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,cursor:'pointer'}}>Tutup</button>
        </>}
      </div>
    </div>
  )
}

// ─── MAIN LANDING PAGE ───────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'login'|'register'|null>(null)
  const [showScript, setShowScript] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(()=>{
    const token = localStorage.getItem('awr_token') || sessionStorage.getItem('awr_token')
    if(token) setLoggedIn(true)
  },[])

  function handleAuthSuccess(token:string, user:any) {
    setAuthMode(null)
    router.push('/')
  }

  return (
    <>
      <Head>
        <title>AWR Key System — Auto Walk Recorder</title>
        <meta name="description" content="AWR Script - Auto Walk Recorder untuk Roblox. Beli key, dapatkan script, mulai farming otomatis!"/>
      </Head>
      <div style={{minHeight:'100vh',background:'#020810',color:'#cce4f8',fontFamily:'Outfit,sans-serif',position:'relative',overflowX:'hidden'}}>
        <Particles/>

        {/* NAVBAR */}
        <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 32px',background:'rgba(2,8,16,.8)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,140,255,.1)'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontWeight:800,fontSize:'1.2rem',background:'linear-gradient(135deg,#00aaff,#00ffcc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>⚡ AWR</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <a href="/feedback" style={{color:'#5a9fd4',textDecoration:'none',padding:'7px 13px',border:'1px solid rgba(0,140,255,.18)',borderRadius:8,fontSize:'.82rem',fontFamily:'Rajdhani,sans-serif',fontWeight:700,transition:'all .2s'}}
              onMouseEnter={e=>{(e.currentTarget as any).style.borderColor='rgba(0,140,255,.45)'}}
              onMouseLeave={e=>{(e.currentTarget as any).style.borderColor='rgba(0,140,255,.18)'}}>
              💬 Feedback
            </a>
            {loggedIn
              ? <button onClick={()=>router.push('/')} style={{background:'linear-gradient(135deg,#0055cc,#00aaff)',border:'none',borderRadius:8,color:'#fff',padding:'8px 18px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>Dashboard →</button>
              : <>
                  <button onClick={()=>setAuthMode('login')} style={{background:'rgba(0,140,255,.1)',border:'1px solid rgba(0,140,255,.25)',borderRadius:8,color:'#00aaff',padding:'8px 16px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.9rem'}}>Login</button>
                  <button onClick={()=>setAuthMode('register')} style={{background:'linear-gradient(135deg,#0055cc,#00aaff)',border:'none',borderRadius:8,color:'#fff',padding:'8px 16px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.9rem'}}>Daftar</button>
                </>
            }
          </div>
        </nav>

        <div style={{position:'relative',zIndex:1,paddingTop:80}}>

          {/* HERO */}
          <section style={{textAlign:'center',padding:'80px 24px 60px'}}>
            <div style={{display:'inline-block',background:'rgba(0,140,255,.1)',border:'1px solid rgba(0,140,255,.25)',borderRadius:99,padding:'6px 18px',color:'#00aaff',fontSize:'.8rem',fontWeight:600,marginBottom:20,letterSpacing:1}}>🎮 ROBLOX SCRIPT</div>
            <h1 style={{fontSize:'clamp(2.2rem,6vw,4rem)',fontWeight:900,fontFamily:'Orbitron,sans-serif',background:'linear-gradient(135deg,#00aaff,#00ffcc,#fff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:16,lineHeight:1.2}}>
              AUTO WALK<br/>RECORDER
            </h1>
            <p style={{color:'#5a9fd4',fontSize:'clamp(.9rem,2vw,1.1rem)',maxWidth:500,margin:'0 auto 36px',lineHeight:1.7}}>
              Script Roblox terbaik untuk merekam dan memutar ulang rute berjalan secara otomatis. Farming jadi mudah!
            </p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>setShowScript(true)}
                style={{background:'linear-gradient(135deg,#0055cc,#00aaff)',border:'none',borderRadius:12,color:'#fff',padding:'14px 32px',fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.1rem',cursor:'pointer',boxShadow:'0 0 25px rgba(0,120,255,.4)',transition:'transform .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.05)')} onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                ⚡ GET SCRIPT
              </button>
              <button onClick={()=>setAuthMode('register')}
                style={{background:'rgba(0,140,255,.08)',border:'1px solid rgba(0,140,255,.3)',borderRadius:12,color:'#00aaff',padding:'14px 32px',fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.1rem',cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,140,255,.15)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,140,255,.08)'}}>
                Daftar Gratis
              </button>
            </div>
          </section>

          {/* FITUR */}
          <section style={{padding:'20px 24px 60px',maxWidth:1000,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:40}}>
              <h2 style={{fontSize:'1.8rem',fontWeight:800,fontFamily:'Rajdhani,sans-serif',color:'#00aaff',marginBottom:8}}>Fitur Unggulan</h2>
              <div style={{color:'#3a6a8a',fontSize:'.85rem'}}>Kenapa AWR Script adalah pilihan terbaik?</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
              {[
                {icon:'🎯',title:'Record & Replay',desc:'Rekam rute berjalan kamu lalu putar ulang otomatis'},
                {icon:'⚡',title:'Multi Executor',desc:'Support Synapse X, Fluxus, Delta, Arceus & semua executor'},
                {icon:'🔒',title:'Key System',desc:'Sistem key aman dengan verifikasi HWID'},
                {icon:'🗺️',title:'Route Library',desc:'Simpan & bagikan rute dengan komunitas'},
                {icon:'📊',title:'Leaderboard',desc:'Bersaing dengan player lain di leaderboard'},
                {icon:'🆓',title:'Key Gratis',desc:'Bisa claim key gratis 24 jam setiap hari'},
                {icon:'💬',title:'Feedback Board',desc:'Kirim saran & bug langsung dari game, tampil di website'},
              ].map(f=>(
                <div key={f.title} style={{background:'rgba(0,140,255,.05)',border:'1px solid rgba(0,140,255,.12)',borderRadius:14,padding:'20px 18px',textAlign:'center',transition:'border-color .2s'}}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(0,140,255,.35)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(0,140,255,.12)')}>
                  <div style={{fontSize:'2rem',marginBottom:10}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#cce4f8',marginBottom:6,fontFamily:'Rajdhani,sans-serif',fontSize:'1.05rem'}}>{f.title}</div>
                  <div style={{color:'#3a6a8a',fontSize:'.82rem',lineHeight:1.5}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* HARGA */}
          <section style={{padding:'20px 24px 80px',maxWidth:1000,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:40}}>
              <h2 style={{fontSize:'1.8rem',fontWeight:800,fontFamily:'Rajdhani,sans-serif',color:'#f5c542',marginBottom:8}}>💎 Harga Key VIP</h2>
              <div style={{color:'#3a6a8a',fontSize:'.85rem'}}>Harga terjangkau, akses penuh tanpa batas</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
              {PRICES.map(p=>(
                <div key={p.dur} style={{position:'relative',background:p.hot?'rgba(245,197,66,.08)':'rgba(0,140,255,.04)',border:`1.5px solid ${p.hot?'rgba(245,197,66,.4)':'rgba(0,140,255,.15)'}`,borderRadius:14,padding:'20px 14px',textAlign:'center',transition:'transform .15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-4px)')} onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                  {p.hot&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#f5c542,#ff8c00)',borderRadius:99,padding:'2px 12px',fontSize:'.65rem',fontWeight:800,color:'#000',whiteSpace:'nowrap'}}>🔥 POPULER</div>}
                  <div style={{fontSize:'1.05rem',fontWeight:700,color:p.hot?'#f5c542':'#8ab8d8',fontFamily:'Rajdhani,sans-serif',marginBottom:8}}>{p.dur}</div>
                  <div style={{fontSize:'1.4rem',fontWeight:900,color:p.hot?'#ffd700':'#cce4f8',fontFamily:'Orbitron,sans-serif'}}>{p.price}</div>
                  {p.dur==='Lifetime'&&<div style={{color:'#5a9fd4',fontSize:'.7rem',marginTop:4}}>Sekali bayar selamanya</div>}
                </div>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:28,color:'#3a6a8a',fontSize:'.85rem'}}>
              Untuk pembelian key, hubungi{' '}
              <a href="https://t.me/sanzxmzz" target="_blank" style={{color:'#00aaff',textDecoration:'none'}}>@sanzxmzz di Telegram</a>
              {' '}atau{' '}
              <a href="https://wa.me/6281234567890" target="_blank" style={{color:'#00aaff',textDecoration:'none'}}>WhatsApp</a>
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{borderTop:'1px solid rgba(0,140,255,.1)',padding:'24px',textAlign:'center',color:'#3a6a8a',fontSize:'.8rem'}}>
            © 2024 Sanzxmzz · AWR Key System · All Rights Reserved
            <div style={{marginTop:8,display:'flex',gap:16,justifyContent:'center'}}>
              <a href="https://t.me/sanzxmzz" target="_blank" style={{color:'#00aaff',textDecoration:'none'}}>Telegram</a>
              <a href="https://tiktok.com/@sanzxmzz" target="_blank" style={{color:'#00aaff',textDecoration:'none'}}>TikTok</a>
              <a href="/feedback" style={{color:'#c084fc',textDecoration:'none'}}>💬 Feedback</a>
              <span style={{cursor:'pointer',color:'#00aaff'}} onClick={()=>setAuthMode('login')}>Login</span>
              <span style={{cursor:'pointer',color:'#00aaff'}} onClick={()=>setAuthMode('register')}>Daftar</span>
            </div>
          </footer>
        </div>
      </div>

      {authMode&&<AuthModal mode={authMode} onClose={()=>setAuthMode(null)} onSuccess={handleAuthSuccess}/>}
      {showScript&&<ScriptModal onClose={()=>setShowScript(false)}/>}
    </>
  )
}
