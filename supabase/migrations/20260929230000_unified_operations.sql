-- Explicit identities preserve legacy portals while the app and dashboard share a dossier.
create function public.paf_dashboard_organization() returns uuid language sql stable security definer set search_path=public as $$
  select organizacao_id from public.paf_dashboard_binding where id=1;
$$;
revoke all on function public.paf_dashboard_organization() from public,anon,authenticated;
grant execute on function public.paf_dashboard_organization() to service_role;
create table public.paf_producer_links (
  legacy_id bigint primary key references public.paf_producers(id) on delete restrict,
  producer_id uuid not null unique references public.paf_produtores(id) on delete restrict,
  property_id uuid references public.paf_propriedades(id) on delete set null,
  organizacao_id uuid not null references public.paf_organizacoes(id),
  origin text not null check (origin in ('exact_name_cpf','dashboard','app','manual')),
  created_at timestamptz not null default now()
);
alter table public.paf_producer_links enable row level security;
revoke all on public.paf_producer_links from anon, authenticated;
grant all on public.paf_producer_links to service_role;

create table public.paf_operation_audit (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id),
  entity text not null, entity_id text not null, action text not null,
  actor text not null, before_data jsonb, after_data jsonb,
  created_at timestamptz not null default now()
);
create index paf_operation_audit_entity_idx on public.paf_operation_audit(organizacao_id,entity,entity_id,created_at desc);
alter table public.paf_operation_audit enable row level security;
revoke all on public.paf_operation_audit from anon, authenticated;
grant all on public.paf_operation_audit to service_role;

alter table public.paf_land_requests
  add column organizacao_id uuid references public.paf_organizacoes(id),
  add column producer_id uuid references public.paf_produtores(id) on delete restrict,
  add column property_id uuid references public.paf_propriedades(id) on delete set null,
  add column assigned_to uuid references public.paf_perfis(id) on delete set null,
  add column due_date date,
  add column next_action text not null default '',
  add column internal_note text not null default '',
  add column checklist jsonb not null default '{}',
  add column archived_at timestamptz;
update public.paf_land_requests set organizacao_id = (select organizacao_id from public.paf_dashboard_binding where id=1);
alter table public.paf_land_requests alter column organizacao_id set not null;
alter table public.paf_land_requests alter column organizacao_id set default public.paf_dashboard_organization();
create index paf_land_workqueue_idx on public.paf_land_requests(organizacao_id,assigned_to,due_date) where archived_at is null;
alter table public.paf_tarefas add column if not exists produtor_id uuid references public.paf_produtores(id) on delete set null;
alter table public.paf_tarefas add column if not exists propriedade_id uuid references public.paf_propriedades(id) on delete set null;
alter table public.paf_agenda add column if not exists propriedade_id uuid references public.paf_propriedades(id) on delete set null;
alter table public.paf_assistencias add column if not exists land_request_id uuid references public.paf_land_requests(id) on delete set null;
create index paf_assistencias_land_request_idx on public.paf_assistencias(land_request_id) where land_request_id is not null;

-- Matches require both name and document; conflicting documents remain unlinked.
insert into public.paf_producer_links(legacy_id,producer_id,property_id,organizacao_id,origin)
select l.id,n.id,(select id from public.paf_propriedades where produtor_id=n.id and deleted_at is null order by created_at,id limit 1),n.organizacao_id,'exact_name_cpf'
from public.paf_producers l join public.paf_produtores n
  on regexp_replace(coalesce(n.cpf,''),'[^0-9]','','g')=l.cpf_digits
  and lower(trim(n.nome))=lower(trim(l.name))
where n.deleted_at is null and n.organizacao_id=public.paf_dashboard_organization()
  and (select count(*) from public.paf_produtores p where p.organizacao_id=n.organizacao_id and p.deleted_at is null and regexp_replace(coalesce(p.cpf,''),'[^0-9]','','g')=l.cpf_digits)=1;

do $$
declare l public.paf_producers; p_id uuid; pr_id uuid; org uuid := public.paf_dashboard_organization();
begin
  for l in select * from public.paf_producers order by id loop
    if exists(select 1 from public.paf_producer_links where legacy_id=l.id) then continue; end if;
    if exists(select 1 from public.paf_produtores where organizacao_id=org and deleted_at is null and regexp_replace(coalesce(cpf,''),'[^0-9]','','g')=l.cpf_digits) then continue; end if;
    insert into public.paf_produtores(organizacao_id,codigo_externo,nome,cpf,telefone,endereco,area_total_ha,origem,fonte_cadastral)
      values(org,'dashboard:'||l.id,l.name,l.cpf_digits,l.phone,l.address,l.area_ha,'integracao','dashboard') returning id into p_id;
    insert into public.paf_propriedades(organizacao_id,produtor_id,codigo_externo,nome,area_hectares,cultura_principal,comunidade_fonte,origem)
      values(org,p_id,'dashboard-property:'||l.id,coalesce(nullif(l.property_name,''),'Propriedade principal'),l.area_ha,'Dendê',l.community,'integracao') returning id into pr_id;
    insert into public.paf_producer_links values(l.id,p_id,pr_id,org,'dashboard',now());
  end loop;
end $$;

create function public.paf_sync_legacy_producer() returns trigger language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links; p_id uuid; pr_id uuid; org uuid := public.paf_dashboard_organization();
begin
  if pg_trigger_depth()>1 then return new; end if;
  select * into link from public.paf_producer_links where legacy_id=new.id;
  if found then
    update public.paf_produtores set nome=new.name,cpf=new.cpf_digits,telefone=new.phone,endereco=new.address where id=link.producer_id;
    if link.property_id is not null then
      update public.paf_propriedades set nome=coalesce(nullif(new.property_name,''),'Propriedade principal'),area_hectares=new.area_ha,comunidade_fonte=new.community where id=link.property_id;
    end if;
  elsif not exists(select 1 from public.paf_produtores where organizacao_id=org and deleted_at is null and regexp_replace(coalesce(cpf,''),'[^0-9]','','g')=new.cpf_digits) then
    insert into public.paf_produtores(organizacao_id,codigo_externo,nome,cpf,telefone,endereco,area_total_ha,origem)
      values(org,'dashboard:'||new.id,new.name,new.cpf_digits,new.phone,new.address,new.area_ha,'integracao') returning id into p_id;
    insert into public.paf_propriedades(organizacao_id,produtor_id,codigo_externo,nome,area_hectares,cultura_principal,comunidade_fonte,origem)
      values(org,p_id,'dashboard-property:'||new.id,coalesce(nullif(new.property_name,''),'Propriedade principal'),new.area_ha,'Dendê',new.community,'integracao') returning id into pr_id;
    insert into public.paf_producer_links values(new.id,p_id,pr_id,org,'dashboard',now());
  end if;
  return new;
end $$;
revoke all on function public.paf_sync_legacy_producer() from public,anon,authenticated;
create trigger paf_legacy_producer_bridge after insert or update of name,cpf_digits,phone,address,property_name,community,area_ha on public.paf_producers for each row execute function public.paf_sync_legacy_producer();

create function public.paf_sync_app_producer() returns trigger language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links; l_id bigint;
begin
  if pg_trigger_depth()>1 or new.organizacao_id<>public.paf_dashboard_organization() or new.deleted_at is not null then return new; end if;
  select * into link from public.paf_producer_links where producer_id=new.id;
  if found then
    update public.paf_producers set name=new.nome,cpf=coalesce(new.cpf,''),cpf_digits=regexp_replace(coalesce(new.cpf,''),'[^0-9]','','g'),phone=new.telefone,address=new.endereco where id=link.legacy_id;
  elsif length(regexp_replace(coalesce(new.cpf,''),'[^0-9]','','g'))=11 and not exists(select 1 from public.paf_producers where cpf_digits=regexp_replace(new.cpf,'[^0-9]','','g')) then
    insert into public.paf_producers(token,name,cpf,cpf_digits,phone,address,property_name,area_ha,process_status)
      values(replace(gen_random_uuid()::text,'-',''),new.nome,new.cpf,regexp_replace(new.cpf,'[^0-9]','','g'),coalesce(new.telefone,''),coalesce(new.endereco,''),'Propriedade a cadastrar',coalesce(new.area_total_ha,0),'INTERNALIZAR') returning id into l_id;
    insert into public.paf_producer_links values(l_id,new.id,null,new.organizacao_id,'app',now());
  end if;
  return new;
end $$;
revoke all on function public.paf_sync_app_producer() from public,anon,authenticated;
create trigger paf_app_producer_bridge after insert or update of nome,cpf,telefone,endereco on public.paf_produtores for each row execute function public.paf_sync_app_producer();

do $$
declare n public.paf_produtores; pr public.paf_propriedades; l_id bigint;
begin
  for n in select * from paf_produtores where organizacao_id=public.paf_dashboard_organization() and deleted_at is null order by id loop
    if exists(select 1 from paf_producer_links where producer_id=n.id) then continue; end if;
    if length(regexp_replace(coalesce(n.cpf,''),'[^0-9]','','g'))<>11 or exists(select 1 from paf_producers where cpf_digits=regexp_replace(n.cpf,'[^0-9]','','g')) then continue; end if;
    select * into pr from paf_propriedades where produtor_id=n.id and deleted_at is null order by created_at,id limit 1;
    insert into paf_producers(token,name,cpf,cpf_digits,phone,address,property_name,area_ha,process_status)
      values(replace(gen_random_uuid()::text,'-',''),n.nome,n.cpf,regexp_replace(n.cpf,'[^0-9]','','g'),coalesce(n.telefone,''),coalesce(n.endereco,''),coalesce(pr.nome,'Propriedade a cadastrar'),coalesce(pr.area_hectares,n.area_total_ha,0),'INTERNALIZAR') returning id into l_id;
    -- The insert trigger may create a link only if it created a new app producer.
    insert into paf_producer_links values(l_id,n.id,pr.id,n.organizacao_id,'app',now());
  end loop;
end $$;

create function public.paf_sync_app_property() returns trigger language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links;
begin
  if pg_trigger_depth()>1 or new.deleted_at is not null then return new; end if;
  update paf_producer_links set property_id=new.id where producer_id=new.produtor_id and property_id is null;
  select * into link from paf_producer_links where producer_id=new.produtor_id and property_id=new.id;
  if found then update paf_producers set property_name=new.nome,area_ha=coalesce(new.area_hectares,0),community=new.comunidade_fonte where id=link.legacy_id; end if;
  return new;
end $$;
revoke all on function public.paf_sync_app_property() from public,anon,authenticated;
create trigger paf_app_property_bridge after insert or update of nome,area_hectares,comunidade_fonte on public.paf_propriedades for each row execute function public.paf_sync_app_property();

create function public.paf_link_producer(p_legacy bigint,p_producer uuid,p_actor text) returns jsonb language plpgsql set search_path=public as $$
declare n public.paf_produtores; l public.paf_producers; pr_id uuid;
begin
  select * into n from paf_produtores where id=p_producer and organizacao_id=public.paf_dashboard_organization() and deleted_at is null for update;
  select * into l from paf_producers where id=p_legacy for update;
  if n.id is null or l.id is null then raise exception 'Cadastro não encontrado.'; end if;
  if regexp_replace(coalesce(n.cpf,''),'[^0-9]','','g')<>l.cpf_digits then raise exception 'Os documentos não correspondem.'; end if;
  select id into pr_id from paf_propriedades where produtor_id=n.id and deleted_at is null order by created_at,id limit 1;
  insert into paf_producer_links values(l.id,n.id,pr_id,n.organizacao_id,'manual',now());
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,before_data,after_data)
    values(n.organizacao_id,'producer_link',n.id::text,'LINK',p_actor,to_jsonb(l),jsonb_build_object('producer_id',n.id,'legacy_id',l.id));
  return jsonb_build_object('producer_id',n.id,'legacy_id',l.id);
end $$;
revoke all on function public.paf_link_producer(bigint,uuid,text) from public,anon,authenticated;
grant execute on function public.paf_link_producer(bigint,uuid,text) to service_role;

create function public.paf_land_workflow(p_id uuid,p_version integer,p_patch jsonb,p_actor text) returns jsonb language plpgsql set search_path=public as $$
declare old public.paf_land_requests; result public.paf_land_requests; assignee uuid; producer uuid; property uuid;
begin
  select * into old from paf_land_requests where id=p_id and organizacao_id=public.paf_dashboard_organization() and version=p_version for update;
  if not found then return null; end if;
  assignee := nullif(p_patch->>'assigned_to','')::uuid;
  producer := nullif(p_patch->>'producer_id','')::uuid;
  property := nullif(p_patch->>'property_id','')::uuid;
  if assignee is not null and not exists(select 1 from paf_perfis where id=assignee and organizacao_id=old.organizacao_id and ativo and papel in ('admin','super_admin','coordenador','tecnico','agente')) then raise exception 'Responsável não autorizado.'; end if;
  if producer is not null and not exists(select 1 from paf_produtores where id=producer and organizacao_id=old.organizacao_id and deleted_at is null and regexp_replace(coalesce(cpf,''),'[^0-9]','','g')=old.cpf) then raise exception 'Confira o CPF e a organização do produtor.'; end if;
  if property is not null and not exists(select 1 from paf_propriedades where id=property and produtor_id=producer and organizacao_id=old.organizacao_id and deleted_at is null) then raise exception 'A propriedade não pertence ao produtor.'; end if;
  update paf_land_requests set assigned_to=assignee,producer_id=producer,property_id=property,due_date=nullif(p_patch->>'due_date','')::date,
    next_action=coalesce(p_patch->>'next_action',''),internal_note=coalesce(p_patch->>'internal_note',''),checklist=coalesce(p_patch->'checklist','{}'),version=version+1,updated_at=now()
    where id=p_id returning * into result;
  if assignee is not null and producer is not null and exists(select 1 from paf_perfis where id=assignee and papel in ('coordenador','tecnico','agente')) then
    insert into paf_produtor_tecnicos(organizacao_id,produtor_id,tecnico_id,principal) values(old.organizacao_id,producer,assignee,false) on conflict(produtor_id,tecnico_id) do nothing;
  end if;
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,before_data,after_data) values(old.organizacao_id,'land',p_id::text,'WORKFLOW',p_actor,to_jsonb(old),to_jsonb(result));
  return to_jsonb(result);
end $$;
revoke all on function public.paf_land_workflow(uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.paf_land_workflow(uuid,integer,jsonb,text) to service_role;

create function public.paf_land_correct(p_id uuid,p_version integer,p_patch jsonb,p_actor text) returns jsonb language plpgsql set search_path=public as $$
declare old public.paf_land_requests; result public.paf_land_requests;
begin
  select * into old from paf_land_requests where id=p_id and organizacao_id=public.paf_dashboard_organization() and version=p_version for update;
  if not found then return null; end if;
  if old.producer_id is not null and old.cpf<>p_patch->>'cpf' then raise exception 'Desvincule o acompanhamento antes de alterar o CPF.'; end if;
  update paf_land_requests set full_name=p_patch->>'full_name',cpf=p_patch->>'cpf',phone=p_patch->>'phone',birth_date=(p_patch->>'birth_date')::date,
    municipality=p_patch->>'municipality',community=p_patch->>'community',is_federal_settlement=(p_patch->>'is_federal_settlement')::boolean,
    mother_name=nullif(p_patch->>'mother_name',''),settlement_name=nullif(p_patch->>'settlement_name',''),version=version+1,updated_at=now()
    where id=p_id returning * into result;
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,before_data,after_data) values(old.organizacao_id,'land',p_id::text,'CORRECT',p_actor,to_jsonb(old),to_jsonb(result));
  return to_jsonb(result);
end $$;
revoke all on function public.paf_land_correct(uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.paf_land_correct(uuid,integer,jsonb,text) to service_role;

create or replace function public.paf_land_delete(p_id uuid,p_version integer,p_protocol text) returns boolean language plpgsql set search_path=public as $$
declare old public.paf_land_requests;
begin
  select * into old from paf_land_requests where id=p_id and version=p_version and protocol=p_protocol for update;
  if not found then return false; end if;
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,after_data) values(old.organizacao_id,'land',p_id::text,'DELETE','dashboard',jsonb_build_object('protocol',old.protocol,'version',old.version));
  delete from paf_land_reviews where request_id=p_id;
  delete from paf_land_requests where id=p_id;
  return true;
end $$;

create function public.paf_land_archive(p_id uuid,p_version integer,p_actor text) returns jsonb language plpgsql set search_path=public as $$
declare result public.paf_land_requests;
begin
  update paf_land_requests set archived_at=now(),version=version+1,updated_at=now() where id=p_id and version=p_version and organizacao_id=public.paf_dashboard_organization() returning * into result;
  if not found then return null; end if;
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,after_data) values(result.organizacao_id,'land',p_id::text,'ARCHIVE',p_actor,jsonb_build_object('protocol',result.protocol));
  return to_jsonb(result);
end $$;
revoke all on function public.paf_land_archive(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.paf_land_archive(uuid,integer,text) to service_role;
