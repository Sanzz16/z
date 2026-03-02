import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────
type User = {
  id: string; username: string; email: string; role: string
  roblox_username?: string; roblox_id?: number
  avatar_url?: string; background_url?: string; background_type?: string
  total_executions?: number; created_at?: string
  is_banned?: boolean; ban_reason?: string
}

type KeyData = {
  id: string; key_value: string; expires_at: string | null
  hwid_max: number; duration_type: string; times_used: number
  is_active: boolean; assigned_to?: string
  users?: { username: string }
  creator?: { username: string }
}

type Notif = { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string; key_id?: string }
type Route = { id: string; name: string; description: string; game_name: string; download_count: number; created_at: string; users?: { username: string } }

// ── API Helper ─────────────────────────────────────────
async function api(path: string, method = 'GET', body?: any, token?: string) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  })
}

function formatDate(d: string | null): string {
  if (!d) return '∞ Lifetime'
  const date = new Date(d)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeLeft(d: string | null): string {
  if (!d) return '∞'
  const now = Date.now()
  const exp = new Date(d).getTime()
  const diff = exp - now
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hrs}h`
  return `${hrs}h`
}

const DURATIONS = ['24h', '3d', '5d', '7d', '30d', '60d', 'lifetime']
const DURATION_LABELS: Record<string, string> = { '24h': '1 Hari', '3d': '3 Hari', '5d': '5 Hari', '7d': '7 Hari', '30d': '30 Hari', '60d': '60 Hari', 'lifetime': 'Lifetime' }

// ── Toast ──────────────────────────────────────────────
let _toastFn: ((msg: string, type?: string, title?: string) => void) | null = null

function Toast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string; title: string }[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    _toastFn = (msg, type = 'info', title = '') => {
      const id = ++idRef.current
      setToasts(prev => [...prev, { id, msg, type, title: title || (type === 'error' ? '❌ Error' : type === 'success' ? '✅ Sukses' : 'ℹ️ Info') }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { _toastFn = null }
  }, [])

  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️', key: '🔑' }

  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{icons[t.type] || '💬'}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function toast(msg: string, type?: string, title?: string) {
  _toastFn?.(msg, type, title)
}

// ── Modal ──────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="flex-between mb-4">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Loading Screen ─────────────────────────────────────
function LoadingScreen({ done }: { done: boolean }) {
  return (
    <div id="loading-screen" className={done ? 'hidden' : ''}>
      <div className="loader-logo">⚡ AWR</div>
      <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: '8px', letterSpacing: '3px' }}>KEY SYSTEM</div>
      <div className="loader-bar-wrap mt-4">
        <div className="loader-bar" />
      </div>
    </div>
  )
}

// ── Auth Forms ─────────────────────────────────────────
function AuthPage({ onAuth }: { onAuth: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login' ? { username: form.username, password: form.password } : form
      const data = await api(path, 'POST', body)
      if (data.error) { toast(data.error, 'error'); return }
      localStorage.setItem('awr_token', data.token)
      onAuth(data.token, data.user)
      toast('Berhasil ' + (mode === 'login' ? 'login' : 'daftar') + '!', 'success')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div className="text-center mb-4" style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '3rem', fontWeight: 700, color: 'var(--accent)', textShadow: '0 0 30px rgba(0,170,255,0.5)', letterSpacing: '4px' }}>
            ⚡ AWR
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Key System v3</div>
        </div>

        <div className="card" style={{ animation: 'modal-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          {/* Tab switch */}
          <div className="tab-bar">
            <button className={`tab-item ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Login</button>
            <button className={`tab-item ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Daftar</button>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Username kamu" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>

            {mode === 'register' && (
              <div className="form-group" style={{ animation: 'fade-up 0.2s ease' }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="Email kamu" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Password kamu"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                  style={{ paddingRight: '42px' }} />
                <button type="button" className="eye-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? '⏳ Loading...' : mode === 'login' ? '🔑 Login' : '✨ Daftar Sekarang'}
              </button>
            </div>
          </form>

          {mode === 'login' && (
            <div className="text-center mt-3" style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
              Belum punya akun?{' '}
              <span style={{ color: 'var(--accent3)', cursor: 'pointer' }} onClick={() => setMode('register')}>Daftar dulu →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── User Dashboard ─────────────────────────────────────
function UserDashboard({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ username: '', roblox_username: '', avatar_url: '', background_url: '', background_type: 'image', password: '' })
  const [showPw, setShowPw] = useState(false)

  async function loadData() {
    setLoading(true)
    const d = await api('/user/profile', 'GET', undefined, token)
    if (d.user) {
      setData(d)
      setProfileForm({
        username: d.user.username,
        roblox_username: d.user.roblox_username || '',
        avatar_url: d.user.avatar_url || '',
        background_url: d.user.background_url || '',
        background_type: d.user.background_type || 'image',
        password: ''
      })
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function saveProfile() {
    const body: any = {}
    if (profileForm.username !== data.user.username) body.username = profileForm.username
    if (profileForm.roblox_username !== (data.user.roblox_username || '')) body.roblox_username = profileForm.roblox_username
    if (profileForm.avatar_url !== (data.user.avatar_url || '')) body.avatar_url = profileForm.avatar_url
    if (profileForm.background_url !== (data.user.background_url || '')) body.background_url = profileForm.background_url
    if (profileForm.background_type !== (data.user.background_type || 'image')) body.background_type = profileForm.background_type
    if (profileForm.password) body.password = profileForm.password

    const res = await api('/user/profile', 'PATCH', body, token)
    if (res.error) { toast(res.error, 'error'); return }
    toast('Profil diupdate!', 'success')
    setEditProfile(false)
    loadData()
  }

  async function markNotifsRead() {
    await api('/user/read-notifs', 'POST', {}, token)
    loadData()
  }

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="skeleton" style={{ width: 200, height: 40 }} /></div>
  if (!data) return null

  const { user: u, key, notifications, announcements } = data
  const unread = notifications?.filter((n: Notif) => !n.is_read).length || 0

  return (
    <>
      {/* Sub-tabs */}
      <div className="tab-bar">
        <button className={`tab-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>🏠 Dashboard</button>
        <button className={`tab-item ${tab === 'notifs' ? 'active' : ''}`} onClick={() => { setTab('notifs'); markNotifsRead() }}>
          🔔 Notifikasi {unread > 0 && <span className="notif-dot" style={{ marginLeft: 4 }} />}
        </button>
        <button className={`tab-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>👤 Profil</button>
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div>
          <div className="grid-2 mb-4">
            {/* HWID */}
            <div className="card">
              <div className="card-title">🖥️ Perangkat Kamu</div>
              <div className="text-sm text-muted mb-2">HWID (Hardware ID)</div>
              <div className="key-box text-sm" id="hwid-display" style={{ letterSpacing: '0.5px', fontSize: '0.75rem', color: 'var(--text2)' }}>
                Hanya tersedia di Roblox Executor
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <div className="card-title">📊 Statistik</div>
              <div className="grid-2">
                <div className="stat-card">
                  <div className="stat-num">{u.total_executions || 0}</div>
                  <div className="stat-label">Total Exec</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{key ? '1' : '0'}</div>
                  <div className="stat-label">Key Aktif</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key section */}
          {key ? (
            <div className="card mb-4" style={{ border: '1px solid rgba(0,170,255,0.3)', background: 'linear-gradient(135deg, rgba(0,30,80,0.5), rgba(0,15,40,0.5))' }}>
              <div className="card-title">🔑 Key Kamu</div>
              <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 8 }}>
                <span className={`badge ${key.is_active ? 'badge-green' : 'badge-red'}`}>{key.is_active ? '● Aktif' : '● Nonaktif'}</span>
                <span className="badge badge-blue">{DURATION_LABELS[key.duration_type] || key.duration_type}</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="form-label mb-2" style={{ marginBottom: 6 }}>KEY</div>
                <div className="key-box" onClick={() => { copyToClipboard(key.key_value); toast('Key disalin!', 'success') }}>
                  {key.key_value}
                  <span style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.7rem', color: 'var(--text3)' }}>klik untuk copy</span>
                </div>
              </div>

              <div className="grid-3 mt-3">
                <div>
                  <div className="text-xs text-muted mb-1">EXPIRED</div>
                  <div className="text-sm" style={{ color: key.expires_at && new Date(key.expires_at) < new Date() ? 'var(--danger)' : 'var(--text)' }}>
                    {formatDate(key.expires_at)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">SISA WAKTU</div>
                  <div className="text-sm text-accent">{timeLeft(key.expires_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">KEY TERPAKAI</div>
                  <div className="text-sm">{key.times_used} kali</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-muted mb-1">HWID MAX</div>
                <div className="text-sm">{key.hwid_max} perangkat</div>
              </div>
            </div>
          ) : (
            <div className="card mb-4 text-center" style={{ padding: '40px', borderStyle: 'dashed' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
              <div className="fw-bold mb-2">Kamu belum punya key</div>
              <div className="text-sm text-muted">Hubungi reseller atau developer untuk mendapatkan key AWR</div>
            </div>
          )}

          {/* Announcements */}
          {announcements && announcements.length > 0 && (
            <div className="card">
              <div className="card-title">📢 Pengumuman</div>
              {announcements.map((a: any) => (
                <div key={a.id} className="announcement-card">
                  <div className="fw-bold text-sm mb-1">{a.title}</div>
                  <div className="text-sm text-muted">{a.content}</div>
                  <div className="text-xs text-muted mt-2">{formatDate(a.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifs' && (
        <div className="card">
          <div className="card-title">🔔 Notifikasi</div>
          {!notifications?.length && <div className="text-center text-muted py-4">Tidak ada notifikasi</div>}
          {notifications?.map((n: Notif) => (
            <div key={n.id} style={{
              padding: '14px', borderRadius: 10, marginBottom: 8,
              background: n.is_read ? 'transparent' : 'rgba(0,102,204,0.08)',
              border: `1px solid ${n.is_read ? 'transparent' : 'rgba(0,170,255,0.15)'}`,
              transition: 'all 0.2s'
            }}>
              <div className="flex-between">
                <div className="fw-bold text-sm">{n.title}</div>
                {!n.is_read && <span className="notif-dot" />}
              </div>
              <div className="text-sm text-muted mt-1">{n.message}</div>
              <div className="text-xs text-muted mt-1">{formatDate(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <div>
          {/* Profile card */}
          <div className="card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Background */}
            <div className="profile-bg">
              {u.background_url ? (
                u.background_type === 'video'
                  ? <video src={u.background_url} autoPlay loop muted />
                  : <img src={u.background_url} alt="bg" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--card2), var(--bg3))' }} />
              )}
            </div>
            {/* User info */}
            <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
              <div className="flex-gap mb-3" style={{ alignItems: 'flex-end' }}>
                <div className="profile-avatar" style={{ flexShrink: 0 }}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: '1.4rem', fontWeight: 700 }}>{u.username}</div>
                  <div className="text-sm text-muted">{u.email}</div>
                </div>
              </div>

              <div className="grid-3 mb-3">
                <div>
                  <div className="text-xs text-muted">Role</div>
                  <span className={`badge ${u.role === 'developer' ? 'badge-purple' : u.role === 'reseller' ? 'badge-yellow' : 'badge-blue'}`}>
                    {u.role === 'developer' ? '👑 Developer' : u.role === 'reseller' ? '🏪 Reseller' : '👤 User'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-muted">Roblox</div>
                  <div className="text-sm">{u.roblox_username || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Bergabung</div>
                  <div className="text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}</div>
                </div>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setEditProfile(true)}>✏️ Edit Profil</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal open={editProfile} onClose={() => setEditProfile(false)} title="✏️ Edit Profil">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" value={profileForm.username}
            onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Username Roblox</label>
          <input className="form-input" placeholder="Username Roblox kamu" value={profileForm.roblox_username}
            onChange={e => setProfileForm(f => ({ ...f, roblox_username: e.target.value }))} />
        </div>
        <div className="divider" />
        <div className="form-label mb-2" style={{ marginBottom: 8 }}>FOTO PROFIL</div>
        <div className="form-group">
          <label className="form-label">URL Avatar</label>
          <input className="form-input" placeholder="https://..." value={profileForm.avatar_url}
            onChange={e => setProfileForm(f => ({ ...f, avatar_url: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">URL Background</label>
          <input className="form-input" placeholder="https://.../image-or-video" value={profileForm.background_url}
            onChange={e => setProfileForm(f => ({ ...f, background_url: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipe Background</label>
          <select className="form-select" value={profileForm.background_type}
            onChange={e => setProfileForm(f => ({ ...f, background_type: e.target.value }))}>
            <option value="image">🖼️ Gambar</option>
            <option value="video">🎥 Video</option>
          </select>
        </div>
        <div className="divider" />
        <div className="form-group">
          <label className="form-label">Password Baru (kosongkan jika tidak mau ganti)</label>
          <div className="input-wrap">
            <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Password baru..."
              value={profileForm.password} onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))}
              style={{ paddingRight: 42 }} />
            <button type="button" className="eye-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>
        <div className="flex-gap mt-4">
          <button className="btn btn-primary flex-1" onClick={saveProfile}>💾 Simpan</button>
          <button className="btn btn-ghost" onClick={() => setEditProfile(false)}>Batal</button>
        </div>
      </Modal>
    </>
  )
}

// ── Reseller Panel ─────────────────────────────────────
function ResellerPanel({ token, user }: { token: string; user: User }) {
  const [users, setUsers] = useState<User[]>([])
  const [keys, setKeys] = useState<KeyData[]>([])
  const [form, setForm] = useState({ target_username: '', duration_type: '24h', hwid_max: '1' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('send')

  useEffect(() => {
    loadUsers()
    loadKeys()
  }, [])

  async function loadUsers() {
    // Use developer list if available, otherwise just keys
    const d = await api('/developer/users', 'GET', undefined, token)
    if (d.users) setUsers(d.users)
  }

  async function loadKeys() {
    const d = await api('/reseller/keys', 'GET', undefined, token)
    if (d.keys) setKeys(d.keys)
  }

  async function sendKey(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const d = await api('/reseller/keys', 'POST', form, token)
    if (d.error) { toast(d.error, 'error'); setLoading(false); return }
    toast(`Key berhasil dikirim ke ${form.target_username}!`, 'success')
    setLoading(false)
    setForm(f => ({ ...f, target_username: '', hwid_max: '1' }))
    loadKeys()
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="tab-bar">
        <button className={`tab-item ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>🔑 Kirim Key</button>
        <button className={`tab-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 History Key</button>
        <button className={`tab-item ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 List User</button>
      </div>

      {tab === 'send' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-title">🔑 Kirim Key ke User</div>
          <form onSubmit={sendKey}>
            <div className="form-group">
              <label className="form-label">Username Tujuan</label>
              <select className="form-select" value={form.target_username}
                onChange={e => setForm(f => ({ ...f, target_username: e.target.value }))} required>
                <option value="">— Pilih Username —</option>
                {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Durasi Key</label>
              <select className="form-select" value={form.duration_type}
                onChange={e => setForm(f => ({ ...f, duration_type: e.target.value }))} required>
                {DURATIONS.map(d => <option key={d} value={d}>{DURATION_LABELS[d]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max HWID (1 - 999999999999)</label>
              <input className="form-input" type="number" min={1} max={999999999999} value={form.hwid_max}
                onChange={e => setForm(f => ({ ...f, hwid_max: e.target.value }))} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? '⏳ Mengirim...' : '🚀 Kirim Key'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-title">📋 History Key yang Dikirim</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Key</th><th>Dikirim ke</th><th>Durasi</th><th>Expired</th><th>Status</th><th>Terpakai</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td>
                      <div className="key-box" style={{ fontSize: '0.72rem', padding: '6px 10px' }}
                        onClick={() => { copyToClipboard(k.key_value); toast('Disalin!', 'success') }}>
                        {k.key_value}
                      </div>
                    </td>
                    <td>{(k as any).users?.username || '-'}</td>
                    <td><span className="badge badge-blue">{DURATION_LABELS[k.duration_type] || k.duration_type}</span></td>
                    <td className="text-sm">{formatDate(k.expires_at)}</td>
                    <td><span className={`badge ${k.is_active ? 'badge-green' : 'badge-red'}`}>{k.is_active ? 'Aktif' : 'Mati'}</span></td>
                    <td>{k.times_used}x</td>
                  </tr>
                ))}
                {!keys.length && <tr><td colSpan={6} className="text-center text-muted">Belum ada key</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="card-title">👥 List User Terdaftar</div>
          <div className="form-group mb-4" style={{ marginBottom: 16 }}>
            <input className="form-input" placeholder="🔍 Cari username atau email..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Username</th><th>Email</th><th>Key Aktif</th><th>Bergabung</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="fw-bold">{u.username}</td>
                    <td className="text-sm text-muted">{u.email}</td>
                    <td>
                      {(u as any).keys?.[0]?.key_value
                        ? <span className="badge badge-green">Ada Key</span>
                        : <span className="badge badge-gray">Tidak Ada</span>}
                    </td>
                    <td className="text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))}
                {!filteredUsers.length && <tr><td colSpan={4} className="text-center text-muted">Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── Developer Panel ─────────────────────────────────────
function DeveloperPanel({ token, user }: { token: string; user: User }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [keys, setKeys] = useState<KeyData[]>([])
  const [search, setSearch] = useState('')
  const [broadcast, setBroadcast] = useState({ title: '', content: '' })
  const [globalKey, setGlobalKey] = useState({ duration_type: '24h', hwid_max: '1' })
  const [editUser, setEditUser] = useState<any>(null)
  const [editKey, setEditKey] = useState<any>(null)
  const [banModal, setBanModal] = useState<any>(null)
  const [banReason, setBanReason] = useState('')
  const [resellerUsername, setResellerUsername] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { loadUsers(); loadKeys() }, [])

  async function loadUsers() {
    const d = await api('/developer/users', 'GET', undefined, token)
    if (d.users) setUsers(d.users)
  }

  async function loadKeys() {
    const d = await api('/developer/keys', 'GET', undefined, token)
    if (d.keys) setKeys(d.keys)
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/broadcast', 'POST', broadcast, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(d.message, 'success')
    setBroadcast({ title: '', content: '' })
  }

  async function sendKeyAll(e: React.FormEvent) {
    e.preventDefault()
    const d = await api('/developer/send-key-all', 'POST', globalKey, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(`Key dikirim! ${d.notified} user dinotifikasi`, 'success')
  }

  async function banUser(action: string) {
    const d = await api('/developer/ban', 'POST', { userId: banModal.id, action, reason: banReason }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(d.message, 'success')
    setBanModal(null)
    setBanReason('')
    loadUsers()
  }

  async function saveEditUser() {
    const d = await api('/developer/users', 'PATCH', editUser, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('User diupdate!', 'success')
    setEditUser(null)
    loadUsers()
  }

  async function saveEditKey() {
    const d = await api('/developer/keys', 'PATCH', editKey, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('Key diupdate!', 'success')
    setEditKey(null)
    loadKeys()
  }

  async function deleteKey(keyId: string) {
    if (!confirm('Yakin hapus key ini?')) return
    await api('/developer/keys', 'DELETE', { keyId }, token)
    toast('Key dihapus', 'info')
    loadKeys()
  }

  async function makeReseller() {
    if (!resellerUsername.trim()) return
    const target = users.find(u => u.username === resellerUsername)
    if (!target) { toast('User tidak ditemukan', 'error'); return }
    const d = await api('/developer/users', 'PATCH', { userId: target.id, role: 'reseller' }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast(`${resellerUsername} dijadikan reseller!`, 'success')
    setResellerUsername('')
    loadUsers()
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
        {['users', 'keys', 'broadcast', 'send-key', 'reseller'].map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'users' ? '👥 Users' : t === 'keys' ? '🔑 Keys' : t === 'broadcast' ? '📢 Broadcast' : t === 'send-key' ? '🎁 Kirim Key Global' : '🏪 Reseller'}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="card">
          <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title">👥 List User ({users.length})</div>
            <input className="form-input" style={{ width: 240 }} placeholder="🔍 Cari..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th><th>Email</th><th>Role</th><th>Key</th>
                  <th>Roblox</th><th>Total Exec</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="fw-bold">{u.username}</td>
                    <td className="text-sm text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'developer' ? 'badge-purple' : u.role === 'reseller' ? 'badge-yellow' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-sm">
                      {u.keys?.[0]?.key_value ? (
                        <div>
                          <div style={{ fontFamily: 'Rajdhani', fontSize: '0.7rem', color: 'var(--accent3)', letterSpacing: 1 }}>
                            {u.keys[0].key_value.substring(0, 12)}...
                          </div>
                          <div className="text-xs text-muted">{formatDate(u.keys[0].expires_at)}</div>
                        </div>
                      ) : <span className="badge badge-gray">No key</span>}
                    </td>
                    <td>
                      {u.roblox_username ? (
                        <a href={`https://www.roblox.com/users/${u.roblox_id}/profile`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--accent3)', textDecoration: 'none', fontSize: '0.82rem' }}>
                          {u.roblox_username} ↗
                        </a>
                      ) : <span className="text-muted text-sm">-</span>}
                    </td>
                    <td>{u.execution_count || 0}x</td>
                    <td>
                      <span className={`badge ${u.is_banned ? 'badge-red' : 'badge-green'}`}>
                        {u.is_banned ? 'Banned' : 'Aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditUser({ userId: u.id, username: u.username, email: u.email, role: u.role, roblox_username: u.roblox_username || '', roblox_id: u.roblox_id || '', password: '' })}>
                          ✏️
                        </button>
                        {u.is_banned
                          ? <button className="btn btn-success btn-sm" onClick={() => { setBanModal(u); setBanReason('') }}>✅</button>
                          : <button className="btn btn-danger btn-sm" onClick={() => { setBanModal(u); setBanReason('') }}>🚫</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && <tr><td colSpan={8} className="text-center text-muted">Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KEYS TAB */}
      {tab === 'keys' && (
        <div className="card">
          <div className="card-title">🔑 Semua Key ({keys.length})</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Key</th><th>Assign to</th><th>Dibuat oleh</th><th>Durasi</th><th>Expired</th><th>HWID Max</th><th>Pakai</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td>
                      <div className="key-box" style={{ fontSize: '0.7rem', padding: '5px 8px', cursor: 'pointer' }}
                        onClick={() => { copyToClipboard(k.key_value); toast('Disalin!', 'success') }}>
                        {k.key_value}
                      </div>
                    </td>
                    <td className="text-sm">{(k as any).users?.username || <span className="badge badge-yellow">Shared</span>}</td>
                    <td className="text-sm">{(k as any).creator?.username || '-'}</td>
                    <td><span className="badge badge-blue">{DURATION_LABELS[k.duration_type] || k.duration_type}</span></td>
                    <td className="text-sm">{formatDate(k.expires_at)}</td>
                    <td>{k.hwid_max}</td>
                    <td>{k.times_used}x</td>
                    <td><span className={`badge ${k.is_active ? 'badge-green' : 'badge-red'}`}>{k.is_active ? 'Aktif' : 'Mati'}</span></td>
                    <td>
                      <div className="flex-gap gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditKey({ keyId: k.id, is_active: k.is_active, hwid_max: k.hwid_max, duration_type: k.duration_type, expires_at: k.expires_at, assigned_to_username: (k as any).users?.username || '' })}>
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteKey(k.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!keys.length && <tr><td colSpan={9} className="text-center text-muted">Belum ada key</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BROADCAST */}
      {tab === 'broadcast' && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div className="card-title">📢 Broadcast ke Semua User</div>
          <form onSubmit={sendBroadcast}>
            <div className="form-group">
              <label className="form-label">Judul</label>
              <input className="form-input" placeholder="Judul pengumuman..." value={broadcast.title}
                onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Isi Pesan</label>
              <textarea className="form-input" rows={5} placeholder="Tulis pesan broadcast kamu..."
                value={broadcast.content} onChange={e => setBroadcast(b => ({ ...b, content: e.target.value }))}
                required style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary btn-full" type="submit">📢 Kirim Broadcast</button>
          </form>
        </div>
      )}

      {/* SEND KEY ALL */}
      {tab === 'send-key' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-title">🎁 Kirim Key ke Semua User</div>
          <div style={{ background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: '#fbbf24' }}>
            ⚠️ Key ini akan dibuat sebagai shared key yang bisa diakses semua orang. Semua user akan menerima notifikasi.
          </div>
          <form onSubmit={sendKeyAll}>
            <div className="form-group">
              <label className="form-label">Durasi</label>
              <select className="form-select" value={globalKey.duration_type}
                onChange={e => setGlobalKey(g => ({ ...g, duration_type: e.target.value }))}>
                {DURATIONS.map(d => <option key={d} value={d}>{DURATION_LABELS[d]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max HWID per user</label>
              <input className="form-input" type="number" min={1} max={999999999999} value={globalKey.hwid_max}
                onChange={e => setGlobalKey(g => ({ ...g, hwid_max: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full" type="submit">🚀 Kirim ke Semua User</button>
          </form>
        </div>
      )}

      {/* RESELLER MANAGEMENT */}
      {tab === 'reseller' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-title">🏪 Jadikan User Reseller</div>
          <div className="form-group">
            <label className="form-label">Pilih Username</label>
            <select className="form-select" value={resellerUsername}
              onChange={e => setResellerUsername(e.target.value)}>
              <option value="">— Pilih User —</option>
              {users.filter(u => u.role === 'user').map(u => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={makeReseller}>✅ Jadikan Reseller</button>

          <div className="divider" />
          <div className="card-title" style={{ marginBottom: 12 }}>📋 Daftar Reseller</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Username</th><th>Email</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.filter(u => u.role === 'reseller').map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td className="text-sm text-muted">{u.email}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={async () => {
                        await api('/developer/users', 'PATCH', { userId: u.id, role: 'user' }, token)
                        toast(`${u.username} dikembalikan ke user`, 'info')
                        loadUsers()
                      }}>Copot</button>
                    </td>
                  </tr>
                ))}
                {!users.filter(u => u.role === 'reseller').length && (
                  <tr><td colSpan={3} className="text-center text-muted">Belum ada reseller</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="✏️ Edit User">
        {editUser && <>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={editUser.username}
              onChange={e => setEditUser((u: any) => ({ ...u, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={editUser.email}
              onChange={e => setEditUser((u: any) => ({ ...u, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={editUser.role}
              onChange={e => setEditUser((u: any) => ({ ...u, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="reseller">Reseller</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Roblox Username</label>
            <input className="form-input" value={editUser.roblox_username}
              onChange={e => setEditUser((u: any) => ({ ...u, roblox_username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password Baru (kosong = tidak ganti)</label>
            <div className="input-wrap">
              <input className="form-input" type={showPw ? 'text' : 'password'} value={editUser.password}
                onChange={e => setEditUser((u: any) => ({ ...u, password: e.target.value }))}
                style={{ paddingRight: 42 }} />
              <button type="button" className="eye-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div className="flex-gap mt-4">
            <button className="btn btn-primary flex-1" onClick={saveEditUser}>💾 Simpan</button>
            <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Batal</button>
          </div>
        </>}
      </Modal>

      {/* Edit Key Modal */}
      <Modal open={!!editKey} onClose={() => setEditKey(null)} title="✏️ Edit Key">
        {editKey && <>
          <div className="form-group">
            <label className="form-label">Assign ke Username</label>
            <input className="form-input" placeholder="Username..." value={editKey.assigned_to_username}
              onChange={e => setEditKey((k: any) => ({ ...k, assigned_to_username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Durasi</label>
            <select className="form-select" value={editKey.duration_type}
              onChange={e => setEditKey((k: any) => ({ ...k, duration_type: e.target.value }))}>
              {DURATIONS.map(d => <option key={d} value={d}>{DURATION_LABELS[d]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max HWID</label>
            <input className="form-input" type="number" value={editKey.hwid_max}
              onChange={e => setEditKey((k: any) => ({ ...k, hwid_max: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={editKey.is_active ? 'true' : 'false'}
              onChange={e => setEditKey((k: any) => ({ ...k, is_active: e.target.value === 'true' }))}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
          <div className="flex-gap mt-4">
            <button className="btn btn-primary flex-1" onClick={saveEditKey}>💾 Simpan</button>
            <button className="btn btn-ghost" onClick={() => setEditKey(null)}>Batal</button>
          </div>
        </>}
      </Modal>

      {/* Ban Modal */}
      <Modal open={!!banModal} onClose={() => setBanModal(null)} title={banModal?.is_banned ? '✅ Unban User' : '🚫 Ban User'}>
        {banModal && <>
          <div className="mb-4">
            {banModal.is_banned
              ? <p className="text-sm text-muted">Unban <strong>{banModal.username}</strong>? Semua key mereka akan tetap nonaktif sampai dibuat ulang.</p>
              : <p className="text-sm text-muted">Ban <strong>{banModal.username}</strong>? Semua key mereka akan dinonaktifkan.</p>}
          </div>
          {!banModal.is_banned && (
            <div className="form-group">
              <label className="form-label">Alasan (opsional)</label>
              <input className="form-input" placeholder="Alasan ban..." value={banReason}
                onChange={e => setBanReason(e.target.value)} />
            </div>
          )}
          <div className="flex-gap mt-4">
            {banModal.is_banned
              ? <button className="btn btn-success flex-1" onClick={() => banUser('unban')}>✅ Unban</button>
              : <button className="btn btn-danger flex-1" onClick={() => banUser('ban')}>🚫 Ban</button>}
            <button className="btn btn-ghost" onClick={() => setBanModal(null)}>Batal</button>
          </div>
        </>}
      </Modal>
    </>
  )
}

// ── Routes Page ────────────────────────────────────────
function RoutesPage({ token, user }: { token: string | null; user: User | null }) {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', game_name: '', data: '' })
  const [selectedRoute, setSelectedRoute] = useState<any>(null)

  useEffect(() => { loadRoutes() }, [])

  async function loadRoutes() {
    setLoading(true)
    const d = await api('/routes')
    if (d.routes) setRoutes(d.routes)
    setLoading(false)
  }

  async function downloadRoute(id: string) {
    const d = await api('/routes/' + id)
    if (d.route) {
      setSelectedRoute(d.route)
    }
  }

  async function uploadRoute(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { toast('Login dulu!', 'error'); return }
    let parsedData
    try {
      parsedData = JSON.parse(uploadForm.data)
    } catch {
      toast('Data route harus JSON valid', 'error')
      return
    }
    const d = await api('/routes', 'POST', { ...uploadForm, data: parsedData }, token)
    if (d.error) { toast(d.error, 'error'); return }
    toast('Route berhasil diupload!', 'success')
    setShowUpload(false)
    setUploadForm({ name: '', description: '', game_name: '', data: '' })
    loadRoutes()
  }

  return (
    <>
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-title">🗺️ Route Library</div>
          <div className="section-sub">Download dan upload rute untuk AWR Script</div>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>⬆️ Upload Route</button>
        )}
      </div>

      {loading ? (
        <div className="routes-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 130, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <div className="routes-grid">
          {routes.map(r => (
            <div key={r.id} className="route-card" onClick={() => downloadRoute(r.id)}>
              <div className="route-card-name">{r.name}</div>
              {r.game_name && <div className="text-xs text-muted mb-2">🎮 {r.game_name}</div>}
              {r.description && <div className="text-sm text-muted mb-3" style={{ lineHeight: 1.4 }}>{r.description}</div>}
              <div className="flex-between mt-2">
                <div className="text-xs text-muted">by {r.users?.username || 'anonymous'}</div>
                <span className="badge badge-blue">⬇️ {r.download_count}</span>
              </div>
            </div>
          ))}
          {!routes.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗺️</div>
              Belum ada route. Upload yang pertama!
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="⬆️ Upload Route">
        <form onSubmit={uploadRoute}>
          <div className="form-group">
            <label className="form-label">Nama Route</label>
            <input className="form-input" placeholder="Nama route..." value={uploadForm.name}
              onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Game</label>
            <input className="form-input" placeholder="Nama game Roblox..." value={uploadForm.game_name}
              onChange={e => setUploadForm(f => ({ ...f, game_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <input className="form-input" placeholder="Deskripsi singkat..." value={uploadForm.description}
              onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Data Route (JSON)</label>
            <textarea className="form-input" rows={6} placeholder='[{"x":0,"y":5,"z":0}, ...]'
              value={uploadForm.data} onChange={e => setUploadForm(f => ({ ...f, data: e.target.value }))}
              required style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }} />
          </div>
          <div className="flex-gap mt-4">
            <button className="btn btn-primary flex-1" type="submit">⬆️ Upload</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowUpload(false)}>Batal</button>
          </div>
        </form>
      </Modal>

      {/* Route detail modal */}
      <Modal open={!!selectedRoute} onClose={() => setSelectedRoute(null)} title={`📥 ${selectedRoute?.name}`}>
        {selectedRoute && <>
          <div className="mb-3">
            {selectedRoute.game_name && <div className="text-sm text-muted mb-1">🎮 {selectedRoute.game_name}</div>}
            {selectedRoute.description && <div className="text-sm text-muted mb-3">{selectedRoute.description}</div>}
          </div>
          <div>
            <div className="form-label mb-2" style={{ marginBottom: 8 }}>Data JSON Route</div>
            <textarea className="form-input" rows={8} readOnly
              value={JSON.stringify(selectedRoute.data, null, 2)}
              style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
          </div>
          <div className="flex-gap mt-4">
            <button className="btn btn-primary flex-1" onClick={() => {
              copyToClipboard(JSON.stringify(selectedRoute.data))
              toast('Data route disalin!', 'success')
            }}>📋 Copy Data</button>
            <button className="btn btn-ghost" onClick={() => {
              const blob = new Blob([JSON.stringify(selectedRoute.data, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `${selectedRoute.name.replace(/\s/g, '_')}.json`
              a.click()
              toast('File didownload!', 'success')
            }}>⬇️ Download .json</button>
          </div>
        </>}
      </Modal>
    </>
  )
}

// ── Leaderboard ────────────────────────────────────────
function LeaderboardPage() {
  const [lb, setLb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/leaderboard').then(d => {
      if (d.leaderboard) setLb(d.leaderboard)
      setLoading(false)
    })
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <>
      <div className="section-header">
        <div className="section-title">🏆 Leaderboard</div>
        <div className="section-sub">Top executor AWR Script</div>
      </div>

      <div style={{ maxWidth: 640 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton mb-2" style={{ height: 60, borderRadius: 12 }} />
          ))
        ) : lb.map((u, i) => (
          <div key={i} style={{
            background: i < 3 ? `linear-gradient(135deg, rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'},0.08), transparent)` : 'var(--card)',
            border: `1px solid ${i < 3 ? `rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'},0.2)` : 'var(--border)'}`,
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transition: 'all 0.2s',
            animation: `fade-up ${0.1 + i * 0.05}s ease`
          }}>
            <div style={{ fontSize: i < 3 ? '1.6rem' : '1rem', width: 36, textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700, color: i < 3 ? 'currentColor' : 'var(--text2)' }}>
              {i < 3 ? medals[i] : `#${u.rank}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.05rem', letterSpacing: 1 }}>{u.username}</div>
              {u.roblox_username && <div className="text-xs text-muted">Roblox: {u.roblox_username}</div>}
            </div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent3)' }}>
              {u.total_executions.toLocaleString()}
              <div className="text-xs text-muted" style={{ fontFamily: 'Exo 2' }}>executions</div>
            </div>
          </div>
        ))}
        {!loading && !lb.length && (
          <div className="text-center text-muted" style={{ padding: '60px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏆</div>
            Belum ada data leaderboard
          </div>
        )}
      </div>
    </>
  )
}

// ── Main App ───────────────────────────────────────────
export default function Home() {
  const [loadingDone, setLoadingDone] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState('home')

  useEffect(() => {
    const t = setTimeout(() => setLoadingDone(true), 2000)

    // Restore session
    const saved = localStorage.getItem('awr_token')
    if (saved) {
      api('/user/profile', 'GET', undefined, saved).then(d => {
        if (d.user) {
          setToken(saved)
          setUser(d.user)
          setPage('dashboard')
        } else {
          localStorage.removeItem('awr_token')
        }
      })
    }

    return () => clearTimeout(t)
  }, [])

  function onAuth(t: string, u: User) {
    setToken(t)
    setUser(u)
    setPage('dashboard')
  }

  function logout() {
    localStorage.removeItem('awr_token')
    setToken(null)
    setUser(null)
    setPage('home')
    toast('Berhasil logout', 'info')
  }

  function canSeeReseller() { return user?.role === 'reseller' || user?.role === 'developer' }
  function canSeeDeveloper() { return user?.role === 'developer' }

  return (
    <>
      <Head>
        <title>AWR Key System — by Sanzxmzz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>

      <LoadingScreen done={loadingDone} />
      <Toast />

      {/* Background */}
      <div className="bg-grid" />
      <div className="bg-glow-orb orb1" />
      <div className="bg-glow-orb orb2" />

      {!token ? (
        <AuthPage onAuth={onAuth} />
      ) : (
        <div className="app-wrapper">
          {/* Navbar */}
          <nav className="navbar">
            <div className="navbar-brand">⚡ AWR</div>
            <div className="navbar-links">
              <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
                🏠 {user?.role === 'developer' ? 'Dev' : user?.role === 'reseller' ? 'Reseller' : 'Dashboard'}
              </button>
              {canSeeReseller() && (
                <button className={`nav-btn ${page === 'reseller' ? 'active' : ''}`} onClick={() => setPage('reseller')}>
                  🏪 Reseller
                </button>
              )}
              {canSeeDeveloper() && (
                <button className={`nav-btn ${page === 'developer' ? 'active' : ''}`} onClick={() => setPage('developer')}>
                  👑 Developer
                </button>
              )}
              <button className={`nav-btn ${page === 'routes' ? 'active' : ''}`} onClick={() => setPage('routes')}>🗺️ Routes</button>
              <button className={`nav-btn ${page === 'leaderboard' ? 'active' : ''}`} onClick={() => setPage('leaderboard')}>🏆 LB</button>
              <button className="nav-btn" onClick={logout} style={{ color: 'var(--danger)' }}>🚪</button>
            </div>
          </nav>

          {/* Pages */}
          <div className="page active">
            {page === 'dashboard' && <UserDashboard token={token} user={user!} onLogout={logout} />}
            {page === 'reseller' && canSeeReseller() && <ResellerPanel token={token} user={user!} />}
            {page === 'developer' && canSeeDeveloper() && <DeveloperPanel token={token} user={user!} />}
            {page === 'routes' && <RoutesPage token={token} user={user} />}
            {page === 'leaderboard' && <LeaderboardPage />}
          </div>
        </div>
      )}
    </>
  )
}
