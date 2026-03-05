import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ══════════════════════════════════════════════════════════════
// HELPERS — api, toast, Modal, Particles, DurationDropdown, BanDialog
// ══════════════════════════════════════════════════════════════

async function api(path:string,method='GET',body?:any,token?:string|null){
  try{
    const r=await fetch('/api'+path,{
      method,
      headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
      body:body?JSON.stringify(body):undefined
    })
    return r.json()
  }catch(e){return{error:'Koneksi gagal, coba lagi'}}
}

function fmtDate(d:string|null){
  if(!d)return '∞ Lifetime'
  return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
function timeLeft(d:string|null){
  if(!d)return '∞'
  const diff=new Date(d).getTime()-Date.now()
  if(diff<=0)return 'Expired'
  const days=Math.floor(diff/86400000),hrs=Math.floor((diff%86400000)/3600000),mins=Math.floor((diff%3600000)/60000)
  if(days>0)return `${days}h ${hrs}j`
  if(hrs>0)return `${hrs}j ${mins}m`
  return `${mins}m`
}
function isExpired(d:string|null){if(!d)return false;return new Date(d)<new Date()}
function copyText(t:string){navigator.clipboard.writeText(t).catch(()=>{})}

const DUR:Record<string,string>={'24h':'24 Jam','3d':'3 Hari','5d':'5 Hari','7d':'7 Hari','30d':'30 Hari','60d':'60 Hari','lifetime':'Lifetime'}
const DURS=Object.keys(DUR)

// ── Toast ──────────────────────────────────────────────────────
let _toast:(msg:string,type?:string)=>void=()=>{}
function toast(msg:string,type='info'){_toast(msg,type)}

function ToastRoot(){
  const [items,setItems]=useState<any[]>([]);const id=useRef(0)
  useEffect(()=>{
    _toast=(msg,type='info')=>{
      const n=++id.current
      const icon=type==='error'?'error':type==='success'?'success':type==='warn'?'warn':'info'
      setItems(p=>[...p,{id:n,msg,type,icon}])
      setTimeout(()=>setItems(p=>p.filter(x=>x.id!==n)),4000)
    }
  },[])
  return(
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:9,maxWidth:340,pointerEvents:'none'}}>
      {items.map(t=>(
        <div key={t.id} style={{background:'rgba(10,11,13,.97)',border:'1px solid rgba(255,255,255,.08)',borderLeft:`3px solid ${t.type==='success'?'#32ff7e':t.type==='error'?'#ff4757':t.type==='warn'?'#f59e0b':'#c77dff'}`,borderRadius:15,padding:'13px 16px',display:'flex',gap:10,alignItems:'flex-start',animation:'dvToastIn .35s ease',backdropFilter:'blur(14px)',boxShadow:'0 10px 36px rgba(0,0,0,.7)',pointerEvents:'all'}}>
          <div style={{flexShrink:0,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {t.icon==='success'?<svg viewBox='0 0 24 24' fill='none' stroke='#32ff7e' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><polyline points='20 6 9 17 4 12'/></svg>
            :t.icon==='error'?<svg viewBox='0 0 24 24' fill='none' stroke='#ff4757' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>
            :t.icon==='warn'?<svg viewBox='0 0 24 24' fill='none' stroke='#f59e0b' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>
            :<svg viewBox='0 0 24 24' fill='none' stroke='#c77dff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg>}
          </div>
          <div>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.85rem',color:'#fff',marginBottom:2}}>{t.type==='error'?'Error':t.type==='success'?'Sukses':t.type==='warn'?'Peringatan':'Info'}</div>
            <div style={{fontSize:'.78rem',color:'#8a8a9a',lineHeight:1.4}}>{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────
function Modal({open,onClose,title,children,wide=false}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;wide?:boolean}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};if(open)window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[open,onClose])
  if(!open)return null
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',animation:'dvFadeIn .2s ease',padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'linear-gradient(160deg,#0f1014,#0a0b0e)',border:'1px solid rgba(168,85,247,.15)',borderRadius:24,padding:28,width:'100%',maxWidth:wide?680:500,maxHeight:'90vh',overflowY:'auto',animation:'dvModalIn .35s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 40px 80px rgba(0,0,0,.9)',position:'relative'}}>
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

// ── Particles ──────────────────────────────────────────────────
function Particles(){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current;if(!c)return
    const ctx=c.getContext('2d')!
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight
    const pts=Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.8+.4,a:Math.random()*.35+.1}))
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw(){
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0||p.x>W)p.vx*=-1
        if(p.y<0||p.y>H)p.vy*=-1
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(168,85,247,${p.a})`;ctx.fill()
        ctx.shadowBlur=6;ctx.shadowColor='rgba(168,85,247,.4)';ctx.fill();ctx.shadowBlur=0
      })
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(168,85,247,${.1*(1-d/120)})`;ctx.lineWidth=.6;ctx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>
}

// ── DurationDropdown ───────────────────────────────────────────
function DurationDropdown({value,onChange}:{value:string;onChange:(v:string)=>void}){
  return(
    <select className="dv-fi" value={value} onChange={e=>onChange(e.target.value)}>
      {DURS.map(d=><option key={d} value={d}>{DUR[d]}</option>)}
    </select>
  )
}

// ── BanDialog ──────────────────────────────────────────────────
function BanDialog({open,user,onClose,onConfirm}:{open:boolean;user:any;onClose:()=>void;onConfirm:(reason:string)=>void}){
  const [reason,setReason]=useState('')
  if(!open||!user)return null
  return(
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.9)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(10px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'linear-gradient(160deg,#110a0a,#0a0a10)',border:'2px solid rgba(220,50,50,.35)',borderRadius:20,padding:28,width:420,maxWidth:'95vw',boxShadow:'0 0 60px rgba(220,50,50,.15)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.2rem',color:'#f87171'}}>🚫 Ban User</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'#8a8a9a',borderRadius:8,padding:'4px 10px',cursor:'pointer'}}>✕</button>
        </div>
        <div style={{background:'rgba(220,50,50,.08)',border:'1px solid rgba(220,50,50,.2)',borderRadius:10,padding:'12px 16px',marginBottom:16}}>
          <div style={{color:'#f87171',fontWeight:700,marginBottom:4}}>Username: <span style={{color:'#fff'}}>{user?.username}</span></div>
          <div style={{color:'#8a8a9a',fontSize:'.82rem'}}>User ini akan dibanned dan semua key-nya dinonaktifkan.</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{color:'#8a8a9a',fontSize:'.82rem',display:'block',marginBottom:6}}>Alasan ban (opsional):</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Melanggar aturan..."
            style={{width:'100%',background:'rgba(220,50,50,.06)',border:'1px solid rgba(220,50,50,.2)',borderRadius:10,color:'#fff',padding:'10px 14px',outline:'none',boxSizing:'border-box' as const,fontFamily:'Outfit,sans-serif'}}/>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'#8a8a9a',padding:'11px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>Cancel</button>
          <button onClick={()=>{onConfirm(reason);setReason('')}} style={{flex:1,background:'linear-gradient(135deg,#7f1d1d,#dc2626)',border:'none',borderRadius:10,color:'#fff',padding:'11px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>🚫 Ban Sekarang</button>
        </div>
      </div>
    </div>
  )
}



// ══════════════════════════════════════════════════════════════
// BROADCAST TAB — useRef untuk input biar gak re-render tiap ketik
// ══════════════════════════════════════════════════════════════
const BroadcastTab=React.memo(function BroadcastTab({token}:{token:string|null}){
  // Uncontrolled refs — TIDAK trigger re-render saat ngetik
  const titleRef=useRef<HTMLInputElement>(null)
  const contentRef=useRef<HTMLTextAreaElement>(null)
  const [sending,setSending]=useState(false)
  const [list,setList]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [editBc,setEditBc]=useState<any>(null)
  // Edit modal pakai controlled (tidak masalah karena modal terpisah)
  const [editTitle,setEditTitle]=useState('')
  const [editContent,setEditContent]=useState('')

  const load=useCallback(async()=>{
    setLoading(true)
    const d=await api('/developer/broadcast','GET',undefined,token)
    if(d.broadcasts)setList(d.broadcasts)
    else if(Array.isArray(d))setList(d)
    setLoading(false)
  },[token])

  useEffect(()=>{load()},[load])

  async function send(e:React.FormEvent){
    e.preventDefault()
    const t=titleRef.current?.value?.trim()||''
    const c=contentRef.current?.value?.trim()||''
    if(!t||!c){toast('Judul & isi wajib diisi','error');return}
    setSending(true)
    const d=await api('/developer/broadcast','POST',{title:t,content:c},token)
    setSending(false)
    if(d.error){toast(d.error,'error');return}
    toast(d.message||'Broadcast terkirim!','success')
    // Reset uncontrolled inputs
    if(titleRef.current)titleRef.current.value=''
    if(contentRef.current)contentRef.current.value=''
    load()
  }

  async function del(id:string){
    if(!confirm('Hapus broadcast ini?'))return
    const d=await api('/developer/broadcast','DELETE',{id},token)
    if(d.error){toast(d.error,'error');return}
    toast('Broadcast dihapus','info');load()
  }

  async function openEdit(bc:any){
    setEditTitle(bc.title)
    setEditContent(bc.content)
    setEditBc(bc)
  }

  async function saveEdit(e:React.FormEvent){
    e.preventDefault()
    const d=await api('/developer/broadcast','PATCH',{id:editBc.id,title:editTitle.trim(),content:editContent.trim()},token)
    if(d.error){toast(d.error,'error');return}
    toast('Broadcast diupdate!','success');setEditBc(null);load()
  }

  function pd(n:number){return String(n).padStart(2,'0')}
  function fmtD(iso:string){const d=new Date(iso);return`${pd(d.getDate())}/${pd(d.getMonth()+1)}/${d.getFullYear()} ${pd(d.getHours())}:${pd(d.getMinutes())}`}

  return(
    <>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:20,alignItems:'start'}}>
      {/* Kiri — Form kirim baru (uncontrolled, gak re-render) */}
      <div className="dv-card">
        <div className="dv-card-title"><div className="dv-card-bar"/><div className="dv-card-label">📢 KIRIM BROADCAST BARU</div></div>
        <form onSubmit={send}>
          <div className="dv-fg">
            <label className="dv-fl">Judul</label>
            <input
              ref={titleRef}
              className="dv-fi"
              placeholder="Judul pengumuman..."
              defaultValue=""
              autoComplete="off"
            />
          </div>
          <div style={{marginBottom:18}}>
            <label className="dv-fl">Isi Pesan</label>
            <textarea
              ref={contentRef}
              className="dv-fi"
              placeholder="Tulis pesan broadcast... ketik sebebas mungkin 🎉"
              defaultValue=""
              style={{minHeight:150,resize:'vertical',lineHeight:1.6}}
            />
          </div>
          <button type="submit" className="dv-btn-primary" disabled={sending}>
            {sending?<><div className="dv-spin"/>Mengirim ke semua user...</>:'📢 Kirim ke Semua User'}
          </button>
        </form>
      </div>

      {/* Kanan — Riwayat broadcast */}
      <div className="dv-card">
        <div className="dv-card-title">
          <div className="dv-card-bar"/>
          <div className="dv-card-label">📋 RIWAYAT ({list.length})</div>
          <button onClick={load} style={{marginLeft:'auto',background:'rgba(168,85,247,.08)',border:'1px solid rgba(168,85,247,.2)',borderRadius:8,color:'#c77dff',padding:'4px 10px',cursor:'pointer',fontSize:'.75rem',fontFamily:'Rajdhani,sans-serif',fontWeight:700,transition:'all .2s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(168,85,247,.16)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(168,85,247,.08)'}>🔄</button>
        </div>
        {loading?(
          [1,2,3].map(i=><div key={i} style={{height:72,background:'rgba(255,255,255,.03)',borderRadius:12,marginBottom:8,opacity:.4}}/>)
        ):list.length===0?(
          <div style={{textAlign:'center',padding:'40px 0',color:'#333344'}}>
            <div style={{fontSize:'2.5rem',marginBottom:8,opacity:.3}}>📭</div>
            <div style={{fontSize:'.85rem'}}>Belum ada broadcast</div>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:430,overflowY:'auto',paddingRight:4}}>
            {list.map((bc)=>(
              <div key={bc.id} style={{background:'rgba(168,85,247,.04)',border:'1px solid rgba(168,85,247,.12)',borderRadius:14,padding:'14px 16px',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,85,247,.3)';e.currentTarget.style.background='rgba(168,85,247,.07)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,85,247,.12)';e.currentTarget.style.background='rgba(168,85,247,.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}}>
                  <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#e0e0e8',fontSize:'.93rem',flex:1,lineHeight:1.3}}>{bc.title}</div>
                  <div style={{display:'flex',gap:5,flexShrink:0}}>
                    <button onClick={()=>openEdit(bc)} className="dv-btn-act" style={{padding:'4px 9px',fontSize:'.8rem'}} title="Edit">✏️</button>
                    <button onClick={()=>del(bc.id)} className="dv-btn-del" style={{padding:'4px 9px',fontSize:'.8rem'}} title="Hapus">🗑</button>
                  </div>
                </div>
                <div style={{color:'#6a6a8a',fontSize:'.8rem',lineHeight:1.55,marginBottom:7,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{bc.content}</div>
                <div style={{fontSize:'.7rem',color:'#333344',fontFamily:'Rajdhani,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{opacity:.5}}>📅</span> {fmtD(bc.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Modal Edit Broadcast */}
    <Modal open={!!editBc} onClose={()=>setEditBc(null)} title="✏️ Edit Broadcast">
      {editBc&&(
        <form onSubmit={saveEdit}>
          <div className="dv-fg">
            <label className="dv-fl">Judul</label>
            <input className="dv-fi" value={editTitle} onChange={e=>setEditTitle(e.target.value)} required placeholder="Judul broadcast..."/>
          </div>
          <div style={{marginBottom:18}}>
            <label className="dv-fl">Isi Pesan</label>
            <textarea className="dv-fi" value={editContent} onChange={e=>setEditContent(e.target.value)} required style={{minHeight:130,resize:'vertical'}} placeholder="Isi broadcast..."/>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button type="submit" className="dv-btn-primary" style={{flex:1}}>💾 Simpan Perubahan</button>
            <button type="button" onClick={()=>setEditBc(null)} className="dv-btn-sec">Batal</button>
          </div>
        </form>
      )}
    </Modal>
    </>
  )
})

// ══════════════════════════════════════════════════════════════
// BLOCK BLAST EVENT TAB
// ══════════════════════════════════════════════════════════════
function BlockBlastTab({token}:{token:string|null}){
  const [eventActive,setEventActive]=useState(false)
  const [scores,setScores]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [toggling,setToggling]=useState(false)
  const [sendingPrize,setSendingPrize]=useState<number|null>(null)
  const PRIZES=[
    {rank:1,label:'🥇 Juara 1',days:'30 Hari',dur:'30d',color:'#ffd700',bg:'rgba(255,215,0,.07)',border:'rgba(255,215,0,.25)'},
    {rank:2,label:'🥈 Juara 2',days:'20 Hari',dur:'30d',color:'#c0c0c0',bg:'rgba(192,192,192,.05)',border:'rgba(192,192,192,.18)'},
    {rank:3,label:'🥉 Juara 3',days:'15 Hari',dur:'7d',color:'#cd7f32',bg:'rgba(205,127,50,.05)',border:'rgba(205,127,50,.18)'},
  ]
  const load=useCallback(async()=>{
    setLoading(true)
    const d=await api('/developer/blockblast','GET',undefined,token)
    if(d.scores)setScores(d.scores)
    if(d.event_active!==undefined)setEventActive(d.event_active)
    setLoading(false)
  },[token])
  useEffect(()=>{load()},[load])
  async function toggleEvent(){
    setToggling(true)
    const d=await api('/developer/blockblast','PATCH',{event_active:!eventActive},token)
    setToggling(false)
    if(d.error){toast(d.error,'error');return}
    setEventActive(!eventActive)
    toast(eventActive?'Event dinonaktifkan':'Event aktif! 🎮','success')
  }
  async function resetScores(){
    if(!confirm('Reset SEMUA skor? Tidak bisa dibatalkan!'))return
    const d=await api('/developer/blockblast','DELETE',undefined,token)
    if(d.error){toast(d.error,'error');return}
    toast('Skor direset','info');load()
  }
  async function sendPrize(rank:number,username:string,dur:string){
    setSendingPrize(rank)
    const d=await api('/developer/keys','POST',{target_username:username,duration_type:dur,hwid_max:1},token)
    setSendingPrize(null)
    if(d.error){toast(d.error,'error');return}
    toast('🎁 Key dikirim ke '+username+'!','success')
  }
  const medals=['🥇','🥈','🥉']
  const rankColors=['#ffd700','#c0c0c0','#cd7f32']
  return(
    <div>
      <div className="dv-card" style={{marginBottom:20}}>
        <div className="dv-card-title"><div className="dv-card-bar"/><div className="dv-card-label">🎮 BLOCK BLAST EVENT</div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:eventActive?'#32ff7e':'#ff4757',fontSize:'1.2rem'}}>{eventActive?'ON':'OFF'}</div><div className="dv-stat-lbl">Status</div></div>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#c77dff'}}>{scores.length}</div><div className="dv-stat-lbl">Peserta</div></div>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#ffd700',fontSize:'1.4rem'}}>{scores[0]?.score?.toLocaleString()||'–'}</div><div className="dv-stat-lbl">Top Skor</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {PRIZES.map(p=>(
            <div key={p.rank} style={{background:p.bg,border:`1px solid ${p.border}`,borderRadius:12,padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:'1.8rem',marginBottom:6}}>{medals[p.rank-1]}</div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:p.color}}>{p.label}</div>
              <div style={{fontSize:'.75rem',color:'rgba(255,255,255,.4)',marginTop:3}}>Key {p.days}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={toggleEvent} disabled={toggling} style={{flex:1,background:eventActive?'linear-gradient(135deg,#7f1d1d,#dc2626)':'linear-gradient(135deg,#14532d,#22c55e)',border:'none',borderRadius:13,color:'#fff',padding:'12px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.95rem',transition:'all .2s'}}>
            {toggling?'...':eventActive?'⏹ Nonaktifkan':'▶ Aktifkan Event'}
          </button>
          <button onClick={resetScores} style={{background:'rgba(255,71,87,.08)',border:'1px solid rgba(255,71,87,.2)',borderRadius:13,color:'#ff5c69',padding:'12px 18px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>🗑 Reset</button>
          <button onClick={load} style={{background:'rgba(168,85,247,.08)',border:'1px solid rgba(168,85,247,.2)',borderRadius:13,color:'#c77dff',padding:'12px 18px',cursor:'pointer'}}>🔄</button>
        </div>
      </div>
      {!loading&&scores.length>0&&(
        <div className="dv-card" style={{marginBottom:20}}>
          <div className="dv-card-title"><div className="dv-card-bar"/><div className="dv-card-label">🏆 PEMENANG TOP 3</div></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {PRIZES.map((prize,i)=>{
              const player=scores[i]
              return(
                <div key={prize.rank} style={{background:prize.bg,border:`1.5px solid ${prize.border}`,borderRadius:16,padding:'20px',textAlign:'center',boxShadow:i===0?`0 0 20px ${prize.color}22`:undefined}}>
                  <div style={{fontSize:'2.2rem',marginBottom:8}}>{medals[i]}</div>
                  {player?(
                    <>
                      <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(0,0,0,.3)',border:`2px solid ${prize.color}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',fontFamily:'Rajdhani,sans-serif',fontWeight:900,fontSize:'1.3rem',color:prize.color}}>{player.username?.[0]?.toUpperCase()}</div>
                      <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#e0e0e8',marginBottom:4}}>{player.username}</div>
                      <div style={{fontFamily:'Orbitron,sans-serif',fontWeight:900,fontSize:'1.1rem',color:prize.color,marginBottom:12}}>{player.score?.toLocaleString()}</div>
                      <button onClick={()=>sendPrize(prize.rank,player.username,prize.dur)} disabled={sendingPrize===prize.rank} style={{width:'100%',background:`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},.12)`,border:`1px solid ${prize.border}`,borderRadius:10,color:prize.color,padding:'8px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.8rem',transition:'all .2s'}}>
                        {sendingPrize===prize.rank?'Mengirim...':'🎁 Kirim Key '+prize.days}
                      </button>
                    </>
                  ):(
                    <div style={{color:'#333344',fontSize:'.82rem',padding:'10px 0'}}>Belum ada</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="dv-card">
        <div className="dv-card-title"><div className="dv-card-bar"/><div className="dv-card-label">📊 SEMUA SKOR ({scores.length})</div></div>
        {loading?([1,2,3,4].map(i=><div key={i} style={{height:48,background:'rgba(255,255,255,.03)',borderRadius:10,marginBottom:8,opacity:.4}}/>))
        :scores.length===0?(
          <div style={{textAlign:'center',padding:'40px 0',color:'#444455'}}>
            <div style={{fontSize:'3rem',marginBottom:10,opacity:.3}}>🎮</div>
            <div>{eventActive?'Belum ada yang main':'Aktifkan event dulu'}</div>
          </div>
        ):(
          <div className="dv-tbl-wrap">
            <table className="dv-tbl">
              <thead><tr><th>#</th><th>Player</th><th>Skor</th><th>Tanggal</th><th>Aksi</th></tr></thead>
              <tbody>
                {scores.map((s,i)=>(
                  <tr key={s.id||i} style={{animation:`dvFadeUp .2s ease ${i*.03}s both`}}>
                    <td style={{fontWeight:900,color:i<3?rankColors[i]:'#444455',fontSize:i<3?'1.1rem':'.85rem'}}>{i<3?medals[i]:`#${i+1}`}</td>
                    <td style={{fontWeight:700,color:'#e0e0e8'}}>{s.username}</td>
                    <td style={{fontFamily:'Orbitron,sans-serif',fontWeight:700,color:i<3?rankColors[i]:'#c77dff'}}>{s.score?.toLocaleString()}</td>
                    <td style={{color:'#444455',fontSize:'.78rem'}}>{s.played_at?new Date(s.played_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'–'}</td>
                    <td>{i<3&&<button onClick={()=>sendPrize(i+1,s.username,PRIZES[i].dur)} disabled={sendingPrize===i+1} style={{background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.25)',borderRadius:8,color:'#c77dff',padding:'4px 10px',cursor:'pointer',fontSize:'.75rem',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>{sendingPrize===i+1?'...':'🎁'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// INFO PAGE — landing page sebelum login
// ══════════════════════════════════════════════════════════════
function InfoPage({onLogin}:{onLogin:(tok:string,user:any)=>void}){
  const router=useRouter()
  const [dialog,setDialog]=useState<'login'|'register'|null>(null)
  const [lf,setLf]=useState({username:'',password:''})
  const [rf,setRf]=useState({username:'',email:'',password:''})
  const [showPw,setShowPw]=useState(false)
  const [showRPw,setShowRPw]=useState(false)
  const [logging,setLogging]=useState(false)
  const [registering,setRegistering]=useState(false)
  const [err,setErr]=useState('')

  async function doLogin(e:React.FormEvent){
    e.preventDefault();setLogging(true);setErr('')
    const d=await api('/auth/login','POST',{...lf,rememberMe:true})
    setLogging(false)
    if(d.error){setErr(d.error);return}
    if(d.user?.role!=='developer'){setErr('Akun ini bukan developer!');return}
    localStorage.setItem('awr_dev_token',d.token)
    onLogin(d.token,d.user)
  }

  async function doRegister(e:React.FormEvent){
    e.preventDefault();setRegistering(true);setErr('')
    const d=await api('/auth/register','POST',rf)
    setRegistering(false)
    if(d.error){setErr(d.error);return}
    toast('Akun dibuat! Silakan login.','success')
    setDialog('login');setLf({username:rf.username,password:rf.password})
  }

  const PRICES=[
    {dur:'1 Hari',price:'Rp1.000',tier:'FREE',c:'#8ab8d8'},
    {dur:'3 Hari',price:'Rp5.000',tier:'BASIC',c:'#4ade80'},
    {dur:'7 Hari',price:'Rp12.000',tier:'BASIC',c:'#4ade80'},
    {dur:'30 Hari',price:'Rp30.000',tier:'PRO',c:'#00aaff'},
    {dur:'Lifetime',price:'Rp100.000',tier:'VIP',c:'#ffd700'},
  ]
  const FITUR=[
    {i:'🎯',t:'Record & Replay',d:'Rekam rute jalan otomatis'},
    {i:'🔒',t:'HWID Protection',d:'Key sistem aman terverifikasi'},
    {i:'📊',t:'Leaderboard Global',d:'Bersaing dengan ribuan pemain'},
    {i:'⚡',t:'Anti-Lag',d:'Script ringan & cepat'},
    {i:'🎮',t:'Event & Hadiah',d:'Event rutin dengan hadiah key'},
    {i:'🔔',t:'Notifikasi',d:'Update langsung dari developer'},
  ]

  return(
    <>
    <Particles/>
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',background:'rgba(8,9,11,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(168,85,247,.12)'}}>
      <div style={{fontFamily:'Orbitron,sans-serif',fontWeight:900,fontSize:'1.1rem',background:'linear-gradient(135deg,#7c3aed,#c77dff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:3}}>⚡ AWR</div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>{setDialog('login');setErr('')}} style={{background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.3)',borderRadius:9,color:'#c77dff',padding:'8px 18px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.9rem',transition:'all .2s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(168,85,247,.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(168,85,247,.1)'}>Login</button>
        <button onClick={()=>{setDialog('register');setErr('')}} style={{background:'linear-gradient(135deg,#7c3aed,#a855f7)',border:'none',borderRadius:9,color:'#fff',padding:'8px 18px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.9rem',boxShadow:'0 4px 14px rgba(168,85,247,.3)'}}>Daftar</button>
      </div>
    </nav>
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'90px 24px 60px',position:'relative',zIndex:1}}>
      <div style={{display:'inline-block',background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.3)',borderRadius:99,padding:'5px 16px',color:'#c77dff',fontSize:'.72rem',fontWeight:700,letterSpacing:2,marginBottom:20,animation:'dvFadeUp .5s ease both'}}>ROBLOX AUTO WALK RECORDER</div>
      <h1 style={{fontFamily:'Orbitron,sans-serif',fontWeight:900,fontSize:'clamp(2.2rem,6vw,4.2rem)',background:'linear-gradient(135deg,#7c3aed,#c77dff 50%,#fff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',textAlign:'center',marginBottom:16,lineHeight:1.1,animation:'dvFadeUp .5s ease .08s both',filter:'drop-shadow(0 0 40px rgba(168,85,247,.3))'}}>AWR KEY SYSTEM</h1>
      <p style={{color:'#6b6b8a',fontSize:'clamp(.88rem,2vw,1.05rem)',maxWidth:520,textAlign:'center',lineHeight:1.8,marginBottom:36,animation:'dvFadeUp .5s ease .14s both'}}>Script terbaik untuk Auto Walk Recorder di Roblox. Key sistem aman, verifikasi HWID, leaderboard global, dan support aktif 24/7.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',marginBottom:56,animation:'dvFadeUp .5s ease .2s both'}}>
        <button onClick={()=>{setDialog('login');setErr('')}} style={{background:'linear-gradient(135deg,#7c3aed,#a855f7)',border:'none',borderRadius:14,color:'#fff',padding:'14px 34px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.05rem',boxShadow:'0 4px 24px rgba(168,85,247,.4)',transition:'all .25s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(168,85,247,.55)'}} onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 24px rgba(168,85,247,.4)'}}>🔑 Login</button>
        <button onClick={()=>router.push('/')} style={{background:'rgba(168,85,247,.07)',border:'1.5px solid rgba(168,85,247,.3)',borderRadius:14,color:'#c77dff',padding:'14px 34px',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.05rem',transition:'all .25s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(168,85,247,.14)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(168,85,247,.07)'}>🌐 Website</button>
      </div>
      <div style={{display:'flex',gap:36,justifyContent:'center',marginBottom:64,flexWrap:'wrap',animation:'dvFadeUp .5s ease .25s both'}}>
        {[{v:'1000+',l:'Pengguna'},{v:'99.9%',l:'Uptime'},{v:'50K+',l:'Eksekusi'},{v:'24/7',l:'Support'}].map(s=>(
          <div key={s.l} style={{textAlign:'center'}}>
            <div style={{fontSize:'1.7rem',fontWeight:900,color:'#c77dff',fontFamily:'Orbitron,sans-serif',filter:'drop-shadow(0 0 10px rgba(168,85,247,.5))'}}>{s.v}</div>
            <div style={{color:'#444455',fontSize:'.7rem',marginTop:3,letterSpacing:1.5,textTransform:'uppercase'}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{width:'100%',maxWidth:780,marginBottom:56,animation:'dvFadeUp .5s ease .3s both'}}>
        <div style={{textAlign:'center',marginBottom:24}}><div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.6rem',color:'#c77dff',marginBottom:4}}>✨ Fitur Unggulan</div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          {FITUR.map(f=>(
            <div key={f.t} style={{background:'rgba(168,85,247,.04)',border:'1px solid rgba(168,85,247,.1)',borderRadius:14,padding:'18px 16px',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,85,247,.3)';e.currentTarget.style.transform='translateY(-3px)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,85,247,.1)';e.currentTarget.style.transform=''}}>
              <div style={{fontSize:'1.7rem',marginBottom:8}}>{f.i}</div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#e0e0e8',marginBottom:4}}>{f.t}</div>
              <div style={{color:'#444455',fontSize:'.8rem',lineHeight:1.5}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{width:'100%',maxWidth:700,animation:'dvFadeUp .5s ease .35s both'}}>
        <div style={{textAlign:'center',marginBottom:24}}><div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:800,fontSize:'1.6rem',color:'#c77dff',marginBottom:4}}>💎 Harga Key</div><div style={{color:'#444455',fontSize:'.85rem'}}>Terjangkau · Bayar sekali · Aktif langsung</div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
          {PRICES.map(p=>(
            <div key={p.dur} style={{background:'rgba(168,85,247,.04)',border:'1px solid rgba(168,85,247,.1)',borderRadius:14,padding:'18px 12px',textAlign:'center',transition:'all .22s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=p.c;e.currentTarget.style.transform='translateY(-4px)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,85,247,.1)';e.currentTarget.style.transform=''}}>
              <div style={{fontSize:'.6rem',fontWeight:700,color:p.c,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{p.tier}</div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#c0c0d8',marginBottom:8,fontSize:'.9rem'}}>{p.dur}</div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontWeight:900,color:p.c,fontSize:'1rem'}}>{p.price}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:14,color:'#444455',fontSize:'.82rem'}}>Beli key → <a href="https://t.me/sanzxmzz" target="_blank" rel="noreferrer" style={{color:'#c77dff',textDecoration:'none',fontWeight:700}}>@sanzxmzz di Telegram</a></div>
      </div>
    </div>

    {dialog&&(
      <div onClick={e=>{if(e.target===e.currentTarget){setDialog(null);setErr('')}}} style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.86)',backdropFilter:'blur(10px)',animation:'dvFadeIn .2s ease',padding:20}}>
        <div style={{background:'linear-gradient(160deg,#0f0918,#08090b)',border:'1px solid rgba(168,85,247,.25)',borderRadius:22,padding:'28px',width:380,maxWidth:'95vw',boxShadow:'0 0 60px rgba(168,85,247,.18)',animation:'dvModalIn .3s ease',position:'relative'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(168,85,247,.7),transparent)',borderRadius:'22px 22px 0 0'}}/>
          <div style={{display:'flex',gap:4,background:'rgba(255,255,255,.04)',borderRadius:12,padding:4,marginBottom:24}}>
            {(['login','register'] as const).map(m=>(
              <button key={m} onClick={()=>{setDialog(m);setErr('')}} style={{flex:1,padding:'9px',borderRadius:9,border:'none',background:dialog===m?'linear-gradient(135deg,rgba(124,58,237,.4),rgba(168,85,247,.3))':'transparent',color:dialog===m?'#fff':'#8a8a9a',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.9rem',transition:'all .2s'}}>
                {m==='login'?'🔑 Login':'✨ Daftar'}
              </button>
            ))}
          </div>
          {err&&<div style={{background:'rgba(220,50,50,.12)',border:'1px solid rgba(220,50,50,.3)',borderRadius:10,padding:'10px 14px',color:'#f87171',fontSize:'.84rem',marginBottom:14}}>⚠️ {err}</div>}
          {dialog==='login'?(
            <form onSubmit={doLogin}>
              <div className="dv-fg"><label className="dv-fl">Username</label><input className="dv-fi" placeholder="Username..." value={lf.username} onChange={e=>setLf(f=>({...f,username:e.target.value}))} required autoComplete="username"/></div>
              <div style={{marginBottom:18,position:'relative'}}>
                <label className="dv-fl">Password</label>
                <input className="dv-fi" style={{paddingRight:44}} type={showPw?'text':'password'} placeholder="Password..." value={lf.password} onChange={e=>setLf(f=>({...f,password:e.target.value}))} required/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,bottom:11,background:'none',border:'none',color:'#444455',cursor:'pointer',fontSize:'1rem'}}>{showPw?'🙈':'👁'}</button>
              </div>
              <button type="submit" className="dv-btn-primary" disabled={logging}>{logging?<><div className="dv-spin"/>Masuk...</>:'🚀 Masuk'}</button>
            </form>
          ):(
            <form onSubmit={doRegister}>
              <div className="dv-fg"><label className="dv-fl">Username</label><input className="dv-fi" placeholder="Username..." value={rf.username} onChange={e=>setRf(f=>({...f,username:e.target.value}))} required/></div>
              <div className="dv-fg"><label className="dv-fl">Email</label><input className="dv-fi" type="email" placeholder="Email..." value={rf.email} onChange={e=>setRf(f=>({...f,email:e.target.value}))} required/></div>
              <div style={{marginBottom:18,position:'relative'}}>
                <label className="dv-fl">Password</label>
                <input className="dv-fi" style={{paddingRight:44}} type={showRPw?'text':'password'} placeholder="Password..." value={rf.password} onChange={e=>setRf(f=>({...f,password:e.target.value}))} required/>
                <button type="button" onClick={()=>setShowRPw(!showRPw)} style={{position:'absolute',right:12,bottom:11,background:'none',border:'none',color:'#444455',cursor:'pointer',fontSize:'1rem'}}>{showRPw?'🙈':'👁'}</button>
              </div>
              <button type="submit" className="dv-btn-primary" disabled={registering}>{registering?<><div className="dv-spin"/>Mendaftar...</>:'✨ Daftar'}</button>
            </form>
          )}
          <button onClick={()=>{setDialog(null);setErr('')}} style={{width:'100%',marginTop:10,background:'none',border:'none',color:'#333344',cursor:'pointer',fontSize:'.8rem',fontFamily:'Rajdhani,sans-serif'}} onMouseEnter={e=>e.currentTarget.style.color='#8a8a9a'} onMouseLeave={e=>e.currentTarget.style.color='#333344'}>Tutup</button>
        </div>
      </div>
    )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
const DV_CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html{scroll-behavior:smooth}
  body{background:#08090b;color:#e0e0e8;font-family:'Outfit',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 90% 0,rgba(168,85,247,.06),transparent),radial-gradient(ellipse 60% 40% at 5% 100%,rgba(124,58,237,.04),transparent);pointer-events:none;z-index:0}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0b0e}::-webkit-scrollbar-thumb{background:rgba(168,85,247,.25);border-radius:4px}
  @keyframes dvToastIn{from{transform:translateX(110px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes dvFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes dvModalIn{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes dvFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dvSpin{to{transform:rotate(360deg)}}
  @keyframes dvTabIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .dv-nav{position:sticky;top:0;z-index:200;height:64px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(8,9,11,.88);backdrop-filter:blur(28px);border-bottom:1px solid rgba(255,255,255,.06)}
  .dv-nav::after{content:'';position:absolute;bottom:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.35) 40%,rgba(168,85,247,.35) 60%,transparent)}
  .dv-brand{font-family:'Orbitron',sans-serif;font-size:1.15rem;font-weight:900;background:linear-gradient(135deg,#7c3aed 20%,#c77dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;filter:drop-shadow(0 0 12px rgba(168,85,247,.45))}
  .dv-nav-actions{display:flex;gap:8px;align-items:center}
  .dv-badge-user{font-size:.72rem;color:#8a8a9a;background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.14);border-radius:8px;padding:3px 10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.5px}
  .dv-btn-nav{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#9a9aaa;border-radius:10px;padding:7px 13px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;transition:all .2s}
  .dv-btn-nav:hover{background:rgba(255,255,255,.08);color:#fff}
  .dv-btn-logout{background:rgba(255,71,87,.07);border:1px solid rgba(255,71,87,.18);color:#ff5c69;border-radius:10px;padding:7px 13px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;transition:all .2s}
  .dv-btn-logout:hover{background:rgba(255,71,87,.14)}
  .dv-tabs{display:flex;gap:3px;background:rgba(7,8,12,.82);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:5px;margin-bottom:28px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;backdrop-filter:blur(16px);box-shadow:0 2px 24px rgba(0,0,0,.5)}
  .dv-tabs::-webkit-scrollbar{display:none}
  .dv-tab{flex:1 0 auto;min-width:60px;padding:9px 10px;border-radius:15px;border:1px solid transparent;background:transparent;color:rgba(120,120,145,.5);cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;transition:all .22s ease;display:flex;flex-direction:column;align-items:center;gap:4px;white-space:nowrap}
  .dv-tab .ti{font-size:1rem;line-height:1;transition:transform .22s ease,filter .22s ease;filter:grayscale(60%) opacity(0.5)}
  .dv-tab .tl{font-size:.58rem;text-transform:uppercase;letter-spacing:1.2px;line-height:1;transition:color .2s}
  .dv-tab:hover{color:rgba(200,170,255,.8);background:rgba(168,85,247,.07);border-color:rgba(168,85,247,.12)}
  .dv-tab:hover .ti{transform:translateY(-2px);filter:grayscale(0%) opacity(1)}
  .dv-tab.active{color:#fff;background:linear-gradient(145deg,rgba(124,58,237,.22),rgba(168,85,247,.16));border-color:rgba(168,85,247,.28);box-shadow:0 4px 18px rgba(168,85,247,.2)}
  .dv-tab.active .ti{transform:scale(1.1) translateY(-1px);filter:grayscale(0%) opacity(1) drop-shadow(0 0 7px rgba(168,85,247,.65))}
  .dv-tab.active .tl{color:rgba(220,180,255,.9)}
  .dv-wrap{max-width:1300px;margin:0 auto;padding:28px 24px}
  .dv-card{background:linear-gradient(160deg,rgba(255,255,255,.03),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:24px;position:relative;overflow:hidden;animation:dvFadeUp .32s ease;margin-bottom:20px}
  .dv-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.35),transparent)}
  .dv-card-title{display:flex;align-items:center;gap:10px;margin-bottom:20px}
  .dv-card-bar{width:3px;height:20px;background:linear-gradient(180deg,#7c3aed,#c77dff);border-radius:3px;flex-shrink:0}
  .dv-card-label{font-family:'Rajdhani',sans-serif;font-size:.9rem;font-weight:700;background:linear-gradient(135deg,#a855f7,#c77dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:.5px}
  .dv-fi{width:100%;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:13px;padding:11px 14px;color:#e0e0e8;font-size:.875rem;font-family:'Outfit',sans-serif;transition:all .2s;outline:none;-webkit-appearance:none}
  .dv-fi::placeholder{color:#444455}
  .dv-fi:hover{border-color:rgba(168,85,247,.2)}
  .dv-fi:focus{border-color:rgba(168,85,247,.45)!important;background:rgba(255,255,255,.05)!important;box-shadow:0 0 0 3px rgba(168,85,247,.09)!important;outline:none!important}
  .dv-fl{display:block;font-size:.78rem;color:#8a8a9a;font-weight:600;margin-bottom:6px}
  .dv-fg{margin-bottom:15px}
  .dv-btn-primary{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:13px;padding:12px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.5px;box-shadow:0 4px 18px rgba(168,85,247,.28);transition:all .2s;width:100%}
  .dv-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 24px rgba(168,85,247,.4)}
  .dv-btn-primary:disabled{background:rgba(255,255,255,.06);color:#444455;cursor:not-allowed;box-shadow:none;transform:none}
  .dv-btn-green{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:13px;padding:11px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;flex:1}
  .dv-btn-gold{background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;border:none;border-radius:13px;padding:10px 18px;font-family:'Rajdhani',sans-serif;font-weight:700;cursor:pointer;white-space:nowrap}
  .dv-btn-sec{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#9a9aaa;border-radius:13px;padding:11px 16px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;transition:all .2s}
  .dv-btn-sec:hover{background:rgba(255,255,255,.09);color:#fff}
  .dv-btn-act{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#8a8a9a;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem;transition:all .2s}
  .dv-btn-act:hover{background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.25);color:#c77dff}
  .dv-btn-ban{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);color:#ff5c69;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem}
  .dv-btn-unban{background:rgba(50,255,126,.08);border:1px solid rgba(50,255,126,.2);color:#32ff7e;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem}
  .dv-btn-del{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);color:#ff5c69;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:.8rem}
  .dv-tbl-wrap{border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;overflow-x:auto}
  .dv-tbl{width:100%;border-collapse:collapse}
  .dv-tbl th{padding:11px 16px;text-align:left;font-family:'Rajdhani',sans-serif;font-weight:700;color:#444455;font-size:.7rem;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
  .dv-tbl td{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.04);color:#c0c0c8;font-size:.84rem;vertical-align:middle}
  .dv-tbl tr:last-child td{border-bottom:none}
  .dv-tbl tr:hover td{background:rgba(168,85,247,.025)}
  .bx{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:.67rem;font-weight:700;letter-spacing:.6px;border:1px solid}
  .bx-g{background:rgba(50,255,126,.09);color:#32ff7e;border-color:rgba(50,255,126,.22)}
  .bx-r{background:rgba(255,71,87,.09);color:#ff5c69;border-color:rgba(255,71,87,.22)}
  .bx-b{background:rgba(79,172,254,.09);color:#4facfe;border-color:rgba(79,172,254,.22)}
  .bx-y{background:rgba(245,158,11,.09);color:#f59e0b;border-color:rgba(245,158,11,.22)}
  .bx-p{background:rgba(168,85,247,.09);color:#c77dff;border-color:rgba(168,85,247,.22)}
  .bx-gray{background:rgba(100,116,139,.1);color:#94a3b8;border-color:rgba(100,116,139,.2)}
  .dv-stat{background:linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;text-align:center}
  .dv-stat-val{font-family:'Rajdhani',sans-serif;font-size:2.4rem;font-weight:700;line-height:1}
  .dv-stat-lbl{font-size:.67rem;color:#444455;text-transform:uppercase;letter-spacing:1.5px;margin-top:6px}
  .dv-key-chip{font-family:'Rajdhani',sans-serif;font-size:.7rem;color:#4facfe;cursor:pointer;background:rgba(79,172,254,.06);border:1px solid rgba(79,172,254,.18);border-radius:8px;padding:4px 9px;display:inline-block;transition:all .2s}
  .dv-key-chip:hover{background:rgba(79,172,254,.12)}
  .dv-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:dvSpin .7s linear infinite}
  .dv-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);margin:16px 0}
  .dv-step-row{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;transition:border-color .2s}
  .dv-step-row.active{border-color:rgba(168,85,247,.22)}
  .dv-step-num{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.85rem;flex-shrink:0;transition:all .2s}
`

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
type Tab='send-key'|'users'|'keys'|'broadcast'|'global-key'|'resellers'|'getkey-settings'|'blockblast'|'music'|'support'

export default function DevPage(){
  const router=useRouter()
  const [token,setToken]=useState<string|null>(null)
  const [user,setUser]=useState<any>(null)
  const [tab,setTab]=useState<Tab>('send-key')
  const [booting,setBooting]=useState(true)
  const [epw,setEpw]=useState(false)
  const [rsSelId,setRsSelId]=useState('')
  const [users,setUsers]=useState<any[]>([])
  const [keys,setKeys]=useState<any[]>([])
  const [gkSteps,setGkSteps]=useState<any[]>([])
  const [search,setSearch]=useState('')
  const [sendForm,setSendForm]=useState({target_username:'',duration_type:'24h',hwid_max:'1'})
  const [sending,setSending]=useState(false)
  const [gk,setGk]=useState({duration_type:'24h',hwid_max:'1'})
  const [editUser,setEditUser]=useState<any>(null)
  const [editKey,setEditKey]=useState<any>(null)
  const [banModal,setBanModal]=useState<any>(null)
  const [banReason,setBanReason]=useState('')
  const [music,setMusic]=useState({url:'',type:'url',is_active:false,volume:50,title:'AWR Music'})
  const [support,setSupport]=useState({whatsapp_url:'',telegram_url:'',discord_url:'',custom_label:'Hubungi Support',is_active:true})
  const [musicSaving,setMusicSaving]=useState(false)
  const [supportSaving,setSupportSaving]=useState(false)
  const [addStep,setAddStep]=useState({name:'',url:'',duration_seconds:'30'})
  const [editStep,setEditStep]=useState<any>(null)

  useEffect(()=>{
    const devTok=localStorage.getItem('awr_dev_token')
    const mainTok=localStorage.getItem('awr_token')||sessionStorage.getItem('awr_token')
    const saved=devTok||mainTok
    if(saved){api('/user/profile','GET',undefined,saved).then(d=>{if(d.user?.role==='developer'){setToken(saved);setUser(d.user);if(!devTok)localStorage.setItem('awr_dev_token',saved)}else localStorage.removeItem('awr_dev_token');setBooting(false)})}
    else setBooting(false)
  },[])

  useEffect(()=>{if(token){loadUsers();loadKeys();loadGkSteps();loadMusicSupport()}},[token])

  const loadUsers=()=>api('/developer/users','GET',undefined,token).then(d=>{if(d.users)setUsers(d.users)})
  const loadMusicSupport=()=>{
    api('/developer/music','GET').then(d=>{if(d.music)setMusic({url:d.music.url||'',type:d.music.type||'url',is_active:!!d.music.is_active,volume:d.music.volume||50,title:d.music.title||'AWR Music'})})
    api('/developer/support','GET').then(d=>{if(d.support)setSupport({whatsapp_url:d.support.whatsapp_url||'',telegram_url:d.support.telegram_url||'',discord_url:d.support.discord_url||'',custom_label:d.support.custom_label||'Hubungi Support',is_active:!!d.support.is_active})})
  }
  const loadKeys=()=>api('/developer/keys','GET',undefined,token).then(d=>{if(d.keys)setKeys(d.keys)})
  const loadGkSteps=()=>api('/developer/getkey-settings','GET',undefined,token).then(d=>{if(d.steps)setGkSteps(d.steps)})
  async function saveMusic(){setMusicSaving(true);const d=await api('/developer/music','PATCH',music,token);setMusicSaving(false);if(d.error){toast(d.error,'error');return};toast('Musik disimpan!','success')}
  async function saveSupport(){setSupportSaving(true);const d=await api('/developer/support','PATCH',support,token);setSupportSaving(false);if(d.error){toast(d.error,'error');return};toast('Support disimpan!','success')}
  async function sendKey(e:React.FormEvent){e.preventDefault();setSending(true);const d=await api('/developer/keys','POST',sendForm,token);setSending(false);if(d.error){toast(d.error,'error');return};toast('Key dikirim ke '+sendForm.target_username+'!','success');setSendForm(f=>({...f,target_username:'',hwid_max:'1'}));loadKeys()}
  async function saveEditUser(){const d=await api('/developer/users','PATCH',editUser,token);if(d.error){toast(d.error,'error');return};toast('User diupdate!','success');setEditUser(null);loadUsers()}
  async function saveEditKey(){const d=await api('/developer/keys','PATCH',editKey,token);if(d.error){toast(d.error,'error');return};toast('Key diupdate!','success');setEditKey(null);loadKeys()}
  async function doBan(action:string){const d=await api('/developer/ban','POST',{userId:banModal.id,action,reason:banReason},token);if(d.error){toast(d.error,'error');return};toast(d.message,'success');setBanModal(null);setBanReason('');loadUsers()}
  async function delKey(id:string){if(!confirm('Hapus key ini?'))return;const d=await api('/developer/keys','DELETE',{keyId:id},token);if(d.error){toast(d.error,'error');return};toast('Key dihapus','info');loadKeys()}
  async function sendGk(e:React.FormEvent){e.preventDefault();const d=await api('/developer/send-key-all','POST',gk,token);if(d.error){toast(d.error,'error');return};toast('Key dikirim! '+d.notified+' user dinotif','success')}
  async function setRole(uid:string,role:string){const d=await api('/developer/users','PATCH',{userId:uid,role},token);if(d.error){toast(d.error,'error');return};toast('Role diupdate!','success');loadUsers()}
  async function addGkStep(e:React.FormEvent){e.preventDefault();const d=await api('/developer/getkey-settings','POST',{...addStep,duration_seconds:parseInt(addStep.duration_seconds)},token);if(d.error){toast(d.error,'error');return};toast('Step ditambah!','success');setAddStep({name:'',url:'',duration_seconds:'30'});loadGkSteps()}
  async function toggleStep(id:string,is_active:boolean){await api('/developer/getkey-settings','PATCH',{id,is_active},token);loadGkSteps()}
  async function saveEditStep(){const d=await api('/developer/getkey-settings','PATCH',{id:editStep.id,name:editStep.name,url:editStep.url,duration_seconds:parseInt(editStep.duration_seconds)},token);if(d.error){toast(d.error,'error');return};toast('Step diupdate!','success');setEditStep(null);loadGkSteps()}
  async function delStep(id:string){if(!confirm('Hapus step ini?'))return;const d=await api('/developer/getkey-settings','DELETE',{id},token);if(d.error){toast(d.error,'error');return};toast('Step dihapus','info');loadGkSteps()}
  function logout(){localStorage.removeItem('awr_dev_token');setToken(null);setUser(null)}

  if(booting||!token)return(
    <><Head><title>AWR Key System</title></Head>
    <style>{DV_CSS}</style><ToastRoot/>
    <div style={{minHeight:'100vh',background:'#08090b',position:'relative',overflow:'hidden'}}>
      <InfoPage onLogin={(tok,u)=>{setToken(tok);setUser(u);setBooting(false)}}/>
    </div></>
  )

  const fu=users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))
  const TABS:[Tab,string,string][]=[
    ['send-key','🔑','Kirim Key'],['users','👥','Users'],['keys','🗝','Keys'],
    ['broadcast','📢','Broadcast'],['global-key','🌐','Global'],['resellers','🏪','Reseller'],
    ['getkey-settings','⚙️','GetKey'],['blockblast','🎮','BlockBlast'],
    ['music','🎵','Musik'],['support','💬','Support'],
  ]
  const CS=({title,children,extra}:{title:string,children:React.ReactNode,extra?:React.ReactNode})=>(
    <div className="dv-card">
      <div className="dv-card-title"><div className="dv-card-bar"/><div className="dv-card-label">{title}</div>{extra&&<div style={{marginLeft:'auto'}}>{extra}</div>}</div>
      {children}
    </div>
  )

  return(
    <><Head><title>Developer Panel — AWR</title></Head>
    <style>{DV_CSS}</style><ToastRoot/>
    <nav className="dv-nav">
      <div className="dv-brand">AWR DEV</div>
      <div className="dv-nav-actions">
        <span className="dv-badge-user">{user.username}</span>
        <button className="dv-btn-nav" onClick={()=>router.push('/')}>🏠 Website</button>
        <button className="dv-btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
    <div className="dv-wrap">
      <div className="dv-tabs">
        {TABS.map(([v,icon,lbl],i)=>(
          <button key={v} className={`dv-tab${tab===v?' active':''}`} onClick={()=>setTab(v)} style={{animation:`dvTabIn .3s ease ${i*.04}s both`}}>
            <span className="ti">{icon}</span><span className="tl">{lbl}</span>
          </button>
        ))}
      </div>

      {tab==='send-key'&&<div style={{animation:'dvFadeUp .3s ease'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#c77dff'}}>{keys.length}</div><div className="dv-stat-lbl">Total Key</div></div>
          <div className="dv-stat"><div className="dv-stat-val" style={{color:'#32ff7e'}}>{keys.filter(k=>k.is_active&&!isExpired(k.expires_at)).length}</div><div className="dv-stat-lbl">Aktif</div></div>
        </div>
        <CS title="KIRIM KEY KE USER">
          <form onSubmit={sendKey} style={{maxWidth:480}}>
            <div className="dv-fg"><label className="dv-fl">Username Tujuan</label><UserSearchInput users={users} value={sendForm.target_username} onChange={v=>setSendForm(f=>({...f,target_username:v}))}/></div>
            <div className="dv-fg"><label className="dv-fl">Durasi</label><DurationDropdown value={sendForm.duration_type} onChange={v=>setSendForm(f=>({...f,duration_type:v}))}/></div>
            <div style={{marginBottom:20}}><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" min={1} value={sendForm.hwid_max} onChange={e=>setSendForm(f=>({...f,hwid_max:e.target.value}))} required/></div>
            <button type="submit" className="dv-btn-primary" disabled={sending||!sendForm.target_username}>{sending?<><div className="dv-spin"/>Mengirim...</>:'Kirim Key'}</button>
          </form>
        </CS>
      </div>}

      {tab==='users'&&<CS title={`SEMUA USER (${users.length})`} extra={<input className="dv-fi" style={{width:200}} placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>}>
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
      </CS>}

      {tab==='keys'&&<CS title={`SEMUA KEY (${keys.length})`}>
        <div className="dv-tbl-wrap"><table className="dv-tbl">
          <thead><tr><th>Key</th><th>Owner</th><th>Durasi</th><th>Expired</th><th>HWID</th><th>Pakai</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {keys.map(k=><tr key={k.id}>
              <td><span className="dv-key-chip" onClick={()=>navigator.clipboard.writeText(k.key_value).then(()=>toast('Disalin!','success'))}>{k.key_value.slice(0,16)}…</span></td>
              <td style={{fontWeight:700,color:'#e0e0e8'}}>{k.owner?.username||<Bdg c="yellow" t="Shared"/>}</td>
              <td><Bdg c="blue" t={DUR[k.duration_type]||k.duration_type}/></td>
              <td style={{fontSize:'.8rem',color:isExpired(k.expires_at)?'#ff5c69':'#8a8a9a'}}>{fmtDate(k.expires_at)}</td>
              <td style={{color:'#8a8a9a'}}>{k.hwid_max}</td>
              <td style={{color:'#444455',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>{k.times_used}×</td>
              <td><Bdg c={k.is_active&&!isExpired(k.expires_at)?'green':'red'} t={k.is_active&&!isExpired(k.expires_at)?'Aktif':'Mati'}/></td>
              <td><div style={{display:'flex',gap:6}}>
                <button className="dv-btn-act" onClick={()=>setEditKey({keyId:k.id,is_active:k.is_active,hwid_max:k.hwid_max,duration_type:k.duration_type,assigned_to_username:k.owner?.username||''})}>✏️</button>
                <button className="dv-btn-del" onClick={()=>delKey(k.id)}>🗑</button>
              </div></td>
            </tr>)}
            {!keys.length&&<tr><td colSpan={8} style={{textAlign:'center',padding:'36px 0',color:'#333344'}}>Belum ada key</td></tr>}
          </tbody>
        </table></div>
      </CS>}

      {tab==='broadcast'&&<BroadcastTab token={token}/>}

      {tab==='global-key'&&<div style={{maxWidth:480}}><CS title="KEY GLOBAL">
        <div style={{background:'rgba(251,191,36,.05)',border:'1px solid rgba(251,191,36,.18)',borderRadius:12,padding:'12px 16px',marginBottom:18,fontSize:'.82rem',color:'#fbbf24'}}>⚠️ Key bisa dipakai semua user.</div>
        <form onSubmit={sendGk}>
          <div className="dv-fg"><label className="dv-fl">Durasi</label><DurationDropdown value={gk.duration_type} onChange={v=>setGk(g=>({...g,duration_type:v}))}/></div>
          <div style={{marginBottom:20}}><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" min={1} value={gk.hwid_max} onChange={e=>setGk(g=>({...g,hwid_max:e.target.value}))}/></div>
          <button type="submit" className="dv-btn-primary">Kirim ke Semua</button>
        </form>
      </CS></div>}

      {tab==='resellers'&&<div style={{maxWidth:620}}><CS title="MANAJEMEN RESELLER">
        <div className="dv-fg"><label className="dv-fl">Jadikan Reseller</label>
          <div style={{display:'flex',gap:8}}>
            <div style={{flex:1}}><UserSelectDropdown users={users.filter(u=>u.role==='user')} value={rsSelId} onChange={v=>setRsSelId(v)}/></div>
            <button onClick={()=>{if(rsSelId){setRole(rsSelId,'reseller');setRsSelId('')}}} className="dv-btn-gold">✓ Set</button>
          </div>
        </div>
        <div className="dv-divider"/>
        <div className="dv-tbl-wrap"><table className="dv-tbl">
          <thead><tr><th>Username</th><th>Email</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.filter(u=>u.role==='reseller').map(u=><tr key={u.id}>
              <td style={{fontWeight:700,color:'#e0e0e8'}}>{u.username}</td><td style={{color:'#444455'}}>{u.email}</td>
              <td><button className="dv-btn-ban" onClick={()=>setRole(u.id,'user')}>Copot</button></td>
            </tr>)}
            {!users.filter(u=>u.role==='reseller').length&&<tr><td colSpan={3} style={{textAlign:'center',padding:'28px 0',color:'#333344'}}>Belum ada reseller</td></tr>}
          </tbody>
        </table></div>
      </CS></div>}

      {tab==='getkey-settings'&&<CS title="SETTING GETKEY STEPS">
        <div style={{fontSize:'.82rem',color:'#444455',marginBottom:18}}>Atur step untuk dapat free key.</div>
        {gkSteps.map((s,i)=>(
          <div key={s.id} className={`dv-step-row${s.is_active?' active':''}`} style={{animation:`dvFadeUp .22s ease ${i*.04}s both`}}>
            <div className="dv-step-num" style={{background:s.is_active?'rgba(168,85,247,.15)':'rgba(255,255,255,.04)',border:`2px solid ${s.is_active?'rgba(168,85,247,.5)':'rgba(255,255,255,.1)'}`,color:s.is_active?'#c77dff':'#444455'}}>{s.order_index}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'.9rem',color:'#e0e0e8'}}>{s.name}</div>
              <div style={{fontSize:'.75rem',color:'#444455',marginTop:3}}>{s.duration_seconds}s · <span style={{color:'#4facfe'}}>{s.url.length>40?s.url.slice(0,40)+'…':s.url}</span></div>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>toggleStep(s.id,!s.is_active)} style={{background:s.is_active?'rgba(50,255,126,.08)':'rgba(255,71,87,.08)',border:`1px solid ${s.is_active?'rgba(50,255,126,.2)':'rgba(255,71,87,.2)'}`,color:s.is_active?'#32ff7e':'#ff5c69',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:'.78rem',fontWeight:700,fontFamily:'Rajdhani,sans-serif'}}>{s.is_active?'ON':'OFF'}</button>
              <button className="dv-btn-act" onClick={()=>setEditStep({...s,duration_seconds:s.duration_seconds.toString()})}>✏️</button>
              <button className="dv-btn-del" onClick={()=>delStep(s.id)}>🗑</button>
            </div>
          </div>
        ))}
        {!gkSteps.length&&<div style={{textAlign:'center',color:'#333344',padding:'16px 0'}}>Belum ada step.</div>}
        <div className="dv-divider"/>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,color:'#c77dff',marginBottom:14}}>+ Tambah Step</div>
        <form onSubmit={addGkStep}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 100px',gap:12,marginBottom:12}}>
            <div><label className="dv-fl">Nama</label><input className="dv-fi" placeholder="Nama..." value={addStep.name} onChange={e=>setAddStep(s=>({...s,name:e.target.value}))} required/></div>
            <div><label className="dv-fl">Detik</label><input className="dv-fi" type="number" min={5} max={300} value={addStep.duration_seconds} onChange={e=>setAddStep(s=>({...s,duration_seconds:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:16}}><label className="dv-fl">URL</label><input className="dv-fi" placeholder="https://..." value={addStep.url} onChange={e=>setAddStep(s=>({...s,url:e.target.value}))} required/></div>
          <button type="submit" className="dv-btn-primary" style={{width:'auto',padding:'10px 24px'}}>+ Tambah</button>
        </form>
      </CS>}

      {tab==='blockblast'&&<BlockBlastTab token={token}/>}

      {tab==='music'&&<div style={{maxWidth:520}}><CS title="🎵 MUSIK OTOMATIS">
        <div className="dv-fg"><label className="dv-fl">Judul</label><input className="dv-fi" placeholder="Nama lagu..." value={music.title} onChange={e=>setMusic(m=>({...m,title:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">URL (MP3 direct)</label><input className="dv-fi" placeholder="https://..." value={music.url} onChange={e=>setMusic(m=>({...m,url:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Volume ({music.volume}%)</label><input type="range" min={0} max={100} value={music.volume} onChange={e=>setMusic(m=>({...m,volume:+e.target.value}))} style={{width:'100%',accentColor:'#a855f7',marginTop:6}}/></div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',color:'#c77dff'}}><input type="checkbox" checked={music.is_active} onChange={e=>setMusic(m=>({...m,is_active:e.target.checked}))} style={{accentColor:'#a855f7',width:16,height:16}}/>Aktifkan</label></div>
        <button onClick={saveMusic} disabled={musicSaving} className="dv-btn-primary">{musicSaving?'Menyimpan...':'💾 Simpan'}</button>
      </CS></div>}

      {tab==='support'&&<div style={{maxWidth:520}}><CS title="💬 SUPPORT">
        <div className="dv-fg"><label className="dv-fl">Label</label><input className="dv-fi" value={support.custom_label} onChange={e=>setSupport(s=>({...s,custom_label:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">WhatsApp</label><input className="dv-fi" placeholder="https://wa.me/..." value={support.whatsapp_url} onChange={e=>setSupport(s=>({...s,whatsapp_url:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Telegram</label><input className="dv-fi" placeholder="https://t.me/..." value={support.telegram_url} onChange={e=>setSupport(s=>({...s,telegram_url:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Discord</label><input className="dv-fi" placeholder="https://discord.gg/..." value={support.discord_url} onChange={e=>setSupport(s=>({...s,discord_url:e.target.value}))}/></div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',color:'#c77dff'}}><input type="checkbox" checked={support.is_active} onChange={e=>setSupport(s=>({...s,is_active:e.target.checked}))} style={{accentColor:'#a855f7',width:16,height:16}}/>Tampilkan</label></div>
        <button onClick={saveSupport} disabled={supportSaving} className="dv-btn-primary">{supportSaving?'Menyimpan...':'💾 Simpan'}</button>
      </CS></div>}
    </div>

    <Modal open={!!editUser} onClose={()=>setEditUser(null)} title="Edit User">
      {editUser&&<>
        {[['Username','username','text'],['Email','email','email'],['Roblox','roblox_username','text']].map(([l,k,t])=>(
          <div key={k as string} className="dv-fg"><label className="dv-fl">{l as string}</label><input className="dv-fi" type={t as string} value={editUser[k as string]} onChange={e=>setEditUser((u:any)=>({...u,[k as string]:e.target.value}))}/></div>
        ))}
        <div className="dv-fg"><label className="dv-fl">Role</label>
          <select className="dv-fi" value={editUser.role} onChange={e=>setEditUser((u:any)=>({...u,role:e.target.value}))}>
            <option value="user">User</option><option value="reseller">Reseller</option><option value="developer">Developer</option>
          </select>
        </div>
        <div style={{marginBottom:20}}><label className="dv-fl">Password Baru (kosong = skip)</label>
          <div style={{position:'relative'}}>
            <input className="dv-fi" style={{paddingRight:44}} type={epw?'text':'password'} placeholder="Password baru..." value={editUser.password} onChange={e=>setEditUser((u:any)=>({...u,password:e.target.value}))}/>
            <button type="button" onClick={()=>setEpw(!epw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#444455',cursor:'pointer'}}>{epw?'🙈':'👁'}</button>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditUser} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button><button onClick={()=>setEditUser(null)} className="dv-btn-sec">Batal</button></div>
      </>}
    </Modal>

    <Modal open={!!editKey} onClose={()=>setEditKey(null)} title="Edit Key">
      {editKey&&<>
        <div className="dv-fg"><label className="dv-fl">Assign Username</label><input className="dv-fi" value={editKey.assigned_to_username} onChange={e=>setEditKey((k:any)=>({...k,assigned_to_username:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Durasi</label><DurationDropdown value={editKey.duration_type} onChange={v=>setEditKey((k:any)=>({...k,duration_type:v}))}/></div>
        <div className="dv-fg"><label className="dv-fl">Max HWID</label><input className="dv-fi" type="number" value={editKey.hwid_max} onChange={e=>setEditKey((k:any)=>({...k,hwid_max:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label className="dv-fl">Status</label>
          <select className="dv-fi" value={editKey.is_active?'1':'0'} onChange={e=>setEditKey((k:any)=>({...k,is_active:e.target.value==='1'}))}>
            <option value="1">Aktif</option><option value="0">Nonaktif</option>
          </select>
        </div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditKey} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button><button onClick={()=>setEditKey(null)} className="dv-btn-sec">Batal</button></div>
      </>}
    </Modal>

    <Modal open={!!editStep} onClose={()=>setEditStep(null)} title="Edit Step">
      {editStep&&<>
        <div className="dv-fg"><label className="dv-fl">Nama</label><input className="dv-fi" value={editStep.name} onChange={e=>setEditStep((s:any)=>({...s,name:e.target.value}))}/></div>
        <div className="dv-fg"><label className="dv-fl">URL</label><input className="dv-fi" value={editStep.url} onChange={e=>setEditStep((s:any)=>({...s,url:e.target.value}))}/></div>
        <div style={{marginBottom:20}}><label className="dv-fl">Detik</label><input className="dv-fi" type="number" min={5} max={300} value={editStep.duration_seconds} onChange={e=>setEditStep((s:any)=>({...s,duration_seconds:e.target.value}))}/></div>
        <div style={{display:'flex',gap:10}}><button onClick={saveEditStep} className="dv-btn-primary" style={{flex:1}}>💾 Simpan</button><button onClick={()=>setEditStep(null)} className="dv-btn-sec">Batal</button></div>
      </>}
    </Modal>

    <BanDialog open={!!banModal&&!banModal.is_banned} user={banModal} onClose={()=>setBanModal(null)} onConfirm={(r)=>{setBanReason(r);doBan('ban')}}/>
    <Modal open={!!banModal&&!!banModal.is_banned} onClose={()=>setBanModal(null)} title="Unban User">
      {banModal&&banModal.is_banned&&<>
        <p style={{fontSize:'.85rem',color:'#8a8a9a',marginBottom:16}}>Unban <strong style={{color:'#fff'}}>{banModal.username}</strong>?</p>
        <div style={{display:'flex',gap:10}}><button onClick={()=>doBan('unban')} className="dv-btn-green" style={{flex:1}}>✅ Unban</button><button onClick={()=>setBanModal(null)} className="dv-btn-sec">Cancel</button></div>
      </>}
    </Modal>
    </>
  )
}
