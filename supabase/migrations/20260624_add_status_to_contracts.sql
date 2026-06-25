-- Add status column to contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'broken', 'completed'));
