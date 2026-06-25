-- ============================================================
-- FOCURA — Day Timeline Migration
-- Run this in your Supabase SQL Editor (or CLI)
-- ============================================================

-- 1. Add wake_hour / sleep_hour to profiles (full day range)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wake_hour INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS sleep_hour INTEGER DEFAULT 23,
  ADD COLUMN IF NOT EXISTS timeline_setup_done BOOLEAN DEFAULT false;

-- 2. timeline_blocks table
CREATE TABLE IF NOT EXISTS timeline_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('focus', 'life')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  life_category TEXT,
  life_label TEXT,
  life_emoji TEXT,
  start_time TIME NOT NULL,
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed', 'overran', 'skipped')),
  position_order INTEGER DEFAULT 0,
  layer TEXT NOT NULL DEFAULT 'plan' CHECK (layer IN ('plan', 'actual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast daily queries
CREATE INDEX IF NOT EXISTS idx_timeline_blocks_user_date
  ON timeline_blocks (user_id, date);

-- 3. day_templates table
CREATE TABLE IF NOT EXISTS day_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Row Level Security
ALTER TABLE timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_templates ENABLE ROW LEVEL SECURITY;

-- RLS: timeline_blocks
CREATE POLICY "Users can manage their own timeline blocks"
  ON timeline_blocks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: day_templates
CREATE POLICY "Users can manage their own day templates"
  ON day_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timeline_blocks_updated_at
  BEFORE UPDATE ON timeline_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
