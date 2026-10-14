-- A real technician profile claims only an unambiguous imported name in its organization.
create function private.paf_assign_imported_technician() returns trigger
language plpgsql security definer set search_path=public,private as $$
declare alias text := upper(split_part(trim(new.nome),' ',1));
begin
  if not new.ativo or new.papel not in ('tecnico','agente') or alias='' then return new; end if;
  if (select count(*) from public.paf_perfis where organizacao_id=new.organizacao_id and ativo and papel in ('tecnico','agente','coordenador') and upper(split_part(trim(nome),' ',1))=alias)<>1 then return new; end if;
  insert into public.paf_produtor_tecnicos(organizacao_id,produtor_id,tecnico_id,principal)
    select p.organizacao_id,p.id,new.id,
      not exists(select 1 from public.paf_produtor_tecnicos a where a.produtor_id=p.id and a.principal)
    from public.paf_produtores p
    where p.organizacao_id=new.organizacao_id and p.deleted_at is null and p.origem='excel_historico'
      and exists(select 1 from regexp_split_to_table(coalesce(p.tecnico_responsavel,''),'[|;,]') label where upper(trim(label))=alias)
    on conflict(produtor_id,tecnico_id) do nothing;
  return new;
end $$;
revoke all on function private.paf_assign_imported_technician() from public,anon,authenticated,service_role;
create trigger paf_assign_imported_technician after insert or update of nome,papel,ativo on public.paf_perfis
  for each row execute function private.paf_assign_imported_technician();
