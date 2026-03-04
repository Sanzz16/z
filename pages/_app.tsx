import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

// ─── Global Music Player (persistent cross-page) ─────────────
let _globalAudio: HTMLAudioElement | null = null

function GlobalMusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [title, setTitle] = useState('AWR Music')
  const [visible, setVisible] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const [musicSrc, setMusicSrc] = useState('')
  const router = useRouter()

  const loadMusic = useCallback(() => {
    fetch('/api/developer/music').then(r => r.json()).then(d => {
      if (d.music && d.music.is_active) {
        const src = (d.music.type === 'upload' && d.music.file_data) ? d.music.file_data : d.music.url
        if (!src) { setVisible(false); return }
        setTitle(d.music.title || 'AWR Music')
        setVolume(d.music.volume || 50)
        setVisible(true)
        if (src !== musicSrc) {
          setMusicSrc(src)
          if (!_globalAudio) {
            _globalAudio = new Audio(src)
            _globalAudio.loop = true
          } else {
            _globalAudio.src = src
          }
          _globalAudio.volume = (d.music.volume || 50) / 100
        }
      } else {
        setVisible(false)
      }
    }).catch(() => {})
  }, [musicSrc])

  useEffect(() => { loadMusic() }, [])

  useEffect(() => {
    const handler = () => loadMusic()
    router.events?.on('routeChangeComplete', handler)
    return () => router.events?.off('routeChangeComplete', handler)
  }, [router, loadMusic])

  useEffect(() => {
    if (_globalAudio) _globalAudio.volume = volume / 100
  }, [volume])

  const toggle = () => {
    if (!_globalAudio) return
    if (playing) {
      _globalAudio.pause(); setPlaying(false)
    } else {
      _globalAudio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 18, zIndex: 8888,
      background: 'rgba(6,8,12,.97)', border: '1px solid rgba(50,140,255,.25)',
      borderRadius: minimized ? 50 : 18, backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,.75)',
      transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
      width: minimized ? 46 : 230,
      overflow: 'hidden',
    }}>
      {minimized ? (
        <button onClick={() => setMinimized(false)} style={{
          width: 46, height: 46, background: 'transparent', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: playing ? '#4facfe' : 'rgba(100,130,180,.5)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </button>
      ) : (
        <div style={{ padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
            <div style={{ fontSize: '.7rem', color: '#4facfe', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, letterSpacing: 1 }}>🎵 MUSIK</div>
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: 'rgba(120,140,180,.5)', cursor: 'pointer', fontSize: '.85rem', lineHeight: 1 }}>—</button>
          </div>
          <div style={{ fontSize: '.76rem', color: '#c8d8f0', marginBottom: 10, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggle} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: playing ? 'rgba(79,172,254,.18)' : 'rgba(255,255,255,.06)',
              color: playing ? '#4facfe' : 'rgba(180,200,230,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {playing
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }
            </button>
            <input type="range" min="0" max="100" value={volume}
              onChange={e => { setVolume(+e.target.value); if (_globalAudio) _globalAudio.volume = +e.target.value / 100 }}
              style={{ flex: 1, accentColor: '#4facfe', height: 3 }} />
            <span style={{ fontSize: '.65rem', color: 'rgba(100,130,180,.5)', minWidth: 22 }}>{volume}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@300;500;600;700&family=Outfit:wght@300;400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <GlobalMusicPlayer />
      <Component {...pageProps} />
    </>
  )
}
