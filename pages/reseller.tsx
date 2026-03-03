import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

async function api(path: string, method = 'GET', body?: any, token?: string | null) {
  try {
    const r = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    })
    return r.json()
  } catch { return { error: 'Network error' } }
}

const DUR: Record<string, string> = { '24h': '1 Hari', '3d': '3 Hari', '5d': '5 Hari', '7d': '7 Hari', '30d': '30 Hari', '60d': '60 Hari', lifetime: 'Lifetime' }
const DURS = Object.keys(DUR)
function fmtDate(d: string | null) {
  if (!d) return '∞ Lifetime'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function copyText(t: string) { navigator.clipboard.writeText(t).catch(() => {}) }

let _toast: (m: string, t?: string) => void = () => {}
function toast(m: string, t = 'info') { _toast(m, t) }

function ToastRoot() {
  const [items, setItems] = useState<any[]>([])
  const id = useRef(0)
  useEffect(() => {
    _toast = (msg, type = 'info') => {
      const n = ++id.current
      setItems(p => [...p, { id: n, msg, type }])
      setTimeout(() => setItems(p => p.filter(x => x.id !== n)), 3500)
    }
  }, [])
  return <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 10 }}>
    {items.map(t => (
      <div key={t.id} style={{
        background: '#0d1e35', border: `1px solid ${t.type === 'error' ? '#ff4757' : t.type === 'success' ? '#00e676' : '#1a4a80'}`,
        borderRadius: 12, padding: '14px 18px', minWidth: 280, display: 'flex', gap: 10, alignItems: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)', animation: 'toastIn .35s cubic-bezier(.34,1.56,.64,1)',
        borderLeft: `3px solid ${t.type === 'error' ? '#ff4757' : t.type === 'success' ? '#00e676' : '#0af'}`
      }}>
        <span style={{ fontSize: '1.1rem' }}>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
        <span style={{ color: '#cce4f8', fontSize: '0.87rem' }}>{t.msg}</span>
      </div>
    ))}
  </div>
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null
  return <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease'
  }}>
    <div style={{
      background: '#0d1e35', border: '1px solid #1a4a80', borderRadius: 20, padding: 28,
      width: '90%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto',
      animation: 'modalIn .3s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 20px 80px rgba(0,0,0,0.9)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#00d4ff' }}>{title}</div>
        <button onClick={onClose} style={{ background: '#0e2040', border: '1px solid #162f50', color: '#5a8ab0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
}

const S = {
  input: { width: '100%', background: '#071224', border: '1px solid #162f50', borderRadius: 10, color: '#cce4f8', padding: '10px 14px', fontFamily: 'Exo 2,sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  select: { width: '100%', background: '#071224', border: '1px solid #162f50', borderRadius: 10, color: '#cce4f8', padding: '10px 14px', fontFamily: 'Exo 2,sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a8ab0', letterSpacing: '1.2px', textTransform: 'uppercase' as const, marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg,#0066cc,#0af)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: 'Exo 2,sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  btnGhost: { background: '#0e2040', border: '1px solid #162f50', color: '#cce4f8', borderRadius: 10, padding: '10px 16px', fontFamily: 'Exo 2,sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  card: { background: '#0b1a2e', border: '1px solid #162f50', borderRadius: 16, padding: 24, marginBottom: 20 },
  th: { padding: '11px 14px', textAlign: 'left' as const, fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, letterSpacing: '1px', color: '#5a8ab0', fontSize: '0.72rem', textTransform: 'uppercase' as const, borderBottom: '1px solid #162f50' },
  td: { padding: '11px 14px', borderBottom: '1px solid rgba(22,47,80,0.4)', color: '#cce4f8', verticalAlign: 'middle' as const, fontSize: '0.84rem' },
}

function badge(color: string, text: string) {
  const map: Record<string, any> = {
    blue:   { bg: 'rgba(0,102,204,.18)', c: '#00d4ff', b: 'rgba(0,170,255,.25)' },
    green:  { bg: 'rgba(22,163,74,.18)', c: '#4ade80', b: 'rgba(74,222,128,.25)' },
    red:    { bg: 'rgba(220,38,38,.18)', c: '#f87171', b: 'rgba(248,113,113,.25)' },
    yellow: { bg: 'rgba(202,138,4,.18)', c: '#fbbf24', b: 'rgba(251,191,36,.25)' },
    gray:   { bg: 'rgba(100,116,139,.15)', c: '#94a3b8', b: 'rgba(148,163,184,.2)' },
  }
  const m = map[color] || map.gray
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', background: m.bg, color: m.c, border: `1px solid ${m.b}` }}>{text}</span>
}

function ResellerLogin({ onLogin }: { onLogin: (t: string, u: any) => void }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/login', 'POST', { ...form, rememberMe: true })
    setLoading(false)
    if (d.error) { toast(d.error, 'error'); return }
    if (d.user?.role !== 'reseller' && d.user?.role !== 'developer') { toast('Akun ini bukan reseller!', 'error'); return }
    localStorage.setItem('awr_rs_token', d.token)
    onLogin(d.token, d.user)
    toast('Welcome, ' + d.user.username + '!', 'success')
  }

  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '3rem', fontWeight: 700, color: '#f59e0b', letterSpacing: 4, textShadow: '0 0 40px rgba(245,158,11,0.6)' }}>🏪 RESELLER</div>
        <div style={{ color: '#5a8ab0', fontSize: '0.78rem', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>Reseller Panel · AWR Key System</div>
      </div>
      <div style={{ ...S.card, border: '1px solid rgba(245,158,11,0.3)' }}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Username Reseller</label>
            <input style={S.input} placeholder="Username..." value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Password..." value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a8ab0', cursor: 'pointer', fontSize: '1rem' }}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#b45309,#f59e0b)', padding: '12px 20px' }}>
            {loading ? '⏳ Loading...' : '🏪 Masuk Reseller Panel'}
          </button>
        </form>
      </div>
    </div>
  </div>
}

type Tab = 'send' | 'history' | 'broadcast' | 'users'

export default function ResellerPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('send')
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [form, setForm] = useState({ target_username: '', duration_type: '24h', hwid_max: '1' })
  const [bc, setBc] = useState({ title: '', content: '', sendEmail: false })
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('awr_rs_token')
    if (saved) {
      api('/user/profile', 'GET', undefined, saved).then(d => {
        if (d.user && (d.user.role === 'reseller' || d.user.role === 'developer')) {
          setToken(saved); setUser(d.user)
        } else localStorage.removeItem('awr_rs_token')
        setLoading(false)
      })
    } else setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    api('/developer/users', 'GET', undefined, token).then(d => { if (d.users) setUsers(d.users) })
    api('/reseller/keys', 'GET', undefined, token).then(d => { if (d.keys) setKeys(d.keys) })
  }, [token])

  async function sendKey(e: React.FormEvent) {
    e.preventDefault(); setSending(true)
    const d = await api('/reseller/keys', 'POST', form, token)
    setSending(false)
    if (d.error) { toast(d.error, 'error'); return }
    toast(`✅ Key dikirim ke ${form.target_username}!`, 'success')
    setForm(f => ({ ...f, target_username: '', hwid_max: '1' }))
    api('/reseller/keys', 'GET', undefined, token).then(d => { if (d.keys) setKeys(d.keys) })
  }

  async function sendBc(e: React.FormEvent) {
    e.preventDefault()
    const d = await api('/reseller/broadcast', 'POST', bc, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(d.message, 'success'); setBc({ title: '', content: '', sendEmail: false })
  }

  function logout() { localStorage.removeItem('awr_rs_token'); setToken(null); setUser(null) }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020810', color: '#f59e0b', fontFamily: 'Rajdhani,sans-serif', fontSize: '1.5rem' }}>Loading...</div>
  if (!token || !user) return <><ToastRoot /><ResellerLogin onLogin={(t, u) => { setToken(t); setUser(u) }} /></>

  const fu = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()))
  const tabStyle = (t: Tab) => ({
    flex: 1, padding: '9px 14px', borderRadius: 8,
    border: tab === t ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
    background: tab === t ? 'rgba(245,158,11,0.12)' : 'transparent',
    color: tab === t ? '#f59e0b' : '#5a8ab0',
    cursor: 'pointer', fontFamily: 'Exo 2,sans-serif', fontSize: '0.82rem', fontWeight: 700,
    transition: 'all .2s', textAlign: 'center' as const, whiteSpace: 'nowrap' as const
  })

  return <>
    <Head>
      <title>Reseller Panel — AWR Key System</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet" />
    </Head>
    <ToastRoot />

    <style>{`
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a4a80;border-radius:99px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes modalIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
      @keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      table{width:100%;border-collapse:collapse}
      tr:hover td{background:rgba(245,158,11,0.03)}
      input:focus,select:focus{border-color:#0066cc!important;box-shadow:0 0 0 3px rgba(0,102,204,0.2)}
    `}</style>

    {/* Navbar */}
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,8,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(245,158,11,0.25)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', letterSpacing: 3, textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>🏪 AWR RESELLER</div>
        <span style={{ fontSize: '0.75rem', color: '#5a8ab0', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '2px 8px' }}>{user.username}</span>
        {user.role === 'developer' && <span style={{ fontSize: '0.68rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 6, padding: '2px 8px' }}>👑 Dev Access</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => router.push('/')} style={{ ...S.btnGhost, fontSize: '0.8rem', padding: '7px 14px' }}>🏠 Website</button>
        <button onClick={logout} style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Exo 2,sans-serif', fontWeight: 600 }}>🚪 Logout</button>
      </div>
    </div>

    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, background: '#04101a', border: '1px solid #162f50', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {([['send', '🔑 Kirim Key'], ['history', '📋 History'], ['broadcast', '📢 Broadcast'], ['users', '👥 Users']] as [Tab, string][]).map(([v, l]) => (
          <button key={v} style={tabStyle(v)} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* SEND KEY */}
      {tab === 'send' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 520 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: 20 }}>🔑 Kirim Key ke User</div>
          <form onSubmit={sendKey}>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Username Tujuan</label>
              <select style={S.select} value={form.target_username} onChange={e => setForm(f => ({ ...f, target_username: e.target.value }))} required>
                <option value="">— Pilih Username —</option>
                {users.map(u => <option key={u.id} value={u.username}>{u.username} {u.is_banned ? '(banned)' : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Durasi Key</label>
              <select style={S.select} value={form.duration_type} onChange={e => setForm(f => ({ ...f, duration_type: e.target.value }))}>
                {DURS.map(d => <option key={d} value={d}>{DUR[d]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Max HWID (1 – 999999999999)</label>
              <input style={S.input} type="number" min={1} max={999999999999} value={form.hwid_max} onChange={e => setForm(f => ({ ...f, hwid_max: e.target.value }))} required />
            </div>
            <button type="submit" disabled={sending} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#b45309,#f59e0b)', padding: '12px 0' }}>
              {sending ? '⏳ Mengirim...' : '🚀 Kirim Key'}
            </button>
          </form>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...S.card, textAlign: 'center', margin: 0 }}>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{keys.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#5a8ab0', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Total Key Dikirim</div>
          </div>
          <div style={{ ...S.card, textAlign: 'center', margin: 0 }}>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>{keys.filter(k => k.is_active).length}</div>
            <div style={{ fontSize: '0.72rem', color: '#5a8ab0', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Key Aktif</div>
          </div>
        </div>
      </div>}

      {/* HISTORY */}
      {tab === 'history' && <div style={{ animation: 'fadeUp .3s ease' }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>📋 History Key ({keys.length})</div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #162f50' }}>
            <table>
              <thead style={{ background: '#071224' }}>
                <tr>
                  <th style={S.th}>Key</th>
                  <th style={S.th}>Dikirim ke</th>
                  <th style={S.th}>Durasi</th>
                  <th style={S.th}>Expired</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Dipakai</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k, i) => <tr key={k.id} style={{ animation: `fadeUp .25s ease ${i * .03}s both` }}>
                  <td style={S.td}>
                    <div onClick={() => { copyText(k.key_value); toast('Key disalin!', 'success') }} style={{ fontFamily: 'Rajdhani', fontSize: '0.68rem', color: '#00d4ff', cursor: 'pointer', letterSpacing: 1, background: '#020810', border: '1px solid #0066cc', borderRadius: 7, padding: '5px 8px', display: 'inline-block' }}>
                      {k.key_value}
                    </div>
                  </td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{k.owner?.username || '-'}</td>
                  <td style={S.td}>{badge('blue', DUR[k.duration_type] || k.duration_type)}</td>
                  <td style={{ ...S.td, fontSize: '0.8rem' }}>{fmtDate(k.expires_at)}</td>
                  <td style={S.td}>{badge(k.is_active ? 'green' : 'red', k.is_active ? 'Aktif' : 'Mati')}</td>
                  <td style={S.td}>{k.times_used}x</td>
                </tr>)}
                {!keys.length && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#5a8ab0' }}>Belum ada key yang dikirim</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {/* BROADCAST */}
      {tab === 'broadcast' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 540 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>📢 Broadcast ke Semua User</div>
          <div style={{ fontSize: '0.82rem', color: '#5a8ab0', marginBottom: 20 }}>
            Pesan akan dikirim sebagai: <strong style={{ color: '#f59e0b' }}>by {user.username}</strong>
          </div>
          <form onSubmit={sendBc}>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Judul</label>
              <input style={S.input} placeholder="Judul pesan..." value={bc.title} onChange={e => setBc(b => ({ ...b, title: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Teks</label>
              <textarea style={{ ...S.input, minHeight: 110, resize: 'vertical' }} placeholder="Isi pesan..." value={bc.content} onChange={e => setBc(b => ({ ...b, content: e.target.value }))} required />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#cce4f8', marginBottom: 18 }}>
              <input type="checkbox" checked={bc.sendEmail} onChange={e => setBc(b => ({ ...b, sendEmail: e.target.checked }))} />
              Kirim juga via Email ke semua user
            </label>
            <button type="submit" style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#b45309,#f59e0b)', padding: '12px 0' }}>
              📢 Kirim Broadcast
            </button>
          </form>
        </div>
      </div>}

      {/* USERS */}
      {tab === 'users' && <div style={{ animation: 'fadeUp .3s ease' }}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>👥 List User ({users.length})</div>
            <input style={{ ...S.input, width: 220 }} placeholder="🔍 Cari username..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #162f50' }}>
            <table>
              <thead style={{ background: '#071224' }}>
                <tr><th style={S.th}>Username</th><th style={S.th}>Email</th><th style={S.th}>Key</th><th style={S.th}>Roblox</th><th style={S.th}>Status</th><th style={S.th}>Bergabung</th></tr>
              </thead>
              <tbody>
                {fu.map((u, i) => <tr key={u.id} style={{ animation: `fadeUp .25s ease ${i * .03}s both` }}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{u.username}</td>
                  <td style={{ ...S.td, color: '#5a8ab0', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={S.td}>{u.keys?.[0]?.key_value ? badge('green', 'Ada Key') : badge('gray', 'No Key')}</td>
                  <td style={S.td}>{u.roblox_username || <span style={{ color: '#5a8ab0' }}>-</span>}</td>
                  <td style={S.td}>{badge(u.is_banned ? 'red' : 'green', u.is_banned ? 'Banned' : 'Aktif')}</td>
                  <td style={{ ...S.td, fontSize: '0.8rem', color: '#5a8ab0' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}</td>
                </tr>)}
                {!fu.length && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#5a8ab0' }}>Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

    </div>
  </>
}
