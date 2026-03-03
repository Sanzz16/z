import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

type User = { id:string;username:string;email:string;role:string;roblox_username?:string;roblox_id?:number;avatar_url?:string;background_url?:string;background_type?:string;total_executions?:number;created_at?:string;is_banned?:boolean }
type KeyData = { id:string;key_value:string;expires_at:string|null;hwid_max:number;duration_type:string;times_used:number;is_active:boolean;is_free_key?:boolean }
type Notif = { id:string;title:string;message:string;type:string;is_read:boolean;created_at:string }

const DUR:Record<string,string> = {'24h':'1 Hari','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}

async function api(path:string,method='GET',body?:any,token?:string|null){
  try{
    const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined})
    return r.json()
  }catch{return{error:'Network error'}}
}

function fmtDate(d:string|null){if(!d)return'∞ Lifetime';return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function timeLeft(d:string|null){if(!d)return'∞';const diff=new Date(d).getTime()-Date.now();if(diff<=0)return'Expired';const days=Math.floor(diff/86400000),hrs=Math.floor((diff%86400000)/3600000);return days>0?`${days}h ${hrs}j`:`${hrs}j ${Math.floor((diff%3600000)/60000)}m`}
function copyText(t:string){navigator.clipboard.writeText(t).catch(()=>{})}
function isExpired(d:string|null){if(!d)return false;return new Date(d)<new Date()}

let _toast:(m:string,t?:string,ttl?:string)=>void=()=>{}
function toast(m:string,t='info',ttl=''){_toast(m,t,ttl)}

function ToastRoot(){
  const [items,setItems]=useState<any[]>([])
  const id=useRef(0)
  useEffect(()=>{
    _toast=(msg,type='info',title='')=>{
      const n=++id.current
      const tl=title||(type==='error'?'❌ Error':type==='success'?'✅ Sukses':type==='warn'?'⚠️ Peringatan':'ℹ️ Info')
      setItems(p=>[...p,{id:n,msg,type,title:tl}])
      setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),3800)
    }
  },[])
  return <div style={{position:'fixed',bottom:24,right:24,zIndex:9998,display:'flex',flexDirection:'column-reverse',gap:10,pointerEvents:'none'}}>
    {items.map(t=>(
      <div key={t.id} style={{background:'#0b1a2e',border:`1px solid ${t.type==='error'?'rgba(255,71,87,.4)':t.type==='success'?'rgba(0,230,118,.3)':t.type==='warn'?'rgba(255,179,0,.3)':'rgba(0,170,255,.2)'}`,borderLeft:`3px solid ${t.type==='error'?'#ff4757':t.type==='success'?'#00e676':t.type==='warn'?'#ffb300':'#0af'}`,borderRadius:14,padding:'14px 18px',minWidth:300,maxWidth:400,display:'flex',alignItems:'flex-start',gap:12,boxShadow:'0 12px 48px rgba(0,0,0,.6)',animation:'toastIn .4s cubic-bezier(.34,1.56,.64,1)',pointerEvents:'all'}}>
        <span style={{fontSize:'1.2rem',lineHeight:1,flexShrink:0}}>{t.type==='error'?'❌':t.type==='success'?'✅':t.type==='warn'?'⚠️':'ℹ️'}</span>
        <div><div style={{fontWeight:700,fontSize:'0.88rem',color:'#cce4f8',marginBottom:3}}>{t.title}</div><div style={{fontSize:'0.8rem',color:'#5a8ab0'}}>{t.msg}</div></div>
      </div>
    ))}
  </div>
}

function Modal({open,onClose,title,children,size=''}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;size?:string}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};if(open)window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[open])
  if(!open)return null
  const wide=size==='lg'
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',animation:'fadeIn .2s ease'}}>
    <div style={{background:'#0b1a2e',border:'1px solid #1a4a80',borderRadius:20,padding:28,width:'90%',maxWidth:wide?680:500,maxHeight:'90vh',overflowY:'auto',animation:'modalIn .35s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 25px 100px rgba(0,0,0,.9),0 0 60px rgba(0,102,204,.15)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.25rem',fontWeight:700,color:'#00d4ff'}}>{title}</div>
        <button onClick={onClose} style={{background:'#0e2040',border:'1px solid #162f50',color:'#5a8ab0',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:'0.9rem'}}>✕</button>
      </div>
      {children}
    </div>
  </div>
}

// ─── PARTICLES ───────────────────────────────────────────────
function Particles(){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current;if(!c)return
    const ctx=c.getContext('2d')!
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight
    const pts=Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.5+.5,a:Math.random()*.5+.2}))
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw(){
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(0,170,255,${p.a*.4})`;ctx.fill()})
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,102,204,${(1-d/120)*.12})`;ctx.lineWidth=.5;ctx.stroke()}}
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:.5}}/>
}

// ─── LOADING ─────────────────────────────────────────────────
function LoadingScreen({done}:{done:boolean}){
  return <div style={{position:'fixed',inset:0,background:'#020810',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'opacity .7s ease,visibility .7s ease',...(done?{opacity:0,visibility:'hidden',pointerEvents:'none'}:{})}}>
    <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'3.5rem',fontWeight:700,color:'#00d4ff',letterSpacing:6,textShadow:'0 0 40px rgba(0,212,255,.6)',animation:'pulse 1.6s ease-in-out infinite'}}>⚡ AWR</div>
    <div style={{fontSize:'0.78rem',letterSpacing:4,textTransform:'uppercase',color:'#5a8ab0',marginTop:6}}>Key System · by Sanzxmzz</div>
    <div style={{width:260,height:2,background:'#071224',borderRadius:99,marginTop:28,overflow:'hidden'}}>
      <div style={{height:'100%',background:'linear-gradient(90deg,#0066cc,#00d4ff,#40e0ff)',borderRadius:99,animation:'lsFill 1.8s cubic-bezier(.4,0,.2,1) forwards',boxShadow:'0 0 12px #00d4ff'}}/>
    </div>
    <div style={{display:'flex',gap:8,marginTop:18}}>
      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#0066cc',animation:`dotBounce 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
    </div>
  </div>
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────
function ForgotModal({open,onClose}:{open:boolean;onClose:()=>void}){
  const [step,setStep]=useState<'email'|'code'>('email')
  const [email,setEmail]=useState('')
  const [username,setUsername]=useState('')
  const [code,setCode]=useState('')
  const [newPw,setNewPw]=useState('')
  const [showPw,setShowPw]=useState(false)
  const [loading,setLoading]=useState(false)

  async function sendCode(e:React.FormEvent){e.preventDefault();setLoading(true);const d=await api('/auth/forgot-password','POST',{email});setLoading(false);if(d.error){toast(d.error,'error');return};setUsername(d.username||'');setStep('code');toast('Kode dikirim ke email!','success')}
  async function resetPw(e:React.FormEvent){e.preventDefault();setLoading(true);const d=await api('/auth/reset-password','POST',{email,code,newPassword:newPw});setLoading(false);if(d.error){toast(d.error,'error');return};toast('Password direset!','success');onClose();setStep('email');setEmail('');setCode('');setNewPw('')}

  return <Modal open={open} onClose={onClose} title="🔑 Lupa Password">
    {step==='email'?<form onSubmit={sendCode}>
      <p style={{fontSize:'0.86rem',color:'#5a8ab0',marginBottom:16}}>Masukkan email akun kamu. Kode verifikasi akan dikirim via email.</p>
      <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Email</label>
        <input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',fontSize:'0.9rem',outline:'none',boxSizing:'border-box'}} type="email" placeholder="Email kamu..." value={email} onChange={e=>setEmail(e.target.value)} required/></div>
      <button style={{width:'100%',background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',opacity:loading?.5:1}} disabled={loading}>{loading?'⏳ Mengirim...':'📧 Kirim Kode'}</button>
    </form>:<form onSubmit={resetPw}>
      <div style={{background:'rgba(0,0,0,.4)',border:'1px solid #1a4a80',borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{fontSize:'0.72rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>KODE VERIFIKASI</div>
        <div style={{fontSize:'0.85rem',color:'#5a8ab0',marginBottom:14}}>Nama Akun: <strong style={{color:'#00d4ff'}}>{username||email}</strong></div>
        <input style={{width:'100%',background:'#020810',border:'1px solid #0066cc',borderRadius:10,color:'#00d4ff',padding:'12px',fontFamily:'Rajdhani,monospace',fontSize:'2rem',fontWeight:700,letterSpacing:8,textAlign:'center',outline:'none',boxSizing:'border-box'}} placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} required/>
        <div style={{textAlign:'center',marginTop:8,fontSize:'0.7rem',color:'#5a8ab0'}}>⏰ Berlaku 20 menit · ©Sanzxmzz</div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Password Baru</label>
        <div style={{position:'relative'}}>
          <input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 44px 10px 14px',fontFamily:'Exo 2,sans-serif',fontSize:'0.9rem',outline:'none',boxSizing:'border-box'}} type={showPw?'text':'password'} placeholder="Password baru min 6 karakter..." value={newPw} onChange={e=>setNewPw(e.target.value)} required minLength={6}/>
          <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button>
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',opacity:loading?.5:1}} disabled={loading}>{loading?'⏳...':'🔓 Reset Password'}</button>
        <button type="button" style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}} onClick={()=>setStep('email')}>← Kembali</button>
      </div>
    </form>}
  </Modal>
}

// ─── GETKEY MODAL (timer-based like SubUnlock) ───────────────
function GetKeyModal({open,onClose,token,onKeyReceived}:{open:boolean;onClose:()=>void;token:string;onKeyReceived:()=>void}){
  const [steps,setSteps]=useState<any[]>([])
  const [currentStep,setCurrentStep]=useState(0)
  const [completedSteps,setCompletedSteps]=useState<string[]>([])
  const [timer,setTimer]=useState(0)
  const [timerActive,setTimerActive]=useState(false)
  const [key,setKey]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const timerRef=useRef<any>(null)

  useEffect(()=>{
    if(open){
      api('/getkey-verify').then(d=>{if(d.steps)setSteps(d.steps)})
      setCurrentStep(0);setCompletedSteps([]);setKey(null);setTimer(0);setTimerActive(false)
    }
  },[open])

  useEffect(()=>{
    if(timerActive&&timer>0){
      timerRef.current=setTimeout(()=>setTimer(t=>t-1),1000)
    }else if(timerActive&&timer===0){
      setTimerActive(false)
      const step=steps[currentStep]
      if(step&&!completedSteps.includes(step.id)){
        setCompletedSteps(p=>[...p,step.id])
        if(currentStep<steps.length-1)setCurrentStep(p=>p+1)
      }
    }
    return()=>clearTimeout(timerRef.current)
  },[timer,timerActive])

  function openStep(step:any){
    window.open(step.url,'_blank')
    setTimer(step.duration_seconds)
    setTimerActive(true)
  }

  async function claim(){
    setLoading(true)
    const d=await api('/getkey-verify','POST',{completed_steps:completedSteps},token)
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    setKey(d.key);onKeyReceived();toast('🎉 Free key 24 jam didapat!','success','Key Gratis!')
  }

  function close(){onClose();setKey(null);setCompletedSteps([]);setCurrentStep(0);setTimerActive(false);clearTimeout(timerRef.current)}

  const allDone=steps.length>0&&steps.every(s=>completedSteps.includes(s.id))

  return <Modal open={open} onClose={close} title="🎁 Get Free Key 24 Jam">
    {key?<>
      <div style={{textAlign:'center',padding:'12px 0 20px'}}>
        <div style={{fontSize:'2.5rem',marginBottom:10}}>🎉</div>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.3rem',fontWeight:700,color:'#00e676',marginBottom:16}}>Key Berhasil Didapat!</div>
        <div onClick={()=>{copyText(key.key_value);toast('Key disalin!','success')}} style={{background:'#020810',border:'1px solid #0066cc',borderRadius:10,padding:'14px',fontFamily:'Rajdhani,monospace',fontSize:'1rem',color:'#00d4ff',letterSpacing:2,cursor:'pointer',marginBottom:10,position:'relative'}}>
          {key.key_value}
          <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.65rem',color:'#5a8ab0'}}>klik copy</span>
        </div>
        <div style={{fontSize:'0.82rem',color:'#5a8ab0'}}>Berlaku: {fmtDate(key.expires_at)}</div>
      </div>
      <button onClick={close} style={{width:'100%',background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'10px',fontFamily:'Exo 2,sans-serif',fontWeight:600,cursor:'pointer'}}>Tutup</button>
    </>:<>
      {/* Progress bar */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'#5a8ab0',marginBottom:6}}>
          <span>Progress</span><span>{completedSteps.length}/{steps.length} selesai</span>
        </div>
        <div style={{height:6,background:'#071224',borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#0066cc,#00d4ff)',borderRadius:99,width:`${steps.length?completedSteps.length/steps.length*100:0}%`,transition:'width .4s ease'}}/>
        </div>
      </div>

      {/* Steps */}
      {steps.map((step,i)=>{
        const done=completedSteps.includes(step.id)
        const isCurrent=i===currentStep&&!done
        const isLocked=i>currentStep&&!done

        return <div key={step.id} style={{background:done?'rgba(0,230,118,.05)':isCurrent?'rgba(0,102,204,.08)':'rgba(4,13,26,.8)',border:`1px solid ${done?'rgba(0,230,118,.25)':isCurrent?'rgba(0,170,255,.25)':'rgba(22,47,80,.5)'}`,borderRadius:12,padding:'14px 16px',marginBottom:10,transition:'all .3s'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:done?'rgba(0,230,118,.2)':isCurrent?'rgba(0,102,204,.3)':'rgba(22,47,80,.5)',border:`2px solid ${done?'#00e676':isCurrent?'#0af':'#162f50'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.9rem'}}>
              {done?'✅':isLocked?'🔒':`${i+1}`}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'0.9rem',color:done?'#4ade80':isCurrent?'#cce4f8':'#5a8ab0'}}>{step.name}</div>
              <div style={{fontSize:'0.72rem',color:'#5a8ab0',marginTop:2}}>⏱️ Tunggu {step.duration_seconds} detik</div>
            </div>
            {!done&&!isLocked&&(
              isCurrent&&timerActive
                ?<div style={{minWidth:52,textAlign:'center'}}>
                  <div style={{fontFamily:'Rajdhani',fontSize:'1.4rem',fontWeight:700,color:'#00d4ff',lineHeight:1}}>{timer}</div>
                  <div style={{fontSize:'0.65rem',color:'#5a8ab0'}}>detik</div>
                </div>
                :<button onClick={()=>openStep(step)} disabled={isLocked||timerActive} style={{background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',opacity:isLocked||timerActive?.5:1}}>
                  Buka →
                </button>
            )}
            {done&&<span style={{color:'#00e676',fontSize:'0.85rem',fontWeight:700}}>✓ Done</span>}
          </div>
          {isCurrent&&timerActive&&<div style={{marginTop:10,height:3,background:'#071224',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,#0066cc,#00d4ff)',borderRadius:99,width:`${(1-timer/step.duration_seconds)*100}%`,transition:'width 1s linear'}}/>
          </div>}
        </div>
      })}

      {!steps.length&&<div style={{textAlign:'center',color:'#5a8ab0',padding:'20px 0'}}>⏳ Loading steps...</div>}

      <div style={{marginTop:16,display:'flex',gap:10}}>
        <button onClick={claim} disabled={!allDone||loading} style={{flex:1,background:allDone?'linear-gradient(135deg,#16a34a,#22c55e)':'#0e2040',border:allDone?'none':'1px solid #162f50',color:allDone?'#fff':'#5a8ab0',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:allDone?'pointer':'not-allowed',transition:'all .3s',fontSize:'0.9rem'}}>
          {loading?'⏳ Memproses...':allDone?'🎁 Ambil Key Sekarang!':'⏳ Selesaikan Semua Step'}
        </button>
        <button onClick={close} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'12px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button>
      </div>
    </>}
  </Modal>
}

// ─── AUTH ────────────────────────────────────────────────────
function AuthPage({onAuth}:{onAuth:(t:string,u:User)=>void}){
  const [mode,setMode]=useState<'login'|'register'>('login')
  const [form,setForm]=useState({username:'',email:'',password:''})
  const [remember,setRemember]=useState(false)
  const [showPw,setShowPw]=useState(false)
  const [loading,setLoading]=useState(false)
  const [showForgot,setShowForgot]=useState(false)

  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true)
    const path=mode==='login'?'/auth/login':'/auth/register'
    const body=mode==='login'?{username:form.username,password:form.password,rememberMe:remember}:form
    const d=await api(path,'POST',body)
    setLoading(false)
    if(d.error){toast(d.error,'error');return}
    if(remember)localStorage.setItem('awr_token',d.token)
    else sessionStorage.setItem('awr_token',d.token)
    onAuth(d.token,d.user)
    toast('Selamat datang, '+d.user.username+'!','success')
  }

  const I={width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',fontSize:'0.9rem',outline:'none',boxSizing:'border-box' as const}

  return <><ForgotModal open={showForgot} onClose={()=>setShowForgot(false)}/>
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:420,animation:'scaleIn .45s cubic-bezier(.34,1.56,.64,1)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'3.5rem',fontWeight:700,color:'#00d4ff',letterSpacing:5,textShadow:'0 0 40px rgba(0,212,255,.6)'}}>⚡ AWR</div>
          <div style={{fontSize:'0.78rem',letterSpacing:4,color:'#5a8ab0',marginTop:4,textTransform:'uppercase'}}>Key System v3 · by Sanzxmzz</div>
        </div>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{display:'flex',gap:3,background:'#04101a',border:'1px solid #162f50',borderRadius:10,padding:4,marginBottom:20}}>
            {(['login','register'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:'8px 14px',borderRadius:8,border:mode===m?'1px solid #1a4a80':'none',background:mode===m?'#0e2040':'transparent',color:mode===m?'#00d4ff':'#5a8ab0',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem',transition:'all .2s'}}>
                {m==='login'?'🔑 Login':'✨ Daftar'}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Username</label><input style={I} placeholder="Username kamu" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required/></div>
            {mode==='register'&&<div style={{marginBottom:14,animation:'fadeUp .25s ease'}}><label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Email</label><input style={I} type="email" placeholder="Email kamu" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>}
            <div style={{marginBottom:mode==='login'?8:16}}><label style={{display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Password</label>
              <div style={{position:'relative'}}><input style={{...I,paddingRight:44}} type={showPw?'text':'password'} placeholder="Password kamu" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button>
              </div></div>
            {mode==='login'&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:'0.83rem',color:'#5a8ab0'}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:'#0066cc'}}/>Ingat saya 30 hari</label>
              <span onClick={()=>setShowForgot(true)} style={{fontSize:'0.83rem',color:'#00d4ff',cursor:'pointer'}}>Lupa password?</span>
            </div>}
            <button style={{width:'100%',background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',opacity:loading?.5:1,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}} disabled={loading}>
              {loading?<><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Loading...</>:mode==='login'?'🔑 Masuk':'✨ Daftar'}
            </button>
          </form>
          {mode==='login'&&<div style={{textAlign:'center',marginTop:14,fontSize:'0.83rem',color:'#5a8ab0'}}>Belum punya akun? <span onClick={()=>setMode('register')} style={{color:'#00d4ff',cursor:'pointer'}}>Daftar →</span></div>}
        </div>
      </div>
    </div>
  </>
}

// ─── USER DASHBOARD ──────────────────────────────────────────
function UserDash({token,user,onLogout}:{token:string;user:User;onLogout:()=>void}){
  const [data,setData]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState('dash')
  const [editOpen,setEditOpen]=useState(false)
  const [ef,setEf]=useState({username:'',roblox_username:'',avatar_url:'',background_url:'',background_type:'image',password:''})
  const [showPw,setShowPw]=useState(false)
  const [getkeyOpen,setGetkeyOpen]=useState(false)

  const load=useCallback(async()=>{
    setLoading(true)
    const d=await api('/user/profile','GET',undefined,token)
    if(d.user){setData(d);setEf({username:d.user.username,roblox_username:d.user.roblox_username||'',avatar_url:d.user.avatar_url||'',background_url:d.user.background_url||'',background_type:d.user.background_type||'image',password:''})}
    setLoading(false)
  },[token])

  useEffect(()=>{load()},[load])

  async function saveProfile(){
    const b:any={}
    if(ef.username!==data.user.username)b.username=ef.username
    if(ef.roblox_username!==(data.user.roblox_username||''))b.roblox_username=ef.roblox_username
    if(ef.avatar_url!==(data.user.avatar_url||''))b.avatar_url=ef.avatar_url
    if(ef.background_url!==(data.user.background_url||''))b.background_url=ef.background_url
    if(ef.background_type!==(data.user.background_type||'image'))b.background_type=ef.background_type
    if(ef.password)b.password=ef.password
    const r=await api('/user/profile','PATCH',b,token)
    if(r.error){toast(r.error,'error');return}
    toast('Profil diupdate!','success');setEditOpen(false);load()
  }

  if(loading)return <div style={{height:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
    <div style={{width:36,height:36,border:'2px solid rgba(255,255,255,.1)',borderTopColor:'#00d4ff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
    <div style={{fontSize:'0.85rem',color:'#5a8ab0'}}>Loading...</div>
  </div>
  if(!data)return null

  const {user:u,key,notifications,announcements}=data
  const unread=notifications?.filter((n:Notif)=>!n.is_read).length||0

  const I={width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',fontSize:'0.9rem',outline:'none',boxSizing:'border-box' as const}
  const LB={display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase' as const,marginBottom:6}

  return <>
    <GetKeyModal open={getkeyOpen} onClose={()=>setGetkeyOpen(false)} token={token} onKeyReceived={load}/>

    {/* Tab bar */}
    <div style={{display:'flex',gap:3,background:'rgba(4,16,26,.8)',border:'1px solid #162f50',borderRadius:12,padding:4,marginBottom:24}}>
      {[['dash','🏠 Dashboard'],['notifs',`🔔 Notif${unread>0?` (${unread})`:''}`],['profile','👤 Profil']].map(([v,l])=>(
        <button key={v} onClick={()=>{setTab(v);if(v==='notifs')api('/user/read-notifs','POST',{},token).then(load)}} style={{flex:1,padding:'8px 14px',borderRadius:8,border:tab===v?'1px solid #1a4a80':'none',background:tab===v?'#0e2040':'transparent',color:tab===v?'#00d4ff':'#5a8ab0',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem',transition:'all .2s'}}>
          {l}
        </button>
      ))}
    </div>

    {/* DASHBOARD */}
    {tab==='dash'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:20,animation:'fadeUp .35s ease both'}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>📊 Statistik</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Total Exec',u.total_executions||0,'#00d4ff'],['Key Aktif',key?1:0,'#4ade80']].map(([l,v,c])=>(
              <div key={l as string} style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'14px',textAlign:'center'}}>
                <div style={{fontFamily:'Rajdhani',fontSize:'2rem',fontWeight:700,color:c as string,lineHeight:1}}>{v as number}</div>
                <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginTop:5}}>{l as string}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:20,animation:'fadeUp .35s ease .05s both'}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',marginBottom:14}}>👤 Info Akun</div>
          <div style={{fontSize:'0.84rem',marginBottom:8}}><span style={{color:'#5a8ab0'}}>Username: </span><strong>{u.username}</strong></div>
          <div style={{fontSize:'0.84rem',marginBottom:8}}><span style={{color:'#5a8ab0'}}>Email: </span>{u.email}</div>
          <div style={{fontSize:'0.84rem'}}><span style={{color:'#5a8ab0'}}>Role: </span>
            <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,letterSpacing:'0.8px',textTransform:'uppercase',background:u.role==='developer'?'rgba(168,85,247,.18)':'rgba(0,102,204,.18)',color:u.role==='developer'?'#c084fc':'#00d4ff',border:`1px solid ${u.role==='developer'?'rgba(192,132,252,.25)':'rgba(0,170,255,.25)'}`}}>
              {u.role==='developer'?'👑 Developer':u.role==='reseller'?'🏪 Reseller':'👤 User'}
            </span>
          </div>
        </div>
      </div>

      {key?(
        <div style={{background:'linear-gradient(135deg,rgba(0,30,80,.4),rgba(0,15,40,.4))',border:'1px solid rgba(0,170,255,.2)',borderRadius:16,padding:24,marginBottom:20,boxShadow:'0 0 40px rgba(0,170,255,.06)',animation:'fadeUp .4s ease .1s both'}}>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:16}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',display:'flex',alignItems:'center',gap:8}}>🔑 Key Kamu</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,textTransform:'uppercase',background:key.is_active&&!isExpired(key.expires_at)?'rgba(22,163,74,.18)':'rgba(220,38,38,.18)',color:key.is_active&&!isExpired(key.expires_at)?'#4ade80':'#f87171',border:`1px solid ${key.is_active&&!isExpired(key.expires_at)?'rgba(74,222,128,.25)':'rgba(248,113,113,.25)'}`}}>
                {key.is_active&&!isExpired(key.expires_at)?'● Aktif':'● Expired/Mati'}
              </span>
              <span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,textTransform:'uppercase',background:'rgba(0,102,204,.18)',color:'#00d4ff',border:'1px solid rgba(0,170,255,.25)'}}>{DUR[key.duration_type]||key.duration_type}</span>
              {key.is_free_key&&<span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,textTransform:'uppercase',background:'rgba(202,138,4,.18)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.25)'}}>🎁 Free</span>}
            </div>
          </div>
          <div onClick={()=>{copyText(key.key_value);toast('Key disalin!','success')}} style={{background:'#020810',border:'1px solid #0066cc',borderRadius:10,padding:'14px 16px',fontFamily:'Rajdhani,monospace',fontSize:'1.05rem',color:'#00d4ff',letterSpacing:2,cursor:'pointer',marginBottom:16,position:'relative',boxShadow:'inset 0 0 20px rgba(0,170,255,.04)'}}>
            {key.key_value}
            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:'0.65rem',color:'#5a8ab0'}}>klik copy</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {[['EXPIRED',fmtDate(key.expires_at),isExpired(key.expires_at)?'#f87171':'#cce4f8'],['SISA WAKTU',timeLeft(key.expires_at),'#00d4ff'],['DIPAKAI',`${key.times_used} kali`,'#cce4f8']].map(([l,v,c])=>(
              <div key={l as string}><div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{l}</div><div style={{fontSize:'0.88rem',color:c as string}}>{v}</div></div>
            ))}
          </div>
          <div style={{marginTop:12,fontSize:'0.75rem',color:'#5a8ab0'}}>HWID Max: {key.hwid_max} perangkat</div>
        </div>
      ):(
        <div style={{background:'#0b1a2e',border:'1px dashed #162f50',borderRadius:16,padding:40,marginBottom:20,textAlign:'center',animation:'fadeUp .4s ease .1s both'}}>
          <div style={{fontSize:'2.5rem',marginBottom:12}}>🔒</div>
          <div style={{fontWeight:700,fontSize:'1rem',marginBottom:8}}>Kamu belum punya key</div>
          <div style={{fontSize:'0.84rem',color:'#5a8ab0',marginBottom:20}}>Hubungi reseller atau developer untuk mendapatkan key AWR</div>
          <button onClick={()=>setGetkeyOpen(true)} style={{background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px 24px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>🎁 Get Free Key 24 Jam</button>
        </div>
      )}

      {announcements?.length>0&&<div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:20,animation:'fadeUp .45s ease .15s both'}}>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',marginBottom:14}}>📢 Pengumuman</div>
        {announcements.map((a:any)=>(
          <div key={a.id} style={{background:'linear-gradient(135deg,rgba(0,80,170,.08),rgba(0,30,80,.08))',border:'1px solid rgba(0,170,255,.14)',borderRadius:10,padding:14,marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:'0.88rem',marginBottom:5}}>{a.title}</div>
            <div style={{fontSize:'0.82rem',color:'#5a8ab0',lineHeight:1.6}}>{a.content}</div>
            <div style={{fontSize:'0.72rem',color:'#3a6a8a',marginTop:8}}>{fmtDate(a.created_at)}</div>
          </div>
        ))}
      </div>}
    </div>}

    {/* NOTIFS */}
    {tab==='notifs'&&<div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:20}}>
      <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',marginBottom:16}}>🔔 Notifikasi</div>
      {!notifications?.length&&<div style={{textAlign:'center',color:'#5a8ab0',padding:40}}>Tidak ada notifikasi</div>}
      {notifications?.map((n:Notif,i:number)=>(
        <div key={n.id} style={{padding:14,borderRadius:10,marginBottom:8,background:n.is_read?'transparent':'rgba(0,102,204,.06)',border:`1px solid ${n.is_read?'transparent':'rgba(0,170,255,.14)'}`,animation:`fadeUp .3s ease ${i*.04}s both`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700,fontSize:'0.88rem'}}>{n.title}</div>
            {!n.is_read&&<span style={{width:8,height:8,borderRadius:'50%',background:'#0af',display:'inline-block'}}/>}
          </div>
          <div style={{fontSize:'0.82rem',color:'#5a8ab0',marginTop:5,lineHeight:1.5}}>{n.message}</div>
          <div style={{fontSize:'0.72rem',color:'#3a6a8a',marginTop:6}}>{fmtDate(n.created_at)}</div>
        </div>
      ))}
    </div>}

    {/* PROFILE */}
    {tab==='profile'&&<div style={{animation:'fadeUp .3s ease'}}>
      <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,overflow:'hidden',marginBottom:16}}>
        {/* Background */}
        <div style={{height:180,background:'linear-gradient(135deg,#040d1a,#071224)',position:'relative',overflow:'hidden'}}>
          {u.background_url?(
            u.background_type==='video'
              ?<video src={u.background_url} autoPlay loop muted playsInline style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<img src={u.background_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          ):<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#030a14 0%,#071224 50%,#0a1f40 100%)'}}/>}
          {/* Overlay gradient */}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 60%,rgba(11,26,46,.9))'}}/>
        </div>

        <div style={{padding:'0 24px 24px',marginTop:-50,position:'relative'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:16,marginBottom:20}}>
            {/* Avatar */}
            <div style={{width:80,height:80,borderRadius:'50%',border:'3px solid #0066cc',overflow:'hidden',background:'#071224',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',flexShrink:0,boxShadow:'0 0 20px rgba(0,170,255,.3)',position:'relative',zIndex:1}}>
              {u.avatar_url?<img src={u.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
            </div>
            <div style={{paddingBottom:4,flex:1}}>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem',fontWeight:700,lineHeight:1}}>{u.username}</div>
              <div style={{fontSize:'0.82rem',color:'#5a8ab0',marginTop:4}}>{u.email}</div>
            </div>
            <button onClick={()=>setEditOpen(true)} style={{background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'8px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>✏️ Edit Profil</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            <div style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'12px 16px'}}>
              <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Role</div>
              <span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,textTransform:'uppercase',background:u.role==='developer'?'rgba(168,85,247,.18)':u.role==='reseller'?'rgba(202,138,4,.18)':'rgba(0,102,204,.18)',color:u.role==='developer'?'#c084fc':u.role==='reseller'?'#fbbf24':'#00d4ff',border:`1px solid ${u.role==='developer'?'rgba(192,132,252,.25)':u.role==='reseller'?'rgba(251,191,36,.25)':'rgba(0,170,255,.25)'}`}}>
                {u.role==='developer'?'👑 Developer':u.role==='reseller'?'🏪 Reseller':'👤 User'}
              </span>
            </div>
            <div style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'12px 16px'}}>
              <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Roblox</div>
              <div style={{fontSize:'0.88rem'}}>{u.roblox_username||<span style={{color:'#5a8ab0'}}>-</span>}</div>
            </div>
            <div style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'12px 16px'}}>
              <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Bergabung</div>
              <div style={{fontSize:'0.88rem'}}>{u.created_at?new Date(u.created_at).toLocaleDateString('id-ID'):'-'}</div>
            </div>
          </div>

          <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'14px',textAlign:'center'}}>
              <div style={{fontFamily:'Rajdhani',fontSize:'2rem',fontWeight:700,color:'#00d4ff'}}>{u.total_executions||0}</div>
              <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginTop:4}}>Total Executions</div>
            </div>
            <div style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,padding:'14px',textAlign:'center'}}>
              <div style={{fontFamily:'Rajdhani',fontSize:'2rem',fontWeight:700,color:key&&key.is_active&&!isExpired(key.expires_at)?'#4ade80':'#f87171'}}>{key&&key.is_active&&!isExpired(key.expires_at)?'✓':'✗'}</div>
              <div style={{fontSize:'0.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginTop:4}}>Status Key</div>
            </div>
          </div>
        </div>
      </div>
    </div>}

    {/* Edit Profile Modal */}
    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="✏️ Edit Profil">
      <div style={{marginBottom:14}}><label style={LB}>Username</label><input style={I} value={ef.username} onChange={e=>setEf(f=>({...f,username:e.target.value}))}/></div>
      <div style={{marginBottom:14}}><label style={LB}>Roblox Username</label><input style={I} placeholder="Username Roblox..." value={ef.roblox_username} onChange={e=>setEf(f=>({...f,roblox_username:e.target.value}))}/></div>
      <div style={{height:1,background:'linear-gradient(90deg,transparent,#1a4a80,transparent)',margin:'16px 0'}}/>
      <div style={{marginBottom:14}}><label style={LB}>URL Avatar (foto profil)</label><input style={I} placeholder="https://...jpg" value={ef.avatar_url} onChange={e=>setEf(f=>({...f,avatar_url:e.target.value}))}/></div>
      <div style={{marginBottom:14}}><label style={LB}>URL Background (foto/video)</label><input style={I} placeholder="https://..." value={ef.background_url} onChange={e=>setEf(f=>({...f,background_url:e.target.value}))}/></div>
      <div style={{marginBottom:14}}><label style={LB}>Tipe Background</label>
        <select style={{...I,appearance:'none' as any}} value={ef.background_type} onChange={e=>setEf(f=>({...f,background_type:e.target.value}))}>
          <option value="image">🖼️ Gambar</option><option value="video">🎥 Video</option>
        </select></div>
      <div style={{height:1,background:'linear-gradient(90deg,transparent,#1a4a80,transparent)',margin:'16px 0'}}/>
      <div style={{marginBottom:20}}><label style={LB}>Password Baru (kosong = tidak ganti)</label>
        <div style={{position:'relative'}}><input style={{...I,paddingRight:44}} type={showPw?'text':'password'} placeholder="Password baru..." value={ef.password} onChange={e=>setEf(f=>({...f,password:e.target.value}))}/>
          <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button>
        </div></div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={saveProfile} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>💾 Simpan</button>
        <button onClick={()=>setEditOpen(false)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button>
      </div>
    </Modal>
  </>
}

// ─── ROUTES ──────────────────────────────────────────────────
function RoutesPage({token,user}:{token:string|null;user:User|null}){
  const [routes,setRoutes]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [uploadOpen,setUploadOpen]=useState(false)
  const [detail,setDetail]=useState<any>(null)
  const [pwModal,setPwModal]=useState<any>(null)
  const [pw,setPw]=useState('')
  const [form,setForm]=useState({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''})

  const load=()=>{setLoading(true);api('/routes','GET',undefined,token).then(d=>{if(d.routes)setRoutes(d.routes);setLoading(false)})}
  useEffect(()=>{load()},[])

  async function openRoute(r:any){
    if(!r.is_public&&r.has_password){setPwModal(r);return}
    const d=await api('/routes/'+r.id,'GET',undefined,token)
    if(d.route)setDetail(d.route);else toast('Gagal load route','error')
  }
  async function openWithPw(){
    const r=await fetch('/api/routes/'+pwModal.id+'?password='+encodeURIComponent(pw))
    const d=await r.json()
    if(d.error){toast(d.error,'error');return}
    setDetail(d.route);setPwModal(null);setPw('')
  }
  function onFileChange(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0];if(!f)return
    const reader=new FileReader()
    reader.onload=ev=>{setForm(f=>({...f,data:ev.target?.result as string||''}))}
    reader.readAsText(f)
  }
  async function upload(e:React.FormEvent){
    e.preventDefault();if(!token){toast('Login dulu!','error');return}
    let parsed;try{parsed=JSON.parse(form.data)}catch{toast('JSON tidak valid','error');return}
    const d=await api('/routes','POST',{...form,data:parsed},token)
    if(d.error){toast(d.error,'error');return}
    toast('Route diupload!','success');setUploadOpen(false);setForm({name:'',description:'',game_name:'',data:'',is_public:true,password:'',thumbnail_url:''});load()
  }

  const I={width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',fontSize:'0.9rem',outline:'none',boxSizing:'border-box' as const}
  const LB={display:'block',fontSize:'0.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase' as const,marginBottom:6}

  return <>
    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:24}}>
      <div><div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.8rem',fontWeight:700}}>🗺️ Route Library</div><div style={{color:'#5a8ab0',fontSize:'0.88rem',marginTop:4}}>Download & upload rute AWR Script</div></div>
      {user&&<button onClick={()=>setUploadOpen(true)} style={{background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>⬆️ Upload Route</button>}
    </div>

    {loading
      ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
        {[1,2,3,4,5,6].map(i=><div key={i} style={{height:120,borderRadius:14,background:'linear-gradient(90deg,#0b1a2e 25%,#0e2040 50%,#0b1a2e 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>)}
      </div>
      :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
        {routes.map((r,i)=>(
          <div key={r.id} onClick={()=>openRoute(r)} style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:14,padding:18,cursor:'pointer',transition:'all .25s',animation:`fadeUp .3s ease ${i*.04}s both',position:'relative',overflow:'hidden`}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1a4a80';(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(0,170,255,.08)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#162f50';(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
            {r.thumbnail_url&&<img src={r.thumbnail_url} alt={r.name} style={{width:'100%',height:100,objectFit:'cover',borderRadius:9,marginBottom:10}}/>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1rem'}}>{r.name}</div>
              {!r.is_public&&<span style={{fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',background:'rgba(202,138,4,.18)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.2)',padding:'2px 7px',borderRadius:99}}>{r.has_password?'🔐':' 🔒'} Private</span>}
            </div>
            {r.game_name&&<div style={{fontSize:'0.75rem',color:'#5a8ab0',marginBottom:6}}>🎮 {r.game_name}</div>}
            {r.description&&<div style={{fontSize:'0.82rem',color:'#5a8ab0',lineHeight:1.4,overflow:'hidden',maxHeight:38,marginBottom:10}}>{r.description}</div>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:'0.72rem',color:'#5a8ab0'}}>by {r.uploader?.username||'anonymous'}</div>
              <span style={{fontSize:'0.72rem',fontWeight:700,background:'rgba(0,102,204,.15)',color:'#00d4ff',border:'1px solid rgba(0,170,255,.2)',padding:'2px 8px',borderRadius:99}}>⬇️ {r.download_count}</span>
            </div>
          </div>
        ))}
        {!routes.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'#5a8ab0'}}>
          <div style={{fontSize:'2.5rem',marginBottom:12}}>🗺️</div>Belum ada route
        </div>}
      </div>}

    {/* Upload Modal */}
    <Modal open={uploadOpen} onClose={()=>setUploadOpen(false)} title="⬆️ Upload Route" size="lg">
      <form onSubmit={upload}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={LB}>Nama *</label><input style={I} placeholder="Nama route..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
          <div><label style={LB}>Nama Game</label><input style={I} placeholder="Roblox game..." value={form.game_name} onChange={e=>setForm(f=>({...f,game_name:e.target.value}))}/></div>
        </div>
        <div style={{marginBottom:12}}><label style={LB}>Deskripsi</label><input style={I} placeholder="Deskripsi singkat..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
        <div style={{marginBottom:12}}><label style={LB}>Thumbnail URL</label><input style={I} placeholder="https://..." value={form.thumbnail_url} onChange={e=>setForm(f=>({...f,thumbnail_url:e.target.value}))}/></div>
        <div style={{marginBottom:12}}><label style={LB}>Data Route * (JSON)</label>
          <label style={{display:'inline-flex',alignItems:'center',gap:8,background:'#0e2040',border:'1px solid #162f50',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:'0.82rem',marginBottom:8}}>
            📁 Upload File JSON<input type="file" accept=".json,.txt" style={{display:'none'}} onChange={onFileChange}/>
          </label>
          <textarea style={{...I,minHeight:80,fontFamily:'monospace',fontSize:'0.78rem',resize:'vertical' as const}} placeholder='[{"x":0,"y":5,"z":0}]' value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} required/>
        </div>
        <div style={{marginBottom:12}}><label style={LB}>Visibilitas</label>
          <select style={{...I,appearance:'none' as any}} value={form.is_public?'public':'private'} onChange={e=>setForm(f=>({...f,is_public:e.target.value==='public'}))}>
            <option value="public">🌐 Public — semua user</option><option value="private">🔒 Private — perlu password</option>
          </select></div>
        {!form.is_public&&<div style={{marginBottom:12,animation:'fadeUp .2s ease'}}><label style={LB}>Password Akses</label><input style={I} placeholder="Password..." value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>}
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button type="submit" style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>⬆️ Upload</button>
          <button type="button" onClick={()=>setUploadOpen(false)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button>
        </div>
      </form>
    </Modal>

    {/* Detail Modal */}
    <Modal open={!!detail} onClose={()=>setDetail(null)} title={`📥 ${detail?.name||''}`} size="lg">
      {detail&&<>
        {detail.description&&<div style={{fontSize:'0.85rem',color:'#5a8ab0',marginBottom:14}}>{detail.description}</div>}
        <textarea rows={8} readOnly value={JSON.stringify(detail.data,null,2)} style={{...I,fontFamily:'monospace',fontSize:'0.74rem',resize:'vertical' as const}}/>
        <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
          <button onClick={()=>{copyText(JSON.stringify(detail.data));toast('Data disalin!','success')}} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>📋 Copy Data</button>
          <button onClick={()=>{const blob=new Blob([JSON.stringify(detail.data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${detail.name.replace(/\s/g,'_')}.json`;a.click();toast('Downloaded!','success')}} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'10px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>⬇️ .json</button>
        </div>
      </>}
    </Modal>

    {/* Password Modal */}
    <Modal open={!!pwModal} onClose={()=>{setPwModal(null);setPw('')}} title={`🔐 ${pwModal?.name||''}`}>
      <p style={{fontSize:'0.85rem',color:'#5a8ab0',marginBottom:14}}>Route ini private. Masukkan password.</p>
      <div style={{marginBottom:16}}><input style={I} type="password" placeholder="Password route..." value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&openWithPw()}/></div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={openWithPw} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>🔓 Akses</button>
        <button onClick={()=>{setPwModal(null);setPw('')}} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button>
      </div>
    </Modal>
  </>
}

// ─── LEADERBOARD ─────────────────────────────────────────────
function LeaderboardPage(){
  const [lb,setLb]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{api('/leaderboard').then(d=>{if(d.leaderboard)setLb(d.leaderboard);setLoading(false)})},[])
  const medals=['🥇','🥈','🥉'],colors=['#ffd700','#c0c0c0','#cd7f32']
  return <>
    <div style={{marginBottom:24}}><div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.8rem',fontWeight:700}}>🏆 Leaderboard</div><div style={{color:'#5a8ab0',fontSize:'0.88rem',marginTop:4}}>Top executor AWR Script</div></div>
    <div style={{maxWidth:620}}>
      {loading?[1,2,3,4,5].map(i=><div key={i} style={{height:60,borderRadius:14,background:'linear-gradient(90deg,#0b1a2e 25%,#0e2040 50%,#0b1a2e 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite',marginBottom:10}}/>)
      :lb.map((u,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:16,background:`linear-gradient(135deg,${i<3?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},.05)`:' #0b1a2e'},transparent)`,border:`1px solid ${i<3?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},.18)`:'#162f50'}`,borderRadius:14,padding:'14px 20px',marginBottom:10,animation:`fadeUp .3s ease ${i*.05}s both`,transition:'all .2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateX(4px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none'}}>
          <div style={{fontFamily:'Rajdhani',fontSize:'1.4rem',fontWeight:700,width:40,textAlign:'center',color:i<3?colors[i]:'#5a8ab0'}}>{i<3?medals[i]:`#${u.rank}`}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Rajdhani',fontSize:'1.05rem',fontWeight:700,color:i<3?colors[i]:'#cce4f8'}}>{u.username}</div>
            {u.roblox_username&&<div style={{fontSize:'0.75rem',color:'#5a8ab0',marginTop:2}}>Roblox: {u.roblox_username}</div>}
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'Rajdhani',fontSize:'1.4rem',fontWeight:700,color:'#00d4ff'}}>{u.total_executions.toLocaleString()}</div>
            <div style={{fontSize:'0.65rem',color:'#5a8ab0',marginTop:1}}>executions</div>
          </div>
        </div>
      ))}
      {!loading&&!lb.length&&<div style={{textAlign:'center',color:'#5a8ab0',padding:60}}><div style={{fontSize:'2.5rem',marginBottom:12}}>🏆</div>Belum ada data</div>}
    </div>
  </>
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App(){
  const router=useRouter()
  const [ready,setReady]=useState(false)
  const [token,setToken]=useState<string|null>(null)
  const [user,setUser]=useState<User|null>(null)
  const [page,setPage]=useState('dash')
  const [pageReady,setPageReady]=useState(true)

  useEffect(()=>{
    const t=setTimeout(()=>setReady(true),2000)
    const saved=localStorage.getItem('awr_token')||sessionStorage.getItem('awr_token')
    if(saved){
      api('/user/profile','GET',undefined,saved).then(d=>{
        if(d.user){setToken(saved);setUser(d.user)}
        else{localStorage.removeItem('awr_token');sessionStorage.removeItem('awr_token')}
      })
    }
    return()=>clearTimeout(t)
  },[])

  function changePage(p:string){
    if(p===page)return
    setPageReady(false)
    setTimeout(()=>{setPage(p);setPageReady(true)},220)
  }

  function onAuth(t:string,u:User){setToken(t);setUser(u);setPage('dash')}
  function logout(){localStorage.removeItem('awr_token');sessionStorage.removeItem('awr_token');setToken(null);setUser(null);toast('Sampai jumpa!','info')}

  return <>
    <Head>
      <title>AWR Key System — by Sanzxmzz</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700;800&display=swap" rel="stylesheet"/>
    </Head>

    <style>{`
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh;overflow-x:hidden}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a4a80;border-radius:99px}
      ::-webkit-scrollbar-thumb:hover{background:#0066cc}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      @keyframes pulse{0%,100%{text-shadow:0 0 30px rgba(0,212,255,.4)}50%{text-shadow:0 0 60px rgba(0,212,255,.9)}}
      @keyframes lsFill{0%{width:0}70%{width:65%}100%{width:100%}}
      @keyframes dotBounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-8px);opacity:1}}
      @keyframes modalIn{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes toastIn{from{transform:translateX(120px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes pageIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pageOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}
      select option{background:#071224;color:#cce4f8}
      input:focus,select:focus,textarea:focus{border-color:#0066cc!important;box-shadow:0 0 0 3px rgba(0,102,204,.2)}
    `}</style>

    <LoadingScreen done={ready}/>
    <ToastRoot/>
    <Particles/>

    {/* Background elements */}
    <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(0,170,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,170,255,.022) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'fixed',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,80,180,.05) 0%,transparent 70%)',top:-150,left:-150,filter:'blur(80px)',pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,120,220,.04) 0%,transparent 70%)',bottom:-100,right:-100,filter:'blur(80px)',pointerEvents:'none',zIndex:0}}/>

    {!token?<AuthPage onAuth={onAuth}/>:
    <div style={{position:'relative',zIndex:1,minHeight:'100vh'}}>
      {/* Navbar */}
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(2,8,16,.85)',backdropFilter:'blur(24px) saturate(180%)',borderBottom:'1px solid #162f50',height:64,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 0 0 0'}}>
        <div onClick={()=>changePage('dash')} style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem',fontWeight:700,color:'#00d4ff',letterSpacing:3,textShadow:'0 0 20px rgba(0,212,255,.4)',cursor:'pointer'}}>⚡ AWR</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
          {[['dash','🏠 Dashboard'],['routes','🗺️ Routes'],['lb','🏆 LB']].map(([v,l])=>(
            <button key={v} onClick={()=>changePage(v)} style={{background:page===v?'rgba(0,170,255,.08)':'transparent',border:page===v?'1px solid #162f50':'1px solid transparent',color:page===v?'#00d4ff':'#5a8ab0',padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem',transition:'all .2s'}}>
              {l}
            </button>
          ))}
          {(user.role==='reseller'||user.role==='developer')&&(
            <button onClick={()=>router.push('/reseller')} style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',color:'#f59e0b',padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem'}}>🏪 Reseller</button>
          )}
          {user.role==='developer'&&(
            <button onClick={()=>router.push('/developer')} style={{background:'rgba(168,85,247,.08)',border:'1px solid rgba(168,85,247,.2)',color:'#a855f7',padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem'}}>👑 Developer</button>
          )}
          <button onClick={logout} style={{background:'rgba(220,38,38,.1)',border:'1px solid rgba(220,38,38,.2)',color:'#f87171',padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'0.82rem'}}>🚪</button>
        </div>
      </nav>

      <div style={{maxWidth:1240,margin:'0 auto',padding:'28px 24px',animation:pageReady?'pageIn .35s ease':'pageOut .22s ease forwards'}}>
        {page==='dash'&&<UserDash token={token} user={user!} onLogout={logout}/>}
        {page==='routes'&&<RoutesPage token={token} user={user}/>}
        {page==='lb'&&<LeaderboardPage/>}
      </div>
    </div>}
  </>
}
