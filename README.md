# ⚡ AWR Key System v3 — by Sanzxmzz

## 🚀 Setup (3 Langkah)

### 1. Jalankan SQL di Supabase
1. Buka: https://supabase.com/dashboard/project/uivqjmpbilfoxrazsfnu/sql
2. New Query → Copy isi `awr_database.sql` → Paste → Run

### 2. Ambil Supabase Keys
Buka: https://supabase.com/dashboard/project/uivqjmpbilfoxrazsfnu/settings/api

### 3. Deploy ke Vercel
Environment Variables yang wajib diisi di Vercel:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uivqjmpbilfoxrazsfnu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `JWT_SECRET` | random string panjang |
| `EMAIL_USER` | Gmail kamu (aktifkan App Password) |
| `EMAIL_PASS` | Gmail App Password (bukan password biasa) |

**Cara buat Gmail App Password:**
1. Buka myaccount.google.com → Security
2. 2-Step Verification harus aktif
3. App Passwords → buat baru → copy 16 karakter

### 4. Update Lua Script
```lua
local KEY_API = "https://nama-project.vercel.app/api/verify"
```

---

## 👑 Login Developer
| | |
|--|--|
| Username | `icansayangara` |
| Password | `sanzxmzz222006` |

---

## ✅ Semua Fitur v3

**Auth**
- Login/Register + show-hide password
- Ingat saya 30 hari
- Lupa password via email (kode OTP 6 digit, berlaku 20 menit)

**User Dashboard**
- Key aktif: KEY, expired, sisa waktu, HWID max, berapa kali dipakai
- Tombol **Get Free Key 24 Jam** (pakai MoneyBlink task)
- Notifikasi in-app
- Pengumuman dari developer/reseller
- Edit profil: avatar URL, background foto/video, username, roblox, password

**Reseller Panel**
- Kirim key ke user via dropdown
- Durasi: 1/3/5/7/30/60 hari / Lifetime
- HWID Max custom 1–999999999999
- History key
- Broadcast ke semua user (notif website + opsional email)
- Lihat list user

**Developer Panel**
- Lihat semua user + full stats
- Edit user (username, email, password, role, roblox)
- Ban/Unban (ban = semua key dimatikan)
- Edit/hapus key
- Broadcast + email ke semua
- Kirim key global ke semua user
- Manage reseller

**Routes**
- Upload file JSON dari internal (.json/.txt)
- Visibilitas: Public / Private (dengan password)
- Thumbnail dari URL
- Download .json / copy data

**Leaderboard**
- Top 20 executions, username di-mask

**Tech**
- Smooth page transitions (tidak refresh sendiri)
- Particle background animated
- Animation delay bertahap
- Remember me 30 hari
