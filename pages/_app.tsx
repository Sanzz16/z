import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

// ─── Global Music Player ─────────────────────────────────────
let _musicApi: { play:()=>void; pause:()=>void; setVol:(v:number)=>void } | null = null
export function getMusicApi() { return _musicApi }

function GlobalMusic() {
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const [music, setMusic] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [vol, setVol] = useState(50)
  const [mini, setMini] = useState(false)

  useEffect(() => {
    fetch('/api/developer/music').then(r=>r.json()).then(d=>{
      if (d.music && d.music.is_active && d.music.url) {
        setMusic(d.music)
        setVol(d.music.volume || 50)
      }
    }).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!music?.url) return
    const a = new Audio(music.url)
    a.loop = true
    a.volume = vol / 100
    audioRef.current = a
    _musicApi = {
      play: () => { a.play().catch(()=>{}); setPlaying(true) },
      pause: () => { a.pause(); setPlaying(false) },
      setVol: (v:number) => { a.volume = v/100; setVol(v) }
    }
    // Autoplay on first interaction
    const tryPlay = () => { a.play().catch(()=>{}); setPlaying(true); document.removeEventListener('click', tryPlay) }
    document.addEventListener('click', tryPlay)
    return () => {
      a.pause()
      a.src = ''
      document.removeEventListener('click', tryPlay)
      _musicApi = null
    }
  }, [music?.url])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = vol / 100
  }, [vol])

  if (!music?.url || !music?.is_active) return null

  return (
    <div style={{position:'fixed',bottom:20,right:20,zIndex:9999,display:'flex',alignItems:'center',gap:8,background:'rgba(6,12,28,0.92)',border:'1px solid rgba(0,140,255,0.35)',borderRadius:50,padding:mini?'8px 12px':'8px 16px',backdropFilter:'blur(12px)',boxShadow:'0 0 20px rgba(0,120,255,0.2)',transition:'all .3s'}}>
      {!mini && <div style={{fontSize:'.7rem',color:'#5a9fd4',maxWidth:100,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{music.title||'AWR Music'}</div>}
      {!mini && <input type="range" min={0} max={100} value={vol} onChange={e=>{ const v=+e.target.value; setVol(v); _musicApi?.setVol(v) }} style={{width:60,accentColor:'#00aaff',cursor:'pointer'}}/>}
      <button onClick={()=>{ if(playing){ audioRef.current?.pause(); setPlaying(false) } else { audioRef.current?.play().catch(()=>{}); setPlaying(true) } }}
        style={{background:'none',border:'none',color:'#00aaff',cursor:'pointer',fontSize:'1.1rem',padding:0,lineHeight:1}}>
        {playing ? '⏸' : '▶'}
      </button>
      <button onClick={()=>setMini(!mini)} style={{background:'none',border:'none',color:'#5a9fd4',cursor:'pointer',fontSize:'.75rem',padding:0}}>
        {mini ? '♫' : '—'}
      </button>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@300;500;600;700&family=Outfit:wght@300;400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
    </Head>
    <Component {...pageProps} />
    <GlobalMusic />
  </>
}
