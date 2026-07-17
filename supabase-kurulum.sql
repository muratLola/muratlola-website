-- muratLola — Supabase kurulumu
-- Supabase → SQL Editor → hepsini yapıştır → Run.
-- Tekrar çalıştırmak güvenlidir (if not exists / drop policy if exists).

-- ══════════ TABLOLAR ══════════
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  sort       int default 0,
  slug       text unique not null,
  title      text not null,
  category   text,
  year       text,
  number     text,
  award      text,
  summary    text,
  body       text,
  cover      text,
  images     text[] default '{}',
  featured   boolean default false
);

create table if not exists jerseys (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title      text not null,
  club       text,
  season     text,
  number     text,
  cover      text
);

-- ══════════ RLS ══════════
-- Herkes okur (site vitrini), yalnızca giriş yapmış kullanıcı yazar.
alter table projects enable row level security;
alter table jerseys  enable row level security;

drop policy if exists "projects_read"  on projects;
drop policy if exists "projects_write" on projects;
create policy "projects_read"  on projects for select using (true);
create policy "projects_write" on projects for all to authenticated
  using (true) with check (true);

drop policy if exists "jerseys_read"  on jerseys;
drop policy if exists "jerseys_write" on jerseys;
create policy "jerseys_read"  on jerseys for select using (true);
create policy "jerseys_write" on jerseys for all to authenticated
  using (true) with check (true);

-- ══════════ GÖRSEL DEPOSU ══════════
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_read"   on storage.objects;
drop policy if exists "media_insert" on storage.objects;
drop policy if exists "media_update" on storage.objects;
drop policy if exists "media_delete" on storage.objects;

create policy "media_read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media');
create policy "media_update" on storage.objects for update to authenticated
  using (bucket_id = 'media');
create policy "media_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media');

-- ══════════ KONTROL ══════════
select 'projects' as tablo, count(*) from projects
union all
select 'jerseys', count(*) from jerseys
union all
select 'media bucket', count(*) from storage.buckets where id = 'media';
