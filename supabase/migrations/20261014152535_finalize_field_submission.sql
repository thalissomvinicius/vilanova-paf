-- Publish a visit for review only after the selected evidence is safely stored.
create function public.paf_finalize_field_collection(p_response uuid,p_client_updated_at timestamptz,p_photos uuid[]) returns jsonb
language plpgsql security invoker set search_path=public,private as $$
declare r public.mobile_respostas; profile public.paf_perfis; f public.mobile_formularios;
  field jsonb; value jsonb; policy jsonb; required_photos integer; photo_count integer; photos uuid[];
begin
  select * into profile from public.paf_perfis where id=auth.uid() and ativo and not deve_trocar_senha;
  if profile.id is null then raise exception 'Acesso ativo necessário.'; end if;
  select * into r from public.mobile_respostas where id=p_response and organizacao_id=profile.organizacao_id and deleted_at is null for update;
  if r.id is null or (r.tecnico_id<>profile.id and profile.papel not in ('admin','super_admin','coordenador')) then raise exception 'Coleta fora do seu acesso.'; end if;
  if r.status_validacao not in ('rascunho','pendente','rejeitado') or r.client_updated_at is distinct from p_client_updated_at then
    raise exception 'A coleta mudou durante o envio. Atualize antes de tentar novamente.';
  end if;
  select * into f from public.mobile_formularios where id=r.formulario_id and organizacao_id=r.organizacao_id and ativo;
  if f.id is null or f.versao<>r.formulario_versao then raise exception 'Versão de formulário não disponível.'; end if;
  if r.produtor_id is not null and not exists(select 1 from public.paf_produtores where id=r.produtor_id and organizacao_id=r.organizacao_id and deleted_at is null) then
    raise exception 'O produtor foi removido ou mudou de carteira.';
  end if;
  if r.propriedade_id is not null and not exists(select 1 from public.paf_propriedades where id=r.propriedade_id and produtor_id=r.produtor_id and organizacao_id=r.organizacao_id and deleted_at is null) then
    raise exception 'A propriedade não pertence ao produtor selecionado.';
  end if;
  if f.escopo::text='produtor' and r.produtor_id is null then raise exception 'Selecione o produtor.'; end if;
  if f.escopo::text='comunidade' and r.comunidade_id is null then raise exception 'Selecione a comunidade.'; end if;
  if f.codigo='assistencia-tecnica-propriedade' and r.propriedade_id is null then raise exception 'Selecione a propriedade visitada.'; end if;
  for field in select item from jsonb_array_elements(coalesce(f.definicao_json->'fields','[]')) item loop
    value := r.dados_json->(field->>'id');
    if coalesce((field->>'required')::boolean,false) and (value is null or value='null'::jsonb or value='[]'::jsonb or (jsonb_typeof(value)='string' and trim(value#>>'{}')='')) then
      raise exception 'Campo obrigatório: %',field->>'label';
    end if;
    if value is null or value='null'::jsonb or value='""'::jsonb then continue; end if;
    if field->>'type'='number' and (jsonb_typeof(value)<>'number' or (value#>>'{}')::numeric<0) then raise exception 'Número inválido: %',field->>'label'; end if;
    if field->>'type'='boolean' and jsonb_typeof(value)<>'boolean' then raise exception 'Selecione Sim ou Não: %',field->>'label'; end if;
    if field->>'type'='date' then
      if (value#>>'{}') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida: %',field->>'label'; end if;
      perform (value#>>'{}')::date;
    end if;
  end loop;
  if f.codigo='assistencia-tecnica-propriedade' then
    if (r.dados_json->>'dataVisita')::date>(now() at time zone 'America/Belem')::date then raise exception 'A visita não pode estar no futuro.'; end if;
    if nullif(r.dados_json->>'proximaVistoria','') is not null and (r.dados_json->>'proximaVistoria')::date<(r.dados_json->>'dataVisita')::date then raise exception 'Confira a data do retorno.'; end if;
    if coalesce(r.dados_json->'atividadesManutencao','[]') ? 'Outros' and nullif(trim(r.dados_json->>'outraAtividade'),'') is null then raise exception 'Descreva a outra atividade.'; end if;
  end if;
  photos := array(select distinct unnest(coalesce(p_photos,'{}')));
  policy := coalesce(f.definicao_json->'evidencePolicy','{}');
  required_photos := coalesce((policy->>'minPhotos')::integer,0);
  if coalesce((policy->>'gpsRequired')::boolean,false) and not exists(
    select 1 from public.mobile_gps where resposta_id=r.id and organizacao_id=r.organizacao_id and tipo='ponto'
      and latitude between -90 and 90 and longitude between -180 and 180 and coalesce(metadados_json->>'localizacao_simulada','false')='false'
  ) then raise exception 'Registre o GPS da atividade.'; end if;
  select count(*) into photo_count from public.mobile_anexos a
    where a.resposta_id=r.id and a.organizacao_id=r.organizacao_id and a.tipo='foto' and a.client_id=any(photos)
      and (not coalesce((policy->>'cameraOnly')::boolean,false) or a.metadados_json->>'fonte'='camera')
      and coalesce(a.metadados_json->>'localizacao_simulada','false')='false'
      and (not coalesce((policy->>'photoLocationRequired')::boolean,false) or exists(
        select 1 from public.mobile_gps g where g.resposta_id=r.id and g.organizacao_id=r.organizacao_id
          and g.metadados_json->>'evidence_client_id'=a.client_id::text and g.latitude between -90 and 90 and g.longitude between -180 and 180
          and coalesce(g.metadados_json->>'localizacao_simulada','false')='false'))
      and exists(select 1 from storage.objects o where o.bucket_id=a.bucket and o.name=a.storage_path);
  if photo_count<required_photos or photo_count<>cardinality(photos) then raise exception 'O envio das fotos e seus dados de GPS ainda não foi concluído.'; end if;
  update public.mobile_anexos set metadados_json=coalesce(metadados_json,'{}')||jsonb_build_object('removido',not(client_id=any(photos)))
    where resposta_id=r.id and organizacao_id=r.organizacao_id and tipo='foto';
  update public.mobile_gps set metadados_json=coalesce(metadados_json,'{}')||jsonb_build_object('removido',not((metadados_json->>'evidence_client_id')::uuid=any(photos)))
    where resposta_id=r.id and organizacao_id=r.organizacao_id and metadados_json ? 'evidence_client_id';
  update public.mobile_respostas set status_validacao='pendente',nota_revisao=null,revisado_em=null,revisado_por=null where id=r.id returning * into r;
  return jsonb_build_object('id',r.id,'status_validacao',r.status_validacao,'nota_revisao',r.nota_revisao,'revisado_em',r.revisado_em,'revisado_por',r.revisado_por);
end $$;
revoke all on function public.paf_finalize_field_collection(uuid,timestamptz,uuid[]) from public,anon;
grant execute on function public.paf_finalize_field_collection(uuid,timestamptz,uuid[]) to authenticated;
