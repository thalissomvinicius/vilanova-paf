create function public.paf_operations_overview(p_days integer default 30, p_municipality text default '', p_responsible uuid default null)
returns jsonb language sql stable set search_path=public as $$
with producers as (
  select p.* from paf_produtores p where p.organizacao_id=paf_dashboard_organization() and p.deleted_at is null
  and (p_municipality='' or exists(select 1 from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null and pr.municipio=p_municipality))
  and (p_responsible is null or exists(select 1 from paf_produtor_tecnicos t where t.produtor_id=p.id and t.tecnico_id=p_responsible))
), requests as (
  select * from paf_land_requests where organizacao_id=paf_dashboard_organization() and archived_at is null
  and (p_municipality='' or municipality=p_municipality) and (p_responsible is null or assigned_to=p_responsible)
), visits as (
  select a.* from paf_agenda a join producers p on p.id=a.produtor_id where a.deleted_at is null and a.tipo='visita'
  and (p_responsible is null or a.responsavel_id=p_responsible)
), tasks as (
  select t.* from paf_tarefas t join producers p on p.id=t.produtor_id where t.deleted_at is null
  and (p_responsible is null or t.responsavel_id=p_responsible)
)
select jsonb_build_object(
 'counts',jsonb_build_object('producers',(select count(*) from producers),'requests',(select count(*) from requests where status='EM_ANALISE'),
 'visits',(select count(*) from visits where status='agendado'),'overdue',(select count(*) from tasks where status in ('pendente','em_andamento') and prazo_em<now())+(select count(*) from requests where status='EM_ANALISE' and due_date<current_date),
 'completedVisits',(select count(*) from visits where status='realizado' and inicio_em>=now()-make_interval(days=>least(greatest(p_days,7),90))),
 'area',(select coalesce(sum(pr.area_hectares),0) from paf_propriedades pr join producers p on p.id=pr.produtor_id where pr.deleted_at is null)),
 'queue',coalesce((select jsonb_agg(to_jsonb(q)) from (select id,protocol,full_name,status,municipality,assigned_to,due_date,next_action,producer_id from requests order by due_date asc nulls last,created_at asc limit 12) q),'[]'::jsonb),
 'agenda',coalesce((select jsonb_agg(to_jsonb(q)) from (select v.id,v.titulo,v.inicio_em,v.status,v.produtor_id,v.responsavel_id,p.nome from visits v join producers p on p.id=v.produtor_id where v.status='agendado' order by v.inicio_em limit 8) q),'[]'::jsonb),
 'pipeline',coalesce((select jsonb_agg(to_jsonb(q)) from (select coalesce(l.process_status,'SEM_ETAPA') as status,count(*) as total from producers p left join paf_producer_links b on b.producer_id=p.id left join paf_producers l on l.id=b.legacy_id group by 1 order by 2 desc) q),'[]'::jsonb),
 'activity',coalesce((select jsonb_agg(to_jsonb(q) order by q.day) from (select d::date as day,(select count(*) from visits v where (v.inicio_em at time zone 'America/Belem')::date=d::date and v.status='realizado') as visits,(select count(*) from requests r where (r.created_at at time zone 'America/Belem')::date=d::date) as requests from generate_series(current_date-least(greatest(p_days,7),90)+1,current_date,'1 day') d) q),'[]'::jsonb),
 'team',coalesce((select jsonb_agg(to_jsonb(q)) from (select f.id,f.nome,f.papel,(select count(*) from requests r where r.assigned_to=f.id and r.status='EM_ANALISE') as requests,(select count(*) from visits v where v.responsavel_id=f.id and v.status='agendado') as visits from paf_perfis f where f.organizacao_id=paf_dashboard_organization() and f.ativo and f.papel in ('tecnico','coordenador','agente') order by f.nome) q),'[]'::jsonb),
 'conflicts',(select count(*) from paf_producers l join paf_produtores n on regexp_replace(coalesce(n.cpf,''),'[^0-9]','','g')=l.cpf_digits where n.organizacao_id=paf_dashboard_organization() and n.deleted_at is null and not exists(select 1 from paf_producer_links b where b.legacy_id=l.id or b.producer_id=n.id))
);
$$;
revoke all on function public.paf_operations_overview(integer,text,uuid) from public,anon,authenticated;
grant execute on function public.paf_operations_overview(integer,text,uuid) to service_role;

create function public.paf_operations_write(p_kind text,p_id uuid,p_expected timestamptz,p_values jsonb,p_actor text)
returns jsonb language plpgsql set search_path=public as $$
declare org uuid:=paf_dashboard_organization(); result jsonb; previous jsonb; producer uuid; assignee uuid; property uuid; identifier uuid:=coalesce(p_id,gen_random_uuid());
begin
  producer:=nullif(p_values->>'produtor_id','')::uuid;
  assignee:=nullif(p_values->>'responsavel_id','')::uuid;
  property:=nullif(p_values->>'propriedade_id','')::uuid;
  if producer is not null and not exists(select 1 from paf_produtores where id=producer and organizacao_id=org and deleted_at is null) then raise exception 'Produtor não encontrado.'; end if;
  if property is not null and not exists(select 1 from paf_propriedades where id=property and produtor_id=producer and organizacao_id=org and deleted_at is null) then raise exception 'Propriedade não encontrada.'; end if;
  if assignee is not null and not exists(select 1 from paf_perfis where id=assignee and organizacao_id=org and ativo and papel in ('tecnico','coordenador','agente','admin','super_admin')) then raise exception 'Responsável não autorizado.'; end if;
  if p_kind='producer' then
    if p_id is not null then
      select to_jsonb(p) into previous from paf_produtores p where id=p_id and organizacao_id=org and deleted_at is null and updated_at=p_expected for update;
      if previous is null then return null; end if;
    end if;
    if exists(select 1 from paf_produtores where organizacao_id=org and deleted_at is null and regexp_replace(coalesce(cpf,''),'[^0-9]','','g')=p_values->>'cpf' and id<>identifier) then raise exception 'CPF já cadastrado. Localize o produtor existente.'; end if;
    insert into paf_produtores(id,organizacao_id,nome,cpf,telefone,email,endereco,data_nascimento,observacoes,origem)
      values(identifier,org,p_values->>'nome',p_values->>'cpf',p_values->>'telefone',nullif(p_values->>'email',''),p_values->>'endereco',nullif(p_values->>'data_nascimento','')::date,p_values->>'observacoes','painel_web')
      on conflict(id) do update set nome=excluded.nome,cpf=excluded.cpf,telefone=excluded.telefone,email=excluded.email,endereco=excluded.endereco,data_nascimento=excluded.data_nascimento,observacoes=excluded.observacoes
      returning to_jsonb(paf_produtores.*) into result;
  elsif p_kind='property' then
    if p_id is not null then
      select to_jsonb(p) into previous from paf_propriedades p where id=p_id and organizacao_id=org and deleted_at is null and updated_at=p_expected for update;
      if previous is null then return null; end if;
      if previous->>'produtor_id'<>producer::text then raise exception 'Não é permitido transferir a propriedade neste formulário.'; end if;
    end if;
    insert into paf_propriedades(id,organizacao_id,produtor_id,nome,municipio,area_hectares,cultura_principal,comunidade_fonte,car,caf,endereco_rural,latitude,longitude,observacoes,origem)
      values(identifier,org,producer,p_values->>'nome',p_values->>'municipio',(p_values->>'area_hectares')::numeric,'Dendê',p_values->>'comunidade_fonte',p_values->>'car',p_values->>'caf',p_values->>'endereco_rural',nullif(p_values->>'latitude','')::numeric,nullif(p_values->>'longitude','')::numeric,p_values->>'observacoes','painel_web')
      on conflict(id) do update set nome=excluded.nome,municipio=excluded.municipio,area_hectares=excluded.area_hectares,comunidade_fonte=excluded.comunidade_fonte,car=excluded.car,caf=excluded.caf,endereco_rural=excluded.endereco_rural,latitude=excluded.latitude,longitude=excluded.longitude,observacoes=excluded.observacoes
      returning to_jsonb(paf_propriedades.*) into result;
  elsif p_kind in ('visit','task') then
    if p_kind='visit' then
      if p_id is not null then
        select to_jsonb(v) into previous from paf_agenda v where id=p_id and organizacao_id=org and deleted_at is null and updated_at=p_expected for update;
        if previous is null then return null; end if;
      end if;
      insert into paf_agenda(id,organizacao_id,produtor_id,propriedade_id,responsavel_id,titulo,descricao,tipo,inicio_em,status,local,client_id)
        values(identifier,org,producer,property,assignee,p_values->>'titulo',p_values->>'descricao','visita',(p_values->>'inicio_em')::timestamptz,p_values->>'status',p_values->>'local',identifier::text)
        on conflict(id) do update set responsavel_id=excluded.responsavel_id,titulo=excluded.titulo,descricao=excluded.descricao,inicio_em=excluded.inicio_em,status=excluded.status,local=excluded.local
        returning to_jsonb(paf_agenda.*) into result;
    else
      if p_id is not null then
        select to_jsonb(t) into previous from paf_tarefas t where id=p_id and organizacao_id=org and deleted_at is null and updated_at=p_expected for update;
        if previous is null then return null; end if;
      end if;
      insert into paf_tarefas(id,organizacao_id,produtor_id,propriedade_id,responsavel_id,titulo,descricao,prioridade,status,prazo_em,client_id)
        values(identifier,org,producer,property,assignee,p_values->>'titulo',p_values->>'descricao',p_values->>'prioridade',p_values->>'status',nullif(p_values->>'prazo_em','')::timestamptz,identifier::text)
        on conflict(id) do update set responsavel_id=excluded.responsavel_id,titulo=excluded.titulo,descricao=excluded.descricao,prioridade=excluded.prioridade,status=excluded.status,prazo_em=excluded.prazo_em,concluida_em=case when excluded.status='concluida' then now() else null end
        returning to_jsonb(paf_tarefas.*) into result;
    end if;
  else raise exception 'Operação inválida.';
  end if;
  if producer is not null and assignee is not null and exists(select 1 from paf_perfis where id=assignee and papel in ('tecnico','coordenador','agente')) then
    insert into paf_produtor_tecnicos(organizacao_id,produtor_id,tecnico_id,principal) values(org,producer,assignee,false) on conflict(produtor_id,tecnico_id) do nothing;
  end if;
  insert into paf_operation_audit(organizacao_id,entity,entity_id,action,actor,before_data,after_data) values(org,p_kind,identifier::text,case when p_id is null then 'CREATE' else 'UPDATE' end,p_actor,previous,result);
  return result;
end $$;
revoke all on function public.paf_operations_write(text,uuid,timestamptz,jsonb,text) from public,anon,authenticated;
grant execute on function public.paf_operations_write(text,uuid,timestamptz,jsonb,text) to service_role;

create function public.paf_land_promote(p_id uuid,p_version integer,p_actor text) returns jsonb language plpgsql set search_path=public as $$
declare r paf_land_requests; p paf_produtores; payload jsonb;
begin
  select * into r from paf_land_requests where id=p_id and version=p_version and organizacao_id=paf_dashboard_organization() for update;
  if not found then return null; end if;
  if r.producer_id is not null then return to_jsonb(r); end if;
  select * into p from paf_produtores where organizacao_id=r.organizacao_id and deleted_at is null and regexp_replace(coalesce(cpf,''),'[^0-9]','','g')=r.cpf;
  if found and lower(trim(p.nome))<>lower(trim(r.full_name)) then raise exception 'O CPF existe com outro nome. Confira o cadastro antes de vincular.'; end if;
  if p.id is null then
    payload:=paf_operations_write('producer',null,null,jsonb_build_object('nome',r.full_name,'cpf',r.cpf,'telefone',r.phone,'data_nascimento',r.birth_date,'endereco',concat_ws(' / ',r.community,r.municipality),'observacoes','Cadastro originado da análise '||r.protocol),p_actor);
    p.id:=(payload->>'id')::uuid;
  end if;
  return paf_land_workflow(r.id,r.version,jsonb_build_object('producer_id',p.id,'assigned_to',r.assigned_to,'due_date',r.due_date,'next_action',r.next_action,'internal_note',r.internal_note,'checklist',r.checklist),p_actor);
end $$;
revoke all on function public.paf_land_promote(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.paf_land_promote(uuid,integer,text) to service_role;

create function public.paf_operations_producers(p_search text default '',p_page integer default 1,p_municipality text default '',p_status text default '',p_responsible uuid default null)
returns jsonb language sql stable set search_path=public as $$
with filtered as (
 select p.id,p.nome,p.cpf,p.telefone,p.status,p.updated_at,p.data_nascimento,
 b.legacy_id,l.process_status,l.token,
 (select count(*) from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null) as properties,
 (select string_agg(distinct pr.municipio,', ') from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null) as municipality
 from paf_produtores p left join paf_producer_links b on b.producer_id=p.id left join paf_producers l on l.id=b.legacy_id
 where p.organizacao_id=paf_dashboard_organization() and p.deleted_at is null
 and (p_search='' or concat_ws(' ',p.nome,p.cpf,p.telefone) ilike '%'||replace(replace(p_search,'%','\%'),'_','\_')||'%')
 and (p_status='' or l.process_status=p_status)
 and (p_municipality='' or exists(select 1 from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null and pr.municipio=p_municipality))
 and (p_responsible is null or exists(select 1 from paf_produtor_tecnicos t where t.produtor_id=p.id and t.tecnico_id=p_responsible))
)
select jsonb_build_object('producers',coalesce((select jsonb_agg(to_jsonb(q)) from (select * from filtered order by nome,id limit 25 offset (greatest(p_page,1)-1)*25) q),'[]'::jsonb),'total',(select count(*) from filtered),'page',greatest(p_page,1),'pageSize',25);
$$;
revoke all on function public.paf_operations_producers(text,integer,text,text,uuid) from public,anon,authenticated;
grant execute on function public.paf_operations_producers(text,integer,text,text,uuid) to service_role;
