create function public.paf_operations_producer_directory(p_search text default '',p_page integer default 1,p_municipality text default '',p_status text default '',p_responsible uuid default null,p_imported_technician text default '')
returns jsonb language sql stable set search_path=public as $$
with filtered as (
 select p.id,p.nome,p.cpf,p.telefone,p.status,p.updated_at,p.data_nascimento,p.tecnico_responsavel,
 coalesce((select string_agg(f.nome,', ' order by f.nome) from paf_produtor_tecnicos a join paf_perfis f on f.id=a.tecnico_id where a.produtor_id=p.id),nullif(p.tecnico_responsavel,''),'A definir') as technician_names,
 b.legacy_id,l.process_status,l.token,
 (select count(*) from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null) as properties,
 (select string_agg(distinct pr.municipio,', ') from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null) as municipality
 from paf_produtores p left join paf_producer_links b on b.producer_id=p.id left join paf_producers l on l.id=b.legacy_id and l.archived_at is null
 where p.organizacao_id=paf_dashboard_organization() and p.deleted_at is null
 and (p_search='' or concat_ws(' ',p.nome,p.cpf,p.telefone,p.tecnico_responsavel) ilike '%'||replace(replace(p_search,'%','\%'),'_','\_')||'%')
 and (p_status='' or l.process_status=p_status)
 and (p_municipality='' or exists(select 1 from paf_propriedades pr where pr.produtor_id=p.id and pr.deleted_at is null and pr.municipio=p_municipality))
 and (p_responsible is null or exists(select 1 from paf_produtor_tecnicos t where t.produtor_id=p.id and t.tecnico_id=p_responsible))
 and (p_imported_technician='' or exists(select 1 from regexp_split_to_table(coalesce(p.tecnico_responsavel,''),'[|;,]') as labels(label) where upper(trim(label))=upper(trim(p_imported_technician))))
)
select jsonb_build_object('producers',coalesce((select jsonb_agg(to_jsonb(q)) from (select * from filtered order by nome,id limit 25 offset (greatest(p_page,1)-1)*25) q),'[]'::jsonb),'total',(select count(*) from filtered),'page',greatest(p_page,1),'pageSize',25);
$$;
revoke all on function public.paf_operations_producer_directory(text,integer,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.paf_operations_producer_directory(text,integer,text,text,uuid,text) to service_role;
