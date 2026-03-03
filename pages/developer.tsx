import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

// ─── API helper ───────────────────────────────────────────────
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
function copyText(t: string) { navigator.clipboard.writeText(t).catch(() => { }) }

// ─── Toast ────────────────────────────────────────────────────
let _toast: (m: string, t?: string) => void = () => { }
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

// ─── Modal ────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide = false }: any) {
  if (!open) return null
  return <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease'
  }}>
    <div style={{
      background: '#0d1e35', border: '1px solid #1a4a80', borderRadius: 20, padding: 28,
      width: '90%', maxWidth: wide ? 700 : 480, maxHeight: '88vh', overflowY: 'auto',
      animation: 'modalIn .3s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 20px 80px rgba(0,0,0,0.9)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#00d4ff' }}>{title}</div>
        <button onClick={onClose} style={{ background: '#0e2040', border: '1px solid #162f50', color: '#5a8ab0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
}

// ─── Shared styles ─────────────────────────────────────────────
const S = {
  input: { width: '100%', background: '#071224', border: '1px solid #162f50', borderRadius: 10, color: '#cce4f8', padding: '10px 14px', fontFamily: 'Exo 2,sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  select: { width: '100%', background: '#071224', border: '1px solid #162f50', borderRadius: 10, color: '#cce4f8', padding: '10px 14px', fontFamily: 'Exo 2,sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a8ab0', letterSpacing: '1.2px', textTransform: 'uppercase' as const, marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg,#0066cc,#0af)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: 'Exo 2,sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  btnGhost: { background: '#0e2040', border: '1px solid #162f50', color: '#cce4f8', borderRadius: 10, padding: '10px 16px', fontFamily: 'Exo 2,sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnDanger: { background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontFamily: 'Exo 2,sans-serif', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
  btnSuccess: { background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontFamily: 'Exo 2,sans-serif', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
  card: { background: '#0b1a2e', border: '1px solid #162f50', borderRadius: 16, padding: 24, marginBottom: 20 },
  th: { padding: '11px 14px', textAlign: 'left' as const, fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, letterSpacing: '1px', color: '#5a8ab0', fontSize: '0.72rem', textTransform: 'uppercase' as const, borderBottom: '1px solid #162f50' },
  td: { padding: '11px 14px', borderBottom: '1px solid rgba(22,47,80,0.4)', color: '#cce4f8', verticalAlign: 'middle' as const, fontSize: '0.84rem' },
}

function badge(color: string, text: string) {
  const map: Record<string, { bg: string; c: string; b: string }> = {
    blue:   { bg: 'rgba(0,102,204,.18)',    c: '#00d4ff', b: 'rgba(0,170,255,.25)' },
    green:  { bg: 'rgba(22,163,74,.18)',    c: '#4ade80', b: 'rgba(74,222,128,.25)' },
    red:    { bg: 'rgba(220,38,38,.18)',    c: '#f87171', b: 'rgba(248,113,113,.25)' },
    yellow: { bg: 'rgba(202,138,4,.18)',    c: '#fbbf24', b: 'rgba(251,191,36,.25)' },
    purple: { bg: 'rgba(168,85,247,.18)',   c: '#c084fc', b: 'rgba(192,132,252,.25)' },
    gray:   { bg: 'rgba(100,116,139,.15)',  c: '#94a3b8', b: 'rgba(148,163,184,.2)' },
  }
  const m = map[color] || map.gray
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', background: m.bg, color: m.c, border: `1px solid ${m.b}` }}>{text}</span>
}

// ─── LOGIN FORM ───────────────────────────────────────────────
function DevLogin({ onLogin }: { onLogin: (t: string, u: any) => void }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const d = await api('/auth/login', 'POST', { ...form, rememberMe: true })
    setLoading(false)
    if (d.error) { toast(d.error, 'error'); return }
    if (d.user?.role !== 'developer') { toast('Akun ini bukan developer!', 'error'); return }
    localStorage.setItem('awr_dev_token', d.token)
    onLogin(d.token, d.user)
    toast('Welcome, ' + d.user.username + '!', 'success')
  }

  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '3rem', fontWeight: 700, color: '#a855f7', letterSpacing: 4, textShadow: '0 0 40px rgba(168,85,247,0.6)' }}>
          👑 DEV
        </div>
        <div style={{ color: '#5a8ab0', fontSize: '0.78rem', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>
          Developer Panel · AWR Key System
        </div>
      </div>
      <div style={{ ...S.card, border: '1px solid rgba(168,85,247,0.3)' }}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Username Developer</label>
            <input style={S.input} placeholder="Username..." value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Password..." value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a8ab0', cursor: 'pointer', fontSize: '1rem' }}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', padding: '12px 20px' }}>
            {loading ? '⏳ Loading...' : '👑 Masuk Developer Panel'}
          </button>
        </form>
      </div>
    </div>
  </div>
}

// ─── TABS ─────────────────────────────────────────────────────
type Tab = 'send-key' | 'users' | 'keys' | 'broadcast' | 'global-key' | 'resellers' | 'getkey-settings'

export default function DeveloperPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('send-key')
  const [loading, setLoading] = useState(true)

  // Data
  const [users, setUsers] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [gkSteps, setGkSteps] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [sendKeyForm, setSendKeyForm] = useState({ target_username: '', duration_type: '24h', hwid_max: '1' })
  const [sendKeyLoading, setSendKeyLoading] = useState(false)

  // Modals
  const [editUser, setEditUser] = useState<any>(null)
  const [editKey, setEditKey] = useState<any>(null)
  const [banModal, setBanModal] = useState<any>(null)
  const [banReason, setBanReason] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [addStep, setAddStep] = useState({ name: '', url: '', duration_seconds: '30' })
  const [editStep, setEditStep] = useState<any>(null)

  // Broadcast
  const [bc, setBc] = useState({ title: '', content: '', sendEmail: false })
  // Global key
  const [gk, setGk] = useState({ duration_type: '24h', hwid_max: '1' })

  useEffect(() => {
    const saved = localStorage.getItem('awr_dev_token')
    if (saved) {
      api('/user/profile', 'GET', undefined, saved).then(d => {
        if (d.user && d.user.role === 'developer') { setToken(saved); setUser(d.user) }
        else localStorage.removeItem('awr_dev_token')
        setLoading(false)
      })
    } else setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    loadUsers(); loadKeys(); loadGkSteps()
  }, [token])

  const loadUsers   = () => api('/developer/users', 'GET', undefined, token).then(d => { if (d.users) setUsers(d.users) })
  const loadKeys    = () => api('/developer/keys', 'GET', undefined, token).then(d => { if (d.keys) setKeys(d.keys) })
  const loadGkSteps = () => api('/developer/getkey-settings', 'GET', undefined, token).then(d => { if (d.steps) setGkSteps(d.steps) })

  async function saveEditUser() {
    const d = await api('/developer/users', 'PATCH', editUser, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('User diupdate!', 'success'); setEditUser(null); loadUsers()
  }
  async function saveEditKey() {
    const d = await api('/developer/keys', 'PATCH', editKey, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('Key diupdate!', 'success'); setEditKey(null); loadKeys()
  }
  async function doBan(action: string) {
    const d = await api('/developer/ban', 'POST', { userId: banModal.id, action, reason: banReason }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(d.message, 'success'); setBanModal(null); setBanReason(''); loadUsers()
  }
  async function delKey(id: string) {
    if (!confirm('Hapus key ini?')) return
    await api('/developer/keys', 'DELETE', { keyId: id }, token)
    toast('Key dihapus', 'info'); loadKeys()
  }
  async function sendBc(e: React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/broadcast', 'POST', bc, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(d.message, 'success'); setBc({ title: '', content: '', sendEmail: false })
  }
  async function sendGlobalKey(e: React.FormEvent) {
  async function sendKeyToUser(e: React.FormEvent) {
    e.preventDefault(); setSendKeyLoading(true)
    const d = await api('/developer/keys', 'POST', sendKeyForm, token)
    setSendKeyLoading(false)
    if (d.error) { toast(d.error, 'error'); return }
    toast('Key berhasil dikirim ke ' + sendKeyForm.target_username + '!', 'success')
    setSendKeyForm(f => ({ ...f, target_username: '', hwid_max: '1' }))
    loadKeys()
  }
    e.preventDefault()
    const d = await api('/developer/send-key-all', 'POST', gk, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(`Key dikirim! ${d.notified} user dinotifikasi`, 'success')
  }
  async function setReseller(uname: string, role: string) {
    const t = users.find(u => u.username === uname)
    if (!t) { toast('User tidak ditemukan', 'error'); return }
    const d = await api('/developer/users', 'PATCH', { userId: t.id, role }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(`${uname} dijadikan ${role}!`, 'success'); loadUsers()
  }
  async function addGkStep(e: React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/getkey-settings', 'POST', { ...addStep, duration_seconds: parseInt(addStep.duration_seconds) }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('Step ditambah!', 'success'); setAddStep({ name: '', url: '', duration_seconds: '30' }); loadGkSteps()
  }
  async function updateStep(id: string, upd: any) {
    await api('/developer/getkey-settings', 'PATCH', { id, ...upd }, token)
    loadGkSteps()
  }
  async function delStep(id: string) {
    if (!confirm('Hapus step ini?')) return
    await api('/developer/getkey-settings', 'DELETE', { id }, token)
    toast('Step dihapus', 'info'); loadGkSteps()
  }

  function logout() { localStorage.removeItem('awr_dev_token'); setToken(null); setUser(null) }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020810', color: '#0af', fontFamily: 'Rajdhani,sans-serif', fontSize: '1.5rem' }}>Loading...</div>
  if (!token || !user) return <><ToastRoot /><DevLogin onLogin={(t, u) => { setToken(t); setUser(u) }} /></>

  const fu = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  const tabStyle = (t: Tab) => ({
    flex: 1, minWidth: 80, padding: '8px 14px', borderRadius: 8, border: tab === t ? '1px solid #7c3aed' : 'none',
    background: tab === t ? 'rgba(124,58,237,0.15)' : 'transparent',
    color: tab === t ? '#a855f7' : '#5a8ab0',
    cursor: 'pointer', fontFamily: 'Exo 2,sans-serif', fontSize: '0.8rem', fontWeight: 700,
    transition: 'all .2s', textAlign: 'center' as const, whiteSpace: 'nowrap' as const
  })

  return <>
    <Head>
      <title>Developer Panel — AWR Key System</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <ToastRoot />

    <style>{`
      * { margin:0;padding:0;box-sizing:border-box }
      body { background:#020810;color:#cce4f8;font-family:'Exo 2',sans-serif;min-height:100vh }
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#04101a}::-webkit-scrollbar-thumb{background:#1a4a80;border-radius:99px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes modalIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
      @keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      table{width:100%;border-collapse:collapse}
      tr:hover td{background:rgba(0,170,255,0.03)}
      input:focus,select:focus{border-color:#0066cc!important;box-shadow:0 0 0 3px rgba(0,102,204,0.2)}
    `}</style>

    {/* Navbar */}
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,8,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#a855f7', letterSpacing: 3, textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
          👑 AWR DEV
        </div>
        <span style={{ fontSize: '0.75rem', color: '#5a8ab0', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 6, padding: '2px 8px' }}>
          {user.username}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => router.push('/')} style={{ ...S.btnGhost, fontSize: '0.8rem', padding: '7px 14px' }}>🏠 Website</button>
        <button onClick={logout} style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Exo 2,sans-serif', fontWeight: 600 }}>🚪 Logout</button>
      </div>
    </div>

    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 24px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 3, background: '#04101a', border: '1px solid #162f50', borderRadius: 12, padding: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {([['send-key','🔑 Kirim Key'],['users','👥 Users'],['keys','📋 Keys'],['broadcast','📢 Broadcast'],['global-key','🎁 Key Global'],['resellers','🏪 Reseller'],['getkey-settings','⚙️ GetKey']] as [Tab,string][]).map(([v,l])=>(
          <button key={v} style={tabStyle(v)} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>


      {/* ── SEND KEY ── */}
      {tab === 'send-key' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 520 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#00d4ff', marginBottom: 20 }}>🔑 Kirim Key ke User</div>
          <form onSubmit={sendKeyToUser}>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Username Tujuan</label>
              <select style={S.select} value={sendKeyForm.target_username} onChange={e => setSendKeyForm(f => ({ ...f, target_username: e.target.value }))} required>
                <option value="">— Pilih Username —</option>
                {users.filter(u => u.role !== 'developer').map(u => <option key={u.id} value={u.username}>{u.username} {u.is_banned ? '(banned)' : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Durasi Key</label>
              <select style={S.select} value={sendKeyForm.duration_type} onChange={e => setSendKeyForm(f => ({ ...f, duration_type: e.target.value }))}>
                {DURS.map(d => <option key={d} value={d}>{DUR[d]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Max HWID (1 – 999999999999)</label>
              <input style={S.input} type="number" min={1} max={999999999999} value={sendKeyForm.hwid_max} onChange={e => setSendKeyForm(f => ({ ...f, hwid_max: e.target.value }))} required />
            </div>
            <button type="submit" disabled={sendKeyLoading || !sendKeyForm.target_username} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', padding: '12px 0', opacity: sendKeyLoading || !sendKeyForm.target_username ? 0.5 : 1 }}>
              {sendKeyLoading ? '⏳ Mengirim...' : '🚀 Kirim Key'}
            </button>
          </form>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...S.card, textAlign: 'center', margin: 0 }}>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>{keys.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#5a8ab0', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Total Key</div>
          </div>
          <div style={{ ...S.card, textAlign: 'center', margin: 0 }}>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>{keys.filter(k => k.is_active).length}</div>
            <div style={{ fontSize: '0.72rem', color: '#5a8ab0', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Key Aktif</div>
          </div>
        </div>
      </div>}

      {/* ── USERS ── */}
      {tab === 'users' && <div style={{ animation: 'fadeUp .3s ease' }}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff' }}>👥 Semua User ({users.length})</div>
            <input style={{ ...S.input, width: 220 }} placeholder="🔍 Cari username/email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #162f50' }}>
            <table>
              <thead style={{ background: '#071224' }}>
                <tr><th style={S.th}>Username</th><th style={S.th}>Email</th><th style={S.th}>Role</th><th style={S.th}>Key</th><th style={S.th}>Roblox</th><th style={S.th}>Exec</th><th style={S.th}>Status</th><th style={S.th}>Aksi</th></tr>
              </thead>
              <tbody>
                {fu.map((u, i) => <tr key={u.id} style={{ animation: `fadeUp .25s ease ${i * 0.03}s both` }}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{u.username}</td>
                  <td style={{ ...S.td, color: '#5a8ab0', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={S.td}>{badge(u.role === 'developer' ? 'purple' : u.role === 'reseller' ? 'yellow' : 'blue', u.role)}</td>
                  <td style={S.td}>
                    {u.keys?.[0]?.key_value
                      ? <div><div style={{ fontFamily: 'Rajdhani', fontSize: '0.68rem', color: '#00d4ff', cursor: 'pointer', letterSpacing: 1 }} onClick={() => { copyText(u.keys[0].key_value); toast('Key disalin!', 'success') }}>{u.keys[0].key_value.slice(0, 14)}...</div>
                        <div style={{ fontSize: '0.72rem', color: '#5a8ab0' }}>{fmtDate(u.keys[0].expires_at)}</div></div>
                      : badge('gray', 'No key')}
                  </td>
                  <td style={S.td}>
                    {u.roblox_username
                      ? <a href={`https://www.roblox.com/users/${u.roblox_id}/profile`} target="_blank" rel="noreferrer" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '0.8rem' }}>{u.roblox_username} ↗</a>
                      : <span style={{ color: '#5a8ab0' }}>-</span>}
                  </td>
                  <td style={{ ...S.td, fontFamily: 'Rajdhani', fontWeight: 700 }}>{u.execution_count || 0}</td>
                  <td style={S.td}>{badge(u.is_banned ? 'red' : 'green', u.is_banned ? 'Banned' : 'Aktif')}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={S.btnGhost as any} onClick={() => setEditUser({ userId: u.id, username: u.username, email: u.email, role: u.role, roblox_username: u.roblox_username || '', password: '' })}
                        title="Edit" className="btn-sm">✏️</button>
                      {u.is_banned
                        ? <button style={S.btnSuccess} onClick={() => { setBanModal(u); setBanReason('') }}>✅</button>
                        : <button style={S.btnDanger} onClick={() => { setBanModal(u); setBanReason('') }}>🚫</button>}
                    </div>
                  </td>
                </tr>)}
                {!fu.length && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#5a8ab0' }}>Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {/* ── KEYS ── */}
      {tab === 'keys' && <div style={{ animation: 'fadeUp .3s ease' }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff', marginBottom: 16 }}>🔑 Semua Key ({keys.length})</div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #162f50' }}>
            <table>
              <thead style={{ background: '#071224' }}>
                <tr><th style={S.th}>Key</th><th style={S.th}>Assign</th><th style={S.th}>Dibuat</th><th style={S.th}>Durasi</th><th style={S.th}>Expired</th><th style={S.th}>HWID</th><th style={S.th}>Pakai</th><th style={S.th}>Status</th><th style={S.th}>Aksi</th></tr>
              </thead>
              <tbody>
                {keys.map(k => <tr key={k.id}>
                  <td style={S.td}><div onClick={() => { copyText(k.key_value); toast('Disalin!', 'success') }} style={{ fontFamily: 'Rajdhani', fontSize: '0.66rem', color: '#00d4ff', cursor: 'pointer', letterSpacing: 1, background: '#020810', border: '1px solid #0066cc', borderRadius: 8, padding: '5px 8px' }}>{k.key_value}</div></td>
                  <td style={S.td}>{k.owner?.username || badge('yellow', 'Shared')}</td>
                  <td style={{ ...S.td, color: '#5a8ab0', fontSize: '0.78rem' }}>{k.creator?.username || '-'}</td>
                  <td style={S.td}>{badge('blue', DUR[k.duration_type] || k.duration_type)}</td>
                  <td style={{ ...S.td, fontSize: '0.8rem' }}>{fmtDate(k.expires_at)}</td>
                  <td style={S.td}>{k.hwid_max}</td>
                  <td style={S.td}>{k.times_used}x</td>
                  <td style={S.td}>{badge(k.is_active ? 'green' : 'red', k.is_active ? 'Aktif' : 'Mati')}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={S.btnGhost as any} onClick={() => setEditKey({ keyId: k.id, is_active: k.is_active, hwid_max: k.hwid_max, duration_type: k.duration_type, expires_at: k.expires_at || '', assigned_to_username: k.owner?.username || '' })}>✏️</button>
                      <button style={S.btnDanger} onClick={() => delKey(k.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>)}
                {!keys.length && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#5a8ab0' }}>Belum ada key</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {/* ── BROADCAST ── */}
      {tab === 'broadcast' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 540 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>📢 Broadcast ke Semua User</div>
          <div style={{ fontSize: '0.82rem', color: '#5a8ab0', marginBottom: 20 }}>Dikirim sebagai: <strong style={{ color: '#00d4ff' }}>by Developer</strong></div>
          <form onSubmit={sendBc}>
            <div style={{ marginBottom: 14 }}><label style={S.label}>Judul</label><input style={S.input} placeholder="Judul..." value={bc.title} onChange={e => setBc(b => ({ ...b, title: e.target.value }))} required /></div>
            <div style={{ marginBottom: 14 }}><label style={S.label}>Teks</label><textarea style={{ ...S.input, minHeight: 100, resize: 'vertical' }} placeholder="Isi pesan..." value={bc.content} onChange={e => setBc(b => ({ ...b, content: e.target.value }))} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#cce4f8', marginBottom: 16 }}>
              <input type="checkbox" checked={bc.sendEmail} onChange={e => setBc(b => ({ ...b, sendEmail: e.target.checked }))} />
              Kirim juga via Gmail ke semua user
            </label>
            <button type="submit" style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>📢 Kirim Broadcast</button>
          </form>
        </div>
      </div>}

      {/* ── GLOBAL KEY ── */}
      {tab === 'global-key' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 480 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff', marginBottom: 8 }}>🎁 Kirim Key ke Semua User</div>
          <div style={{ background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: '#fbbf24' }}>
            ⚠️ Key ini shared, bisa dipakai semua. Semua user dapat notifikasi.
          </div>
          <form onSubmit={sendGlobalKey}>
            <div style={{ marginBottom: 14 }}><label style={S.label}>Durasi</label><select style={S.select} value={gk.duration_type} onChange={e => setGk(g => ({ ...g, duration_type: e.target.value }))}>
              {DURS.map(d => <option key={d} value={d}>{DUR[d]}</option>)}
            </select></div>
            <div style={{ marginBottom: 20 }}><label style={S.label}>Max HWID</label><input style={S.input} type="number" min={1} max={999999999999} value={gk.hwid_max} onChange={e => setGk(g => ({ ...g, hwid_max: e.target.value }))} /></div>
            <button type="submit" style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>🚀 Kirim ke Semua User</button>
          </form>
        </div>
      </div>}

      {/* ── RESELLERS ── */}
      {tab === 'resellers' && <div style={{ animation: 'fadeUp .3s ease', maxWidth: 560 }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff', marginBottom: 16 }}>🏪 Manajemen Reseller</div>
          <div style={{ marginBottom: 24 }}>
            <label style={S.label}>Jadikan Reseller</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select id="rs-select" style={{ ...S.select, flex: 1 }}>
                <option value="">— Pilih User —</option>
                {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
              </select>
              <button style={S.btnPrimary} onClick={() => { const v = (document.getElementById('rs-select') as any)?.value; if (v) setReseller(v, 'reseller') }}>✅ Set</button>
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#1a4a80,transparent)', margin: '16px 0' }} />
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1rem', fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>📋 Daftar Reseller</div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #162f50' }}>
            <table>
              <thead style={{ background: '#071224' }}><tr><th style={S.th}>Username</th><th style={S.th}>Email</th><th style={S.th}>Aksi</th></tr></thead>
              <tbody>
                {users.filter(u => u.role === 'reseller').map(u => <tr key={u.id}>
                  <td style={S.td}>{u.username}</td><td style={{ ...S.td, color: '#5a8ab0' }}>{u.email}</td>
                  <td style={S.td}><button style={S.btnGhost as any} onClick={() => setReseller(u.username, 'user')}>Copot</button></td>
                </tr>)}
                {!users.filter(u => u.role === 'reseller').length && <tr><td colSpan={3} style={{ ...S.td, textAlign: 'center', padding: 24, color: '#5a8ab0' }}>Belum ada reseller</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {/* ── GETKEY SETTINGS ── */}
      {tab === 'getkey-settings' && <div style={{ animation: 'fadeUp .3s ease' }}>
        <div style={S.card}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>⚙️ Setting GetKey Steps</div>
          <div style={{ fontSize: '0.82rem', color: '#5a8ab0', marginBottom: 20 }}>Atur step yang harus diselesaikan user untuk dapat free key. Urutan sesuai order.</div>

          {/* Steps list */}
          <div style={{ marginBottom: 24 }}>
            {gkSteps.map((s, i) => <div key={s.id} style={{ background: '#071224', border: `1px solid ${s.is_active ? '#1a4a80' : '#162f50'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, animation: `fadeUp .25s ease ${i * .04}s both` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.is_active ? '#0066cc' : '#162f50', color: s.is_active ? '#fff' : '#5a8ab0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, flexShrink: 0 }}>{s.order_index}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#5a8ab0', wordBreak: 'break-all' }}>{s.url.length > 60 ? s.url.slice(0, 60) + '...' : s.url}</div>
                <div style={{ fontSize: '0.72rem', color: '#5a8ab0', marginTop: 2 }}>⏱️ {s.duration_seconds} detik</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => updateStep(s.id, { is_active: !s.is_active })} style={s.is_active ? S.btnSuccess : S.btnDanger}>{s.is_active ? '✅ Aktif' : '❌ Mati'}</button>
                <button onClick={() => setEditStep({ ...s, duration_seconds: s.duration_seconds.toString() })} style={S.btnGhost as any}>✏️</button>
                <button onClick={() => delStep(s.id)} style={S.btnDanger}>🗑️</button>
              </div>
            </div>)}
            {!gkSteps.length && <div style={{ textAlign: 'center', color: '#5a8ab0', padding: 24 }}>Belum ada step. Tambah di bawah.</div>}
          </div>

          {/* Add step */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#1a4a80,transparent)', margin: '0 0 20px' }} />
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1rem', fontWeight: 700, color: '#00d4ff', marginBottom: 14 }}>➕ Tambah Step Baru</div>
          <form onSubmit={addGkStep}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={S.label}>Nama Step</label><input style={S.input} placeholder="Contoh: Join Telegram" value={addStep.name} onChange={e => setAddStep(s => ({ ...s, name: e.target.value }))} required /></div>
              <div><label style={S.label}>Durasi (detik)</label><input style={S.input} type="number" min={5} max={300} value={addStep.duration_seconds} onChange={e => setAddStep(s => ({ ...s, duration_seconds: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>URL Link</label><input style={S.input} placeholder="https://..." value={addStep.url} onChange={e => setAddStep(s => ({ ...s, url: e.target.value }))} required /></div>
            <button type="submit" style={{ ...S.btnPrimary, padding: '10px 24px' }}>➕ Tambah Step</button>
          </form>
        </div>
      </div>}
    </div>

    {/* ── MODALS ── */}
    {/* Edit User */}
    <Modal open={!!editUser} onClose={() => setEditUser(null)} title="✏️ Edit User">
      {editUser && <>
        {[['Username', 'username', 'text'], ['Email', 'email', 'email'], ['Roblox Username', 'roblox_username', 'text']].map(([l, k, t]) => (
          <div key={k} style={{ marginBottom: 14 }}><label style={S.label}>{l}</label>
            <input style={S.input} type={t} value={editUser[k]} onChange={e => setEditUser((u: any) => ({ ...u, [k]: e.target.value }))} /></div>
        ))}
        <div style={{ marginBottom: 14 }}><label style={S.label}>Role</label>
          <select style={S.select} value={editUser.role} onChange={e => setEditUser((u: any) => ({ ...u, role: e.target.value }))}>
            <option value="user">User</option><option value="reseller">Reseller</option><option value="developer">Developer</option>
          </select></div>
        <div style={{ marginBottom: 20 }}><label style={S.label}>Password Baru</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Kosong = tidak ganti" value={editUser.password} onChange={e => setEditUser((u: any) => ({ ...u, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a8ab0', cursor: 'pointer' }}>{showPw ? '🙈' : '👁️'}</button>
          </div></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center' }} onClick={saveEditUser}>💾 Simpan</button>
          <button style={S.btnGhost} onClick={() => setEditUser(null)}>Batal</button>
        </div>
      </>}
    </Modal>

    {/* Edit Key */}
    <Modal open={!!editKey} onClose={() => setEditKey(null)} title="✏️ Edit Key">
      {editKey && <>
        <div style={{ marginBottom: 14 }}><label style={S.label}>Assign ke Username</label><input style={S.input} placeholder="Username..." value={editKey.assigned_to_username} onChange={e => setEditKey((k: any) => ({ ...k, assigned_to_username: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}><label style={S.label}>Durasi</label>
          <select style={S.select} value={editKey.duration_type} onChange={e => setEditKey((k: any) => ({ ...k, duration_type: e.target.value }))}>
            {DURS.map(d => <option key={d} value={d}>{DUR[d]}</option>)}
          </select></div>
        <div style={{ marginBottom: 14 }}><label style={S.label}>Max HWID</label><input style={S.input} type="number" value={editKey.hwid_max} onChange={e => setEditKey((k: any) => ({ ...k, hwid_max: e.target.value }))} /></div>
        <div style={{ marginBottom: 20 }}><label style={S.label}>Status</label>
          <select style={S.select} value={editKey.is_active ? 'true' : 'false'} onChange={e => setEditKey((k: any) => ({ ...k, is_active: e.target.value === 'true' }))}>
            <option value="true">Aktif</option><option value="false">Nonaktif</option>
          </select></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center' }} onClick={saveEditKey}>💾 Simpan</button>
          <button style={S.btnGhost} onClick={() => setEditKey(null)}>Batal</button>
        </div>
      </>}
    </Modal>

    {/* Edit Step */}
    <Modal open={!!editStep} onClose={() => setEditStep(null)} title="✏️ Edit Step">
      {editStep && <>
        <div style={{ marginBottom: 14 }}><label style={S.label}>Nama Step</label><input style={S.input} value={editStep.name} onChange={e => setEditStep((s: any) => ({ ...s, name: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}><label style={S.label}>URL</label><input style={S.input} value={editStep.url} onChange={e => setEditStep((s: any) => ({ ...s, url: e.target.value }))} /></div>
        <div style={{ marginBottom: 20 }}><label style={S.label}>Durasi (detik)</label><input style={S.input} type="number" min={5} max={300} value={editStep.duration_seconds} onChange={e => setEditStep((s: any) => ({ ...s, duration_seconds: e.target.value }))} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { updateStep(editStep.id, { name: editStep.name, url: editStep.url, duration_seconds: parseInt(editStep.duration_seconds) }); setEditStep(null); toast('Step diupdate!', 'success') }}>💾 Simpan</button>
          <button style={S.btnGhost} onClick={() => setEditStep(null)}>Batal</button>
        </div>
      </>}
    </Modal>

    {/* Ban/Unban */}
    <Modal open={!!banModal} onClose={() => setBanModal(null)} title={banModal?.is_banned ? '✅ Unban User' : '🚫 Ban User'}>
      {banModal && <>
        <p style={{ fontSize: '0.88rem', color: '#5a8ab0', marginBottom: 16 }}>{banModal.is_banned ? `Unban ${banModal.username}?` : `Ban ${banModal.username}? Semua key akan dimatikan.`}</p>
        {!banModal.is_banned && <div style={{ marginBottom: 16 }}><label style={S.label}>Alasan</label><input style={S.input} placeholder="Alasan ban..." value={banReason} onChange={e => setBanReason(e.target.value)} /></div>}
        <div style={{ display: 'flex', gap: 10 }}>
          {banModal.is_banned ? <button style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#16a34a,#22c55e)' }} onClick={() => doBan('unban')}>✅ Unban</button>
            : <button style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#c0392b,#e74c3c)' }} onClick={() => doBan('ban')}>🚫 Ban</button>}
          <button style={S.btnGhost} onClick={() => setBanModal(null)}>Batal</button>
        </div>
      </>}
    </Modal>
  </>
}
