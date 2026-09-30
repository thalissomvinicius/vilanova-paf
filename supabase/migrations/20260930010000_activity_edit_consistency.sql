create or replace function public.paf_operations_write(p_kind text,p_id uuid,p_expected timestamptz,p_values jsonb,p_actor text)
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
        on conflict(id) do update set propriedade_id=excluded.propriedade_id,responsavel_id=excluded.responsavel_id,titulo=excluded.titulo,descricao=excluded.descricao,inicio_em=excluded.inicio_em,status=excluded.status,local=excluded.local
        returning to_jsonb(paf_agenda.*) into result;
    else
      if p_id is not null then
        select to_jsonb(t) into previous from paf_tarefas t where id=p_id and organizacao_id=org and deleted_at is null and updated_at=p_expected for update;
        if previous is null then return null; end if;
      end if;
      insert into paf_tarefas(id,organizacao_id,produtor_id,propriedade_id,responsavel_id,titulo,descricao,prioridade,status,prazo_em,concluida_em,client_id)
        values(identifier,org,producer,property,assignee,p_values->>'titulo',p_values->>'descricao',p_values->>'prioridade',p_values->>'status',nullif(p_values->>'prazo_em','')::timestamptz,case when p_values->>'status'='concluida' then now() else null end,identifier::text)
        on conflict(id) do update set propriedade_id=excluded.propriedade_id,responsavel_id=excluded.responsavel_id,titulo=excluded.titulo,descricao=excluded.descricao,prioridade=excluded.prioridade,status=excluded.status,prazo_em=excluded.prazo_em,concluida_em=case when excluded.status='concluida' then now() else null end
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
