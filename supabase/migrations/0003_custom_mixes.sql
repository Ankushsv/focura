-- Migration 0003_custom_mixes.sql
create table if not exists public.custom_mixes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  icon        text not null default '🎵',
  volumes     jsonb not null,
  created_at  timestamptz default now()
);

-- Enable RLS
alter table public.custom_mixes enable row level security;

-- Policies
create policy "Users own custom mixes"
  on public.custom_mixes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
