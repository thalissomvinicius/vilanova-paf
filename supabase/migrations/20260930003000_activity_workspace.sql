create function public.paf_operations_activity(p_kind text, p_search text default '', p_status text default '', p_responsible uuid default null, p_page integer default 1)
returns jsonb language sql stable set search_path=public as $$
with records as (
  select to_jsonb(a) as record, a.produtor_id, a.responsavel_id, a.titulo, a.status, a.inicio_em as due
  from paf_agenda a where p_kind='visit' and a.organizacao_id=paf_dashboard_organization() and a.deleted_at is null and a.tipo='visita'
  union all
  select to_jsonb(t), t.produtor_id, t.responsavel_id, t.titulo, t.status, t.prazo_em
  from paf_tarefas t where p_kind='task' and t.organizacao_id=paf_dashboard_organization() and t.deleted_at is null
), filtered as (
  select r.record || jsonb_build_object('producer_name',p.nome,'responsible_name',f.nome) as record, r.due
  from records r left join paf_produtores p on p.id=r.produtor_id and p.organizacao_id=paf_dashboard_organization() and p.deleted_at is null
  left join paf_perfis f on f.id=r.responsavel_id and f.organizacao_id=paf_dashboard_organization()
  where (p_status='' or r.status=p_status) and (p_responsible is null or r.responsavel_id=p_responsible)
  and (r.produtor_id is null or p.id is not null)
  and (p_search='' or position(lower(p_search) in lower(coalesce(r.titulo,'')||' '||coalesce(p.nome,'Equipe')||' '||coalesce(p.cpf,'')))>0)
), page as (
  select record from filtered order by due asc nulls last,record->>'id' limit 25 offset (greatest(1,least(p_page,100000))-1)*25
)
select jsonb_build_object('records',coalesce((select jsonb_agg(record) from page),'[]'::jsonb),'total',(select count(*) from filtered),'page',greatest(1,p_page),'pageSize',25);
$$;
revoke all on function public.paf_operations_activity(text,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.paf_operations_activity(text,text,text,uuid,integer) to service_role;
