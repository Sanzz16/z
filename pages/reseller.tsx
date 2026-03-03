import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

async function api(p:string,m='GET',b?:any,t?:string|null){try{const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return r.json()}catch{return{error:'Koneksi gagal'}}}
const DUR:Record<string,string>={'24h':'24 Jam','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const DURS=Object.keys(DUR)
function fmtDate(d:string|null){if(!d)return'∞ Lifetime';return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function isExpired(d:string|null){if(!d)return false;return new Date(d)<new Date()}

let _toast:(m:string,t?:string)=>void=()=>{}
function toast(m:string,t='info'){_toast(m,t)}

function ToastRoot(){
  const [items,setItems]=useState<any[]>([]);const id=useRef(0)
  useEffect(()=>{_toast=(msg,type='info')=>{const n=++id.current;const icon=type==='error'?'❌':type==='success'?'✅':'ℹ️';setItems(p=>[...p,{id:n,msg,type,icon}]);setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),4000)}},[])
  return <div style={{position:'fixed',bottom:24,right:24,zIndex:9998,display:'flex',flexDirection:'column-reverse',gap:10,pointerEvents:'none'}}>{items.map(t=><div key={t.id} style={{background:'#0b1a2e',border:'1px solid #1a4a80',borderLeft:`3px solid ${t.type==='error'?'#ef4444':t.type==='success'?'#22c55e':'#0af'}`,borderRadius:14,padding:'14px 18px',minWidth:300,display:'flex',alignItems:'flex-start',gap:12,boxShadow:'0 12px 48px rgba(0,0,0,.6)',animation:'toastIn .4s cubic-bezier(.34,1.56,.64,1)',pointerEvents:'all'}}><span style={{fontSize:'1.1rem',flexShrink:0,lineHeight:1.4}}>{t.icon}</span><div><div style={{fontWeight:700,fontSize:'.86rem',color:'#cce4f8',marginBottom:2}}>{t.type==='error'?'Error':t.type==='success'?'Sukses':'Info'}</div><div style={{fontSize:'.78rem',color:'#7aaacf'}}>{t.msg}</div></div></div>)}</div>
}

function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
  if(!open)return null
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',animation:'fadeIn .2s ease'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={{background:'#0b1a2e',border:'1px solid #1a4a80',borderRadius:20,padding:28,width:'90%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',animation:'modalIn .35s cubic-bezier(.34,1.56,.64,1)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.25rem',fontWeight:700,color:'#00d4ff'}}>{title}</div><button onClick={onClose} style={{background:'#0e2040',border:'1px solid #162f50',color:'#5a8ab0',borderRadius:8,padding:'5px 10px',cursor:'pointer'}}>✕</button></div>{children}</div></div>
}

type Tab='send'|'history'|'broadcast'|'users'

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
    toast('Selamat datang, '+d.user.username+'!','success')
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

  const INP={width:'100%',background:'#071224',border:'1px solid #162f50',borderRadius:10,color:'#cce4f8',padding:'10px 14px',fontFamily:'Exo 2,sans-serif',outline:'none',boxSizing:'border-box' as any}
  const LBL={display:'block',fontSize:'.72rem',fontWeight:700,color:'#5a8ab0',letterSpacing:'1.2px',textTransform:'uppercase' as any,marginBottom:6}

  if(booting)return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020810',color:'#f59e0b',fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem'}}>Loading...</div>

  if(!token)return <>
    <Head><title>Reseller — AWR</title><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet"/></Head>
    <ToastRoot/>
    <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}@keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}input:focus,select:focus{border-color:#0066cc!important;outline:none}`}</style>
    <div style={{width:'100%',maxWidth:420,animation:'scaleIn .4s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'3rem',fontWeight:700,color:'#f59e0b',letterSpacing:5,textShadow:'0 0 40px rgba(245,158,11,.6)'}}>🏪 RESELLER</div>
        <div style={{fontSize:'.75rem',color:'#3a6a8a',letterSpacing:3,textTransform:'uppercase',marginTop:4}}>Reseller Panel · AWR Key System</div>
      </div>
      <div style={{background:'#0b1a2e',border:'1px solid rgba(245,158,11,.3)',borderRadius:16,padding:24}}>
        <form onSubmit={login}>
          <div style={{marginBottom:14}}><label style={LBL}>Username</label><input style={INP} placeholder="Username reseller..." value={loginForm.username} onChange={e=>setLoginForm(f=>({...f,username:e.target.value}))} required/></div>
          <div style={{marginBottom:20}}><label style={LBL}>Password</label>
            <div style={{position:'relative'}}><input style={{...INP,paddingRight:44}} type={showPw?'text':'password'} placeholder="Password..." value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5a8ab0',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁️'}</button></div></div>
          <button type="submit" disabled={logging} style={{width:'100%',background:'linear-gradient(135deg,#b45309,#f59e0b)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer',opacity:logging?.5:1}}>
            {logging?'⏳ Loading...':'🏪 Masuk Reseller Panel'}</button>
        </form>
      </div>
    </div>
  </>

  const fu=users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase()))
  const tabs:Array<[Tab,string]>=[['send','🔑 Kirim Key'],['history','📋 History'],['broadcast','📢 Broadcast'],['users','👥 Users']]

  return <>
    <Head><title>Reseller Panel — AWR</title><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet"/></Head>
    <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a4a80;border-radius:99px}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes modalIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}table{width:100%;border-collapse:collapse}.tw{border-radius:12px;border:1px solid #162f50;overflow:hidden;overflow-x:auto}th{padding:11px 14px;text-align:left;font-family:Rajdhani,sans-serif;font-weight:700;color:#3a6a8a;font-size:.72rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #162f50;background:#071224}td{padding:11px 14px;border-bottom:1px solid rgba(22,47,80,.4);color:#cce4f8;font-size:.84rem;vertical-align:middle}tr:hover td{background:rgba(0,170,255,.025)}input:focus,select:focus,textarea:focus{border-color:#0066cc!important;outline:none}`}</style>
    <ToastRoot/>

    <div style={{position:'sticky',top:0,zIndex:200,background:'rgba(2,8,16,.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(245,158,11,.25)',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.5rem',fontWeight:700,color:'#f59e0b',letterSpacing:3,textShadow:'0 0 20px rgba(245,158,11,.5)'}}>🏪 AWR RESELLER</div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:'.75rem',color:'#5a8ab0',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',borderRadius:6,padding:'2px 8px'}}>{user.username}</span>
        <button onClick={()=>router.push('/')} style={{background:'#0e2040',border:'1px solid #162f50',color:'#cce4f8',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:600,fontSize:'.8rem'}}>🏠 Website</button>
        <button onClick={logout} style={{background:'rgba(220,38,38,.1)',border:'1px solid rgba(220,38,38,.25)',color:'#f87171',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:600,fontSize:'.8rem'}}>🚪 Logout</button>
      </div>
    </div>

    <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 24px'}}>
      <div style={{display:'flex',gap:3,background:'#04101a',border:'1px solid #162f50',borderRadius:12,padding:4,marginBottom:24}}>
        {tabs.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:'8px 14px',borderRadius:8,border:tab===v?'1px solid rgba(245,158,11,.35)':'1px solid transparent',background:tab===v?'rgba(245,158,11,.1)':'transparent',color:tab===v?'#f59e0b':'#5a8ab0',cursor:'pointer',fontFamily:'Exo 2,sans-serif',fontWeight:700,fontSize:'.8rem',transition:'all .2s',whiteSpace:'nowrap',textAlign:'center'}}>{l}</button>)}
      </div>

      {tab==='send'&&<div style={{animation:'fadeUp .3s ease',maxWidth:520}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24,marginBottom:16}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#f59e0b',marginBottom:20}}>🔑 Kirim Key ke User</div>
          <form onSubmit={sendKey}>
            <div style={{marginBottom:14}}><label style={LBL}>Username Tujuan</label>
              <select style={INP} value={form.target_username} onChange={e=>setForm(f=>({...f,target_username:e.target.value}))} required>
                <option value="">— Pilih Username —</option>
                {users.map(u=><option key={u.id} value={u.username}>{u.username}{u.is_banned?' (banned)':''}</option>)}
              </select></div>
            <div style={{marginBottom:14}}><label style={LBL}>Durasi</label>
              <select style={INP} value={form.duration_type} onChange={e=>setForm(f=>({...f,duration_type:e.target.value}))}>
                {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
              </select></div>
            <div style={{marginBottom:20}}><label style={LBL}>Max HWID</label>
              <input style={INP} type="number" min={1} max={999999999} value={form.hwid_max} onChange={e=>setForm(f=>({...f,hwid_max:e.target.value}))} required/></div>
            <button type="submit" disabled={sending||!form.target_username} style={{width:'100%',background:sending||!form.target_username?'#0e2040':'linear-gradient(135deg,#b45309,#f59e0b)',color:sending||!form.target_username?'#5a8ab0':'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:sending||!form.target_username?'not-allowed':'pointer',transition:'all .2s'}}>
              {sending?'⏳ Mengirim...':'🚀 Kirim Key'}
            </button>
          </form>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[['Total Dikirim',keys.length,'#f59e0b'],['Aktif',keys.filter(k=>k.is_active&&!isExpired(k.expires_at)).length,'#4ade80']].map(([l,v,c])=>(
            <div key={l as string} style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:14,padding:20,textAlign:'center'}}>
              <div style={{fontFamily:'Rajdhani',fontSize:'2rem',fontWeight:700,color:c as string}}>{v as number}</div>
              <div style={{fontSize:'.7rem',color:'#5a8ab0',textTransform:'uppercase',letterSpacing:1,marginTop:5}}>{l}</div>
            </div>
          ))}
        </div>
      </div>}

      {tab==='history'&&<div style={{animation:'fadeUp .3s ease'}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#f59e0b',marginBottom:16}}>📋 History Key ({keys.length})</div>
          <div className="tw"><table>
            <thead><tr><th>Key</th><th>Dikirim ke</th><th>Durasi</th><th>Expired</th><th>Status</th><th>Dipakai</th></tr></thead>
            <tbody>
              {keys.map((k,i)=><tr key={k.id} style={{animation:`fadeUp .25s ease ${i*.03}s both`}}>
                <td><span style={{fontFamily:'Rajdhani',fontSize:'.7rem',color:'#00d4ff',letterSpacing:1,cursor:'pointer',background:'#020810',border:'1px solid #0066cc',borderRadius:7,padding:'4px 7px',display:'inline-block'}} onClick={()=>navigator.clipboard.writeText(k.key_value).then(()=>toast('Disalin!','success'))}>{k.key_value}</span></td>
                <td style={{fontWeight:700}}>{k.owner?.username||'-'}</td>
                <td><span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:99,fontSize:'.68rem',fontWeight:800,textTransform:'uppercase',background:'rgba(0,102,204,.18)',color:'#00d4ff',border:'1px solid rgba(0,170,255,.25)'}}>{DUR[k.duration_type]||k.duration_type}</span></td>
                <td style={{fontSize:'.8rem',color:isExpired(k.expires_at)?'#f87171':'#cce4f8'}}>{fmtDate(k.expires_at)}</td>
                <td><span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'.68rem',fontWeight:800,textTransform:'uppercase',background:k.is_active&&!isExpired(k.expires_at)?'rgba(22,163,74,.18)':'rgba(220,38,38,.18)',color:k.is_active&&!isExpired(k.expires_at)?'#4ade80':'#f87171',border:`1px solid ${k.is_active&&!isExpired(k.expires_at)?'rgba(74,222,128,.25)':'rgba(248,113,113,.25)'}`}}>{k.is_active&&!isExpired(k.expires_at)?'Aktif':'Mati'}</span></td>
                <td>{k.times_used}×</td>
              </tr>)}
              {!keys.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'#5a8ab0'}}>Belum ada history</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>}

      {tab==='broadcast'&&<div style={{animation:'fadeUp .3s ease',maxWidth:560}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#f59e0b',marginBottom:4}}>📢 Broadcast Pengumuman</div>
          <div style={{fontSize:'.82rem',color:'#5a8ab0',marginBottom:20}}>Dikirim sebagai: <strong style={{color:'#f59e0b'}}>by {user.username}</strong></div>
          <form onSubmit={sendBc}>
            <div style={{marginBottom:14}}><label style={LBL}>Judul</label><input style={INP} placeholder="Judul pengumuman..." value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} required/></div>
            <div style={{marginBottom:20}}><label style={LBL}>Isi</label><textarea style={{...INP,minHeight:100,resize:'vertical' as any}} placeholder="Isi pesan..." value={bc.content} onChange={e=>setBc(b=>({...b,content:e.target.value}))} required/></div>
            <button type="submit" style={{width:'100%',background:'linear-gradient(135deg,#b45309,#f59e0b)',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontFamily:'Exo 2,sans-serif',fontWeight:700,cursor:'pointer'}}>📢 Kirim Broadcast</button>
          </form>
        </div>
      </div>}

      {tab==='users'&&<div style={{animation:'fadeUp .3s ease'}}>
        <div style={{background:'#0b1a2e',border:'1px solid #162f50',borderRadius:16,padding:24}}>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#f59e0b'}}>👥 Daftar User ({users.length})</div>
            <input style={{...INP,width:220}} placeholder="🔍 Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="tw"><table>
            <thead><tr><th>Username</th><th>Email</th><th>Key</th><th>Status</th></tr></thead>
            <tbody>
              {fu.map((u,i)=><tr key={u.id} style={{animation:`fadeUp .25s ease ${i*.03}s both`}}>
                <td style={{fontWeight:700}}>{u.username}</td>
                <td style={{color:'#5a8ab0',fontSize:'.8rem'}}>{u.email}</td>
                <td>{u.keys?.[0]?.key_value?<span style={{fontFamily:'Rajdhani',fontSize:'.7rem',color:'#00d4ff',letterSpacing:1}}>Ada Key</span>:<span style={{color:'#5a8ab0'}}>No Key</span>}</td>
                <td><span style={{display:'inline-flex',padding:'3px 10px',borderRadius:99,fontSize:'.68rem',fontWeight:800,textTransform:'uppercase',background:u.is_banned?'rgba(220,38,38,.18)':'rgba(22,163,74,.18)',color:u.is_banned?'#f87171':'#4ade80',border:`1px solid ${u.is_banned?'rgba(248,113,113,.25)':'rgba(74,222,128,.25)'}`}}>{u.is_banned?'Banned':'Aktif'}</span></td>
              </tr>)}
              {!fu.length&&<tr><td colSpan={4} style={{textAlign:'center',padding:32,color:'#5a8ab0'}}>Tidak ada user</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>}
    </div>
  </>
}
