-- =============================================================
-- Focura Core Schema — 0001_core_schema.sql
-- Apply in: Supabase Dashboard > SQL Editor
-- =============================================================

-- Enable RLS on all user tables
-- Auth: Supabase built-in auth.users

-- ---- Profiles ----
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text,
  avatar_emoji text default '🐥',
  total_xp    int  not null default 0,
  level       int  not null default 1,
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users own their profile"
  on profiles for all using (auth.uid() = id);

-- ---- XP Events ----
create table if not exists xp_events (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users on delete cascade,
  source_module text not null,
  amount        int  not null,
  created_at    timestamptz default now()
);
alter table xp_events enable row level security;
create policy "Users see own XP events"
  on xp_events for all using (auth.uid() = user_id);

-- ---- Tasks ----
create table if not exists tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  title            text not null,
  priority         text not null check (priority in ('critical','high','medium')),
  energy           text not null check (energy in ('low','medium','high')),
  tag              text,
  xp               int  not null default 25,
  done             bool not null default false,
  is_boss          bool not null default false,
  memory_note      text,
  difficulty_before int,
  difficulty_after  int,
  completed_at     timestamptz,
  created_at       timestamptz default now()
);
alter table tasks enable row level security;
create policy "Users own their tasks"
  on tasks for all using (auth.uid() = user_id);

-- ---- Subtasks ----
create table if not exists subtasks (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  label      text not null,
  xp         int  not null default 10,
  done       bool not null default false,
  created_at timestamptz default now()
);
alter table subtasks enable row level security;
create policy "Users own subtasks via tasks"
  on subtasks for all using (auth.uid() = user_id);

-- ---- Focus Sessions ----
create table if not exists sessions (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users on delete cascade,
  task_id          uuid references tasks,
  task_title       text,
  planned_minutes  int  not null,
  actual_minutes   int  not null,
  ended_at         timestamptz default now()
);
alter table sessions enable row level security;
create policy "Users own sessions"
  on sessions for all using (auth.uid() = user_id);

-- ---- Mastery Paths ----
create table if not exists paths (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  goal       text,
  category   text not null,
  created_at timestamptz default now()
);
alter table paths enable row level security;
create policy "Users own paths"
  on paths for all using (auth.uid() = user_id);

create table if not exists path_nodes (
  id          uuid primary key default gen_random_uuid(),
  path_id     uuid not null references paths on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  label       text not null,
  description text,
  xp          int  not null default 30,
  status      text not null default 'locked' check (status in ('locked','available','done')),
  parent_id   uuid references path_nodes,
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);
alter table path_nodes enable row level security;
create policy "Users own path nodes"
  on path_nodes for all using (auth.uid() = user_id);

-- ---- Contracts ----
create table if not exists contracts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  title           text not null,
  description     text,
  frequency       text not null check (frequency in ('daily','weekdays','weekly')),
  shields_max     int  not null default 3,
  shields_used    int  not null default 0,
  xp_per_checkin  int  not null default 15,
  streak          int  not null default 0,
  best_streak     int  not null default 0,
  created_at      timestamptz default now()
);
alter table contracts enable row level security;
create policy "Users own contracts"
  on contracts for all using (auth.uid() = user_id);

create table if not exists contract_checkins (
  id          bigint generated always as identity primary key,
  contract_id uuid not null references contracts on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null,
  done        bool not null default true,
  created_at  timestamptz default now(),
  unique(contract_id, date)
);
alter table contract_checkins enable row level security;
create policy "Users own checkins"
  on contract_checkins for all using (auth.uid() = user_id);

-- ---- Challenges ----
create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  description text,
  category    text not null,
  icon        text,
  target      int  not null,
  progress    int  not null default 0,
  xp_reward   int  not null default 50,
  claimed     bool not null default false,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);
alter table challenges enable row level security;
create policy "Users own challenges"
  on challenges for all using (auth.uid() = user_id);

-- ---- Rewards ----
create table if not exists rewards (
  id          text primary key,  -- static catalog IDs (r1, r2 ...)
  name        text not null,
  description text,
  category    text not null,
  icon        text,
  cost        int  not null
);

create table if not exists user_rewards (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users on delete cascade,
  reward_id   text not null references rewards,
  equipped    bool not null default false,
  unlocked_at timestamptz default now(),
  unique(user_id, reward_id)
);
alter table user_rewards enable row level security;
create policy "Users own their rewards"
  on user_rewards for all using (auth.uid() = user_id);

-- ---- Memory Notes ----
create table if not exists memory_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  text       text not null,
  tag        text not null check (tag in ('idea','block','thought','tip')),
  task_id    uuid references tasks,
  created_at timestamptz default now()
);
alter table memory_notes enable row level security;
create policy "Users own memory notes"
  on memory_notes for all using (auth.uid() = user_id);

-- ---- Coach Messages ----
create table if not exists coach_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null check (role in ('user','coach')),
  text       text not null,
  created_at timestamptz default now()
);
alter table coach_messages enable row level security;
create policy "Users own coach messages"
  on coach_messages for all using (auth.uid() = user_id);

-- ---- Trigger: auto-create profile on signup ----
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
