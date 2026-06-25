-- Add settings and preference columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS focus_duration INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS short_break_duration INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS long_break_duration INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS sounds_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
