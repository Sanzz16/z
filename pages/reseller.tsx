import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

async function api(p:string,m='GET',b?:any,t?:string|null){
  try{const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return r.json()}
  catch{return{error:'Koneksi gagal'}}
}
const DUR:Record<string,string>={'24h':'24 Jam','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const DURS=Object.keys(DUR)
function fmtDate(d:string|null){if(!d)return'∞ Lifetime';return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function isExpired(d:string|null){if(!d)return false;return new Date(d)<new Date()}

let _toast:(m:string,t?:string,title?:string)=>void=()=>{}
function toast(m:string,t='info',title=''){_toast(m,t,title)}

function ToastRoot(){
  const [items,setItems]=useState<any[]>([]);const id=useRef(0)
  useEffect(()=>{_toast=(msg,type='info',title='')=>{const n=++id.current;const icon=type==='error'?'❌':type==='success'?'✅':type==='warn'?'⚠️':'ℹ️';const tl=title||(type==='error'?'Error':type==='success'?'Sukses':'Info');setItems(p=>[...p,{id:n,msg,type,icon,title:tl}]);setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),4000)}},[])
  return <div className="toast-root">{items.map(t=><div key={t.id} className={`toast-item ${t.type}`}><span className="toast-icon">{t.icon}</span><div><div className="toast-title">{t.title}</div><div className="toast-msg">{t.msg}</div></div></div>)}</div>
}

function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};if(open)window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[open])
  if(!open)return null
  return(
    <div className="rs-modal-bg" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rs-modal-box">
        <div className="rs-modal-head"><div className="rs-modal-title">{title}</div><button className="rs-modal-close" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  )
}

type Tab='send'|'history'|'broadcast'|'users'

const CSS=`
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{background:#07080a;color:#fff;font-family:'Outfit','Inter',sans-serif;min-height:100vh;}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0b0d}::-webkit-scrollbar-thumb{background:rgba(245,158,11,.3);border-radius:99px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes logoPulse{0%{opacity:.7;transform:scale(1)}100%{opacity:1;transform:scale(1.05)}}
  @keyframes shimmerSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.2)}50%{box-shadow:0 0 40px rgba(245,158,11,.45)}}
  @keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes tabSlideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}

  table{width:100%;border-collapse:collapse}
  .tbl-wrap{border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;overflow-x:auto;background:rgba(255,255,255,.01)}
  th{padding:11px 16px;text-align:left;font-family:'Rajdhani',sans-serif;font-weight:700;color:rgba(150,150,170,.6);font-size:.69rem;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
  td{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);color:#b0b0c0;font-size:.84rem;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(245,158,11,.02)}

  .toast-root{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:9px;max-width:340px}
  .toast-item{background:rgba(12,13,16,.98);border:1px solid rgba(255,255,255,.09);border-left:3px solid #f59e0b;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;animation:toastIn .35s cubic-bezier(.34,1.56,.64,1);backdrop-filter:blur(18px);box-shadow:0 12px 40px rgba(0,0,0,.8)}
  .toast-item.success{border-left-color:#32ff7e}.toast-item.error{border-left-color:#ff4757}.toast-item.warn{border-left-color:#f59e0b}
  .toast-title{font-weight:700;font-size:.85rem;color:#fff;margin-bottom:2px;font-family:'Rajdhani',sans-serif}.toast-msg{font-size:.78rem;color:#9090a8;line-height:1.4}.toast-icon{font-size:1.1rem;flex-shrink:0;line-height:1.4}

  .rs-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);animation:fadeIn .2s ease;padding:20px}
  .rs-modal-box{background:linear-gradient(155deg,rgba(20,17,10,.99),rgba(10,11,13,.99));border:1px solid rgba(245,158,11,.15);border-radius:22px;padding:26px;width:90%;max-width:500px;max-height:90vh;overflow-y:auto;animation:scaleIn .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 30px 80px rgba(0,0,0,.94),0 0 0 1px rgba(245,158,11,.06);position:relative}
  .rs-modal-box::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,#f59e0b 30%,#fbbf24 70%,transparent);border-radius:22px 22px 0 0}
  .rs-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .rs-modal-title{font-family:'Rajdhani',sans-serif;font-size:1.2rem;font-weight:700;background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .rs-modal-close{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#808090;border-radius:8px;padding:5px 11px;cursor:pointer;transition:all .2s;font-size:.9rem}
  .rs-modal-close:hover{color:#fff;border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.08)}

  .fi{width:100%;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:11px 14px;color:#fff;font-size:.88rem;font-family:'Outfit',sans-serif;transition:all .2s;outline:none}
  .fi:hover{border-color:rgba(245,158,11,.2)}.fi:focus{border-color:rgba(245,158,11,.45)!important;background:rgba(245,158,11,.04)!important;box-shadow:0 0 0 3px rgba(245,158,11,.07)!important}
  .fi::placeholder{color:#5a5a70}
  .fl{display:block;font-size:.76rem;color:#9090a8;font-weight:600;margin-bottom:6px;letter-spacing:.3px}
  select.fi{appearance:none}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:.67rem;font-weight:700;letter-spacing:.4px;border:1px solid}
  .badge-g{background:rgba(50,255,126,.08);color:#32ff7e;border-color:rgba(50,255,126,.2)}
  .badge-r{background:rgba(255,71,87,.08);color:#ff4757;border-color:rgba(255,71,87,.2)}
  .badge-b{background:rgba(79,172,254,.08);color:#4facfe;border-color:rgba(79,172,254,.2)}
  .badge-y{background:rgba(245,158,11,.08);color:#f59e0b;border-color:rgba(245,158,11,.2)}

  .rs-tabs{display:flex;gap:3px;background:rgba(8,9,12,.8);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:5px;margin-bottom:28px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;backdrop-filter:blur(16px);box-shadow:0 2px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04)}
  .rs-tabs::-webkit-scrollbar{display:none}
  .rs-tab{flex:1;min-width:72px;padding:11px 12px;border-radius:15px;border:1px solid transparent;background:transparent;color:rgba(130,130,150,.55);cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;transition:all .22s ease;display:flex;flex-direction:column;align-items:center;gap:5px;white-space:nowrap;position:relative}
  .rs-tab .ti{font-size:1.1rem;line-height:1;transition:transform .2s ease,filter .2s ease;filter:grayscale(60%) opacity(0.5)}
  .rs-tab .tl{font-size:.63rem;text-transform:uppercase;letter-spacing:1.2px;line-height:1;transition:color .2s}
  .rs-tab:hover{color:rgba(220,200,160,.8);background:rgba(245,158,11,.06);border-color:rgba(245,158,11,.1)}
  .rs-tab:hover .ti{transform:translateY(-2px);filter:grayscale(0%) opacity(1)}
  .rs-tab.on{color:#fff;background:linear-gradient(145deg,rgba(245,158,11,.22),rgba(180,83,9,.18));border-color:rgba(245,158,11,.25);box-shadow:0 4px 18px rgba(245,158,11,.2),inset 0 1px 0 rgba(255,255,255,.08)}
  .rs-tab.on .ti{transform:scale(1.1) translateY(-1px);filter:grayscale(0%) opacity(1) drop-shadow(0 0 6px rgba(245,158,11,.6))}
  .rs-tab.on .tl{color:rgba(255,220,140,.9)}

  .rs-card{background:linear-gradient(155deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden}
  .rs-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(245,158,11,.35) 50%,transparent 100%)}
  .rs-card-title{display:flex;align-items:center;gap:10px;margin-bottom:20px}
  .rs-card-bar{width:3px;height:20px;background:linear-gradient(180deg,#f59e0b,#fbbf24);border-radius:4px;flex-shrink:0;box-shadow:0 0 8px rgba(245,158,11,.5)}
  .rs-card-label{font-family:'Rajdhani',sans-serif;font-size:.95rem;font-weight:700;background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent}

  .rs-btn{width:100%;background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;border:none;border-radius:12px;padding:12px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.92rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(245,158,11,.3);letter-spacing:.5px;transition:all .2s;position:relative;overflow:hidden}
  .rs-btn::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);transition:left .4s ease}
  .rs-btn:hover::after{left:100%}
  .rs-btn:hover{box-shadow:0 6px 28px rgba(245,158,11,.45);transform:translateY(-1px)}
  .rs-btn:disabled{background:rgba(255,255,255,.06);color:#5a5a70;box-shadow:none;cursor:not-allowed;transform:none}
  .rs-btn:disabled::after{display:none}

  .rs-stat{background:linear-gradient(155deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:20px;text-align:center;transition:all .25s;position:relative;overflow:hidden}
  .rs-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(245,158,11,.3),transparent)}
  .rs-stat:hover{border-color:rgba(245,158,11,.2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
  .rs-stat-val{font-family:'Rajdhani',sans-serif;font-size:2.4rem;font-weight:700;line-height:1}
  .rs-stat-lbl{font-size:.64rem;color:#5a5a78;text-transform:uppercase;letter-spacing:1.5px;margin-top:7px}

  .key-chip{font-family:'Rajdhani',sans-serif;font-size:.72rem;color:#4facfe;letter-spacing:1px;cursor:pointer;background:rgba(79,172,254,.06);border:1px solid rgba(79,172,254,.18);border-radius:8px;padding:4px 9px;display:inline-block;transition:all .2s}
  .key-chip:hover{background:rgba(79,172,254,.12);border-color:rgba(79,172,254,.35)}

  .rs-nav{position:sticky;top:0;z-index:200;background:rgba(7,8,10,.93);backdrop-filter:blur(28px);border-bottom:1px solid rgba(245,158,11,.1);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between}
  .rs-nav-brand{font-family:'Orbitron',sans-serif;font-size:1.2rem;font-weight:800;background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;filter:drop-shadow(0 0 10px rgba(245,158,11,.35))}
  .rs-nav-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#9090a8;border-radius:10px;padding:7px 14px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;transition:all .2s}
  .rs-nav-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.15);color:#fff}
  .rs-nav-btn.logout{background:rgba(255,71,87,.07);border-color:rgba(255,71,87,.18);color:#ff4757}
  .rs-nav-btn.logout:hover{background:rgba(255,71,87,.14);box-shadow:0 0 16px rgba(255,71,87,.2)}
  .rs-nav-user{font-size:.73rem;color:#6a6a80;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.15);border-radius:8px;padding:3px 10px;font-family:'Rajdhani',sans-serif;font-weight:700}

  .bg-dots{position:fixed;inset:0;background-image:radial-gradient(circle at 70% 10%,rgba(245,158,11,.05),transparent 55%),radial-gradient(circle at 20% 80%,rgba(255,77,255,.04),transparent 55%);pointer-events:none;z-index:0}
  .page-wrap{max-width:1100px;margin:0 auto;padding:28px 24px;position:relative;z-index:1}

  input:focus,select:focus,textarea:focus{border-color:rgba(245,158,11,.45)!important;outline:none!important;box-shadow:0 0 0 3px rgba(245,158,11,.07)!important}
`

export default function ResellerPage(){
  const router=useRouter()
  const [token,setToken]=useState<string|null>(null)
  const [user,setUser]=useState<any>(null)
  const [tab,setTab]=useState<Tab>('send')
  const [booting,setBooting]=useState(true)
  const [loginForm,setLoginForm]=useState({username:'',password:''})
  const [showPw,setShowPw]=useState(false)
  const [logging,setLogging]=useState(false)
  const [users,setUsers]=useState<any[]>([])
  const [keys,setKeys]=useState<any[]>([])
  const [form,setForm]=useState({target_username:'',duration_type:'24h',hwid_max:'1'})
  const [sending,setSending]=useState(false)
  const [bc,setBc]=useState({title:'',content:''})
  const [search,setSearch]=useState('')

  useEffect(()=>{
    const saved=localStorage.getItem('awr_rs_token')
    if(saved){api('/user/profile','GET',undefined,saved).then(d=>{if(d.user&&(d.user.role==='reseller'||d.user.role==='developer')){setToken(saved);setUser(d.user)}else localStorage.removeItem('awr_rs_token');setBooting(false)})}
    else setBooting(false)
  },[])

  useEffect(()=>{
    if(!token)return
    api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
    api('/reseller/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  },[token])

  const reloadKeys=()=>api('/reseller/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})

  async function login(e:React.FormEvent){
    e.preventDefault();setLogging(true)
    const d=await api('/auth/login','POST',{...loginForm,rememberMe:true})
    setLogging(false)
    if(d.error){toast(d.error,'error');return}
    if(d.user?.role!=='reseller'&&d.user?.role!=='developer'){toast('Akun ini bukan reseller!','error');return}
    localStorage.setItem('awr_rs_token',d.token);setToken(d.token);setUser(d.user)
    toast('Selamat datang, '+d.user.username+'!','success','Login Berhasil')
  }

  async function sendKey(e:React.FormEvent){
    e.preventDefault();setSending(true)
    const d=await api('/reseller/keys','POST',form,token)
    setSending(false)
    if(d.error){toast(d.error,'error');return}
    toast('Key dikirim ke '+form.target_username+'!','success')
    setForm(f=>({...f,target_username:'',hwid_max:'1'}));reloadKeys()
  }

  async function sendBc(e:React.FormEvent){
    e.preventDefault()
    const d=await api('/reseller/broadcast','POST',bc,token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success');setBc({title:'',content:''})
  }

  function logout(){localStorage.removeItem('awr_rs_token');setToken(null);setUser(null)}

  if(booting)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#07080a'}}>
      <div style={{width:36,height:36,border:'2px solid rgba(245,158,11,.15)',borderTopColor:'#f59e0b',borderRadius:'50%',animation:'spin .7s linear infinite',boxShadow:'0 0 16px rgba(245,158,11,.25)'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if(!token)return(
    <>
      <Head><title>Reseller — AWR</title></Head>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@600;700&family=Outfit:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{CSS+`body{display:flex;align-items:center;justify-content:center;padding:24px;background-image:radial-gradient(circle at top right,rgba(245,158,11,.06),transparent 60%),radial-gradient(circle at bottom left,rgba(255,77,255,.05),transparent 60%)}`}</style>
      <ToastRoot/>
      <div style={{width:'100%',maxWidth:420,animation:'scaleIn .4s cubic-bezier(.34,1.56,.64,1)'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'2.7rem',fontWeight:800,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:4,filter:'drop-shadow(0 0 24px rgba(245,158,11,.55))',animation:'logoPulse 2s ease-in-out infinite alternate',display:'inline-block'}}>🏪 AWR</div>
          <div style={{fontSize:'.68rem',color:'#5a5a70',letterSpacing:4,textTransform:'uppercase',marginTop:8}}>Reseller Panel · Key System</div>
          <div style={{width:60,height:2,background:'linear-gradient(90deg,transparent,rgba(245,158,11,.5),transparent)',margin:'14px auto 0'}}/>
        </div>
        <div style={{background:'linear-gradient(155deg,rgba(245,158,11,.07),rgba(180,83,9,.04))',border:'1px solid rgba(245,158,11,.18)',borderRadius:22,padding:28,boxShadow:'0 0 60px rgba(245,158,11,.06)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(245,158,11,.4),transparent)'}}/>
          <form onSubmit={login}>
            <div style={{marginBottom:16}}>
              <label className="fl">Username</label>
              <input className="fi" placeholder="Username reseller..." value={loginForm.username} onChange={e=>setLoginForm(f=>({...f,username:e.target.value}))} required/>
            </div>
            <div style={{marginBottom:24}}>
              <label className="fl">Password</label>
              <div style={{position:'relative'}}>
                <input className="fi" style={{paddingRight:44}} type={showPw?'text':'password'} placeholder="Password..." value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} required/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a5a70',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button>
              </div>
            </div>
            <button type="submit" disabled={logging} className="rs-btn">
              {logging?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Loading...</>:'🏪 Masuk Reseller Panel'}
            </button>
          </form>
        </div>
      </div>
    </>
  )

  const fu=users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase()))
  const tabs:Array<[Tab,string,string]>=[
    ['send','🔑','Kirim Key'],
    ['history','📋','History'],
    ['broadcast','📢','Broadcast'],
    ['users','👥','Users'],
  ]
  const activeKeys=keys.filter(k=>k.is_active&&!isExpired(k.expires_at)).length

  return(
    <>
      <Head><title>Reseller Panel — AWR</title></Head>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@600;700&family=Outfit:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{CSS}</style>
      <ToastRoot/>
      <div className="bg-dots"/>

      {/* Navbar */}
      <nav className="rs-nav">
        <div className="rs-nav-brand">🏪 RESELLER</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className="rs-nav-user">{user.username}</span>
          <button onClick={()=>router.push('/')} className="rs-nav-btn">🏠 Website</button>
          <button onClick={logout} className="rs-nav-btn logout">🚪 Logout</button>
        </div>
      </nav>

      <div className="page-wrap">

        {/* Premium Tabs Bar */}
        <div className="rs-tabs">
          {tabs.map(([v,icon,lbl],i)=>(
            <button key={v} onClick={()=>setTab(v)} className={`rs-tab${tab===v?' on':''}`} style={{animation:`tabSlideIn .3s ease ${i*.06}s both`}}>
              <span className="ti">{icon}</span>
              <span className="tl">{lbl}</span>
            </button>
          ))}
        </div>

        {/* SEND KEY */}
        {tab==='send'&&(
          <div style={{animation:'fadeUp .3s ease',maxWidth:540}}>
            <div className="rs-card">
              <div className="rs-card-title">
                <div className="rs-card-bar"/>
                <div className="rs-card-label">KIRIM KEY KE USER</div>
              </div>
              <form onSubmit={sendKey}>
                <div style={{marginBottom:14}}>
                  <label className="fl">Username Tujuan</label>
                  <select className="fi" value={form.target_username} onChange={e=>setForm(f=>({...f,target_username:e.target.value}))} required>
                    <option value="">— Pilih Username —</option>
                    {users.map(u=><option key={u.id} value={u.username}>{u.username}{u.is_banned?' (banned)':''}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:14}}>
                  <label className="fl">Durasi</label>
                  <select className="fi" value={form.duration_type} onChange={e=>setForm(f=>({...f,duration_type:e.target.value}))}>
                    {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <label className="fl">Max HWID</label>
                  <input className="fi" type="number" min={1} max={999999999} value={form.hwid_max} onChange={e=>setForm(f=>({...f,hwid_max:e.target.value}))} required/>
                </div>
                <button type="submit" disabled={sending||!form.target_username} className="rs-btn">
                  {sending?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Mengirim...</>:'🚀 Kirim Key'}
                </button>
              </form>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['Total Dikirim',keys.length,'#f59e0b'],['Key Aktif',activeKeys,'#32ff7e']].map(([l,v,c],i)=>(
                <div key={l as string} className="rs-stat" style={{animation:`fadeUp .3s ease ${.1+i*.08}s both`}}>
                  <div className="rs-stat-val" style={{color:c as string}}>{v as number}</div>
                  <div className="rs-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab==='history'&&(
          <div style={{animation:'fadeUp .3s ease'}}>
            <div className="rs-card">
              <div className="rs-card-title">
                <div className="rs-card-bar"/>
                <div className="rs-card-label">HISTORY KEY <span style={{color:'#5a5a78',fontWeight:400,fontFamily:'Outfit,sans-serif',fontSize:'.8rem'}}>({keys.length})</span></div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Key</th><th>Dikirim ke</th><th>Durasi</th><th>Expired</th><th>Status</th><th>Pakai</th></tr></thead>
                  <tbody>
                    {keys.map((k,i)=>(
                      <tr key={k.id} style={{animation:`fadeUp .22s ease ${i*.025}s both`}}>
                        <td><span className="key-chip" onClick={()=>navigator.clipboard.writeText(k.key_value).then(()=>toast('Disalin!','success'))}>{k.key_value.length>20?k.key_value.slice(0,20)+'…':k.key_value}</span></td>
                        <td style={{fontWeight:700,color:'#e0e0f0'}}>{k.owner?.username||'-'}</td>
                        <td><span className="badge badge-b">{DUR[k.duration_type]||k.duration_type}</span></td>
                        <td style={{fontSize:'.8rem',color:isExpired(k.expires_at)?'#ff4757':'#9090a8'}}>{fmtDate(k.expires_at)}</td>
                        <td><span className={`badge ${k.is_active&&!isExpired(k.expires_at)?'badge-g':'badge-r'}`}>{k.is_active&&!isExpired(k.expires_at)?'Aktif':'Mati'}</span></td>
                        <td style={{color:'#5a5a78'}}>{k.times_used}×</td>
                      </tr>
                    ))}
                    {!keys.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'#5a5a70'}}>Belum ada history key</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BROADCAST */}
        {tab==='broadcast'&&(
          <div style={{animation:'fadeUp .3s ease',maxWidth:560}}>
            <div className="rs-card">
              <div className="rs-card-title">
                <div className="rs-card-bar"/>
                <div className="rs-card-label">BROADCAST PENGUMUMAN</div>
              </div>
              <div style={{fontSize:'.8rem',color:'#5a5a78',marginBottom:20,marginTop:-8}}>Dikirim sebagai: <strong style={{color:'#f59e0b'}}>by {user.username}</strong></div>
              <form onSubmit={sendBc}>
                <div style={{marginBottom:14}}><label className="fl">Judul</label><input className="fi" placeholder="Judul pengumuman..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
                <div style={{marginBottom:20}}><label className="fl">Isi Pesan</label><textarea className="fi" placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required style={{minHeight:110,resize:'vertical'}}/></div>
                <button type="submit" className="rs-btn">📢 Kirim ke Semua User</button>
              </form>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab==='users'&&(
          <div style={{animation:'fadeUp .3s ease'}}>
            <div className="rs-card">
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,alignItems:'center',marginBottom:20}}>
                <div className="rs-card-title" style={{marginBottom:0}}>
                  <div className="rs-card-bar"/>
                  <div className="rs-card-label">DAFTAR USER <span style={{color:'#5a5a78',fontWeight:400,fontFamily:'Outfit,sans-serif',fontSize:'.8rem'}}>({users.length})</span></div>
                </div>
                <input className="fi" style={{width:200}} placeholder="🔍 Cari username..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Username</th><th>Email</th><th>Key</th><th>Status</th></tr></thead>
                  <tbody>
                    {fu.map((u,i)=>(
                      <tr key={u.id} style={{animation:`fadeUp .22s ease ${i*.025}s both`}}>
                        <td style={{fontWeight:700,color:'#e0e0f0'}}>{u.username}</td>
                        <td style={{color:'#5a5a78',fontSize:'.8rem'}}>{u.email}</td>
                        <td>{u.keys?.[0]?.key_value?<span style={{fontFamily:'Rajdhani',fontSize:'.72rem',color:'#4facfe',letterSpacing:1}}>Ada Key</span>:<span style={{color:'#5a5a78',fontSize:'.8rem'}}>No Key</span>}</td>
                        <td><span className={`badge ${u.is_banned?'badge-r':'badge-g'}`}>{u.is_banned?'Banned':'Aktif'}</span></td>
                      </tr>
                    ))}
                    {!fu.length&&<tr><td colSpan={4} style={{textAlign:'center',padding:40,color:'#5a5a70'}}>Tidak ada user</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
