-- Replacing the directory archives old identities; operational history stays linked.
alter table public.paf_producers add column if not exists archived_at timestamptz;
drop index if exists public.paf_producers_cpf_digits_unique;
create unique index paf_producers_cpf_digits_unique on public.paf_producers(cpf_digits)
  where cpf_digits <> '' and archived_at is null;
create index paf_producers_active_name_idx on public.paf_producers(lower(name),id) where archived_at is null;

create table private.paf_directory_imports (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  file_name text not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  unique(organizacao_id,checksum)
);
create table private.paf_directory_backups (
  import_id uuid not null references private.paf_directory_imports(id),
  table_name text not null,
  records jsonb not null,
  primary key(import_id,table_name)
);
alter table private.paf_directory_imports enable row level security;
alter table private.paf_directory_backups enable row level security;
revoke all on private.paf_directory_imports, private.paf_directory_backups from public,anon,authenticated;

create or replace function public.paf_sync_app_producer() returns trigger
language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links; l_id bigint;
begin
  if pg_trigger_depth()>1 or new.organizacao_id<>public.paf_dashboard_organization() or new.deleted_at is not null then return new; end if;
  select * into link from public.paf_producer_links where producer_id=new.id;
  if found then
    update public.paf_producers set name=new.nome,cpf=coalesce(new.cpf,''),cpf_digits=regexp_replace(coalesce(new.cpf,''),'[^0-9]','','g'),
      phone=new.telefone,address=new.endereco,designer=new.tecnico_responsavel
      where id=link.legacy_id and archived_at is null;
  else
    insert into public.paf_producers(token,name,cpf,cpf_digits,phone,address,property_name,area_ha,process_status,designer)
      values(replace(gen_random_uuid()::text,'-',''),new.nome,coalesce(new.cpf,''),regexp_replace(coalesce(new.cpf,''),'[^0-9]','','g'),
        coalesce(new.telefone,''),coalesce(new.endereco,''),'Propriedade a cadastrar',coalesce(new.area_total_ha,0),'INTERNALIZAR',new.tecnico_responsavel)
      returning id into l_id;
    insert into public.paf_producer_links values(l_id,new.id,null,new.organizacao_id,'app',now());
  end if;
  return new;
end $$;
revoke all on function public.paf_sync_app_producer() from public,anon,authenticated;
drop trigger paf_app_producer_bridge on public.paf_produtores;
create trigger paf_app_producer_bridge after insert or update of nome,cpf,telefone,endereco,tecnico_responsavel
  on public.paf_produtores for each row execute function public.paf_sync_app_producer();

create or replace function public.paf_sync_legacy_producer() returns trigger
language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links; p_id uuid; pr_id uuid; org uuid := public.paf_dashboard_organization();
begin
  if pg_trigger_depth()>1 or new.archived_at is not null then return new; end if;
  select * into link from public.paf_producer_links where legacy_id=new.id;
  if found then
    update public.paf_produtores set nome=new.name,cpf=nullif(new.cpf_digits,''),telefone=new.phone,endereco=new.address
      where id=link.producer_id and deleted_at is null;
    if link.property_id is not null then
      update public.paf_propriedades set nome=coalesce(nullif(new.property_name,''),'Propriedade principal'),comunidade_fonte=new.community
        where id=link.property_id and deleted_at is null;
      if (select count(*) from public.paf_propriedades where produtor_id=link.producer_id and deleted_at is null)=1 then
        update public.paf_propriedades set area_hectares=new.area_ha where id=link.property_id and deleted_at is null;
      end if;
    end if;
  else
    insert into public.paf_produtores(organizacao_id,codigo_externo,nome,cpf,telefone,endereco,area_total_ha,origem,tecnico_responsavel)
      values(org,'dashboard:'||new.id,new.name,nullif(new.cpf_digits,''),new.phone,new.address,new.area_ha,'integracao',new.designer) returning id into p_id;
    insert into public.paf_propriedades(organizacao_id,produtor_id,codigo_externo,nome,area_hectares,cultura_principal,comunidade_fonte,origem)
      values(org,p_id,'dashboard-property:'||new.id,coalesce(nullif(new.property_name,''),'Propriedade principal'),new.area_ha,'Dendê',new.community,'integracao') returning id into pr_id;
    insert into public.paf_producer_links values(new.id,p_id,pr_id,org,'dashboard',now());
  end if;
  return new;
end $$;
revoke all on function public.paf_sync_legacy_producer() from public,anon,authenticated;

create or replace function public.paf_sync_app_property() returns trigger
language plpgsql security definer set search_path=public as $$
declare link public.paf_producer_links; total numeric; first_property public.paf_propriedades;
begin
  if pg_trigger_depth()>1 or not exists(select 1 from public.paf_produtores where id=new.produtor_id and deleted_at is null) then return new; end if;
  select * into first_property from public.paf_propriedades where produtor_id=new.produtor_id and deleted_at is null order by created_at,id limit 1;
  select sum(area_hectares) into total from public.paf_propriedades where produtor_id=new.produtor_id and deleted_at is null;
  update public.paf_producer_links set property_id=first_property.id where producer_id=new.produtor_id;
  select * into link from public.paf_producer_links where producer_id=new.produtor_id;
  if found then
    update public.paf_producers set property_name=coalesce(first_property.nome,'Propriedade a cadastrar'),area_ha=coalesce(total,0),
      community=first_property.comunidade_fonte,agency=first_property.municipio where id=link.legacy_id and archived_at is null;
  end if;
  return new;
end $$;
revoke all on function public.paf_sync_app_property() from public,anon,authenticated;
drop trigger paf_app_property_bridge on public.paf_propriedades;
create trigger paf_app_property_bridge after insert or update of nome,area_hectares,comunidade_fonte,municipio,deleted_at
  on public.paf_propriedades for each row execute function public.paf_sync_app_property();

create function private.paf_replace_producer_directory(p_payload jsonb) returns jsonb
language plpgsql security invoker set search_path=public,private as $$
declare
  org uuid := public.paf_dashboard_organization(); batch uuid; prior uuid; table_key text;
  p jsonb; pr jsonb; tech text; producer_uuid uuid; property_uuid uuid; community_uuid uuid; legacy bigint; tech_uuid uuid;
  expected integer := (p_payload->'summary'->>'producers')::integer;
  linked integer := 0; current_primary boolean; result jsonb;
begin
  if org is null or expected not between 1 and 5000 or jsonb_array_length(p_payload->'producers')<>expected then
    raise exception 'Invalid organization or incomplete producer payload.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('paf-directory:'||org::text,0));
  select id into prior from private.paf_directory_imports where organizacao_id=org and checksum=p_payload->'summary'->>'checksum';
  if prior is not null then return jsonb_build_object('alreadyImported',true,'importId',prior); end if;
  lock table public.paf_produtores,public.paf_propriedades,public.paf_producers,public.paf_produtor_tecnicos in share row exclusive mode;
  insert into private.paf_directory_imports(organizacao_id,checksum,file_name,summary)
    values(org,p_payload->'summary'->>'checksum',p_payload->'summary'->>'file',p_payload->'summary') returning id into batch;
  foreach table_key in array array['paf_produtores','paf_propriedades','paf_producer_links','paf_produtor_tecnicos','paf_producers','paf_access_account_producers'] loop
    execute format('insert into private.paf_directory_backups select $1,$2,coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t',table_key) using batch,table_key;
  end loop;
  update public.paf_produtores set deleted_at=now(),status='inativo' where organizacao_id=org and deleted_at is null;
  update public.paf_propriedades set deleted_at=now() where organizacao_id=org and deleted_at is null;
  update public.paf_producers set archived_at=now() where archived_at is null;
  delete from public.paf_produtor_tecnicos where organizacao_id=org;
  delete from public.paf_access_account_producers where producer_id in (select id from public.paf_producers where archived_at is not null);

  for p in select value from jsonb_array_elements(p_payload->'producers') loop
    producer_uuid := gen_random_uuid();
    community_uuid := null;
    pr := p->'properties'->0;
    if nullif(pr->>'community','') is not null then
      select id into community_uuid from public.paf_comunidades where organizacao_id=org and deleted_at is null
        and lower(trim(nome))=lower(trim(pr->>'community')) and lower(trim(municipio))=lower(trim(pr->>'municipality')) order by id limit 1;
      if community_uuid is null then
        insert into public.paf_comunidades(organizacao_id,codigo_externo,nome,municipio,origem)
          values(org,'import-20261014:community:'||md5(coalesce(pr->>'municipality','')||'|'||coalesce(pr->>'community','')),
            pr->>'community',pr->>'municipality','excel_historico') returning id into community_uuid;
      end if;
    end if;
    insert into public.paf_produtores(id,organizacao_id,codigo_externo,comunidade_id,nome,cpf,telefone,rg,endereco,status,origem,
      tipo_produtor,area_total_ha,tecnico_responsavel,fonte_cadastral,status_importacao,observacoes,dados_cadastrais_json)
    values(producer_uuid,org,'import-20261014:'||(p->>'key'),community_uuid,p->>'name',nullif(p->>'cpf',''),nullif(p->>'phone',''),nullif(p->>'rg',''),
      nullif(pr->>'community',''),'ativo','excel_historico',p->>'type',(p->>'area')::numeric,
      (select string_agg(value,' | ') from jsonb_array_elements_text(p->'technicians')),p_payload->'summary'->>'file',
      case when nullif(p->>'cpf','') is null then 'PENDENTE_CPF' else 'PRONTO_SEM_NASCIMENTO' end,
      concat_ws('. ', 'Cadastro substituído pela planilha atualizada; situação do processo não informada',
        (select string_agg(value,'; ') from jsonb_array_elements_text(p->'issues'))),
      jsonb_build_object('importId',batch,'sources',p->'sources','sourceDetails',p->'sourceDetails','sourceRows',p->'sourceRows','issues',p->'issues'));
    for pr in select value from jsonb_array_elements(p->'properties') loop
      insert into public.paf_propriedades(organizacao_id,produtor_id,codigo_externo,nome,nome_provisorio,municipio,area_hectares,
        cultura_principal,car,caf,endereco_rural,comunidade_fonte,origem,observacoes)
      values(org,producer_uuid,'import-20261014:property:'||(p->>'key')||':'||md5(coalesce(pr->>'municipality','')||'|'||coalesce(pr->>'community','')),
        pr->>'name',(pr->>'provisionalName')::boolean,pr->>'municipality',(pr->>'area')::numeric,'Dendê',nullif(pr->>'car',''),nullif(pr->>'caf',''),
        pr->>'community',pr->>'community','excel_historico',case when pr->>'area' is null then 'Área em hectares não informada na planilha; conferir.' else null end)
        returning id into property_uuid;
    end loop;
    current_primary := true;
    for tech in select value from jsonb_array_elements_text(p->'technicians') loop
      tech_uuid := null;
      if (select count(*) from public.paf_perfis where organizacao_id=org and ativo and papel in ('tecnico','agente','coordenador') and upper(split_part(trim(nome),' ',1))=upper(tech))=1 then
        select id into tech_uuid from public.paf_perfis where organizacao_id=org and ativo and papel in ('tecnico','agente','coordenador') and upper(split_part(trim(nome),' ',1))=upper(tech);
        insert into public.paf_produtor_tecnicos(organizacao_id,produtor_id,tecnico_id,principal) values(org,producer_uuid,tech_uuid,current_primary);
        current_primary := false; linked := linked+1;
      end if;
    end loop;
    select legacy_id into legacy from public.paf_producer_links where producer_id=producer_uuid;
    update public.paf_producers set planting_year=(select max((value->>'plantingYear')::integer) from jsonb_array_elements(p->'sourceRows')),
      designer=(select string_agg(value,' | ') from jsonb_array_elements_text(p->'technicians')) where id=legacy;
  end loop;
  if (select count(*) from public.paf_produtores where organizacao_id=org and deleted_at is null)<>expected
    or (select count(*) from public.paf_producers where archived_at is null)<>expected
    or (select sum(area_total_ha) from public.paf_produtores where organizacao_id=org and deleted_at is null)<>(p_payload->'summary'->>'area')::numeric then
    raise exception 'Replacement totals differ from the reviewed workbook; transaction rolled back.';
  end if;
  result := jsonb_build_object('importId',batch,'producers',expected,'technicianAssignments',linked,'sourceSummary',p_payload->'summary');
  return result;
end $$;
revoke all on function private.paf_replace_producer_directory(jsonb) from public,anon,authenticated,service_role;
