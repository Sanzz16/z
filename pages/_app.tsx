import type { AppProps } from 'next/app'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

// ── Global audio singleton (persists across route changes) ──
let _audio: HTMLAudioElement | null = null
let _lastSrc = ''

function GlobalMusicPlayer() {
  const [settings, setSettings] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [mini, setMini] = useState(true)
  const router = useRouter()

  async function loadSettings() {
    try {
      const r = await fetch('/api/developer/music')
      const d = await r.json()
      const s = d.settings
      if (!s?.is_active || !s?.url) { setSettings(null); return }
      setSettings(s)
      if (s.volume !== undefined) setVolume(s.volume / 100)
      if (!_audio) _audio = new Audio()
      if (_lastSrc !== s.url) {
        _lastSrc = s.url
        _audio.src = s.url
        _audio.loop = true
        _audio.volume = s.volume / 100
      }
    } catch {}
  }

  useEffect(() => {
    loadSettings()
    router.events.on('routeChangeComplete', loadSettings)
    return () => router.events.off('routeChangeComplete', loadSettings)
  }, [])

  useEffect(() => { if (_audio) _audio.volume = volume }, [volume])

  function togglePlay() {
    if (!_audio) return
    if (playing) { _audio.pause(); setPlaying(false) }
    else { _audio.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  if (!settings) return null

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 8888, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {!mini && (
        <div style={{ background: 'rgba(4,12,28,.95)', border: '1px solid rgba(0,140,255,.35)', borderRadius: 16, padding: '14px 16px', width: 230, boxShadow: '0 8px 32px rgba(0,0,0,.6)', backdropFilter: 'blur(16px)', animation: 'slideUpMP .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0044bb,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🎵</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#cce4f8', fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.title || 'AWR Music'}</div>
              <div style={{ fontSize: '.7rem', color: '#5a9fd4' }}>{playing ? '▶ Playing' : '⏸ Paused'}</div>
            </div>
          </div>
          <button onClick={togglePlay} style={{ width: '100%', background: playing ? 'rgba(0,140,255,.15)' : 'linear-gradient(135deg,#0044bb,#00aaff)', border: `1px solid ${playing ? 'rgba(0,140,255,.4)' : 'transparent'}`, borderRadius: 10, color: playing ? '#00aaff' : '#fff', padding: '9px', cursor: 'pointer', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '.9rem', marginBottom: 12 }}>{playing ? '⏸ Pause' : '▶ Play'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '.8rem' }}>🔊</span>
            <input type="range" min={0} max={1} step={.05} value={volume} onChange={e => setVolume(Number(e.target.value))} style={{ flex: 1, accentColor: '#00aaff', cursor: 'pointer' }} />
            <span style={{ fontSize: '.72rem', color: '#5a9fd4', width: 28, textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
      <button onClick={() => setMini(!mini)} style={{ width: 46, height: 46, borderRadius: 14, background: mini ? 'rgba(0,140,255,.12)' : 'linear-gradient(135deg,#0044bb,#00aaff)', border: '1px solid rgba(0,140,255,.35)', color: '#00aaff', cursor: 'pointer', fontSize: '1.2rem', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? '🎵' : '🎶'}</button>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <GlobalMusicPlayer />
      <style jsx global>{`
        @keyframes slideUpMP { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </>
  )
}
