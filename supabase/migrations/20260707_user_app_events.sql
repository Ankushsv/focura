-- =============================================================
-- Focura — user_app_events table for The Ritual feature
-- Tracks app opens, session starts/completions, ritual events
-- =============================================================

CREATE TABLE IF NOT EXISTS user_app_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL,
  -- Supported event_types:
  -- 'app_opened' | 'session_started' | 'session_completed'
  -- 'task_viewed' | 'ritual_started' | 'ritual_completed'
  -- 'ritual_dismissed' | 'ritual_retry'
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own events"
  ON user_app_events FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast daily event lookups
CREATE INDEX IF NOT EXISTS idx_user_app_events_user_date
  ON user_app_events (user_id, created_at DESC);
