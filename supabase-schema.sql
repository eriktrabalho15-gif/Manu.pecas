create table if not exists public.manupecas_requests (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.manupecas_users (
  email text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.manupecas_deleted_users (
  email text primary key,
  updated_at timestamptz not null default now()
);

create table if not exists public.manupecas_custom_parts (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.manupecas_part_registrations (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.manupecas_requests enable row level security;
alter table public.manupecas_users enable row level security;
alter table public.manupecas_deleted_users enable row level security;
alter table public.manupecas_custom_parts enable row level security;
alter table public.manupecas_part_registrations enable row level security;

drop policy if exists "manupecas_requests_public_all" on public.manupecas_requests;
drop policy if exists "manupecas_users_public_all" on public.manupecas_users;
drop policy if exists "manupecas_deleted_users_public_all" on public.manupecas_deleted_users;
drop policy if exists "manupecas_custom_parts_public_all" on public.manupecas_custom_parts;
drop policy if exists "manupecas_part_registrations_public_all" on public.manupecas_part_registrations;

create policy "manupecas_requests_public_all"
on public.manupecas_requests
for all
to anon
using (true)
with check (true);

create policy "manupecas_users_public_all"
on public.manupecas_users
for all
to anon
using (true)
with check (true);

create policy "manupecas_deleted_users_public_all"
on public.manupecas_deleted_users
for all
to anon
using (true)
with check (true);

create policy "manupecas_custom_parts_public_all"
on public.manupecas_custom_parts
for all
to anon
using (true)
with check (true);

create policy "manupecas_part_registrations_public_all"
on public.manupecas_part_registrations
for all
to anon
using (true)
with check (true);
