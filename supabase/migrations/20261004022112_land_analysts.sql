create table public.paf_land_analysts (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id),
  name text not null check (length(btrim(name)) between 3 and 160),
  active boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index paf_land_analysts_name on public.paf_land_analysts (organizacao_id, lower(name));
alter table public.paf_land_analysts enable row level security;
revoke all on public.paf_land_analysts from public, anon, authenticated;
grant select, insert, update on public.paf_land_analysts to service_role;
