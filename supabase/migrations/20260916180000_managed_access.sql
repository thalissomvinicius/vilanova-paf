-- Profile changes are atomic, tenant-scoped and audited; authors are never deleted.
alter table public.paf_acesso_eventos drop constraint paf_acesso_eventos_tipo_check;
alter table public.paf_acesso_eventos add constraint paf_acesso_eventos_tipo_check
  check (tipo in ('acesso_criado', 'senha_redefinida', 'acesso_editado', 'acesso_bloqueado', 'acesso_reativado'));

create or replace function public.paf_manage_access(
  target_id uuid, new_name text, new_role text, new_active boolean, expected_updated_at timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
declare
  caller public.paf_perfis;
  target public.paf_perfis;
  allowed text[];
begin
  -- Lock order serializes access administration within each organization.
  select * into caller from public.paf_perfis where id = auth.uid();
  if caller.id is null or not caller.ativo or caller.deve_trocar_senha then
    raise exception 'Sessao nao autorizada.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller.organizacao_id::text, 0));
  select * into caller from public.paf_perfis where id = auth.uid() for update;
  if not caller.ativo or caller.deve_trocar_senha then
    raise exception 'Sessao nao autorizada.' using errcode = '42501';
  end if;
  allowed := case caller.papel::text
    when 'super_admin' then array['admin','coordenador','tecnico','agente','auditor']
    when 'admin' then array['coordenador','tecnico','agente','auditor']
    when 'coordenador' then array['tecnico','agente','auditor']
    else array[]::text[] end;
  select * into target from public.paf_perfis
    where id = target_id and organizacao_id = caller.organizacao_id for update;
  if target.id is null or target.id = caller.id or not (target.papel::text = any(allowed))
     or new_role is null or not (new_role = any(allowed)) then
    raise exception 'Seu perfil nao pode alterar este acesso.' using errcode = '42501';
  end if;
  if new_name is null or length(trim(new_name)) not between 3 and 120 or new_active is null then
    raise exception 'Dados do acesso invalidos.' using errcode = '22023';
  end if;
  if expected_updated_at is distinct from target.updated_at then
    raise exception 'Este acesso mudou. Atualize a lista antes de continuar.' using errcode = '40001';
  end if;
  update public.paf_perfis set nome = trim(new_name), papel = new_role::public.paf_papel,
    ativo = new_active where id = target.id;
  insert into public.paf_acesso_eventos(organizacao_id, ator_id, usuario_id, tipo, email_status)
    values(caller.organizacao_id, caller.id, target.id,
      case when target.ativo and not new_active then 'acesso_bloqueado'
           when not target.ativo and new_active then 'acesso_reativado'
           else 'acesso_editado' end, 'not_configured');
end;
$$;
revoke all on function public.paf_manage_access(uuid,text,text,boolean,timestamptz) from public, anon;
grant execute on function public.paf_manage_access(uuid,text,text,boolean,timestamptz) to authenticated;

-- New clients use the RPC; older APKs retain their status-only update path.
drop policy if exists "gestores incluem perfis" on public.paf_perfis;
drop policy if exists "gestores removem perfis" on public.paf_perfis;

create or replace function private.paf_guard_access_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare caller public.paf_perfis; allowed text[];
begin
  if auth.uid() is null then return new; end if;
  select * into caller from public.paf_perfis where id = auth.uid();
  allowed := case caller.papel::text
    when 'super_admin' then array['admin','coordenador','tecnico','agente','auditor']
    when 'admin' then array['coordenador','tecnico','agente','auditor']
    when 'coordenador' then array['tecnico','agente','auditor']
    else array[]::text[] end;
  if caller.id is null or not caller.ativo or caller.deve_trocar_senha or old.id = caller.id
    or old.organizacao_id <> caller.organizacao_id
    or not (old.papel::text = any(allowed)) or not (new.papel::text = any(allowed))
    or (to_jsonb(new) - array['nome','papel','ativo','updated_at']) is distinct from
       (to_jsonb(old) - array['nome','papel','ativo','updated_at']) then
    raise exception 'Alteracao de acesso nao autorizada.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger paf_guard_access_update before update on public.paf_perfis
  for each row execute function private.paf_guard_access_update();
