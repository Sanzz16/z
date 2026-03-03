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
  const [items,setItems]=useState<any[]>([])
  const id=useRef(0)
  useEffect(()=>{_toast=(msg,type='info')=>{const n=++id.current;const icon=type==='error'?'❌':type==='success'?'✅':type==='warn'?'⚠️':'ℹ️';setItems(p=>[...p,{id:n,msg,type,icon}]);setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),4000)}},[])
  return <div className="toast-root">{items.map(t=><div key={t.id} className={`toast-item ${t.type}`}><span className="toast-icon">{t.icon}</span><div><div className="toast-title">{t.type==='error'?'Error':t.type==='success'?'Sukses':'Info'}</div><div className="toast-msg">{t.msg}</div></div></div>)}</div>
}

function Modal({open,onClose,title,children,size=''}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;size?:string}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};if(open)window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[open])
  if(!open)return null
  return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className={`modal-box ${size}`}><div className="modal-header"><div className="modal-title">{title}</div><button className="modal-close" onClick={onClose}>✕</button></div>{children}</div></div>
}

function badge(color:string,text:string){return <span className={`badge badge-${color}`}>{text}</span>}

type Tab='send-key'|'users'|'keys'|'broadcast'|'global-key'|'resellers'|'getkey-settings'

export default function DevPage(){
  const router=useRouter()
  const [token,setToken]=useState<string|null>(null)
  const [user,setUser]=useState<any>(null)
  const [tab,setTab]=useState<Tab>('send-key')
  const [booting,setBooting]=useState(true)
  const [loginForm,setLoginForm]=useState({username:'',password:''})
  const [showPw,setShowPw]=useState(false)
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
    const devTok = localStorage.getItem('awr_dev_token')
    const mainTok = localStorage.getItem('awr_token') || sessionStorage.getItem('awr_token')
    const saved = devTok || mainTok
    if(saved){
      api('/user/profile','GET',undefined,saved).then(d=>{
        if(d.user?.role==='developer'){
          setToken(saved); setUser(d.user)
          if(!devTok) localStorage.setItem('awr_dev_token', saved)
        } else {
          localStorage.removeItem('awr_dev_token')
        }
        setBooting(false)
      })
    } else { setBooting(false) }
  },[])

  useEffect(()=>{if(token){loadUsers();loadKeys();loadGkSteps()}},[token])

  const loadUsers=()=>api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
  const loadKeys=()=>api('/developer/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  const loadGkSteps=()=>api('/developer/getkey-settings','GET',undefined,token).then(d=>{if(d.steps)setGkSteps(d.steps)})

  async function login(e:React.FormEvent){
    e.preventDefault();setLogging(true)
    const d=await api('/auth/login','POST',{...loginForm,rememberMe:true})
    setLogging(false)
    if(d.error){toast(d.error,'error');return}
    if(d.user?.role!=='developer'){toast('Akun ini bukan developer!','error');return}
    localStorage.setItem('awr_dev_token',d.token);setToken(d.token);setUser(d.user)
    toast('Selamat datang, '+d.user.username+'!','success')
  }

  async function sendKey(e:React.FormEvent){
    e.preventDefault();setSending(true)
    const d=await api('/developer/keys','POST',sendForm,token)
    setSending(false)
    if(d.error){toast(d.error,'error');return}
    toast('Key dikirim ke '+sendForm.target_username+'!','success')
    setSendForm(f=>({...f,target_username:'',hwid_max:'1'}));loadKeys()
  }
  async function saveEditUser(){
    const d=await api('/developer/users','PATCH',editUser,token)
    if(d.error){toast(d.error,'error');return}
    toast('User diupdate!','success');setEditUser(null);loadUsers()
  }
  async function saveEditKey(){
    const d=await api('/developer/keys','PATCH',editKey,token)
    if(d.error){toast(d.error,'error');return}
    toast('Key diupdate!','success');setEditKey(null);loadKeys()
  }
  async function doBan(action:string){
    const d=await api('/developer/ban','POST',{userId:banModal.id,action,reason:banReason},token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success');setBanModal(null);setBanReason('');loadUsers()
  }
  async function delKey(id:string){
    if(!confirm('Hapus key ini?'))return
    const d=await api('/developer/keys','DELETE',{keyId:id},token)
    if(d.error){toast(d.error,'error');return}
    toast('Key dihapus','info');loadKeys()
  }
  async function sendBc(e:React.FormEvent){
    e.preventDefault()
    const d=await api('/developer/broadcast','POST',bc,token)
    if(d.error){toast(d.error,'error');return}
    toast(d.message,'success');setBc({title:'',content:''})
  }
  async function sendGk(e:React.FormEvent){
    e.preventDefault()
    const d=await api('/developer/send-key-all','POST',gk,token)
    if(d.error){toast(d.error,'error');return}
    toast(`Key dikirim! ${d.notified} user dinotif`,'success')
  }
  async function setRole(uid:string,role:string){
    const d=await api('/developer/users','PATCH',{userId:uid,role},token)
    if(d.error){toast(d.error,'error');return}
    toast('Role diupdate!','success');loadUsers()
  }
  async function addGkStep(e:React.FormEvent){
    e.preventDefault()
    const d=await api('/developer/getkey-settings','POST',{...addStep,duration_seconds:parseInt(addStep.duration_seconds)},token)
    if(d.error){toast(d.error,'error');return}
    toast('Step ditambah!','success');setAddStep({name:'',url:'',duration_seconds:'30'});loadGkSteps()
  }
  async function toggleStep(id:string,is_active:boolean){
    await api('/developer/getkey-settings','PATCH',{id,is_active},token);loadGkSteps()
  }
  async function saveEditStep(){
    const d=await api('/developer/getkey-settings','PATCH',{id:editStep.id,name:editStep.name,url:editStep.url,duration_seconds:parseInt(editStep.duration_seconds)},token)
    if(d.error){toast(d.error,'error');return}
    toast('Step diupdate!','success');setEditStep(null);loadGkSteps()
  }
  async function delStep(id:string){
    if(!confirm('Hapus step ini?'))return
    const d=await api('/developer/getkey-settings','DELETE',{id},token)
    if(d.error){toast(d.error,'error');return}
    toast('Step dihapus','info');loadGkSteps()
  }
  function logout(){localStorage.removeItem('awr_dev_token');setToken(null);setUser(null)}

  if(booting)return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020810',color:'#a855f7',fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem'}}>Loading...</div>

  if(!token)return <>
    <Head><title>Developer — AWR</title><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet"/></Head>
    <ToastRoot/>
    <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}`}</style>
    <div style={{width:'100%',maxWidth:420,animation:'scaleIn .4s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'3rem',fontWeight:700,color:'#a855f7',letterSpacing:5,textShadow:'0 0 40px rgba(168,85,247,.6)'}}>👑 DEV</div>
        <div style={{fontSize:'.75rem',color:'#3a6a8a',letterSpacing:3,textTransform:'uppercase',marginTop:4}}>Developer Panel · AWR Key System</div>
      </div>
      <div style={{background:'#0b1a2e',border:'1px solid rgba(168,85,247,.3)',borderRadius:16,padding:24}}>
        <form onSubmit={login}>
          <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Username</label>
            <input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box'}} placeholder="Username developer..." value={loginForm.username} onChange={e=>setLoginForm(f=>({...f,username:e.target.value}))} required/></div>
          <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Password</label>
            <div style={{position:'relative'}}><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 44px 10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box'}} type={showPw?'text':'password'} placeholder="Password..." value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button></div></div>
          <button type="submit" disabled={logging} style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',opacity:logging?.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {logging?'⏳ Loading...':'👑 Masuk Developer Panel'}</button>
        </form>
      </div>
    </div>
  </>

  const fu=users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))
  const tabs:Array<[Tab,string]>=[['send-key','🔑 Kirim Key'],['users','👥 Users'],['keys','📋 Keys'],['broadcast','📢 Broadcast'],['global-key','🎁 Global'],['resellers','🏪 Reseller'],['getkey-settings','⚙️ GetKey']]

  return <>
    <Head><title>Developer Panel — AWR</title><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet"/></Head>
    <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a4a80;border-radius:99px}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes modalIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}table{width:100%;border-collapse:collapse}.tbl-wrap{border-radius:12px;border:1px solid #162f50;overflow:hidden;overflow-x:auto}.tbl th{padding:11px 14px;text-align:left;font-family:Rajdhani,sans-serif;font-weight:700;color:#3a6a8a;font-size:.72rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #162f50;background:#071224}.tbl td{padding:11px 14px;border-bottom:1px solid rgba(22,47,80,.4);color:#cce4f8;font-size:.84rem;vertical-align:middle}.tbl tr:hover td{background:rgba(0,170,255,.025)}input:focus,select:focus,textarea:focus{border-color:#0066cc!important;box-shadow:0 0 0 3px rgba(0,102,204,.18)!important;outline:none}.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:.68rem;font-weight:800;letter-spacing:.8px;text-transform:uppercase;border:1px solid}.badge-blue{background:rgba(0,102,204,.18);color:#00d4ff;border-color:rgba(0,170,255,.25)}.badge-green{background:rgba(22,163,74,.18);color:#4ade80;border-color:rgba(74,222,128,.25)}.badge-red{background:rgba(220,38,38,.18);color:#f87171;border-color:rgba(248,113,113,.25)}.badge-yellow{background:rgba(202,138,4,.18);color:#fbbf24;border-color:rgba(251,191,36,.25)}.badge-purple{background:rgba(168,85,247,.18);color:#c084fc;border-color:rgba(192,132,252,.25)}.badge-gray{background:rgba(100,116,139,.15);color:#94a3b8;border-color:rgba(148,163,184,.2)}.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeIn .2s ease}.modal-box{background:#0b1a2e;border:1px solid #1a4a80;border-radius:20px;padding:28px;width:90%;max-width:500px;max-height:90vh;overflow-y:auto;animation:modalIn .35s cubic-bezier(.34,1.56,.64,1)}.modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.modal-title{font-family:Rajdhani,sans-serif;font-size:1.25rem;font-weight:700;color:#00d4ff}.modal-close{background:#0e2040;border:1px solid #162f50;color:#5a8ab0;border-radius:8px;padding:5px 10px;cursor:pointer}.toast-root{position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;flex-direction:column-reverse;gap:10px;pointer-events:none}.toast-item{background:#0b1a2e;border:1px solid #1a4a80;border-radius:14px;padding:14px 18px;min-width:300px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 12px 48px rgba(0,0,0,.6);animation:toastIn .4s cubic-bezier(.34,1.56,.64,1);pointer-events:all;border-left:3px solid}.toast-item.success{border-left-color:#22c55e}.toast-item.error{border-left-color:#ef4444}.toast-item.warn{border-left-color:#f59e0b}.toast-item.info{border-left-color:#0af}.toast-icon{font-size:1.1rem;flex-shrink:0;line-height:1.4}.toast-title{font-weight:700;font-size:.86rem;color:#cce4f8;margin-bottom:2px}.toast-msg{font-size:.78rem;color:#7aaacf;line-height:1.4}`}</style>
    <ToastRoot/>

    {/* Navbar */}
    <div style={{position:'sticky',top:0,zIndex:200,background:'rgba(2,8,16,.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(168,85,247,.25)',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem',fontWeight:700,color:'#a855f7',letterSpacing:3,textShadow:'0 0 20px rgba(168,85,247,.5)'}}>👑 AWR DEV</div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:'.75rem',color:'#5a8ab0',background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.2)',borderRadius:6,padding:'2px 8px'}}>{user.username}</span>
        <button onClick={()=>router.push('/')} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:600,fontSize:'.8rem'}}>🏠 Website</button>
        <button onClick={logout} style={{background:'rgba(220,38,38,.1)',border:'1px solid rgba(220,38,38,.25)',color:'#f87171',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:600,fontSize:'.8rem'}}>🚪 Logout</button>
      </div>
    </div>

    <div style={{maxWidth:1300,margin:'0 auto',padding:'28px 24px'}}>
      {/* Tabs */}
      <div style={{display:'flex',gap:3,background:'#04101a',border:'1px solid #162f50',borderRadius:12,padding:4,marginBottom:24,flexWrap:'wrap'}}>
        {tabs.map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{flex:1,minWidth:70,padding:'8px 14px',borderRadius:8,border:tab===v?'1px solid rgba(168,85,247,.4)':'1px solid transparent',background:tab===v?'rgba(168,85,247,.1)':'transparent',color:tab===v?'#a855f7':'#5a8ab0',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'.78rem',transition:'all .2s',whiteSpace:'nowrap',textAlign:'center'}}>{l}</button>
        ))}
      </div>

      {/* SEND KEY */}
      {tab==='send-key'&&<div style={{animation:'fadeUp .3s ease',maxWidth:540}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24,marginBottom:16}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:20}}>🔑 Kirim Key ke User</div>
          <form onSubmit={sendKey}>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Username Tujuan</label>
              <select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={sendForm.target_username} onChange={e=>setSendForm(f=>({...f,target_username:e.target.value}))} required>
                <option value="">— Pilih Username —</option>
                {users.map(u=><option key={u.id} value={u.username}>{u.username}{u.is_banned?' (banned)':''}</option>)}
              </select></div>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Durasi</label>
              <select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={sendForm.duration_type} onChange={e=>setSendForm(f=>({...f,duration_type:e.target.value}))}>
                {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
              </select></div>
            <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Max HWID</label>
              <input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type="number" min={1} max={999999999} value={sendForm.hwid_max} onChange={e=>setSendForm(f=>({...f,hwid_max:e.target.value}))} required/></div>
            <button type="submit" disabled={sending||!sendForm.target_username} style={{width:'100%',background:sending||!sendForm.target_username?'#0e2040':'linear-gradient(135deg,#0066cc,#0af)',color:sending||!sendForm.target_username?'#5a8ab0':'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:sending||!sendForm.target_username?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {sending?'⏳ Mengirim...':'🚀 Kirim Key'}
            </button>
          </form>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[['Total Key',keys.length,'#00d4ff'],['Aktif',keys.filter(k=>k.is_active&&!(k.expires_at&&new Date(k.expires_at)<new Date())).length,'#4ade80']].map(([l,v,c])=>(
            <div key={l as string} style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:14,padding:20,textAlign:'center'}}>
              <div style={{fontFamily:'Rajdhani',fontSize:'2rem',fontWeight:700,color:c as string}}>{v as number}</div>
              <div style={{fontSize:'.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginTop:5}}>{l}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* USERS */}
      {tab==='users'&&<div style={{animation:'fadeUp .3s ease'}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff'}}>👥 Semua User ({users.length})</div>
            <input style={{background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'8px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',width:220}} placeholder="🔍 Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Key</th><th>Exec</th><th>Aksi</th></tr></thead>
            <tbody>
              {fu.map((u,i)=><tr key={u.id} style={{animation:`fadeUp .25s ease ${i*.03}s both`}}>
                <td style={{fontWeight:700}}>{u.username}</td>
                <td style={{color:'#5a8ab0',fontSize:'.8rem'}}>{u.email}</td>
                <td>{badge(u.role==='developer'?'purple':u.role==='reseller'?'yellow':'blue',u.role)}</td>
                <td>{badge(u.is_banned?'red':'green',u.is_banned?'Banned':'Aktif')}</td>
                <td>{u.keys?.[0]?.key_value?<span style={{fontFamily:'Rajdhani',fontSize:'.7rem',color:'#00d4ff',letterSpacing:1}}>{u.keys[0].key_value.slice(0,12)}...</span>:badge('gray','No Key')}</td>
                <td style={{fontFamily:'Rajdhani',fontWeight:700}}>{u.total_executions||0}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>setEditUser({userId:u.id,username:u.username,email:u.email,role:u.role,roblox_username:u.roblox_username||'',password:''})}>✏️</button>
                  {u.is_banned?<button style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',color:'#4ade80',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>{setBanModal(u);setBanReason('')}}>✅ Unban</button>
                    :<button style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',color:'#f87171',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>{setBanModal(u);setBanReason('')}}>🚫 Ban</button>}
                </div></td>
              </tr>)}
              {!fu.length&&<tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#5a8ab0'}}>Tidak ada user</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>}

      {/* KEYS */}
      {tab==='keys'&&<div style={{animation:'fadeUp .3s ease'}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:16}}>📋 Semua Key ({keys.length})</div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Key</th><th>Owner</th><th>Dibuat</th><th>Durasi</th><th>Expired</th><th>HWID</th><th>Pakai</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {keys.map(k=><tr key={k.id}>
                <td><span style={{fontFamily:'Rajdhani',fontSize:'.68rem',color:'#00d4ff',letterSpacing:1,cursor:'pointer',background:'#020810',border:'1px solid #0066cc',borderRadius:7,padding:'4px 7px',display:'inline-block'}} onClick={()=>navigator.clipboard.writeText(k.key_value).then(()=>toast('Disalin!','success'))}>{k.key_value.slice(0,16)}...</span></td>
                <td>{k.owner?.username||badge('yellow','Shared')}</td>
                <td style={{color:'#5a8ab0',fontSize:'.78rem'}}>{k.creator?.username||'-'}</td>
                <td>{badge('blue',DUR[k.duration_type]||k.duration_type)}</td>
                <td style={{fontSize:'.8rem',color:isExpired(k.expires_at)?'#f87171':'#cce4f8'}}>{fmtDate(k.expires_at)}</td>
                <td>{k.hwid_max}</td><td>{k.times_used}×</td>
                <td>{badge(k.is_active&&!isExpired(k.expires_at)?'green':'red',k.is_active&&!isExpired(k.expires_at)?'Aktif':'Mati')}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>setEditKey({keyId:k.id,is_active:k.is_active,hwid_max:k.hwid_max,duration_type:k.duration_type,assigned_to_username:k.owner?.username||''})}>✏️</button>
                  <button style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',color:'#f87171',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>delKey(k.id)}>🗑️</button>
                </div></td>
              </tr>)}
              {!keys.length&&<tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'#5a8ab0'}}>Belum ada key</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>}

      {/* BROADCAST */}
      {tab==='broadcast'&&<div style={{animation:'fadeUp .3s ease',maxWidth:560}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:4}}>📢 Broadcast Pengumuman</div>
          <div style={{fontSize:'.82rem',color:'#5a8ab0',marginBottom:20}}>Dikirim sebagai: <strong style={{color:'#00d4ff'}}>by Developer</strong></div>
          <form onSubmit={sendBc}>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Judul</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} placeholder="Judul pengumuman..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
            <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Isi</label><textarea style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',minHeight:100,resize:'vertical' as any,boxSizing:'border-box' as any}} placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required/></div>
            <button type="submit" style={{width:'100%',background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>📢 Kirim ke Semua User</button>
          </form>
        </div>
      </div>}

      {/* GLOBAL KEY */}
      {tab==='global-key'&&<div style={{animation:'fadeUp .3s ease',maxWidth:480}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:8}}>🎁 Key Global ke Semua User</div>
          <div style={{background:'rgba(251,191,36,.06)',border:'1px solid rgba(251,191,36,.2)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:'.82rem',color:'#fbbf24'}}>⚠️ Key ini bisa dipakai semua user. Semua user dapat notifikasi.</div>
          <form onSubmit={sendGk}>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Durasi</label><select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={gk.duration_type} onChange={e=>setGk(g=>({...g,duration_type:e.target.value}))}>{DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}</select></div>
            <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Max HWID</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type="number" min={1} value={gk.hwid_max} onChange={e=>setGk(g=>({...g,hwid_max:e.target.value}))}/></div>
            <button type="submit" style={{width:'100%',background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>🚀 Kirim ke Semua</button>
          </form>
        </div>
      </div>}

      {/* RESELLERS */}
      {tab==='resellers'&&<div style={{animation:'fadeUp .3s ease',maxWidth:600}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:16}}>🏪 Manajemen Reseller</div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Jadikan Reseller</label>
            <div style={{display:'flex',gap:8}}>
              <select id="rs-sel" style={{flex:1,background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none'}}>
                <option value="">— Pilih User —</option>
                {users.filter(u=>u.role==='user').map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
              <button onClick={()=>{const v=(document.getElementById('rs-sel') as HTMLSelectElement)?.value;if(v)setRole(v,'reseller')}} style={{background:'linear-gradient(135deg,#b45309,#f59e0b)',color:'#fff',border:'none',borderRadius:10,padding:'10px 18px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700}}>✅ Set</button>
            </div>
          </div>
          <div style={{height:1,background:'linear-gradient(90deg,transparent,#1a4a80,transparent)',margin:'0 0 16px'}}/>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Username</th><th>Email</th><th>Aksi</th></tr></thead>
            <tbody>
              {users.filter(u=>u.role==='reseller').map(u=><tr key={u.id}><td style={{fontWeight:700}}>{u.username}</td><td style={{color:'#5a8ab0'}}>{u.email}</td><td><button style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',color:'#f87171',borderRadius:7,padding:'5px 12px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:600,fontSize:'.8rem'}} onClick={()=>setRole(u.id,'user')}>Copot</button></td></tr>)}
              {!users.filter(u=>u.role==='reseller').length&&<tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#5a8ab0'}}>Belum ada reseller</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>}

      {/* GETKEY SETTINGS */}
      {tab==='getkey-settings'&&<div style={{animation:'fadeUp .3s ease'}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00d4ff',marginBottom:4}}>⚙️ Setting GetKey Steps</div>
          <div style={{fontSize:'.82rem',color:'#5a8ab0',marginBottom:20}}>Atur step yang harus diselesaikan user untuk dapat free key.</div>
          {gkSteps.map((s,i)=><div key={s.id} style={{background:'#071224',border:`1px solid ${s.is_active?'#1a4a80':'#162f50'}`,borderRadius:12,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12,animation:`fadeUp .25s ease ${i*.04}s both`}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:s.is_active?'rgba(0,102,204,.2)':'#162f50',border:`2px solid ${s.is_active?'#0af':'#162f50'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Rajdhani',fontWeight:700,flexShrink:0,color:s.is_active?'#0af':'#5a8ab0'}}>{s.order_index}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:'.9rem'}}>{s.name}</div><div style={{fontSize:'.75rem',color:'#5a8ab0',marginTop:2}}>⏱️ {s.duration_seconds}s · {s.url.length>50?s.url.slice(0,50)+'...':s.url}</div></div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>toggleStep(s.id,!s.is_active)} style={{background:s.is_active?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)',border:`1px solid ${s.is_active?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`,color:s.is_active?'#4ade80':'#f87171',borderRadius:7,padding:'5px 10px',cursor:'pointer',fontSize:'.78rem',fontWeight:700}}>{s.is_active?'✅ Aktif':'❌ Mati'}</button>
              <button onClick={()=>setEditStep({...s,duration_seconds:s.duration_seconds.toString()})} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}}>✏️</button>
              <button onClick={()=>delStep(s.id)} style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',color:'#f87171',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:'.8rem'}}>🗑️</button>
            </div>
          </div>)}
          {!gkSteps.length&&<div style={{textAlign:'center',color:'#5a8ab0',padding:24,marginBottom:16}}>Belum ada step. Tambah di bawah.</div>}
          <div style={{height:1,background:'linear-gradient(90deg,transparent,#1a4a80,transparent)',margin:'16px 0'}}/>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00d4ff',marginBottom:14}}>➕ Tambah Step</div>
          <form onSubmit={addGkStep}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:12,marginBottom:12}}>
              <div><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Nama</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} placeholder="Nama step..." value={addStep.name} onChange={e=>setAddStep(s=>({...s,name:e.target.value}))} required/></div>
              <div><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Detik</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type="number" min={5} max={300} value={addStep.duration_seconds} onChange={e=>setAddStep(s=>({...s,duration_seconds:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:16}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>URL</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} placeholder="https://..." value={addStep.url} onChange={e=>setAddStep(s=>({...s,url:e.target.value}))} required/></div>
            <button type="submit" style={{background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>➕ Tambah Step</button>
          </form>
        </div>
      </div>}
    </div>

    {/* Modals */}
    <Modal open={!!editUser} onClose={()=>setEditUser(null)} title="✏️ Edit User">
      {editUser&&<>
        {[['Username','username','text'],['Email','email','email'],['Roblox','roblox_username','text']].map(([l,k,t])=>(
          <div key={k} style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>{l}</label>
            <input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type={t} value={editUser[k]} onChange={e=>setEditUser((u:any)=>({...u,[k]:e.target.value}))}/></div>
        ))}
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Role</label>
          <select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={editUser.role} onChange={e=>setEditUser((u:any)=>({...u,role:e.target.value}))}>
            <option value="user">User</option><option value="reseller">Reseller</option><option value="developer">Developer</option>
          </select></div>
        <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Password Baru</label>
          <div style={{position:'relative'}}><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 44px 10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type={showPw?'text':'password'} placeholder="Kosong = tidak ganti" value={editUser.password} onChange={e=>setEditUser((u:any)=>({...u,password:e.target.value}))}/>
            <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer'}}>{showPw?'🙈':'👁️'}</button></div></div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditUser} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>💾 Simpan</button><button onClick={()=>setEditUser(null)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button></div>
      </>}
    </Modal>

    <Modal open={!!editKey} onClose={()=>setEditKey(null)} title="✏️ Edit Key">
      {editKey&&<>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Assign ke Username</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} placeholder="Username..." value={editKey.assigned_to_username} onChange={e=>setEditKey((k:any)=>({...k,assigned_to_username:e.target.value}))}/></div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Durasi</label><select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={editKey.duration_type} onChange={e=>setEditKey((k:any)=>({...k,duration_type:e.target.value}))}>{DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Max HWID</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type="number" value={editKey.hwid_max} onChange={e=>setEditKey((k:any)=>({...k,hwid_max:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Status</label><select style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={editKey.is_active?'1':'0'} onChange={e=>setEditKey((k:any)=>({...k,is_active:e.target.value==='1'}))}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditKey} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>💾 Simpan</button><button onClick={()=>setEditKey(null)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button></div>
      </>}
    </Modal>

    <Modal open={!!editStep} onClose={()=>setEditStep(null)} title="✏️ Edit Step">
      {editStep&&<>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Nama</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={editStep.name} onChange={e=>setEditStep((s:any)=>({...s,name:e.target.value}))}/></div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>URL</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} value={editStep.url} onChange={e=>setEditStep((s:any)=>({...s,url:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Durasi (detik)</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} type="number" min={5} max={300} value={editStep.duration_seconds} onChange={e=>setEditStep((s:any)=>({...s,duration_seconds:e.target.value}))}/></div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditStep} style={{flex:1,background:'linear-gradient(135deg,#0066cc,#0af)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>💾 Simpan</button><button onClick={()=>setEditStep(null)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button></div>
      </>}
    </Modal>

    <Modal open={!!banModal} onClose={()=>setBanModal(null)} title={banModal?.is_banned?'✅ Unban User':'🚫 Ban User'}>
      {banModal&&<>
        <p style={{fontSize:'.85rem',color:'#5a8ab0',marginBottom:16}}>{banModal.is_banned?`Unban ${banModal.username}?`:`Ban ${banModal.username}? Semua key akan dimatikan.`}</p>
        {!banModal.is_banned&&<div style={{marginBottom:16}}><label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:6}}>Alasan</label><input style={{width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}} placeholder="Alasan ban..." value={banReason} onChange={e=>setBanReason(e.target.value)}/></div>}
        <div style={{display:'flex',gap:10}}>
          {banModal.is_banned?<button onClick={()=>doBan('unban')} style={{flex:1,background:'linear-gradient(135deg,#16a34a,#22c55e)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>✅ Unban</button>:<button onClick={()=>doBan('ban')} style={{flex:1,background:'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>🚫 Ban</button>}
          <button onClick={()=>setBanModal(null)} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'11px 16px',cursor:'pointer',fontFamily:'Exo 2,sans-serif'}}>Batal</button>
        </div>
      </>}
    </Modal>
  </>
}
