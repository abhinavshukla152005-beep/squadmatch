-- ============================================================================
-- SquadMatch — Supabase schema
-- Project: rfvjxirjnzhwwpghjetg
--
-- HOW TO RUN
--   Supabase dashboard → your project → SQL Editor → New query → paste all of
--   this file → Run. The whole file is idempotent: safe to re-run any number of
--   times, and it never touches auth.users directly.
--
-- WHAT IT CREATES
--   public.profiles     one row per student (skills, idea, needed skills, time slots)
--   public.squad_picks  the saved/edited shortlist, up to 3 per student
--   trigger handle_new_user  → a profiles row is created automatically for every
--                              NEW signup, and a one-time backfill below repairs
--                              accounts that signed up before this trigger existed.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text        not null default 'New builder',
  role         text        not null default '',
  year         text        not null default '',
  tagline      text        not null default '',
  idea         text        not null default '',
  pitch        text        not null default '',
  skills       text[]      not null default '{}',
  needs        text[]      not null default '{}',
  slots        text[]      not null default '{}',
  discoverable boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_skills_idx on public.profiles using gin (skills);
create index if not exists profiles_slots_idx  on public.profiles using gin (slots);

-- ---------------------------------------------------------------------------
-- 2. squad_picks (saved shortlist)
--    candidate_id is text because it can be a bundled sample profile
--    (e.g. 'sample-aria') or a real Supabase user uuid.
-- ---------------------------------------------------------------------------
create table if not exists public.squad_picks (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid        not null references public.profiles (id) on delete cascade,
  candidate_id text        not null,
  candidate    jsonb       not null default '{}'::jsonb,
  score        integer     not null default 0,
  reasons      text[]      not null default '{}',
  note         text        not null default '',
  position     integer     not null default 0,
  created_at   timestamptz not null default now(),
  unique (owner, candidate_id)
);

create index if not exists squad_picks_owner_idx on public.squad_picks (owner, position);

-- ---------------------------------------------------------------------------
-- 3. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    Directory is world-readable (that is the point of a teammate finder);
--    writes are strictly owner-only.
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.squad_picks enable row level security;

drop policy if exists "profiles: read directory"   on public.profiles;
drop policy if exists "profiles: insert own"       on public.profiles;
drop policy if exists "profiles: update own"       on public.profiles;
drop policy if exists "squad_picks: read own"      on public.squad_picks;
drop policy if exists "squad_picks: insert own"    on public.squad_picks;
drop policy if exists "squad_picks: update own"    on public.squad_picks;
drop policy if exists "squad_picks: delete own"    on public.squad_picks;

create policy "profiles: read directory"
  on public.profiles for select
  using (discoverable = true or id = auth.uid());

create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "squad_picks: read own"
  on public.squad_picks for select to authenticated
  using (owner = auth.uid());

create policy "squad_picks: insert own"
  on public.squad_picks for insert to authenticated
  with check (owner = auth.uid());

create policy "squad_picks: update own"
  on public.squad_picks for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy "squad_picks: delete own"
  on public.squad_picks for delete to authenticated
  using (owner = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Auto-create a profile row on every new signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New builder'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. One-time backfill: students who signed up before this trigger existed
--    would otherwise have no profiles row, which makes saving a shortlist fail
--    on the squad_picks.owner foreign key.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, name)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), nullif(split_part(u.email, '@', 1), ''), 'New builder')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Sanity check (optional — run the last line alone to verify)
-- ---------------------------------------------------------------------------
-- select (select count(*) from public.profiles)    as profiles,
--        (select count(*) from public.squad_picks) as picks;
