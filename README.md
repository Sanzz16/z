# ⚡ AWR Key System — by Sanzxmzz

Full-stack key management system untuk AWR Script.
**Next.js + Supabase + Vercel** — siap deploy!

---

## 🚀 Cara Setup (3 langkah)

### Step 1 — Jalankan SQL di Supabase
1. Buka: https://supabase.com/dashboard/project/uivqjmpbilfoxrazsfnu/sql
2. Klik **"New query"**
3. Copy seluruh isi file **`awr_database.sql`** → paste → klik **Run**
4. Selesai! Semua tabel + fungsi + akun developer sudah dibuat.

### Step 2 — Ambil Supabase Keys
Buka: https://supabase.com/dashboard/project/uivqjmpbilfoxrazsfnu/settings/api
- Copy **Project URL**
- Copy **anon / public key**
- Copy **service_role key** ⚠️ (rahasia, jangan share!)

### Step 3 — Deploy ke Vercel
1. Push folder ini ke GitHub (buat repo baru → upload semua file)
2. Buka https://vercel.com → **New Project** → import dari GitHub
3. Di bagian **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uivqjmpbilfoxrazsfnu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role key) |
| `JWT_SECRET` | string random panjang, contoh: `awrSecret!Sanzxmzz@2024` |

4. Klik **Deploy** — tunggu ~1 menit

### Step 4 — Update Lua Script
Setelah dapat URL Vercel, ganti baris ini di `AWR_v1_4.lua`:
```lua
local KEY_API = "https://nama-project-kamu.vercel.app/api/verify"
```

---

## 👑 Login Developer Default
| | |
|--|--|
| **Username** | `icansayangara` |
| **Password** | `sanzxmzz222006` |

> ⚠️ Segera ganti password setelah pertama kali masuk!

---

## 📂 Struktur File

```
awr-keysystem/
├── awr_database.sql          ← 1 file SQL untuk semua setup Supabase
├── .env.local                ← template environment variables
├── pages/
│   ├── index.tsx             ← halaman utama (semua UI)
│   └── api/
│       ├── verify.ts         ← endpoint dari Lua script
│       ├── auth/             ← login & register
│       ├── user/             ← profil & notifikasi
│       ├── reseller/         ← kirim key
│       ├── developer/        ← panel full control
│       ├── routes/           ← upload & download rute
│       └── leaderboard.ts    ← top executions
├── lib/
│   ├── supabase.ts           ← koneksi database
│   ├── auth.ts               ← JWT & bcrypt
│   └── middleware.ts         ← cek role
└── styles/globals.css        ← semua styling
```

---

## ✅ Fitur Lengkap

**User**
- Register / Login (show-hide password)
- Dashboard: key aktif, expired, sisa waktu, HWID max, berapa kali dipakai
- Notifikasi in-app dari reseller / developer
- Pengumuman broadcast
- Edit profil: avatar URL, background foto/video URL, username, roblox, password

**Reseller**
- Kirim key ke user via dropdown username
- Durasi: 1 Hari / 3 Hari / 5 Hari / 7 Hari / 30 Hari / 60 Hari / Lifetime
- HWID Max custom 1 – 999999999999
- Lihat history key yang pernah dikirim
- Lihat list semua user terdaftar

**Developer (kontrol penuh)**
- Lihat semua user: username, email, role, key, roblox info, total execution
- Edit user: nama, email, password, role, roblox
- Ban / Unban user (ban = semua key dimatikan)
- Manage semua key: edit, hapus, assign ke user lain
- Broadcast pengumuman ke semua user
- Kirim key global yang bisa dipakai siapapun
- Jadikan / copot reseller

**Routes**
- Browse & download rute publik
- Upload rute dalam format JSON
- Kompatibel dengan AWR Script load-from-web

**Leaderboard**
- Top 20 user by total execution
- Username di-mask: `Can*****ara`
