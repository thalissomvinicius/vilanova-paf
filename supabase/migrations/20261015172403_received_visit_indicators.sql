-- Scheduled appointments and received visit reports are different measures.
create or replace function public.paf_operations_overview(p_days integer default 30,p_municipality text default '',p_responsible uuid default null)
returns jsonb language sql stable set search_path=public as $$
with clock as (select (now() at time zone 'America/Belem')::date as today), producers as (
 select p.* from paf_produtores p where p.organizacao_id=paf_dashboard_organization() and p.deleted_at is null
 and (p_municipality='' or exists(select 1 from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null and pr.municipio=p_municipality))
 and (p_responsible is null or exists(select 1 from paf_produtor_tecnicos t where t.produtor_id=p.id and t.tecnico_id=p_responsible))
), requests as (
 select * from paf_land_requests where organizacao_id=paf_dashboard_organization() and archived_at is null
 and (p_municipality='' or municipality=p_municipality) and (p_responsible is null or assigned_to=p_responsible)
), visits as (
 select a.* from paf_agenda a where a.organizacao_id=paf_dashboard_organization() and a.deleted_at is null and a.tipo='visita'
 and (a.produtor_id in (select id from producers) or (a.produtor_id is null and p_municipality=''))
 and (p_responsible is null or a.responsavel_id=p_responsible)
), field_visits as (
 select r.* from mobile_respostas r join mobile_formularios f on f.id=r.formulario_id
 where r.organizacao_id=paf_dashboard_organization() and r.deleted_at is null
 and r.status_validacao in ('pendente','aprovado','rejeitado')
 and f.codigo='assistencia-tecnica-propriedade'
 and (r.produtor_id in (select id from producers) or (r.produtor_id is null and p_municipality=''))
 and (p_responsible is null or r.tecnico_id=p_responsible)
), tasks as (
 select t.* from paf_tarefas t where t.organizacao_id=paf_dashboard_organization() and t.deleted_at is null
 and (t.produtor_id in (select id from producers) or (t.produtor_id is null and p_municipality=''))
 and (p_responsible is null or t.responsavel_id=p_responsible)
)
select jsonb_build_object(
 'counts',jsonb_build_object('producers',(select count(*) from producers),'requests',(select count(*) from requests where status in ('EM_ANALISE','DADOS_INCONSISTENTES')),
 'visits',(select count(*) from visits where status='agendado'),'overdue',(select count(*) from tasks where status in ('pendente','em_andamento') and prazo_em<now())+(select count(*) from requests where status in ('EM_ANALISE','DADOS_INCONSISTENTES') and due_date<(select today from clock)),
 'completedVisits',(select count(*) from field_visits where (coletado_em at time zone 'America/Belem')::date>=(select today from clock)-least(greatest(p_days,7),90)+1 and coletado_em<=now()),
 'area',(select coalesce(sum(pr.area_hectares),0) from paf_propriedades pr join producers p on p.id=pr.produtor_id where pr.deleted_at is null)),
 'queue',coalesce((select jsonb_agg(to_jsonb(q)) from (select id,protocol,full_name,status,municipality,assigned_to,due_date,next_action,producer_id from requests where status in ('EM_ANALISE','DADOS_INCONSISTENTES') order by due_date asc nulls last,created_at asc,id limit 12) q),'[]'::jsonb),
 'agenda',coalesce((select jsonb_agg(to_jsonb(q)) from (select v.id,v.titulo,v.inicio_em,v.status,v.produtor_id,v.responsavel_id,coalesce(p.nome,'Equipe PAF') as nome from visits v left join producers p on p.id=v.produtor_id where v.status='agendado' order by v.inicio_em,v.id limit 8) q),'[]'::jsonb),
 'pipeline',coalesce((select jsonb_agg(to_jsonb(q)) from (select coalesce(l.process_status,'SEM_ETAPA') as status,count(*) as total from producers p left join paf_producer_links b on b.producer_id=p.id left join paf_producers l on l.id=b.legacy_id group by 1 order by 2 desc) q),'[]'::jsonb),
 'activity',coalesce((select jsonb_agg(to_jsonb(q) order by q.day) from (select d::date as day,(select count(*) from field_visits v where (v.coletado_em at time zone 'America/Belem')::date=d::date and v.coletado_em<=now()) as visits,(select count(*) from requests r where (r.created_at at time zone 'America/Belem')::date=d::date) as requests from generate_series((select today from clock)-least(greatest(p_days,7),90)+1,(select today from clock),'1 day') d) q),'[]'::jsonb),
 'team',coalesce((select jsonb_agg(to_jsonb(q)) from (select f.id,f.nome,f.papel,(select count(*) from requests r where r.assigned_to=f.id and r.status in ('EM_ANALISE','DADOS_INCONSISTENTES')) as requests,(select count(*) from visits v where v.responsavel_id=f.id and v.status='agendado') as visits from paf_perfis f where f.organizacao_id=paf_dashboard_organization() and f.ativo and f.papel in ('tecnico','coordenador','agente') and (p_responsible is null or f.id=p_responsible) order by f.nome) q),'[]'::jsonb),
 'conflicts',(select count(*) from paf_producers l join paf_produtores n on regexp_replace(coalesce(n.cpf,''),'[^0-9]','','g')=l.cpf_digits where n.organizacao_id=paf_dashboard_organization() and n.deleted_at is null and not exists(select 1 from paf_producer_links b where b.legacy_id=l.id or b.producer_id=n.id))
);
$$;
revoke all on function public.paf_operations_overview(integer,text,uuid) from public,anon,authenticated;
grant execute on function public.paf_operations_overview(integer,text,uuid) to service_role;
