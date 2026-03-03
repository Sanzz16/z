-- ================================================================
-- AWR KEY SYSTEM — TAMBAHAN SQL (jalankan ini aja, bukan yang lama)
-- Hanya tabel & kolom baru yang belum ada sebelumnya
-- ================================================================

-- Tambah kolom is_free_key ke tabel keys (kalau belum ada)
ALTER TABLE keys ADD COLUMN IF NOT EXISTS is_free_key BOOLEAN DEFAULT false;

-- Tambah kolom baru ke routes (kalau belum ada)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Tabel password reset codes (baru)
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'password_resets' AND policyname = 'svc_pw_resets'
  ) THEN
    CREATE POLICY "svc_pw_resets" ON password_resets FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Tabel getkey steps settings (baru)
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'getkey_settings' AND policyname = 'svc_getkey'
  ) THEN
    CREATE POLICY "svc_getkey" ON getkey_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'getkey_settings' AND policyname = 'pub_getkey'
  ) THEN
    CREATE POLICY "pub_getkey" ON getkey_settings FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;

-- Default getkey steps (skip kalau udah ada)
INSERT INTO getkey_settings (name, url, duration_seconds, order_index) 
SELECT * FROM (VALUES
  ('Buka Link Iklan', 'https://moneyblink.com/st/?api=b238837b14e9101a5fdb857decf8238aa217c3db&url=https://msanzxmzz.vercel.app/', 30, 1),
  ('Join Saluran Telegram', 'https://t.me/sanzxmzz', 25, 2),
  ('Follow TikTok', 'https://tiktok.com/@sanzxmzz', 25, 3)
) AS v(name, url, duration_seconds, order_index)
WHERE NOT EXISTS (SELECT 1 FROM getkey_settings LIMIT 1);

-- Fungsi increment_executions (update/create)
CREATE OR REPLACE FUNCTION increment_executions(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET total_executions = COALESCE(total_executions, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
