-- Add pauses column to timeline_blocks for tracking stops and resumptions
ALTER TABLE timeline_blocks ADD COLUMN IF NOT EXISTS pauses JSONB DEFAULT '[]';
