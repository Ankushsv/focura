-- Focura Task Manager schema (Module 5)

create table if not exists public.task_chains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  path_node_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium')),
  tag text,
  xp int not null default 25,
  done boolean not null default false,
  is_boss boolean not null default false,
  energy_level text not null default 'medium' check (energy_level in ('low', 'medium', 'high')),
  difficulty_before int check (difficulty_before between 1 and 10),
  difficulty_after int check (difficulty_after between 1 and 10),
  memory_note text,
  chain_id uuid references public.task_chains (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  text text not null,
  xp int not null default 10,
  done boolean not null default false,
  "order" int not null default 0
);

create table if not exists public.ai_breakdowns (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  prompt text not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.task_chains enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.ai_breakdowns enable row level security;

create policy "own chains" on public.task_chains
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own subtasks" on public.subtasks
  for all using (
    exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid())
  );

create policy "own breakdowns" on public.ai_breakdowns
  for all using (
    exists (select 1 from public.tasks t where t.id = ai_breakdowns.task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.tasks t where t.id = ai_breakdowns.task_id and t.user_id = auth.uid())
  );
