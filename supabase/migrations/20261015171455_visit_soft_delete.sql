-- Retain field evidence and audit while removing test visits from active views.
alter table public.mobile_respostas add column if not exists deleted_by uuid;
alter table public.mobile_respostas add column if not exists deletion_reason text;

create or replace function private.paf_guard_collection_deletion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Use a exclusão administrativa; as evidências devem ser preservadas.' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    if new.deleted_at is not null or new.deleted_by is not null or new.deletion_reason is not null then
      raise exception 'Não é permitido criar uma visita excluída.' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.deleted_at is not null then
    raise exception 'Esta visita foi excluída pela administração. Sincronize novamente.' using errcode = '42501';
  end if;
  if new.deleted_at is not distinct from old.deleted_at then
    if new.deleted_by is distinct from old.deleted_by or new.deletion_reason is distinct from old.deletion_reason then
      raise exception 'Metadados de exclusão protegidos.' using errcode = '42501';
    end if;
    return new;
  end if;
  if not exists (select 1 from public.paf_perfis p where p.id = auth.uid() and p.ativo
      and not p.deve_trocar_senha and p.organizacao_id = old.organizacao_id and p.papel in ('admin','super_admin')) then
    raise exception 'Somente a administração pode excluir visitas.' using errcode = '42501';
  end if;
  if (to_jsonb(new) - array['deleted_at','deleted_by','deletion_reason','updated_at']) is distinct from
     (to_jsonb(old) - array['deleted_at','deleted_by','deletion_reason','updated_at']) then
    raise exception 'A exclusão não pode alterar o conteúdo da visita.';
  end if;
  new.deletion_reason := btrim(new.deletion_reason);
  if new.deletion_reason is null or length(new.deletion_reason) not between 5 and 1000 then
    raise exception 'Informe o motivo da exclusão, entre 5 e 1.000 caracteres.';
  end if;
  new.deleted_at := now();
  new.deleted_by := auth.uid();
  insert into public.paf_operation_audit (organizacao_id,entity,entity_id,action,actor,before_data,after_data)
  values (old.organizacao_id,'mobile_respostas',old.id::text,'delete',auth.uid()::text,
    jsonb_build_object('status_validacao',old.status_validacao,'client_id',old.client_id),
    jsonb_build_object('deleted_at',new.deleted_at,'reason',new.deletion_reason));
  return new;
end;
$$;
revoke all on function private.paf_guard_collection_deletion() from public, anon, authenticated;
create trigger paf_guard_collection_deletion before insert or update or delete on public.mobile_respostas
for each row execute function private.paf_guard_collection_deletion();

create or replace function public.paf_delete_field_collection(p_response uuid, p_expected_updated_at timestamptz, p_reason text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare removed uuid;
begin
  if not exists (select 1 from public.paf_perfis p where p.id = auth.uid() and p.ativo
      and not p.deve_trocar_senha and p.papel in ('admin','super_admin')) then
    raise exception 'Somente a administração pode excluir visitas.' using errcode = '42501';
  end if;
  update public.mobile_respostas r set deleted_at = now(), deletion_reason = p_reason
    where r.id = p_response and r.updated_at = p_expected_updated_at and r.deleted_at is null
    and r.organizacao_id = (select p.organizacao_id from public.paf_perfis p where p.id = auth.uid())
    returning r.id into removed;
  if removed is null then
    raise exception 'A visita mudou ou seu acesso foi alterado. Atualize e abra novamente.' using errcode = '40001';
  end if;
  return removed;
end;
$$;
revoke all on function public.paf_delete_field_collection(uuid,timestamptz,text) from public, anon;
grant execute on function public.paf_delete_field_collection(uuid,timestamptz,text) to authenticated;
