-- ===========================================================================
-- Shared Checklists — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard ▸ SQL ▸ New query).
-- ===========================================================================

-- ---- Tables ---------------------------------------------------------------

create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  share_code  text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists (id) on delete cascade,
  text        text not null,
  is_done     boolean not null default false,   -- the temporary strikethrough
  position    bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists items_list_id_idx on public.items (list_id);

-- Keep updated_at fresh so "last write wins" has a tie-breaker timestamp.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ---- Realtime -------------------------------------------------------------
-- Broadcast row changes so every device with the list open stays in sync.

alter table public.lists  replica identity full;
alter table public.items  replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'lists'
  ) then
    alter publication supabase_realtime add table public.lists;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;

-- ---- Row Level Security ---------------------------------------------------
-- No accounts: access is by share code/link. We enable RLS and grant the
-- anonymous (anon) role full access. This means anyone holding the project's
-- anon key can reach the shared family space — acceptable for personal/family
-- use, and the only model that satisfies "no login" + live create/delete sync.

alter table public.lists enable row level security;
alter table public.items enable row level security;

drop policy if exists "anon full access lists" on public.lists;
create policy "anon full access lists" on public.lists
  for all to anon using (true) with check (true);

drop policy if exists "anon full access items" on public.items;
create policy "anon full access items" on public.items
  for all to anon using (true) with check (true);
