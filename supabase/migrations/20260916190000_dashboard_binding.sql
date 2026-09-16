-- This legacy operational module belongs to exactly one PAF organization.
create table public.paf_dashboard_binding (
  id integer primary key check (id = 1),
  organizacao_id uuid not null references public.paf_organizacoes(id)
);
do $$ begin
  if (select count(*) from public.paf_organizacoes) <> 1 then
    raise exception 'Configure the dashboard organization explicitly before migration.';
  end if;
end $$;
insert into public.paf_dashboard_binding select 1,id from public.paf_organizacoes;
alter table public.paf_dashboard_binding enable row level security;
revoke all on public.paf_dashboard_binding from public,anon,authenticated;
grant select on public.paf_dashboard_binding to service_role;
