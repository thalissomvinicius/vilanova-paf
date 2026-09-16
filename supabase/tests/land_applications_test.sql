begin;
do $$
declare test_id uuid; result jsonb;
begin
  if has_table_privilege('anon', 'public.paf_land_requests', 'SELECT')
    or has_table_privilege('authenticated', 'public.paf_land_requests', 'SELECT')
    or has_function_privilege('anon', 'public.paf_land_review(uuid,integer,text,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.paf_land_review(uuid,integer,text,text,text)', 'EXECUTE') then
    raise exception 'Public access must be denied';
  end if;
  insert into public.paf_land_requests(client_id,fingerprint,protocol,full_name,cpf,birth_date,municipality,community,consent_version)
    values(gen_random_uuid(),'TEST','TEST-' || gen_random_uuid(),'TESTE TRANSACIONAL','52998224725','1980-01-10','Teste','Teste','test') returning id into test_id;
  select public.paf_land_review(test_id,1,'AREA_REPROVADA','Teste de parecer transacional.','Teste') into result;
  if result->>'status' <> 'AREA_REPROVADA' or (result->>'version')::int <> 2 then raise exception 'Review failed'; end if;
  if public.paf_land_review(test_id,1,'EM_ANALISE','Teste de alteração concorrente.','Teste') is not null then raise exception 'Stale overwrite allowed'; end if;
  if (select count(*) from public.paf_land_reviews where request_id = test_id) <> 1 then raise exception 'History mismatch'; end if;
end;
$$;
rollback;
