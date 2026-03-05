-- ══════════════════════════════════════════════════════════════
-- AWR Block Blast Event System — SQL Schema
-- Jalankan di Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Tabel pengaturan event Block Blast
CREATE TABLE IF NOT EXISTS blockblast_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  event_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Insert default row jika belum ada
INSERT INTO blockblast_settings (id, event_active)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Tabel skor Block Blast
CREATE TABLE IF NOT EXISTS blockblast_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- satu user satu skor (upsert skor terbaik)
);

-- Index untuk query skor tercepat
CREATE INDEX IF NOT EXISTS idx_blockblast_scores_score ON blockblast_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_blockblast_scores_user ON blockblast_scores(user_id);

-- API endpoint untuk submit skor dari game (publik dengan token user)
-- Dibuat via /api/blockblast/score (POST)

-- ══════════════════════════════════════════════════════════════
-- JIKA announcements table belum ada (untuk broadcast)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
