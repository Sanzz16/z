import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

async function api(path:string,method='GET',body?:any,token?:string|null){
  try{const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return r.json()}
  catch{return{error:'Koneksi gagal'}}
}
const DUR:Record<string,string>={'24h':'24 Jam','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const DURS=Object.keys(DUR)
function fmtDate(d:string|null){if(!d)return'∞ Lifetime';return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function isExpired(d:string|null){if(!d)return false;return new Date(d)<new Date()}

let _toast:(m:string,t?:string)=>void=()=>{}
function toast(m:string,t='info'){_toast(m,t)}

function ToastRoot(){
  const [items,setItems]=useState<any[]>([]);const id=useRef(0)
  useEffect(()=>{_toast=(msg,type='info')=>{const n=++id.current;const icon=type==='error'?'❌':type==='success'?'✅':type==='warn'?'⚠️':'ℹ️';setItems(p=>[...p,{id:n,msg,type,icon}]);setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),4000)}},[]  )
  return(
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:9,maxWidth:340,pointerEvents:'none'}}>
      {items.map(t=>(
        <div key={t.id} style={{background:'rgba(10,11,13,.97)',border:'1px solid rgba(255,255,255,.08)',borderLeft:`3px solid ${t.type==='success'?'#32ff7e':t.type==='error'?'#ff4757':t.type==='warn'?'#f59e0b':'#c77dff'}`,borderRadius:15,padding:'13px 16px',display:'flex',gap:10,alignItems:'flex-start',animation:'dvToastIn .35s cubic-bezier(.34,1.56,.64,1)',backdropFilter:'blur(14px)',boxShadow:'0 10px 36px rgba(0,0,0,.7)',pointerEvents:'all'}}>
          <span style={{fontSize:'1.05rem',flexShrink:0,lineHeight:1.4}}>{t.icon}</span>
          <div>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.85rem',color:'#fff',marginBottom:2}}>{t.type==='error'?'Error':t.type==='success'?'Sukses':'Info'}</div>
            <div style={{fontSize:'.78rem',color:'#8a8a9a',lineHeight:1.4}}>{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Modal({open,onClose,title,children,wide=false}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;wide?:boolean}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};if(open)window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[open])
  if(!open)return null
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',animation:'dvFadeIn .2s ease',padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'linear-gradient(160deg,#0f1014,#0a0b0e)',border:'1px solid rgba(168,85,247,.15)',borderRadius:24,padding:28,width:'100%',maxWidth:wide?680:500,maxHeight:'90vh',overflowY:'auto',animation:'dvModalIn .35s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 40px 80px rgba(0,0,0,.9),0 0 60px rgba(168,85,247,.06)',position:'relative'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(168,85,247,.6),transparent)',borderRadius:'24px 24px 0 0'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.2rem',fontWeight:700,background:'linear-gradient(135deg,#a855f7,#c77dff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{title}</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'#8a8a9a',borderRadius:9,padding:'5px 10px',cursor:'pointer',transition:'all .2s'}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Bdg({c,t}:{c:string,t:string}){
  const MAP:any={green:'bx-g',red:'bx-r',blue:'bx-b',yellow:'bx-y',purple:'bx-p',gray:'bx-gray'}
  return <span className={`bx ${MAP[c]||'bx-gray'}`}>{t}</span>
}

type Tab='send-key'|'users'|'keys'|'broadcast'|'global-key'|'resellers'|'getkey-settings'

const DV_CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html{scroll-behavior:smooth}
  body{background:#08090b;color:#e0e0e8;font-family:'Outfit',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 90% 0,rgba(168,85,247,.06),transparent),radial-gradient(ellipse 60% 40% at 5% 100%,rgba(124,58,237,.04),transparent);pointer-events:none;z-index:0}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0b0e}::-webkit-scrollbar-thumb{background:rgba(168,85,247,.25);border-radius:4px}
  @keyframes dvToastIn{from{transform:translateX(110px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes dvFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes dvModalIn{from{opacity:0;transform:scale(.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes dvFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dvSpin{to{transform:rotate(360deg)}}
  @keyframes dvScaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  @keyframes dvScanline{0%{transform:translateX(-100%)}50%,100%{transform:translateX(200%)}}
  @keyframes dvGlow{0%,100%{opacity:.5}50%{opacity:1}}
  /* ── NAVBAR ── */
  .dv-nav{position:sticky;top:0;z-index:200;height:64px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(8,9,11,.88);backdrop-filter:blur(28px) saturate(160%);border-bottom:1px solid rgba(255,255,255,.06)}
  .dv-nav::after{content:'';position:absolute;bottom:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.35) 40%,rgba(168,85,247,.35) 60%,transparent)}
  .dv-brand{font-family:'Orbitron',sans-serif;font-size:1.15rem;font-weight:900;background:linear-gradient(135deg,#7c3aed 20%,#c77dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;filter:drop-shadow(0 0 12px rgba(168,85,247,.45))}
  .dv-nav-actions{display:flex;gap:8px;align-items:center}
  .dv-badge-user{font-size:.72rem;color:#8a8a9a;background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.14);border-radius:8px;padding:3px 10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.5px}
  .dv-btn-nav{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#9a9aaa;border-radius:10px;padding:7px 13px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.5px;transition:all .2s}
  .dv-btn-nav:hover{background:rgba(255,255,255,.08);color:#fff}
  .dv-btn-logout{background:rgba(255,71,87,.07);border:1px solid rgba(255,71,87,.18);color:#ff5c69;border-radius:10px;padding:7px 13px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.5px;transition:all .2s}
  .dv-btn-logout:hover{background:rgba(255,71,87,.14)}
  /* ── TABS BAR ── */
  @keyframes dvTabIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .dv-tabs{display:flex;gap:3px;background:rgba(7,8,12,.82);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:5px;margin-bottom:28px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;backdrop-filter:blur(16px);box-shadow:0 2px 24px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04)}
  .dv-tabs::-webkit-scrollbar{display:none}
  .dv-tab{flex:1 0 auto;min-width:62px;padding:10px 10px;border-radius:15px;border:1px solid transparent;background:transparent;color:rgba(120,120,145,.5);cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.4px;transition:all .22s ease;display:flex;flex-direction:column;align-items:center;gap:5px;white-space:nowrap;position:relative;overflow:hidden}
  .dv-tab .ti{font-size:1.08rem;line-height:1;transition:transform .22s ease,filter .22s ease;filter:grayscale(60%) opacity(0.5)}
  .dv-tab .tl{font-size:.61rem;text-transform:uppercase;letter-spacing:1.2px;line-height:1;transition:color .2s}
  .dv-tab:hover{color:rgba(200,170,255,.8);background:rgba(168,85,247,.07);border-color:rgba(168,85,247,.12)}
  .dv-tab:hover .ti{transform:translateY(-2px);filter:grayscale(0%) opacity(1)}
  .dv-tab.active{color:#fff;background:linear-gradient(145deg,rgba(124,58,237,.22),rgba(168,85,247,.16));border-color:rgba(168,85,247,.28);box-shadow:0 4px 18px rgba(168,85,247,.2),inset 0 1px 0 rgba(255,255,255,.07)}
  .dv-tab.active .ti{transform:scale(1.1) translateY(-1px);filter:grayscale(0%) opacity(1) drop-shadow(0 0 7px rgba(168,85,247,.65))}
  .dv-tab.active .tl{color:rgba(220,180,255,.9)}
  /* ── CONTENT ── */
  .dv-wrap{max-width:1300px;margin:0 auto;padding:28px 24px}
  /* ── CARD ── */
  .dv-card{background:linear-gradient(160deg,rgba(255,255,255,.03),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:24px;position:relative;overflow:hidden;animation:dvFadeUp .32s ease;margin-bottom:20px}
  .dv-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.35),transparent)}
  .dv-card-title{display:flex;align-items:center;gap:10px;margin-bottom:20px}
  .dv-card-bar{width:3px;height:20px;background:linear-gradient(180deg,#7c3aed,#c77dff);border-radius:3px;flex-shrink:0}
  .dv-card-label{font-family:'Rajdhani',sans-serif;font-size:.9rem;font-weight:700;background:linear-gradient(135deg,#a855f7,#c77dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:.5px}
  /* ── FORM ── */
  .dv-fi{width:100%;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:13px;padding:11px 14px;color:#e0e0e8;font-size:.875rem;font-family:'Outfit',sans-serif;transition:all .2s;outline:none;-webkit-appearance:none}
  .dv-fi::placeholder{color:#444455}
  .dv-fi:hover{border-color:rgba(168,85,247,.2)}
  .dv-fi:focus{border-color:rgba(168,85,247,.45)!important;background:rgba(255,255,255,.05)!important;box-shadow:0 0 0 3px rgba(168,85,247,.09)!important;outline:none!important}
  .dv-fl{display:block;font-size:.78rem;color:#8a8a9a;font-weight:600;margin-bottom:6px}
  .dv-fg{margin-bottom:15px}
  /* ── BUTTONS ── */
  .dv-btn-primary{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:13px;padding:12px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.5px;box-shadow:0 4px 18px rgba(168,85,247,.28),inset 0 1px 0 rgba(255,255,255,.1);transition:all .2s;width:100%}
  .dv-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 24px rgba(168,85,247,.4)}
  .dv-btn-primary:disabled{background:rgba(255,255,255,.06);color:#444455;cursor:not-allowed;box-shadow:none;transform:none}
  .dv-btn-green{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:13px;padding:11px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;flex:1;box-shadow:0 4px 16px rgba(34,197,94,.22);letter-spacing:.5px}
  .dv-btn-red{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;border:none;border-radius:13px;padding:11px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;flex:1;box-shadow:0 4px 16px rgba(220,38,38,.22);letter-spacing:.5px}
  .dv-btn-gold{background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;border:none;border-radius:13px;padding:10px 18px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;box-shadow:0 4px 16px rgba(245,158,11,.22);letter-spacing:.5px;white-space:nowrap}
  .dv-btn-sec{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#9a9aaa;border-radius:13px;padding:11px 16px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;transition:all .2s}
  .dv-btn-sec:hover{background:rgba(255,255,255,.09);color:#fff}
  .dv-btn-act{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#8a8a9a;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem;transition:all .2s}
  .dv-btn-act:hover{background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.25);color:#c77dff}
  .dv-btn-ban{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);color:#ff5c69;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem;transition:all .2s}
  .dv-btn-unban{background:rgba(50,255,126,.08);border:1px solid rgba(50,255,126,.2);color:#32ff7e;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem;transition:all .2s}
  .dv-btn-del{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);color:#ff5c69;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem;transition:all .2s}
  /* ── TABLE ── */
  .dv-tbl-wrap{border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;overflow-x:auto}
  .dv-tbl{width:100%;border-collapse:collapse}
  .dv-tbl th{padding:11px 16px;text-align:left;font-family:'Rajdhani',sans-serif;font-weight:700;color:#444455;font-size:.7rem;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
  .dv-tbl td{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.04);color:#c0c0c8;font-size:.84rem;vertical-align:middle}
  .dv-tbl tr:last-child td{border-bottom:none}
  .dv-tbl tr:hover td{background:rgba(168,85,247,.025)}
  /* ── BADGE ── */
  .bx{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:.67rem;font-weight:700;letter-spacing:.6px;border:1px solid}
  .bx-g{background:rgba(50,255,126,.09);color:#32ff7e;border-color:rgba(50,255,126,.22)}
  .bx-r{background:rgba(255,71,87,.09);color:#ff5c69;border-color:rgba(255,71,87,.22)}
  .bx-b{background:rgba(79,172,254,.09);color:#4facfe;border-color:rgba(79,172,254,.22)}
  .bx-y{background:rgba(245,158,11,.09);color:#f59e0b;border-color:rgba(245,158,11,.22)}
  .bx-p{background:rgba(168,85,247,.09);color:#c77dff;border-color:rgba(168,85,247,.22)}
  .bx-gray{background:rgba(100,116,139,.1);color:#94a3b8;border-color:rgba(100,116,139,.2)}
  /* ── MISC ── */
  .dv-stat{background:linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;text-align:center}
  .dv-stat-val{font-family:'Rajdhani',sans-serif;font-size:2.4rem;font-weight:700;line-height:1}
  .dv-stat-lbl{font-size:.67rem;color:#444455;text-transform:uppercase;letter-spacing:1.5px;margin-top:6px}
  .dv-key-chip{font-family:'Rajdhani',sans-serif;font-size:.7rem;color:#4facfe;letter-spacing:1px;cursor:pointer;background:rgba(79,172,254,.06);border:1px solid rgba(79,172,254,.18);border-radius:8px;padding:4px 9px;display:inline-block;transition:all .2s}
  .dv-key-chip:hover{background:rgba(79,172,254,.12);border-color:rgba(79,172,254,.35)}
  .dv-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:dvSpin .7s linear infinite}
  .dv-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);margin:16px 0}
  .dv-step-row{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;transition:border-color .2s}
  .dv-step-row.active{border-color:rgba(168,85,247,.22)}
  .dv-step-num{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.85rem;flex-shrink:0;transition:all .2s}
  /* ── AUTH ── */
  .dv-auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .dv-auth-box{width:100%;max-width:420px;animation:dvScaleIn .4s cubic-bezier(.34,1.56,.64,1)}
  .dv-auth-logo{text-align:center;margin-bottom:32px}
  .dv-auth-title{font-family:'Orbitron',sans-serif;font-size:2.6rem;font-weight:900;background:linear-gradient(135deg,#7c3aed 20%,#c77dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;filter:drop-shadow(0 0 20px rgba(168,85,247,.5))}
  .dv-auth-sub{font-size:.68rem;color:#333344;letter-spacing:4px;text-transform:uppercase;margin-top:7px}
  .dv-auth-card{background:linear-gradient(160deg,rgba(168,85,247,.07),rgba(124,58,237,.03));border:1px solid rgba(168,85,247,.18);border-radius:22px;padding:28px;box-shadow:0 0 60px rgba(168,85,247,.07),0 20px 60px rgba(0,0,0,.5)}
  input:focus,select:focus,textarea:focus{border-color:rgba(168,85,247,.45)!important;outline:none!important;box-shadow:0 0 0 3px rgba(168,85,247,.09)!important}
`

export default function DevPage(){
  const router=useRouter()
  const [token,setToken]=useState<string|null>(null)
  const [user,setUser]=useState<any>(null)
  const [tab,setTab]=useState<Tab>('send-key')
  const [booting,setBooting]=useState(true)
  const [loginForm,setLoginForm]=useState({username:'',password:''})
  const [showPw,setShowPw]=useState(false)
  const [epw,setEpw]=useState(false)
  const [logging,setLogging]=useState(false)
  const [users,setUsers]=useState<any[]>([])
  const [keys,setKeys]=useState<any[]>([])
  const [gkSteps,setGkSteps]=useState<any[]>([])
  const [search,setSearch]=useState('')
  const [sendForm,setSendForm]=useState({target_username:'',duration_type:'24h',hwid_max:'1'})
  const [sending,setSending]=useState(false)
  const [bc,setBc]=useState({title:'',content:''})
  const [gk,setGk]=useState({duration_type:'24h',hwid_max:'1'})
  const [editUser,setEditUser]=useState<any>(null)
  const [editKey,setEditKey]=useState<any>(null)
  const [banModal,setBanModal]=useState<any>(null)
  const [banReason,setBanReason]=useState('')
  const [addStep,setAddStep]=useState({name:'',url:'',duration_seconds:'30'})
  const [editStep,setEditStep]=useState<any>(null)

  useEffect(()=>{
    const devTok=localStorage.getItem('awr_dev_token')
    const mainTok=localStorage.getItem('awr_token')||sessionStorage.getItem('awr_token')
    const saved=devTok||mainTok
    if(saved){api('/user/profile','GET',undefined,saved).then(d=>{if(d.user?.role==='developer'){setToken(saved);setUser(d.user);if(!devTok)localStorage.setItem('awr_dev_token',saved)}else localStorage.removeItem('awr_dev_token');setBooting(false)})}
    else setBooting(false)
  },[])

  useEffect(()=>{if(token){loadUsers();loadKeys();loadGkSteps()}},[token])

  const loadUsers=()=>api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
  const loadKeys=()=>api('/developer/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  const loadGkSteps=()=>api('/developer/getkey-settings','GET',undefined,token).then(d=>{if(d.steps)setGkSteps(d.steps)})

  async function login(e:React.FormEvent){e.preventDefault();setLogging(true);const d=await api('/auth/login','POST',{...loginForm,rememberMe:true});setLogging(false);if(d.error){toast(d.error,'error');return};if(d.user?.role!=='developer'){toast('Akun ini bukan developer!','error');return};localStorage.setItem('awr_dev_token',d.token);setToken(d.token);setUser(d.user);toast('Selamat datang, '+d.user.username+'!','success')}
  async function sendKey(e:React.FormEvent){e.preventDefault();setSending(true);const d=await api('/developer/keys','POST',sendForm,token);setSending(false);if(d.error){toast(d.error,'error');return};toast('Key dikirim ke '+sendForm.target_username+'!','success');setSendForm(f=>({...f,target_username:'',hwid_max:'1'}));loadKeys()}
  async function saveEditUser(){const d=await api('/developer/users','PATCH',editUser,token);if(d.error){toast(d.error,'error');return};toast('User diupdate!','success');setEditUser(null);loadUsers()}
  async function saveEditKey(){const d=await api('/developer/keys','PATCH',editKey,token);if(d.error){toast(d.error,'error');return};toast('Key diupdate!','success');setEditKey(null);loadKeys()}
  async function doBan(action:string){const d=await api('/developer/ban','POST',{userId:banModal.id,action,reason:banReason},token);if(d.error){toast(d.error,'error');return};toast(d.message,'success');setBanModal(null);setBanReason('');loadUsers()}
  async function delKey(id:string){if(!confirm('Hapus key ini?'))return;const d=await api('/developer/keys','DELETE',{keyId:id},token);if(d.error){toast(d.error,'error');return};toast('Key dihapus','info');loadKeys()}
  async function sendBc(e:React.FormEvent){e.preventDefault();const d=await api('/developer/broadcast','POST',bc,token);if(d.error){toast(d.error,'error');return};toast(d.message,'success');setBc({title:'',content:''})}
  async function sendGk(e:React.FormEvent){e.preventDefault();const d=await api('/developer/send-key-all','POST',gk,token);if(d.error){toast(d.error,'error');return};toast(`Key dikirim! ${d.notified} user dinotif`,'success')}
  async function setRole(uid:string,role:string){const d=await api('/developer/users','PATCH',{userId:uid,role},token);if(d.error){toast(d.error,'error');return};toast('Role diupdate!','success');loadUsers()}
  async function addGkStep(e:React.FormEvent){e.preventDefault();const d=await api('/developer/getkey-settings','POST',{...addStep,duration_seconds:parseInt(addStep.duration_seconds)},token);if(d.error){toast(d.error,'error');return};toast('Step ditambah!','success');setAddStep({name:'',url:'',duration_seconds:'30'});loadGkSteps()}
  async function toggleStep(id:string,is_active:boolean){await api('/developer/getkey-settings','PATCH',{id,is_active},token);loadGkSteps()}
  async function saveEditStep(){const d=await api('/developer/getkey-settings','PATCH',{id:editStep.id,name:editStep.name,url:editStep.url,duration_seconds:parseInt(editStep.duration_seconds)},token);if(d.error){toast(d.error,'error');return};toast('Step diupdate!','success');setEditStep(null);loadGkSteps()}
  async function delStep(id:string){if(!confirm('Hapus step ini?'))return;const d=await api('/developer/getkey-settings','DELETE',{id},token);if(d.error){toast(d.error,'error');return};toast('Step dihapus','info');loadGkSteps()}
  function logout(){localStorage.removeItem('awr_dev_token');setToken(null);setUser(null)}

  if(booting)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#08090b'}}><style>{`@keyframes dvSpin{to{transform:rotate(360deg)}}`}</style><div style={{width:38,height:38,border:'2px solid rgba(168,85,247,.15)',borderTopColor:'#a855f7',borderRadius:'50%',animation:'dvSpin .7s linear infinite'}}/></div>)

  if(!token)return(
    <><Head><title>Developer — AWR</title></Head><style>{DV_CSS}</style><ToastRoot/>
    <div className="dv-auth-wrap"><div className="dv-auth-box">
      <div className="dv-auth-logo">
        <div className="dv-auth-title">👑 DEV</div>
        <div className="dv-auth-sub">Developer Panel · AWR Key System</div>
      </div>
      <div className="dv-auth-card">
        <form onSubmit={login}>
          <div className="dv-fg"><label className="dv-fl">Username</label><input className="dv-fi" placeholder="Username developer..." value={loginForm.username} onChange={e=>setLoginForm(f=>({...f,username:e.target.value}))} required/></div>
          <div style={{marginBottom:22}}><label className="dv-fl">Password</label>
            <div style={{position:'relative'}}>
              <input className="dv-fi" style={{paddingRight:44}} type={showPw?'text':'password'} placeholder="Password..." value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#444455',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button>
            </div>
          </div>
          <button type="submit" className="dv-btn-primary" disabled={logging}>{logging?<><div className="dv-spin"/>Loading...</>:'👑 Masuk Developer Panel'}</button>
        </form>
      </div>
    </div></div></>
  )

  const fu=users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))
  const TABS:[Tab,string,string][]=[
    ['send-key','🔑','Kirim Key'],
    ['users','👥','Users'],
    ['keys','📋','Keys'],
    ['broadcast','📢','Broadcast'],
    ['global-key','🎁','Global'],
    ['resellers','🏪','Reseller'],
    ['getkey-settings','⚙️','GetKey'],
  ]

  const CardSection=({title,children,extra}:{title:string,children:React.ReactNode,extra?:React.ReactNode})=>(
    <div className="dv-card">
      <div className="dv-card-title">
        <div className="dv-card-bar"/>
        <div className="dv-card-label">{title}</div>
        {extra&&<div style={{marginLeft:'auto'}}>{extra}</div>}
      </div>
      {children}
    </div>
  )

  return(
    <><Head><title>Developer Panel — AWR</title></Head>
    <style>{DV_CSS}</style>
    <ToastRoot/>

    <nav className="dv-nav">
      <div className="dv-brand">👑 AWR DEV</div>
      <div className="dv-nav-actions">
        <span className="dv-badge-user">{user.username}</span>
        <button className="dv-btn-nav" onClick={()=>router.push('/')}>🏠 Website</button>
        <button className="dv-btn-logout" onClick={logout}>🚪 Logout</button>
      </div>
    </nav>

    <div className="dv-wrap">
      {/* ── TABS BAR ── */}
      <div className="dv-tabs">
        {TABS.map(([v,icon,lbl],i)=>(
          <button key={v} className={`dv-tab${tab===v?' active':''}`} onClick={()=>setTab(v)} style={{animation:`dvTabIn .3s ease ${i*.05}s both`}}>
            <span className="ti">{icon}</span>
            <span className="tl">{lbl}</span>
          </button>
        ))}
      </div>

      {/* SEND KEY */}
      {tab==='send-key'&&<div style={{animation:'dvFadeUp .3s ease'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#c77dff'}}>{keys.length}</div><div className="dv-stat-lbl">Total Key</div></div>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#32ff7e'}}>{keys.filter(k=>k.is_active&&!isExpired(k.expires_at)).length}</div><div className="dv-stat-lbl">Aktif</div></div>
        </div>
        <CardSection title="KIRIM KEY KE USER">
          <form onSubmit={sendKey} style={{maxWidth:480}}>
            <div className="dv-fg"><label className="dv-fl">Username Tujuan</label>
              <select className="dv-fi" value={sendForm.target_username} onChange={e=>setSendForm(f=>({...f,target_username:e.target.value}))} required>
                <option value="">— Pilih Username —</option>
                {users.map(u=><option key={u.id} value={u.username}>{u.username}{u.is_banned?' (banned)':''}</option>)}
              </select>
            </div>
            <div className="dv-fg"><label className="dv-fl">Durasi</label>
              <select className="dv-fi" value={sendForm.duration_type} onChange={e=>setSendForm(f=>({...f,duration_type:e.target.value}))}>
                {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" min={1} value={sendForm.hwid_max} onChange={e=>setSendForm(f=>({...f,hwid_max:e.target.value}))} required/></div>
            <button type="submit" className="dv-btn-primary" disabled={sending||!sendForm.target_username}>{sending?<><div className="dv-spin"/>Mengirim...</>:'🚀 Kirim Key'}</button>
          </form>
        </CardSection>
      </div>}

      {/* USERS */}
      {tab==='users'&&<CardSection title={`SEMUA USER (${users.length})`} extra={<input className="dv-fi" style={{width:220}} placeholder="🔍 Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>}>
        <div className="dv-tbl-wrap"><table className="dv-tbl">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Key</th><th>Exec</th><th>Aksi</th></tr></thead>
          <tbody>
            {fu.map((u,i)=><tr key={u.id} style={{animation:`dvFadeUp .22s ease ${i*.028}s both`}}>
              <td style={{fontWeight:700,color:'#e0e0e8'}}>{u.username}</td>
              <td style={{color:'#444455',fontSize:'.8rem'}}>{u.email}</td>
              <td><Bdg c={u.role==='developer'?'purple':u.role==='reseller'?'yellow':'blue'} t={u.role}/></td>
              <td><Bdg c={u.is_banned?'red':'green'} t={u.is_banned?'Banned':'Aktif'}/></td>
              <td>{u.keys?.[0]?.key_value?<span className="dv-key-chip">{u.keys[0].key_value.slice(0,12)}…</span>:<Bdg c="gray" t="No Key"/>}</td>
              <td style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#c77dff'}}>{u.total_executions||0}</td>
              <td><div style={{display:'flex',gap:6}}>
                <button className="dv-btn-act" onClick={()=>setEditUser({userId:u.id,username:u.username,email:u.email,role:u.role,roblox_username:u.roblox_username||'',password:''})}>✏️</button>
                {u.is_banned?<button className="dv-btn-unban" onClick={()=>{setBanModal(u);setBanReason('')}}>✅</button>:<button className="dv-btn-ban" onClick={()=>{setBanModal(u);setBanReason('')}}>🚫</button>}
              </div></td>
            </tr>)}
            {!fu.length&&<tr><td colSpan={7} style={{textAlign:'center',padding:'36px 0',color:'#333344'}}>Tidak ada user</td></tr>}
          </tbody>
        </table></div>
      </CardSection>}

      {/* KEYS */}
      {tab==='keys'&&<CardSection title={`SEMUA KEY (${keys.length})`}>
        <div className="dv-tbl-wrap"><table className="dv-tbl">
          <thead><tr><th>Key</th><th>Owner</th><th>Dibuat</th><th>Durasi</th><th>Expired</th><th>HWID</th><th>Pakai</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {keys.map(k=><tr key={k.id}>
              <td><span className="dv-key-chip" onClick={()=>navigator.clipboard.writeText(k.key_value).then(()=>toast('Disalin!','success'))}>{k.key_value.slice(0,16)}…</span></td>
              <td style={{fontWeight:700,color:'#e0e0e8'}}>{k.owner?.username||<Bdg c="yellow" t="Shared"/>}</td>
              <td style={{color:'#444455',fontSize:'.78rem'}}>{k.creator?.username||'—'}</td>
              <td><Bdg c="blue" t={DUR[k.duration_type]||k.duration_type}/></td>
              <td style={{fontSize:'.8rem',color:isExpired(k.expires_at)?'#ff5c69':'#8a8a9a'}}>{fmtDate(k.expires_at)}</td>
              <td style={{color:'#8a8a9a'}}>{k.hwid_max}</td>
              <td style={{color:'#444455',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>{k.times_used}×</td>
              <td><Bdg c={k.is_active&&!isExpired(k.expires_at)?'green':'red'} t={k.is_active&&!isExpired(k.expires_at)?'Aktif':'Mati'}/></td>
              <td><div style={{display:'flex',gap:6}}>
                <button className="dv-btn-act" onClick={()=>setEditKey({keyId:k.id,is_active:k.is_active,hwid_max:k.hwid_max,duration_type:k.duration_type,assigned_to_username:k.owner?.username||''})}>✏️</button>
                <button className="dv-btn-del" onClick={()=>delKey(k.id)}>🗑️</button>
              </div></td>
            </tr>)}
            {!keys.length&&<tr><td colSpan={9} style={{textAlign:'center',padding:'36px 0',color:'#333344'}}>Belum ada key</td></tr>}
          </tbody>
        </table></div>
      </CardSection>}

      {/* BROADCAST */}
      {tab==='broadcast'&&<div style={{maxWidth:560}}><CardSection title="BROADCAST PENGUMUMAN">
        <div style={{fontSize:'.82rem',color:'#444455',marginBottom:18,marginTop:-10}}>Dikirim sebagai: <strong style={{color:'#c77dff'}}>by Developer</strong></div>
        <form onSubmit={sendBc}>
          <div className="dv-fg"><label className="dv-fl">Judul</label><input className="dv-fi" placeholder="Judul pengumuman..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
          <div style={{marginBottom:20}}><label className="dv-fl">Isi Pesan</label><textarea className="dv-fi" placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required style={{minHeight:110,resize:'vertical'}}/></div>
          <button type="submit" className="dv-btn-primary">📢 Kirim ke Semua User</button>
        </form>
      </CardSection></div>}

      {/* GLOBAL KEY */}
      {tab==='global-key'&&<div style={{maxWidth:480}}><CardSection title="KEY GLOBAL KE SEMUA USER">
        <div style={{background:'rgba(251,191,36,.05)',border:'1px solid rgba(251,191,36,.18)',borderRadius:12,padding:'12px 16px',marginBottom:18,marginTop:-10,fontSize:'.82rem',color:'#fbbf24'}}>⚠️ Key ini bisa dipakai semua user. Semua user dapat notifikasi.</div>
        <form onSubmit={sendGk}>
          <div className="dv-fg"><label className="dv-fl">Durasi</label>
            <select className="dv-fi" value={gk.duration_type} onChange={e=>setGk(g=>({...g,duration_type:e.target.value}))}>
              {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
            </select>
          </div>
          <div style={{marginBottom:20}}><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" min={1} value={gk.hwid_max} onChange={e=>setGk(g=>({...g,hwid_max:e.target.value}))}/></div>
          <button type="submit" className="dv-btn-primary">🚀 Kirim ke Semua</button>
        </form>
      </CardSection></div>}

      {/* RESELLERS */}
      {tab==='resellers'&&<div style={{maxWidth:620}}><CardSection title="MANAJEMEN RESELLER">
        <div className="dv-fg"><label className="dv-fl">Jadikan Reseller</label>
          <div style={{display:'flex',gap:8}}>
            <select id="rs-sel" className="dv-fi" style={{flex:1}}>
              <option value="">— Pilih User —</option>
              {users.filter(u=>u.role==='user').map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
            <button onClick={()=>{const v=(document.getElementById('rs-sel') as HTMLSelectElement)?.value;if(v)setRole(v,'reseller')}} className="dv-btn-gold">✅ Set</button>
          </div>
        </div>
        <div className="dv-divider"/>
        <div className="dv-tbl-wrap"><table className="dv-tbl">
          <thead><tr><th>Username</th><th>Email</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.filter(u=>u.role==='reseller').map(u=><tr key={u.id}>
              <td style={{fontWeight:700,color:'#e0e0e8'}}>{u.username}</td>
              <td style={{color:'#444455'}}>{u.email}</td>
              <td><button className="dv-btn-ban" onClick={()=>setRole(u.id,'user')}>Copot Reseller</button></td>
            </tr>)}
            {!users.filter(u=>u.role==='reseller').length&&<tr><td colSpan={3} style={{textAlign:'center',padding:'28px 0',color:'#333344'}}>Belum ada reseller</td></tr>}
          </tbody>
        </table></div>
      </CardSection></div>}

      {/* GETKEY SETTINGS */}
      {tab==='getkey-settings'&&<CardSection title="SETTING GETKEY STEPS">
        <div style={{fontSize:'.82rem',color:'#444455',marginBottom:18,marginTop:-10}}>Atur step yang harus diselesaikan user untuk dapat free key.</div>
        {gkSteps.map((s,i)=>(
          <div key={s.id} className={`dv-step-row${s.is_active?' active':''}`} style={{animation:`dvFadeUp .22s ease ${i*.04}s both`}}>
            <div className="dv-step-num" style={{background:s.is_active?'rgba(168,85,247,.15)':'rgba(255,255,255,.04)',border:`2px solid ${s.is_active?'rgba(168,85,247,.5)':'rgba(255,255,255,.1)'}`,color:s.is_active?'#c77dff':'#444455'}}>{s.order_index}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'.9rem',color:'#e0e0e8'}}>{s.name}</div>
              <div style={{fontSize:'.75rem',color:'#444455',marginTop:3}}>⏱️ {s.duration_seconds}s · <span style={{color:'#4facfe'}}>{s.url.length>45?s.url.slice(0,45)+'…':s.url}</span></div>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>toggleStep(s.id,!s.is_active)} style={{background:s.is_active?'rgba(50,255,126,.08)':'rgba(255,71,87,.08)',border:`1px solid ${s.is_active?'rgba(50,255,126,.2)':'rgba(255,71,87,.2)'}`,color:s.is_active?'#32ff7e':'#ff5c69',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:'.78rem',fontWeight:700,fontFamily:'Rajdhani,sans-serif'}}>{s.is_active?'● ON':'○ OFF'}</button>
              <button className="dv-btn-act" onClick={()=>setEditStep({...s,duration_seconds:s.duration_seconds.toString()})}>✏️</button>
              <button className="dv-btn-del" onClick={()=>delStep(s.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {!gkSteps.length&&<div style={{textAlign:'center',color:'#333344',padding:'20px 0 4px'}}>Belum ada step. Tambah di bawah.</div>}
        <div className="dv-divider"/>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'.95rem',fontWeight:700,color:'#c77dff',marginBottom:14}}>➕ Tambah Step</div>
        <form onSubmit={addGkStep}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 100px',gap:12,marginBottom:12}}>
            <div><label className="dv-fl">Nama Step</label><input className="dv-fi" placeholder="Nama step..." value={addStep.name} onChange={e=>setAddStep(s=>({...s,name:e.target.value}))} required/></div>
            <div><label className="dv-fl">Detik</label><input className="dv-fi" type="number" min={5} max={300} value={addStep.duration_seconds} onChange={e=>setAddStep(s=>({...s,duration_seconds:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:16}}><label className="dv-fl">URL</label><input className="dv-fi" placeholder="https://..." value={addStep.url} onChange={e=>setAddStep(s=>({...s,url:e.target.value}))} required/></div>
          <button type="submit" className="dv-btn-primary" style={{width:'auto',padding:'10px 24px'}}>➕ Tambah Step</button>
        </form>
      </CardSection>}
    </div>

    {/* ── MODALS ── */}
    <Modal open={!!editUser} onClose={()=>setEditUser(null)} title="✏️ Edit User">
      {editUser&&<>
        {[['Username','username','text'],['Email','email','email'],['Roblox','roblox_username','text']].map(([l,k,t])=>(
          <div key={k as string} className="dv-fg"><label className="dv-fl">{l as string}</label><input className="dv-fi" type={t as string} value={editUser[k as string]} onChange={e=>setEditUser((u:any)=>({...u,[k as string]:e.target.value}))}/></div>
        ))}
        <div className="dv-fg"><label className="dv-fl">Role</label>
          <select className="dv-fi" value={editUser.role} onChange={e=>setEditUser((u:any)=>({...u,role:e.target.value}))}>
            <option value="user">👤 User</option><option value="reseller">🏪 Reseller</option><option value="developer">👑 Developer</option>
          </select>
        </div>
        <div style={{marginBottom:20}}><label className="dv-fl">Password Baru (kosong = tidak ganti)</label>
          <div style={{position:'relative'}}>
            <input className="dv-fi" style={{paddingRight:44}} type={epw?'text':'password'} placeholder="Password baru..." value={editUser.password} onChange={e=>setEditUser((u:any)=>({...u,password:e.target.value}))}/>
            <button type="button" onClick={()=>setEpw(!epw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#444455',cursor:'pointer'}}>{epw?'🙈':'👁️'}</button>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={saveEditUser} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button>
          <button onClick={()=>setEditUser(null)} className="dv-btn-sec">Batal</button>
        </div>
      </>}
    </Modal>

    <Modal open={!!editKey} onClose={()=>setEditKey(null)} title="✏️ Edit Key">
      {editKey&&<>
        <div className="dv-fg"><label className="dv-fl">Assign ke Username</label><input className="dv-fi" placeholder="Username..." value={editKey.assigned_to_username} onChange={e=>setEditKey((k:any)=>({...k,assigned_to_username:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Durasi</label>
          <select className="dv-fi" value={editKey.duration_type} onChange={e=>setEditKey((k:any)=>({...k,duration_type:e.target.value}))}>
            {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
          </select>
        </div>
        <div className="dv-fg"><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" value={editKey.hwid_max} onChange={e=>setEditKey((k:any)=>({...k,hwid_max:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label className="dv-fl">Status</label>
          <select className="dv-fi" value={editKey.is_active?'1':'0'} onChange={e=>setEditKey((k:any)=>({...k,is_active:e.target.value==='1'}))}>
            <option value="1">✅ Aktif</option><option value="0">❌ Nonaktif</option>
          </select>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={saveEditKey} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button>
          <button onClick={()=>setEditKey(null)} className="dv-btn-sec">Batal</button>
        </div>
      </>}
    </Modal>

    <Modal open={!!editStep} onClose={()=>setEditStep(null)} title="✏️ Edit Step">
      {editStep&&<>
        <div className="dv-fg"><label className="dv-fl">Nama</label><input className="dv-fi" value={editStep.name} onChange={e=>setEditStep((s:any)=>({...s,name:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">URL</label><input className="dv-fi" value={editStep.url} onChange={e=>setEditStep((s:any)=>({...s,url:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label className="dv-fl">Durasi (detik)</label><input className="dv-fi" type="number" min={5} max={300} value={editStep.duration_seconds} onChange={e=>setEditStep((s:any)=>({...s,duration_seconds:e.target.value}))}/></div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={saveEditStep} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button>
          <button onClick={()=>setEditStep(null)} className="dv-btn-sec">Batal</button>
        </div>
      </>}
    </Modal>

    <Modal open={!!banModal} onClose={()=>setBanModal(null)} title={banModal?.is_banned?'✅ Unban User':'🚫 Ban User'}>
      {banModal&&<>
        <p style={{fontSize:'.85rem',color:'#8a8a9a',marginBottom:16}}>{banModal.is_banned?`Unban ${banModal.username}?`:`Ban ${banModal.username}? Semua key akan dimatikan.`}</p>
        {!banModal.is_banned&&<div style={{marginBottom:16}}><label className="dv-fl">Alasan Ban</label><input className="dv-fi" placeholder="Alasan ban..." value={banReason} onChange={e=>setBanReason(e.target.value)}/></div>}
        <div style={{display:'flex',gap:10}}>
          {banModal.is_banned?<button onClick={()=>doBan('unban')} className="dv-btn-green">✅ Unban</button>:<button onClick={()=>doBan('ban')} className="dv-btn-red">🚫 Ban</button>}
          <button onClick={()=>setBanModal(null)} className="dv-btn-sec">Batal</button>
        </div>
      </>}
    </Modal>
    </>
  )
}
