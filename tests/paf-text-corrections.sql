do $$
declare p public.paf_perfis; technician public.paf_perfis; f public.mobile_formularios; rid uuid := gen_random_uuid(); first_id uuid; stamp timestamptz; failed boolean; snapshot jsonb;
begin
  select * into p from public.paf_perfis where ativo and not deve_trocar_senha and papel::text in ('admin','super_admin') limit 1;
  select * into f from public.mobile_formularios where organizacao_id=p.organizacao_id and codigo='assistencia-tecnica-propriedade' order by versao desc limit 1;
  if p.id is null or f.id is null then raise exception 'Fixture context unavailable'; end if;
  insert into public.mobile_respostas(id,client_id,organizacao_id,formulario_id,formulario_versao,tecnico_id,dados_json,observacoes,status_validacao,coletado_em,client_updated_at)
    values(rid,gen_random_uuid(),p.organizacao_id,f.id,f.versao,p.id,'{"recomendacoesTecnicas":"Texto origial","_visitSignatures":[{"role":"technician"}]}','Observacao original','rascunho',now(),now()) returning updated_at into stamp;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p.id,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  insert into public.paf_text_corrections(organizacao_id,resposta_id,expected_updated_at,corrections)
    values(p.organizacao_id,rid,stamp,'{"recomendacoesTecnicas":"Texto original"}') returning id,original_json into first_id,snapshot;
  if snapshot->>'recomendacoesTecnicas'<>'Texto origial' then raise exception 'Original snapshot not preserved'; end if;
  if (select dados_json->>'recomendacoesTecnicas' from public.mobile_respostas where id=rid)<>'Texto origial' or (select jsonb_array_length(dados_json->'_visitSignatures') from public.mobile_respostas where id=rid)<>1 then raise exception 'Source was modified'; end if;
  failed := false; begin insert into public.paf_text_corrections(organizacao_id,resposta_id,expected_updated_at,corrections) values(p.organizacao_id,rid,stamp,'{"recomendacoesTecnicas":"Outro"}'); exception when others then failed := true; end;
  if not failed then raise exception 'Concurrent revision accepted'; end if;
  failed := false; begin insert into public.paf_text_corrections(organizacao_id,resposta_id,expected_updated_at,expected_previous_id,corrections) values(p.organizacao_id,rid,stamp,first_id,'{"_visitSignatures":"alterado"}'); exception when others then failed := true; end;
  if not failed then raise exception 'Signature modification accepted'; end if;
  failed := false; begin update public.paf_text_corrections set corrections='{}' where id=first_id; exception when others then failed := true; end;
  if not failed then raise exception 'History update accepted'; end if;
  insert into public.paf_text_corrections(organizacao_id,resposta_id,expected_updated_at,expected_previous_id,corrections) values(p.organizacao_id,rid,stamp,first_id,'{"__observacoes":"Observação original"}');
  select * into technician from public.paf_perfis where organizacao_id=p.organizacao_id and ativo and not deve_trocar_senha and papel::text='tecnico' limit 1;
  if technician.id is not null then
    perform set_config('request.jwt.claims',jsonb_build_object('sub',technician.id,'role','authenticated')::text,true);
    failed := false; begin insert into public.paf_text_corrections(organizacao_id,resposta_id,expected_updated_at,corrections) values(p.organizacao_id,rid,stamp,'{"recomendacoesTecnicas":"Outro"}'); exception when others then failed := true; end;
    if not failed then raise exception 'Non-manager revision accepted'; end if;
    if exists(select 1 from public.paf_text_corrections where resposta_id=rid) then raise exception 'Other technician can read manager collection revisions'; end if;
  end if;
  execute 'reset role';
end $$;
