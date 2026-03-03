-- ================================================================
-- AWR KEY SYSTEM — JALANKAN INI, BUKAN YANG LAMA
-- Aman 100%, tidak akan error policy already exists
-- ================================================================

-- Kolom baru di tabel keys
ALTER TABLE keys ADD COLUMN IF NOT EXISTS is_free_key BOOLEAN DEFAULT false;

-- Kolom baru di tabel routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Tabel password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_pw_resets" ON password_resets;
CREATE POLICY "svc_pw_resets" ON password_resets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tabel getkey_settings
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
DROP POLICY IF EXISTS "svc_getkey" ON getkey_settings;
DROP POLICY IF EXISTS "pub_getkey" ON getkey_settings;
CREATE POLICY "svc_getkey" ON getkey_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pub_getkey" ON getkey_settings FOR SELECT TO anon USING (is_active = true);

-- Default steps (skip kalau sudah ada isinya)
INSERT INTO getkey_settings (name, url, duration_seconds, order_index)
SELECT * FROM (VALUES
  ('Buka Link Iklan', 'https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/', 30, 1),
  ('Join Saluran Telegram', 'https://t.me/sanzxmzz', 25, 2),
  ('Follow TikTok', 'https://tiktok.com/@sanzxmzz', 25, 3)
) AS v(name, url, duration_seconds, order_index)
WHERE NOT EXISTS (SELECT 1 FROM getkey_settings LIMIT 1);

-- Update fungsi
CREATE OR REPLACE FUNCTION increment_executions(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET total_executions = COALESCE(total_executions, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
