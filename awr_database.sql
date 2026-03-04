-- AWR KEY SYSTEM v5 — DATABASE SETUP — Run di Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','reseller','developer')),
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  avatar_url TEXT,
  avatar_file_url TEXT,
  background_url TEXT,
  background_type VARCHAR(10) DEFAULT 'image' CHECK (background_type IN ('image','video')),
  roblox_username VARCHAR(100),
  roblox_id BIGINT,
  total_executions INTEGER DEFAULT 0,
  leaderboard_public BOOLEAN DEFAULT true,
  support_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_file_url') THEN ALTER TABLE users ADD COLUMN avatar_file_url TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='leaderboard_public') THEN ALTER TABLE users ADD COLUMN leaderboard_public BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='support_contact') THEN ALTER TABLE users ADD COLUMN support_contact TEXT; END IF;
END $$;

CREATE TABLE IF NOT EXISTS keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_value VARCHAR(100) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  hwid TEXT, hwid_max INTEGER DEFAULT 1, expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true, is_used BOOLEAN DEFAULT false,
  is_free_key BOOLEAN DEFAULT false, times_used INTEGER DEFAULT 0,
  duration_type VARCHAR(20) DEFAULT '24h' CHECK (duration_type IN ('24h','3d','5d','7d','30d','60d','lifetime')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_keys_assigned_to ON keys(assigned_to);
CREATE INDEX IF NOT EXISTS idx_keys_created_by ON keys(created_by);
CREATE INDEX IF NOT EXISTS idx_keys_is_active ON keys(is_active);
CREATE INDEX IF NOT EXISTS idx_keys_key_value ON keys(key_value);

CREATE TABLE IF NOT EXISTS key_hwids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID REFERENCES keys(id) ON DELETE CASCADE,
  hwid TEXT NOT NULL, bound_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key_id, hwid)
);
CREATE INDEX IF NOT EXISTS idx_key_hwids_key_id ON key_hwids(key_id);

CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_id UUID REFERENCES keys(id) ON DELETE SET NULL,
  roblox_username VARCHAR(100), roblox_id BIGINT, hwid TEXT, ip_address TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_logs_user_id ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exec_logs_executed_at ON execution_logs(executed_at);

CREATE TABLE IF NOT EXISTS routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL, description TEXT, game_name VARCHAR(100),
  data JSONB NOT NULL, uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0, is_public BOOLEAN DEFAULT true,
  has_password BOOLEAN DEFAULT false, password TEXT, thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_routes_is_public ON routes(is_public);
CREATE INDEX IF NOT EXISTS idx_routes_uploaded_by ON routes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);

-- ============================================================
-- TABEL FEEDBACKS (dari AWR Lua Script — public)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type               VARCHAR(50) NOT NULL CHECK (type IN ('Saran','Report Bug','Feedback')),
  message            TEXT        NOT NULL,
  rating             INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  roblox_name_masked VARCHAR(100) NOT NULL,
  website_username   VARCHAR(100),
  hwid               TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type       ON feedbacks(type);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_rating     ON feedbacks(rating);


CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL, message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info','success','warning','key','announcement')),
  is_read BOOLEAN DEFAULT false, key_id UUID REFERENCES keys(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifs_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_created_at ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL, content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announce_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announce_created_at ON announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  code VARCHAR(10) NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pw_resets_user_id ON password_resets(user_id);

CREATE TABLE IF NOT EXISTS getkey_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL, url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30, order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_getkey_order ON getkey_settings(order_index, is_active);

-- TABEL BARU: music_settings
CREATE TABLE IF NOT EXISTS music_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  type VARCHAR(10) DEFAULT 'url' CHECK (type IN ('url','upload')),
  is_active BOOLEAN DEFAULT false,
  volume INTEGER DEFAULT 50,
  title VARCHAR(200) DEFAULT 'AWR Music',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO music_settings (url, type, is_active, volume, title)
SELECT '', 'url', false, 50, 'AWR Music'
WHERE NOT EXISTS (SELECT 1 FROM music_settings);

-- TABEL BARU: support_settings
CREATE TABLE IF NOT EXISTS support_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_url TEXT DEFAULT '',
  telegram_url TEXT DEFAULT '',
  discord_url TEXT DEFAULT '',
  custom_label TEXT DEFAULT 'Hubungi Support',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO support_settings (whatsapp_url, telegram_url, discord_url, is_active)
SELECT '', '', '', true
WHERE NOT EXISTS (SELECT 1 FROM support_settings);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION increment_executions(user_id UUID)
RETURNS void AS $$
BEGIN UPDATE users SET total_executions=COALESCE(total_executions,0)+1,updated_at=NOW() WHERE id=user_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_keys ON keys;
CREATE TRIGGER set_updated_at_keys BEFORE UPDATE ON keys FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_routes ON routes;
CREATE TRIGGER set_updated_at_routes BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_users',(SELECT COUNT(*) FROM users WHERE role='user'),
    'total_resellers',(SELECT COUNT(*) FROM users WHERE role='reseller'),
    'total_keys',(SELECT COUNT(*) FROM keys),
    'active_keys',(SELECT COUNT(*) FROM keys WHERE is_active=true),
    'expired_keys',(SELECT COUNT(*) FROM keys WHERE expires_at<NOW() AND expires_at IS NOT NULL),
    'total_executions',(SELECT COALESCE(SUM(total_executions),0) FROM users),
    'banned_users',(SELECT COUNT(*) FROM users WHERE is_banned=true),
    'total_routes',(SELECT COUNT(*) FROM routes),
    'today_executions',(SELECT COUNT(*) FROM execution_logs WHERE executed_at>=CURRENT_DATE)
  ) INTO result; RETURN result;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deactivate_expired_keys()
RETURNS void AS $$
BEGIN UPDATE keys SET is_active=false,updated_at=NOW() WHERE is_active=true AND expires_at IS NOT NULL AND expires_at<NOW(); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_hwids ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE getkey_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svc_users" ON users; CREATE POLICY "svc_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_keys" ON keys; CREATE POLICY "svc_keys" ON keys FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_hwids" ON key_hwids; CREATE POLICY "svc_hwids" ON key_hwids FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_exec" ON execution_logs; CREATE POLICY "svc_exec" ON execution_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_routes" ON routes; CREATE POLICY "svc_routes" ON routes FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_notifs" ON notifications; CREATE POLICY "svc_notifs" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_announce" ON announcements; CREATE POLICY "svc_announce" ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_sessions" ON sessions; CREATE POLICY "svc_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_pw_resets" ON password_resets; CREATE POLICY "svc_pw_resets" ON password_resets FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_getkey" ON getkey_settings; CREATE POLICY "svc_getkey" ON getkey_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_feedbacks" ON feedbacks; CREATE POLICY "svc_feedbacks" ON feedbacks FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "pub_feedbacks" ON feedbacks; CREATE POLICY "pub_feedbacks" ON feedbacks FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "ins_feedbacks" ON feedbacks; CREATE POLICY "ins_feedbacks" ON feedbacks FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "svc_music" ON music_settings; CREATE POLICY "svc_music" ON music_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_support" ON support_settings; CREATE POLICY "svc_support" ON support_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "svc_feedbacks" ON feedbacks; CREATE POLICY "svc_feedbacks" ON feedbacks FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Anon bisa baca dan insert feedbacks (publik)
DROP POLICY IF EXISTS "pub_feedbacks" ON feedbacks; CREATE POLICY "pub_feedbacks" ON feedbacks FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "ins_feedbacks" ON feedbacks; CREATE POLICY "ins_feedbacks" ON feedbacks FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "pub_routes" ON routes; CREATE POLICY "pub_routes" ON routes FOR SELECT TO anon USING (is_public=true);
DROP POLICY IF EXISTS "pub_getkey" ON getkey_settings; CREATE POLICY "pub_getkey" ON getkey_settings FOR SELECT TO anon USING (is_active=true);
DROP POLICY IF EXISTS "pub_announce" ON announcements; CREATE POLICY "pub_announce" ON announcements FOR SELECT TO anon USING (is_active=true);
DROP POLICY IF EXISTS "pub_music" ON music_settings; CREATE POLICY "pub_music" ON music_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "pub_support" ON support_settings; CREATE POLICY "pub_support" ON support_settings FOR SELECT TO anon USING (true);

-- SEED DATA
INSERT INTO users (username,email,password_hash,role) VALUES ('icansayangara','developer@awr.local','$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Wa9E.LAMiKHiUKmqKTLyK','developer') ON CONFLICT (username) DO UPDATE SET role='developer',updated_at=NOW();
INSERT INTO getkey_settings (name,url,duration_seconds,order_index,is_active) VALUES ('Buka Link Iklan','https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/',30,1,true),('Join Saluran Telegram','https://t.me/sanzxmzz',25,2,true),('Follow TikTok','https://tiktok.com/@sanzxmzz',25,3,true) ON CONFLICT DO NOTHING;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM announcements WHERE title='Selamat Datang di AWR Key System!') THEN INSERT INTO announcements (title,content,is_active) VALUES ('Selamat Datang di AWR Key System!','AWR Key System v5 sudah online!',true); END IF; END $$;

-- VIEWS
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT ROW_NUMBER() OVER (ORDER BY total_executions DESC) AS rank, username, roblox_username, total_executions, avatar_url, avatar_file_url, leaderboard_public
FROM users WHERE is_banned=false AND total_executions>0 ORDER BY total_executions DESC LIMIT 50;

CREATE OR REPLACE VIEW v_users_with_active_key AS
SELECT u.id,u.username,u.email,u.role,u.is_banned,u.total_executions,u.created_at,k.key_value,k.expires_at,k.duration_type,k.is_active AS key_active
FROM users u LEFT JOIN keys k ON k.assigned_to=u.id AND k.is_active=true AND (k.expires_at IS NULL OR k.expires_at>NOW()) WHERE u.role='user' ORDER BY u.created_at DESC;

CREATE OR REPLACE VIEW v_daily_executions AS
SELECT DATE(executed_at) AS exec_date, COUNT(*) AS total_execs, COUNT(DISTINCT user_id) AS unique_users
FROM execution_logs WHERE executed_at>=NOW()-INTERVAL '7 days' GROUP BY DATE(executed_at) ORDER BY exec_date DESC;

-- JIKA LOGIN DEVELOPER MASIH GAGAL:
-- UPDATE users SET password_hash='$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Wa9E.LAMiKHiUKmqKTLyK' WHERE username='icansayangara';

-- ============================================================
-- TABEL FEEDBACKS (dari Lua script → dikirim ke website)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type                VARCHAR(50) NOT NULL CHECK (type IN ('Saran','Report Bug','Feedback')),
  message             TEXT        NOT NULL,
  rating              INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  roblox_name_masked  VARCHAR(100),
  website_username    VARCHAR(100),
  hwid                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type       ON feedbacks(type);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "pub_feedbacks" ON feedbacks;
CREATE POLICY "svc_feedbacks" ON feedbacks FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Public bisa baca (untuk halaman feedback publik) dan insert (kirim dari Lua)
CREATE POLICY "pub_feedbacks" ON feedbacks FOR SELECT TO anon USING (true);
CREATE POLICY "ins_feedbacks" ON feedbacks FOR INSERT TO anon WITH CHECK (true);
