create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  section_id text not null check (section_id in (
    'apparatology',
    'makeup',
    'haircare',
    'newness',
    'haircolor'
  )),
  name text not null check (char_length(name) between 1 and 200),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('video/mp4', 'video/webm', 'video/ogg')),
  size_bytes bigint not null check (size_bytes between 1 and 52428800),
  created_at timestamptz not null default now()
);

create index if not exists videos_section_created_idx
  on public.videos (section_id, created_at);

alter table public.videos enable row level security;

grant select on public.videos to anon, authenticated;
grant insert, delete on public.videos to authenticated;

drop policy if exists "Anyone can read video metadata" on public.videos;
create policy "Anyone can read video metadata"
  on public.videos for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can add video metadata" on public.videos;
create policy "Admins can add video metadata"
  on public.videos for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'beauty_admin') = 'true');

drop policy if exists "Admins can delete video metadata" on public.videos;
create policy "Admins can delete video metadata"
  on public.videos for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'beauty_admin') = 'true');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'beauty-videos',
  'beauty-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/ogg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read Beauty Tech video objects" on storage.objects;
create policy "Admins can read Beauty Tech video objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'beauty-videos'
    and (auth.jwt() -> 'app_metadata' ->> 'beauty_admin') = 'true'
  );

drop policy if exists "Admins can upload Beauty Tech videos" on storage.objects;
create policy "Admins can upload Beauty Tech videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'beauty-videos'
    and (auth.jwt() -> 'app_metadata' ->> 'beauty_admin') = 'true'
  );

drop policy if exists "Admins can delete Beauty Tech videos" on storage.objects;
create policy "Admins can delete Beauty Tech videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'beauty-videos'
    and (auth.jwt() -> 'app_metadata' ->> 'beauty_admin') = 'true'
  );
