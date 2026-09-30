do $$
declare l_id bigint; p_id uuid; request_id uuid; request_version integer; result jsonb; org uuid := public.paf_dashboard_organization();
begin
  if org is null then raise exception 'Dashboard organization missing'; end if;
  if exists(select 1 from paf_producer_links link join paf_produtores p on p.id=link.producer_id where link.organizacao_id<>p.organizacao_id) then raise exception 'Cross-organization producer link'; end if;
  if has_function_privilege('anon','public.paf_land_workflow(uuid,integer,jsonb,text)','EXECUTE') or has_function_privilege('authenticated','public.paf_land_correct(uuid,integer,jsonb,text)','EXECUTE') then raise exception 'Public mutation privilege'; end if;
  insert into paf_producers(token,name,cpf,cpf_digits,phone,area_ha,process_status)
    values(gen_random_uuid()::text,'Verificação transacional PAF','00000000001','00000000001','91999999999',5,'INTERNALIZAR') returning id into l_id;
  select producer_id into p_id from paf_producer_links where legacy_id=l_id;
  if p_id is null then raise exception 'Legacy insert did not create canonical identity'; end if;
  update paf_produtores set nome='Nome atualizado na verificação' where id=p_id;
  if (select name from paf_producers where id=l_id)<>'Nome atualizado na verificação' then raise exception 'App changes did not update the legacy portal'; end if;
  insert into paf_land_requests(client_id,fingerprint,protocol,full_name,cpf,birth_date,municipality,community,phone,consent_version)
    values(gen_random_uuid(),'test','PAF-TEST-'||gen_random_uuid(),'Verificação transacional PAF','00000000001','1990-01-01','Tomé-Açu','Comunidade de teste','91999999999','test') returning id,version into request_id,request_version;
  result := paf_land_workflow(request_id,request_version,jsonb_build_object('producer_id',p_id,'next_action','Visita técnica','checklist',jsonb_build_object('cpf',true)),'migration-test');
  if result is null or result->>'producer_id'<>p_id::text then raise exception 'Workflow linking failed'; end if;
  if paf_land_workflow(request_id,request_version,'{}','migration-test') is not null then raise exception 'Stale workflow overwrote newer state'; end if;
  if not exists(select 1 from paf_operation_audit where entity='land' and entity_id=request_id::text and action='WORKFLOW') then raise exception 'Workflow audit missing'; end if;
end $$;
do $$
declare p jsonb; a jsonb; b jsonb; visit jsonb; task jsonb; changed jsonb;
begin
  p:=paf_operations_write('producer',null,null,'{"nome":"Teste de consistencia","cpf":"00000000003","telefone":"91999999999"}','transactional-test');
  a:=paf_operations_write('property',null,null,jsonb_build_object('produtor_id',p->>'id','nome','Area A','municipio','Tomé-Açu','area_hectares',1),'transactional-test');
  b:=paf_operations_write('property',null,null,jsonb_build_object('produtor_id',p->>'id','nome','Area B','municipio','Tomé-Açu','area_hectares',2),'transactional-test');
  visit:=paf_operations_write('visit',null,null,jsonb_build_object('produtor_id',p->>'id','propriedade_id',a->>'id','titulo','Visita teste','inicio_em',now(),'status','agendado'),'transactional-test');
  changed:=paf_operations_write('visit',(visit->>'id')::uuid,(visit->>'updated_at')::timestamptz,jsonb_build_object('produtor_id',p->>'id','propriedade_id',b->>'id','titulo','Visita revisada','inicio_em',now(),'status','agendado'),'transactional-test');
  if changed->>'propriedade_id'<>b->>'id' then raise exception 'Visit property edit was lost'; end if;
  task:=paf_operations_write('task',null,null,jsonb_build_object('produtor_id',p->>'id','propriedade_id',a->>'id','titulo','Tarefa teste','prioridade','media','status','concluida'),'transactional-test');
  if task->>'concluida_em' is null then raise exception 'Completed creation lacks completion time'; end if;
  changed:=paf_operations_write('task',(task->>'id')::uuid,(task->>'updated_at')::timestamptz,jsonb_build_object('produtor_id',p->>'id','propriedade_id',b->>'id','titulo','Tarefa revisada','prioridade','media','status','pendente'),'transactional-test');
  if changed->>'propriedade_id'<>b->>'id' or changed->>'concluida_em' is not null then raise exception 'Task property or reopening failed'; end if;
end $$;
do $$
declare p jsonb; pr jsonb; org uuid:=paf_dashboard_organization(); overview jsonb;
begin
  p:=paf_operations_write('producer',null,null,'{"nome":"Produtor verificação temporária","cpf":"00000000002","telefone":"91999999999"}', 'transactional-test');
  pr:=paf_operations_write('property',null,null,jsonb_build_object('produtor_id',p->>'id','nome','Área teste','municipio','Tomé-Açu','area_hectares',5), 'transactional-test');
  if pr->>'produtor_id'<>p->>'id' then raise exception 'Property ownership failed'; end if;
  if paf_operations_write('producer',(p->>'id')::uuid,'1900-01-01',jsonb_build_object('nome','Não deve salvar','cpf','00000000002'),'transactional-test') is not null then raise exception 'Expected conflict'; end if;
  overview:=paf_operations_overview(30,'',null);
  if (overview->'counts'->>'producers')::integer<1 then raise exception 'Overview failed'; end if;
  if has_function_privilege('authenticated','public.paf_operations_write(text,uuid,timestamptz,jsonb,text)','execute') then raise exception 'Write RPC exposed'; end if;
end $$;
select 'Identity, properties, workflow, organization boundaries and concurrency verified' as verification;
do $$
declare request_key uuid:=gen_random_uuid(); first_result jsonb; repeated_result jsonb; payload jsonb; changed boolean:=false; overview jsonb;
begin
  payload:=jsonb_build_object('titulo','Tarefa transacional temporária','status','pendente','prioridade','media');
  first_result:=paf_operations_write_once(request_key,'task',payload,'transactional-test');
  repeated_result:=paf_operations_write_once(request_key,'task',payload,'transactional-test');
  if first_result<>repeated_result then raise exception 'Retry created a duplicate'; end if;
  if (select count(*) from paf_operation_audit where entity='task' and entity_id=first_result->>'id' and action='CREATE')<>1 then raise exception 'Duplicate audit after retry'; end if;
  begin
    perform paf_operations_write_once(request_key,'task',payload||'{"titulo":"Outra tarefa"}'::jsonb,'transactional-test');
  exception when raise_exception then changed:=true;
  end;
  if not changed then raise exception 'Changed payload reused request key'; end if;
  if not exists(select 1 from jsonb_array_elements(paf_operations_activity('task')->'records') r where r->>'id'=first_result->>'id') then raise exception 'General app task is invisible in dashboard'; end if;
  overview:=paf_operations_overview(7);
  if overview->'activity'->-1->>'day'<>((now() at time zone 'America/Belem')::date)::text then raise exception 'Dashboard uses wrong day'; end if;
  if exists(select 1 from jsonb_array_elements(overview->'queue') r where r->>'status' not in ('EM_ANALISE','DADOS_INCONSISTENTES')) then raise exception 'Finished analysis entered active queue'; end if;
  if has_function_privilege('authenticated','public.paf_operations_write_once(uuid,text,jsonb,text)','execute') then raise exception 'Public idempotent write access'; end if;
end $$;
