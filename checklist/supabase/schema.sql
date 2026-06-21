-- ===========================================================================
-- "הרשימות שלנו" — shared database setup.
-- Paste this whole file into Supabase ▸ SQL Editor ▸ New query, then press Run.
-- ===========================================================================

create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    bigint not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists (id) on delete cascade,
  text        text not null,
  is_done     boolean not null default false,   -- the temporary strikethrough
  position    bigint not null default 0,
  assignee    text,                              -- abba | ima | adam | naor | null
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists items_list_id_idx on public.items (list_id);

-- Realtime: broadcast row changes so every phone stays in sync.
alter table public.lists replica identity full;
alter table public.items replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'lists') then
    alter publication supabase_realtime add table public.lists;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'items') then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;

-- No accounts: the family shares one space. Enable row-level security and grant
-- the anonymous app role full access (the only model that fits "no login").
alter table public.lists enable row level security;
alter table public.items enable row level security;

drop policy if exists "anon all lists" on public.lists;
create policy "anon all lists" on public.lists for all to anon using (true) with check (true);

drop policy if exists "anon all items" on public.items;
create policy "anon all items" on public.items for all to anon using (true) with check (true);
