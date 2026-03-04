import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

// ─── Particles ──────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current; if(!c) return
    const ctx=c.getContext('2d')!
    let W=c.width=window.innerWidth, H=c.height=window.innerHeight
    const pts=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*1.8+.4,a:Math.random()*.35+.1}))
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight}
    window.addEventListener('resize',resize)
    let raf:number
    function draw(){
      ctx.clearRect(0,0,W,H)
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(0,170,255,${p.a})`;ctx.fill()})
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<115){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,110,255,${.14*(1-d/115)})`;ctx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>
}

// ─── Type config ────────────────────────────────────────────
const TYPE_CFG: Record<string,{bg:string;border:string;color:string;icon:string}> = {
  'Report Bug': { bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.3)',  color:'#f87171', icon:'🐛' },
  'Saran':      { bg:'rgba(59,130,246,.12)',  border:'rgba(59,130,246,.3)', color:'#60a5fa', icon:'💡' },
  'Feedback':   { bg:'rgba(168,85,247,.12)',  border:'rgba(168,85,247,.3)', color:'#c084fc', icon:'💬' },
}

// ─── Stars component ────────────────────────────────────────
function Stars({rating}:{rating:number}) {
  return <>{Array.from({length:5},(_,i)=>(
    <span key={i} style={{color:i<rating?'#f5c542':'rgba(255,255,255,.15)',fontSize:'1rem',letterSpacing:1}}>★</span>
  ))}</>
}

// ─── Pad helper ─────────────────────────────────────────────
const pad = (n:number) => String(n).padStart(2,'0')
function fmtDate(iso:string) {
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function FeedbackPublicPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('Semua')
  const [search, setSearch]       = useState('')
  const [now, setNow]             = useState(new Date())

  // Real-time clock
  useEffect(()=>{
    const iv = setInterval(()=>setNow(new Date()),1000)
    return ()=>clearInterval(iv)
  },[])

  const liveTime = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}  ·  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const loadFeedbacks = () => {
    fetch('/api/feedback')
      .then(r=>r.json())
      .then(d=>{ setFeedbacks(d.feedbacks||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }

  useEffect(()=>{
    loadFeedbacks()
    const iv = setInterval(loadFeedbacks, 30000)
    return ()=>clearInterval(iv)
  },[])

  // Stats
  const total    = feedbacks.length
  const bugs     = feedbacks.filter(f=>f.type==='Report Bug').length
  const saran    = feedbacks.filter(f=>f.type==='Saran').length
  const avgRating= total ? Math.round(feedbacks.reduce((s,f)=>s+f.rating,0)/total*10)/10 : 0

  // Filter & search
  const FILTERS = ['Semua','Saran','Report Bug','Feedback']
  const filtered = feedbacks.filter(f=>{
    if(filter!=='Semua' && f.type!==filter) return false
    const q = search.toLowerCase()
    if(q && !f.message?.toLowerCase().includes(q)
         && !f.roblox_name_masked?.toLowerCase().includes(q)
         && !f.website_username?.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <>
      <Head>
        <title>Feedback Board — AWR Key System</title>
        <meta name="description" content="Lihat feedback dan laporan bug dari pengguna AWR Script"/>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{minHeight:'100vh',background:'#020810',color:'#cce4f8',fontFamily:'Outfit,sans-serif',position:'relative'}}>
        <Particles/>

        {/* ── NAVBAR ── */}
        <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(2,8,16,.88)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(0,140,255,.12)',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <a href="/home" style={{fontFamily:'Orbitron,sans-serif',fontWeight:800,fontSize:'1.1rem',background:'linear-gradient(135deg,#00aaff,#00ffcc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',textDecoration:'none'}}>
            ⚡ AWR
          </a>
          <div style={{display:'flex',gap:14,fontSize:'.82rem'}}>
            <a href="/home"     style={{color:'#5a9fd4',textDecoration:'none'}}>Home</a>
            <a href="/"         style={{color:'#5a9fd4',textDecoration:'none'}}>Dashboard</a>
            <span style={{color:'#00aaff',fontWeight:700}}>Feedback</span>
          </div>
        </nav>

        <div style={{position:'relative',zIndex:1,maxWidth:860,margin:'0 auto',padding:'32px 20px 60px'}}>

          {/* ── HEADER ── */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:28}}>
            <div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'2rem',fontWeight:800,background:'linear-gradient(135deg,#00aaff,#00ffcc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:.5}}>
                💬 Feedback Board
              </div>
              <div style={{color:'#3a6a8a',fontSize:'.85rem',marginTop:4}}>
                Feedback & laporan bug dari pengguna AWR Script — public
              </div>
            </div>

            {/* ── REAL-TIME CLOCK EMAS ── */}
            <div style={{background:'rgba(245,197,66,.07)',border:'1.5px solid rgba(245,197,66,.3)',borderRadius:12,padding:'10px 20px',textAlign:'center',minWidth:200}}>
              <div style={{fontSize:'.58rem',color:'rgba(245,197,66,.5)',letterSpacing:3,marginBottom:4,fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>⏱ WAKTU SEKARANG</div>
              <div style={{fontWeight:900,color:'#f5c542',fontFamily:'Orbitron,sans-serif',fontSize:'.9rem',letterSpacing:2,textShadow:'0 0 12px rgba(245,197,66,.4)'}}>
                {liveTime}
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:24}}>
            {[
              {val:loading?'—':total,  lbl:'Total',      icon:'📋',  c:'#00aaff'},
              {val:loading?'—':bugs,   lbl:'Bug Report',  icon:'🐛',  c:'#f87171'},
              {val:loading?'—':saran,  lbl:'Saran',       icon:'💡',  c:'#60a5fa'},
              {val:loading?'—':(avgRating>0?`${avgRating}★`:'—'),lbl:'Avg Rating',icon:'⭐',c:'#f5c542'},
            ].map((s,i)=>(
              <div key={i} style={{background:'rgba(0,140,255,.05)',border:'1px solid rgba(0,140,255,.12)',borderRadius:14,padding:'16px 10px',textAlign:'center',transition:'border-color .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(0,140,255,.3)')}
                onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(0,140,255,.12)')}>
                <div style={{fontSize:'1.4rem',fontWeight:900,color:s.c,fontFamily:'Orbitron,sans-serif'}}>{s.val}</div>
                <div style={{fontSize:'.72rem',color:'#3a6a8a',marginTop:4}}>{s.icon} {s.lbl}</div>
              </div>
            ))}
          </div>

          {/* ── FILTER + SEARCH ── */}
          <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{background:filter===f?'linear-gradient(135deg,#0044bb,#00aaff)':'rgba(0,140,255,.07)',
                  border:`1px solid ${filter===f?'transparent':'rgba(0,140,255,.2)'}`,
                  borderRadius:8,color:filter===f?'#fff':'#5a9fd4',padding:'7px 14px',cursor:'pointer',
                  fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'.82rem',transition:'all .2s'}}>
                {f}
                {f!=='Semua'&&!loading?<span style={{marginLeft:5,opacity:.7,fontSize:'.75rem'}}>({feedbacks.filter(x=>x.type===f).length})</span>:null}
              </button>
            ))}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari..."
              style={{flex:1,minWidth:160,background:'rgba(0,140,255,.06)',border:'1px solid rgba(0,140,255,.18)',
                borderRadius:8,color:'#cce4f8',padding:'7px 14px',outline:'none',fontFamily:'Outfit,sans-serif',fontSize:'.83rem'}}/>
            <button onClick={loadFeedbacks}
              style={{background:'rgba(0,140,255,.07)',border:'1px solid rgba(0,140,255,.2)',borderRadius:8,color:'#5a9fd4',
                padding:'7px 12px',cursor:'pointer',fontSize:'.85rem',transition:'all .2s'}}
              title="Refresh">🔄</button>
          </div>

          {/* ── FEEDBACK LIST ── */}
          {loading ? (
            [1,2,3,4].map(i=>(
              <div key={i} style={{background:'rgba(0,140,255,.04)',border:'1px solid rgba(0,140,255,.1)',borderRadius:16,
                height:120,marginBottom:12,animation:'pulse 1.5s ease-in-out infinite',
                backgroundImage:'linear-gradient(90deg,transparent 25%,rgba(0,140,255,.05) 50%,transparent 75%)',
                backgroundSize:'200% 100%'}}/>
            ))
          ) : filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'80px 0',color:'#3a6a8a'}}>
              <div style={{fontSize:'3rem',marginBottom:16,opacity:.3}}>💬</div>
              <div style={{fontSize:'1rem'}}>Belum ada feedback{filter!=='Semua'?` untuk "${filter}"`:''}</div>
              {search&&<div style={{fontSize:'.82rem',marginTop:6,opacity:.6}}>Coba keyword lain</div>}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {filtered.map((fb,i)=>{
                const tc = TYPE_CFG[fb.type] || TYPE_CFG['Feedback']
                return (
                  <div key={fb.id} style={{
                    background:`linear-gradient(145deg,rgba(0,140,255,.04),rgba(0,0,0,0))`,
                    border:'1px solid rgba(0,140,255,.12)',
                    borderRadius:18,padding:'18px 20px',
                    animation:`fadeUp .3s ease ${i*.04}s both`,
                    transition:'border-color .2s, transform .15s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,140,255,.28)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,140,255,.12)';e.currentTarget.style.transform='translateY(0)'}}>

                    {/* ── TOP ROW ── */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10,marginBottom:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                        {/* Type badge */}
                        <span style={{background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,
                          borderRadius:99,padding:'3px 12px',fontSize:'.72rem',fontWeight:700,
                          fontFamily:'Rajdhani,sans-serif',letterSpacing:.5}}>
                          {tc.icon} {fb.type}
                        </span>
                        {/* Stars */}
                        <span><Stars rating={fb.rating}/></span>
                        <span style={{fontSize:'.72rem',color:'rgba(245,197,66,.6)',fontFamily:'Rajdhani,sans-serif'}}>({fb.rating}/5)</span>
                      </div>

                      {/* ── TANGGAL BOLD EMAS ── */}
                      <div style={{
                        fontWeight:900,
                        color:'#f5c542',
                        fontFamily:'Orbitron,sans-serif',
                        fontSize:'.65rem',
                        letterSpacing:1,
                        textShadow:'0 0 8px rgba(245,197,66,.3)',
                        whiteSpace:'nowrap',
                        background:'rgba(245,197,66,.06)',
                        border:'1px solid rgba(245,197,66,.2)',
                        borderRadius:8,
                        padding:'4px 10px',
                      }}>
                        📅 {fmtDate(fb.created_at)}
                      </div>
                    </div>

                    {/* ── PESAN ── */}
                    <p style={{color:'#b0ccdf',fontSize:'.9rem',lineHeight:1.7,margin:'0 0 14px',wordBreak:'break-word'}}>
                      {fb.message}
                    </p>

                    {/* ── FOOTER: NAMA ── */}
                    <div style={{display:'flex',gap:18,flexWrap:'wrap',borderTop:'1px solid rgba(0,140,255,.1)',paddingTop:12}}>
                      {fb.website_username&&(
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:'.68rem',color:'#3a6a8a',fontFamily:'Rajdhani,sans-serif',letterSpacing:.5}}>AKUN WEBSITE</span>
                          <span style={{fontSize:'.82rem',fontWeight:700,color:'#00aaff',fontFamily:'Rajdhani,sans-serif',
                            background:'rgba(0,170,255,.08)',border:'1px solid rgba(0,170,255,.2)',borderRadius:6,padding:'2px 8px'}}>
                            👤 {fb.website_username}
                          </span>
                        </div>
                      )}
                      {fb.roblox_name_masked&&(
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:'.68rem',color:'#3a6a8a',fontFamily:'Rajdhani,sans-serif',letterSpacing:.5}}>ROBLOX</span>
                          <span style={{fontSize:'.82rem',fontWeight:700,color:'#8ab8d8',fontFamily:'Rajdhani,sans-serif',
                            background:'rgba(138,184,216,.06)',border:'1px solid rgba(138,184,216,.15)',borderRadius:6,padding:'2px 8px',
                            letterSpacing:1}}>
                            🎮 {fb.roblox_name_masked}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer info */}
          {!loading&&feedbacks.length>0&&(
            <div style={{textAlign:'center',marginTop:20,color:'#1e3a5a',fontSize:'.75rem'}}>
              Menampilkan {filtered.length} dari {feedbacks.length} feedback · auto-refresh 30 detik
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes pulse {
          0%,100% { opacity:.4 }
          50%      { opacity:.7 }
        }
        * { box-sizing:border-box; margin:0; padding:0 }
        html { scroll-behavior:smooth }
        ::-webkit-scrollbar { width:6px }
        ::-webkit-scrollbar-track { background:#020810 }
        ::-webkit-scrollbar-thumb { background:rgba(0,140,255,.3); border-radius:99px }
      `}</style>
    </>
  )
}
