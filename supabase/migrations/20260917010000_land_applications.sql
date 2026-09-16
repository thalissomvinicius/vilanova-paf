create table public.paf_land_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  fingerprint text not null,
  protocol text not null unique,
  full_name text not null check (char_length(full_name) between 5 and 160),
  cpf text not null check (cpf ~ '^\d{11}$'),
  birth_date date not null,
  municipality text not null,
  community text not null,
  phone text not null default '',
  status text not null default 'EM_ANALISE' check (status in ('EM_ANALISE','AREA_REPROVADA','POSSIVEL_FINANCIAMENTO')),
  comment text not null default 'Cadastro recebido. Aguarde a análise da equipe PAF.',
  version integer not null default 1,
  consent_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index paf_land_requests_status_created_idx on public.paf_land_requests(status, created_at desc);
create table public.paf_land_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.paf_land_requests(id),
  status text not null,
  comment text not null,
  actor text not null,
  created_at timestamptz not null default now()
);
create index paf_land_reviews_request_idx on public.paf_land_reviews(request_id, created_at desc);
create table public.paf_land_rate_limits (
  key text primary key,
  hits integer not null,
  expires_at timestamptz not null
);
alter table public.paf_land_requests enable row level security;
alter table public.paf_land_reviews enable row level security;
alter table public.paf_land_rate_limits enable row level security;
revoke all on public.paf_land_requests, public.paf_land_reviews, public.paf_land_rate_limits from anon, authenticated;
grant all on public.paf_land_requests, public.paf_land_reviews, public.paf_land_rate_limits to service_role;

create function public.paf_land_rate(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql set search_path = public as $$
declare current_hits integer;
begin
  delete from paf_land_rate_limits where expires_at < now();
  insert into paf_land_rate_limits(key, hits, expires_at)
    values(p_key, 1, now() + make_interval(secs => p_seconds))
    on conflict(key) do update set hits = paf_land_rate_limits.hits + 1
    returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;

create function public.paf_land_review(p_id uuid, p_version integer, p_status text, p_comment text, p_actor text)
returns jsonb language plpgsql set search_path = public as $$
declare result public.paf_land_requests;
begin
  if p_status not in ('EM_ANALISE','AREA_REPROVADA','POSSIVEL_FINANCIAMENTO')
    or length(trim(p_comment)) not between 10 and 2000 or length(trim(p_actor)) = 0 then
    raise exception 'Invalid review';
  end if;
  update paf_land_requests set status = p_status, comment = trim(p_comment), version = version + 1, updated_at = now()
    where id = p_id and version = p_version returning * into result;
  if not found then return null; end if;
  insert into paf_land_reviews(request_id, status, comment, actor) values(p_id, p_status, trim(p_comment), p_actor);
  return to_jsonb(result);
end;
$$;
revoke all on function public.paf_land_rate(text,integer,integer), public.paf_land_review(uuid,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.paf_land_rate(text,integer,integer), public.paf_land_review(uuid,integer,text,text,text) to service_role;
