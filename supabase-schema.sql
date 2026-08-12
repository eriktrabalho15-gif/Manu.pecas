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

create table if not exists public.manupecas_email_settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.itens (
  id uuid primary key default gen_random_uuid(),
  codigo_sap text unique,
  descricao text not null,
  codigo_original text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  prefixo text,
  tipo_solicitacao text,
  prioridade text,
  motivo text,
  solicitante text,
  manutentor text,
  status_atual text,
  criado_em timestamptz default now()
);

create table if not exists public.solicitacao_itens (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid references public.solicitacoes(id) on delete cascade,
  codigo_sap text,
  descricao text not null,
  quantidade_solicitada numeric default 0,
  quantidade_almox numeric default 0,
  quantidade_cd numeric default 0,
  quantidade_compra numeric default 0,
  quantidade_retirada numeric default 0,
  status_item text,
  nf_transferencia text,
  entrada_sap text,
  criado_em timestamptz default now()
);

create table if not exists public.atendimentos_cd (
  id uuid primary key default gen_random_uuid(),
  solicitacao_numero text not null,
  item_chave text not null,
  codigo_sap text,
  descricao text,
  quantidade_enviada numeric default 0,
  quantidade_atendida numeric default 0,
  quantidade_compra numeric default 0,
  responsavel text,
  nf_transferencia text,
  inicio_em timestamptz,
  finalizado_em timestamptz,
  sla_minutos numeric,
  status text,
  criado_em timestamptz default now()
);

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  solicitacao_numero text not null,
  item_chave text not null,
  codigo_sap text,
  descricao text,
  quantidade_compra numeric default 0,
  solicitacao_sap text,
  pedido_compra text,
  previsao_entrega date,
  data_chegada date,
  observacao text,
  responsavel_sap text,
  responsavel_compras text,
  inicio_em timestamptz,
  pedido_registrado_em timestamptz,
  chegada_em timestamptz,
  finalizado_em timestamptz,
  sla_minutos numeric,
  status text,
  criado_em timestamptz default now()
);

create table if not exists public.recebimentos (
  id uuid primary key default gen_random_uuid(),
  solicitacao_numero text not null,
  item_chave text not null,
  codigo_sap text,
  descricao text,
  quantidade_cd numeric default 0,
  quantidade_compra numeric default 0,
  quantidade_recebida numeric default 0,
  entrada_sap text,
  nf_transferencia_cd text,
  nf_fornecedor text,
  responsavel text,
  inicio_em timestamptz,
  finalizado_em timestamptz,
  sla_minutos numeric,
  status text,
  criado_em timestamptz default now()
);

alter table public.itens add column if not exists codigo_original text;
alter table public.itens add column if not exists ativo boolean default true;
alter table public.itens add column if not exists criado_em timestamptz default now();

alter table public.solicitacoes add column if not exists prefixo text;
alter table public.solicitacoes add column if not exists tipo_solicitacao text;
alter table public.solicitacoes add column if not exists prioridade text;
alter table public.solicitacoes add column if not exists motivo text;
alter table public.solicitacoes add column if not exists solicitante text;
alter table public.solicitacoes add column if not exists manutentor text;
alter table public.solicitacoes add column if not exists status_atual text;
alter table public.solicitacoes add column if not exists criado_em timestamptz default now();

alter table public.solicitacao_itens add column if not exists solicitacao_id uuid references public.solicitacoes(id) on delete cascade;
alter table public.solicitacao_itens add column if not exists codigo_sap text;
alter table public.solicitacao_itens add column if not exists descricao text;
alter table public.solicitacao_itens add column if not exists quantidade_solicitada numeric default 0;
alter table public.solicitacao_itens add column if not exists quantidade_almox numeric default 0;
alter table public.solicitacao_itens add column if not exists quantidade_cd numeric default 0;
alter table public.solicitacao_itens add column if not exists quantidade_compra numeric default 0;
alter table public.solicitacao_itens add column if not exists quantidade_retirada numeric default 0;
alter table public.solicitacao_itens add column if not exists status_item text;
alter table public.solicitacao_itens add column if not exists nf_transferencia text;
alter table public.solicitacao_itens add column if not exists entrada_sap text;
alter table public.solicitacao_itens add column if not exists criado_em timestamptz default now();

alter table public.atendimentos_cd add column if not exists solicitacao_numero text;
alter table public.atendimentos_cd add column if not exists item_chave text;
alter table public.atendimentos_cd add column if not exists codigo_sap text;
alter table public.atendimentos_cd add column if not exists descricao text;
alter table public.atendimentos_cd add column if not exists quantidade_enviada numeric default 0;
alter table public.atendimentos_cd add column if not exists quantidade_atendida numeric default 0;
alter table public.atendimentos_cd add column if not exists quantidade_compra numeric default 0;
alter table public.atendimentos_cd add column if not exists responsavel text;
alter table public.atendimentos_cd add column if not exists nf_transferencia text;
alter table public.atendimentos_cd add column if not exists inicio_em timestamptz;
alter table public.atendimentos_cd add column if not exists finalizado_em timestamptz;
alter table public.atendimentos_cd add column if not exists sla_minutos numeric;
alter table public.atendimentos_cd add column if not exists status text;
alter table public.atendimentos_cd add column if not exists criado_em timestamptz default now();

alter table public.compras add column if not exists solicitacao_numero text;
alter table public.compras add column if not exists item_chave text;
alter table public.compras add column if not exists codigo_sap text;
alter table public.compras add column if not exists descricao text;
alter table public.compras add column if not exists quantidade_compra numeric default 0;
alter table public.compras add column if not exists solicitacao_sap text;
alter table public.compras add column if not exists pedido_compra text;
alter table public.compras add column if not exists previsao_entrega date;
alter table public.compras add column if not exists data_chegada date;
alter table public.compras add column if not exists observacao text;
alter table public.compras add column if not exists responsavel_sap text;
alter table public.compras add column if not exists responsavel_compras text;
alter table public.compras add column if not exists inicio_em timestamptz;
alter table public.compras add column if not exists pedido_registrado_em timestamptz;
alter table public.compras add column if not exists chegada_em timestamptz;
alter table public.compras add column if not exists finalizado_em timestamptz;
alter table public.compras add column if not exists sla_minutos numeric;
alter table public.compras add column if not exists status text;
alter table public.compras add column if not exists criado_em timestamptz default now();

alter table public.recebimentos add column if not exists solicitacao_numero text;
alter table public.recebimentos add column if not exists item_chave text;
alter table public.recebimentos add column if not exists codigo_sap text;
alter table public.recebimentos add column if not exists descricao text;
alter table public.recebimentos add column if not exists quantidade_cd numeric default 0;
alter table public.recebimentos add column if not exists quantidade_compra numeric default 0;
alter table public.recebimentos add column if not exists quantidade_recebida numeric default 0;
alter table public.recebimentos add column if not exists entrada_sap text;
alter table public.recebimentos add column if not exists nf_transferencia_cd text;
alter table public.recebimentos add column if not exists nf_fornecedor text;
alter table public.recebimentos add column if not exists responsavel text;
alter table public.recebimentos add column if not exists inicio_em timestamptz;
alter table public.recebimentos add column if not exists finalizado_em timestamptz;
alter table public.recebimentos add column if not exists sla_minutos numeric;
alter table public.recebimentos add column if not exists status text;
alter table public.recebimentos add column if not exists criado_em timestamptz default now();

create index if not exists idx_solicitacoes_numero on public.solicitacoes(numero);
create index if not exists idx_solicitacao_itens_solicitacao_id on public.solicitacao_itens(solicitacao_id);
create index if not exists idx_atendimentos_cd_solicitacao on public.atendimentos_cd(solicitacao_numero);
create index if not exists idx_compras_solicitacao on public.compras(solicitacao_numero);
create index if not exists idx_recebimentos_solicitacao on public.recebimentos(solicitacao_numero);

alter table public.manupecas_requests enable row level security;
alter table public.manupecas_users enable row level security;
alter table public.manupecas_deleted_users enable row level security;
alter table public.manupecas_custom_parts enable row level security;
alter table public.manupecas_part_registrations enable row level security;
alter table public.manupecas_email_settings enable row level security;
alter table public.itens enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.solicitacao_itens enable row level security;
alter table public.atendimentos_cd enable row level security;
alter table public.compras enable row level security;
alter table public.recebimentos enable row level security;

drop policy if exists "manupecas_requests_public_all" on public.manupecas_requests;
drop policy if exists "manupecas_users_public_all" on public.manupecas_users;
drop policy if exists "manupecas_deleted_users_public_all" on public.manupecas_deleted_users;
drop policy if exists "manupecas_custom_parts_public_all" on public.manupecas_custom_parts;
drop policy if exists "manupecas_part_registrations_public_all" on public.manupecas_part_registrations;
drop policy if exists "manupecas_email_settings_public_all" on public.manupecas_email_settings;
drop policy if exists "itens_public_all" on public.itens;
drop policy if exists "solicitacoes_public_all" on public.solicitacoes;
drop policy if exists "solicitacao_itens_public_all" on public.solicitacao_itens;
drop policy if exists "atendimentos_cd_public_all" on public.atendimentos_cd;
drop policy if exists "compras_public_all" on public.compras;
drop policy if exists "recebimentos_public_all" on public.recebimentos;

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

create policy "manupecas_email_settings_public_all"
on public.manupecas_email_settings
for all
to anon
using (true)
with check (true);

create policy "itens_public_all"
on public.itens
for all
to anon
using (true)
with check (true);

create policy "solicitacoes_public_all"
on public.solicitacoes
for all
to anon
using (true)
with check (true);

create policy "solicitacao_itens_public_all"
on public.solicitacao_itens
for all
to anon
using (true)
with check (true);

create policy "atendimentos_cd_public_all"
on public.atendimentos_cd
for all
to anon
using (true)
with check (true);

create policy "compras_public_all"
on public.compras
for all
to anon
using (true)
with check (true);

create policy "recebimentos_public_all"
on public.recebimentos
for all
to anon
using (true)
with check (true);
