create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  created_at timestamptz not null default now()
);

insert into public.users (id, email, name)
values ('00000000-0000-0000-0000-000000000001', 'demo@mapaleads.local', 'Usuário demo')
on conflict (id) do nothing;

create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  ibge_id integer not null unique,
  uf text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  ibge_code text not null unique,
  state_uf text not null references public.states(uf) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cities_state_name_idx on public.cities (state_uf, name);

create table if not exists public.city_coordinates (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  city text not null,
  ibge_code text,
  latitude double precision not null,
  longitude double precision not null,
  source text not null default 'nominatim',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state, city)
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'osm' check (source in ('osm', 'foursquare', 'google')),
  osm_id text not null,
  osm_type text not null check (osm_type in ('node', 'way', 'relation')),
  name text not null,
  address text,
  phone text,
  email text,
  website text,
  category text,
  latitude double precision not null,
  longitude double precision not null,
  osm_url text not null,
  city text not null,
  state text not null,
  niche text not null,
  has_website boolean not null default false,
  raw_tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (osm_type, osm_id)
);

create index if not exists businesses_search_idx
on public.businesses (source, state, city, niche, has_website);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  provider text not null default 'osm' check (provider in ('osm', 'foursquare', 'google')),
  search_type text not null default 'city' check (search_type in ('city', 'map')),
  state text,
  city text,
  niche text not null,
  radius_km integer not null,
  center_lat double precision,
  center_lng double precision,
  searched_at timestamptz not null default now(),
  total_results integer not null default 0,
  total_without_website integer not null default 0
);

create index if not exists searches_cache_idx
on public.searches (provider, search_type, state, city, niche, radius_km, searched_at desc);

create index if not exists searches_map_cache_idx
on public.searches (provider, search_type, niche, radius_km, center_lat, center_lng, searched_at desc);

alter table public.businesses
add column if not exists source text not null default 'osm';

alter table public.searches
add column if not exists provider text not null default 'osm';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status_value') then
    create type public.lead_status_value as enum (
      'novo',
      'prospectado',
      'interessado',
      'vendido',
      'recusado'
    );
  end if;
end $$;

create table if not exists public.lead_status (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.lead_status_value not null default 'novo',
  notes text,
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.generated_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  business_osm_id text not null,
  business_osm_type text not null,
  site_name text,
  business_name text not null,
  niche text not null,
  city text,
  template_type text not null default 'profissional' check (template_type in ('profissional', 'oferta', 'premium')),
  visual_style text not null default 'claro' check (visual_style in ('claro', 'escuro', 'minimalista', 'gradiente', 'cartao')),
  button_style text not null default 'primary' check (button_style in ('whatsapp', 'primary', 'secondary', 'premium')),
  slug text not null unique,
  public_token text,
  seo_title text,
  meta_description text,
  title text not null,
  subtitle text not null,
  description text not null,
  services jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  cta_text text not null default 'Solicite um orçamento',
  cta_final text not null default 'Fale agora pelo WhatsApp.',
  whatsapp_message text not null,
  public_url text not null,
  status text not null default 'publicado' check (status in ('rascunho', 'enviado', 'visualizado', 'aceito', 'aguardando_pagamento', 'em_personalizacao', 'publicado_definitivo', 'publicado', 'vendido', 'recusado', 'expirado')),
  expires_at timestamptz,
  is_public boolean not null default true,
  phone text,
  address text,
  latitude double precision,
  longitude double precision,
  osm_url text not null,
  primary_color text not null default '#173b34',
  accent_color text not null default '#f4b860',
  show_map boolean not null default true,
  show_about boolean not null default true,
  show_benefits boolean not null default true,
  content_json jsonb not null default '{}'::jsonb,
  design_json jsonb not null default '{}'::jsonb,
  sections_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generated_sites_business_idx
on public.generated_sites (business_id, business_osm_type, business_osm_id, created_at desc);

create index if not exists generated_sites_slug_idx
on public.generated_sites (slug);

alter table public.generated_sites
add column if not exists site_name text;

alter table public.generated_sites
add column if not exists public_token text;

alter table public.generated_sites
add column if not exists expires_at timestamptz;

alter table public.generated_sites
add column if not exists is_public boolean not null default true;

alter table public.generated_sites
add column if not exists content_json jsonb not null default '{}'::jsonb;

alter table public.generated_sites
add column if not exists design_json jsonb not null default '{}'::jsonb;

alter table public.generated_sites
add column if not exists sections_json jsonb not null default '{}'::jsonb;

alter table public.generated_sites
add column if not exists published_at timestamptz;

alter table public.generated_sites
add column if not exists sent_at timestamptz;

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  usage_date date not null default current_date,
  daily_limit integer not null default 30,
  searches_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date),
  check (daily_limit >= 0),
  check (searches_used >= 0)
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status_value') then
    create type public.subscription_status_value as enum (
      'active',
      'pending',
      'expired',
      'canceled',
      'refunded'
    );
  end if;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  name text,
  plan_id text not null check (plan_id in ('monthly', 'quarterly', 'semiannual', 'annual')),
  status public.subscription_status_value not null default 'pending',
  starts_at timestamptz,
  expires_at timestamptz,
  payment_id text unique,
  checkout_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_email_status_idx
on public.subscriptions (email, status, expires_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  plan_id text not null check (plan_id in ('monthly', 'quarterly', 'semiannual', 'annual')),
  payment_id text not null unique,
  checkout_customer_id text,
  status text not null,
  amount_cents integer not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_email_idx
on public.payments (email, created_at desc);

alter table public.users enable row level security;
alter table public.states enable row level security;
alter table public.cities enable row level security;
alter table public.city_coordinates enable row level security;
alter table public.businesses enable row level security;
alter table public.searches enable row level security;
alter table public.lead_status enable row level security;
alter table public.generated_sites enable row level security;
alter table public.usage_limits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

create policy "service role full access users" on public.users
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access states" on public.states
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access cities" on public.cities
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access city_coordinates" on public.city_coordinates
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access businesses" on public.businesses
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access searches" on public.searches
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access lead_status" on public.lead_status
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access generated_sites" on public.generated_sites
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access usage_limits" on public.usage_limits
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access subscriptions" on public.subscriptions
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access payments" on public.payments
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
