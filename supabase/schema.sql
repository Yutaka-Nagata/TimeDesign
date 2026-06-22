-- TimeDesign schema
-- Run this in your Supabase project > SQL Editor

create table if not exists long_term_goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists mid_term_themes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  related_goal_id text,
  created_at timestamptz not null default now()
);

create table if not exists task_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  estimated_minutes integer not null default 30,
  memo text not null default '',
  related_theme_id text,
  template_type text not null default 'reusable',
  due_date text,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  entries jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  start_time text not null,
  title text not null,
  estimated_minutes integer not null default 30,
  memo text not null default '',
  related_theme_id text,
  is_done boolean not null default false,
  template_id text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table long_term_goals enable row level security;
alter table mid_term_themes enable row level security;
alter table task_templates enable row level security;
alter table templates enable row level security;
alter table tasks enable row level security;

create policy "users_own_goals"          on long_term_goals  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_themes"         on mid_term_themes  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_task_templates" on task_templates   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_templates"      on templates        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_tasks"          on tasks            for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
