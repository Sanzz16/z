-- ================================================================
-- AWR KEY SYSTEM v3 — DATABASE SETUP (SATU FILE LENGKAP)
-- Jalankan sekali di Supabase SQL Editor
-- ================================================================

-- ─── TABLES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'developer')),
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  avatar_url TEXT,
  background_url TEXT,
  background_type VARCHAR(10) DEFAULT 'image' CHECK (background_type IN ('image', 'video')),
  roblox_username VARCHAR(100),
  roblox_id BIGINT,
  total_executions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_value VARCHAR(100) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  hwid TEXT,
  hwid_max INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_used BOOLEAN DEFAULT false,
  is_free_key BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  duration_type VARCHAR(20) DEFAULT '24h' CHECK (duration_type IN ('24h', '3d', '5d', '7d', '30d', '60d', 'lifetime')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_hwids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID REFERENCES keys(id) ON DELETE CASCADE,
  hwid TEXT NOT NULL,
  bound_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key_id, hwid)
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_id UUID REFERENCES keys(id) ON DELETE SET NULL,
  roblox_username VARCHAR(100),
  roblox_id BIGINT,
  hwid TEXT,
  ip_address TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  game_name VARCHAR(100),
  data JSONB NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  has_password BOOLEAN DEFAULT false,
  password TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'key', 'announcement')),
  is_read BOOLEAN DEFAULT false,
  key_id UUID REFERENCES keys(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset codes table
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FUNCTIONS ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_executions(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_executions = COALESCE(total_executions, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys             ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_hwids        ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets  ENABLE ROW LEVEL SECURITY;

-- Service role (backend) dapat akses semua
CREATE POLICY "svc_users"       ON users           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_keys"        ON keys            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_hwids"       ON key_hwids       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_exec"        ON execution_logs  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_routes"      ON routes          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_notifs"      ON notifications   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_announce"    ON announcements   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_sessions"    ON sessions        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_pw_resets"   ON password_resets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public bisa baca routes yang public
CREATE POLICY "pub_routes"      ON routes FOR SELECT TO anon USING (is_public = true);

-- ─── SEED: AKUN DEVELOPER DEFAULT ───────────────────────────────
-- Username : icansayangara
-- Password : sanzxmzz222006

INSERT INTO users (username, email, password_hash, role)
VALUES (
  'icansayangara',
  'developer@awr.local',
  '$2a$10$rBnFKhRQXGl9vJ7J8qKEaOzWqQ1pFqF9XYkEsOvHzlY3nJ2vK4Omi',
  'developer'
) ON CONFLICT (username) DO NOTHING;

-- GetKey Steps Settings
CREATE TABLE IF NOT EXISTS getkey_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE getkey_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc_getkey" ON getkey_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pub_getkey"  ON getkey_settings FOR SELECT TO anon USING (is_active = true);

-- Default getkey steps
INSERT INTO getkey_settings (name, url, duration_seconds, order_index) VALUES
  ('Buka Link Iklan', 'https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/', 30, 1),
  ('Join Saluran Telegram', 'https://t.me/sanzxmzz', 25, 2),
  ('Follow TikTok', 'https://tiktok.com/@sanzxmzz', 25, 3)
ON CONFLICT DO NOTHING;
