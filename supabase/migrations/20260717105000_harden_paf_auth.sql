-- Endurecimento da autenticacao e das politicas RLS da plataforma PAF.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.paf_organizacao_atual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.organizacao_id
  from public.paf_perfis p
  where p.id = auth.uid() and p.ativo = true
  limit 1;
$$;

create or replace function private.paf_papel_atual()
returns public.paf_papel
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel
  from public.paf_perfis p
  where p.id = auth.uid() and p.ativo = true
  limit 1;
$$;

create or replace function private.paf_eh_gestor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.paf_papel_atual() in ('super_admin', 'admin', 'coordenador'),
    false
  );
$$;

create or replace function private.paf_eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.paf_papel_atual() in (
      'super_admin', 'admin', 'coordenador', 'tecnico', 'agente'
    ),
    false
  );
$$;

create or replace function private.paf_pode_ler_dados()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.paf_papel_atual() in (
      'super_admin', 'admin', 'coordenador', 'tecnico', 'agente', 'auditor'
    ),
    false
  );
$$;

revoke all on function private.paf_organizacao_atual() from public, anon;
revoke all on function private.paf_papel_atual() from public, anon;
revoke all on function private.paf_eh_gestor() from public, anon;
revoke all on function private.paf_eh_equipe() from public, anon;
revoke all on function private.paf_pode_ler_dados() from public, anon;
grant execute on function private.paf_organizacao_atual() to authenticated;
grant execute on function private.paf_papel_atual() to authenticated;
grant execute on function private.paf_eh_gestor() to authenticated;
grant execute on function private.paf_eh_equipe() to authenticated;
grant execute on function private.paf_pode_ler_dados() to authenticated;

drop policy if exists "organizacao visivel para membros" on public.paf_organizacoes;
drop policy if exists "gestores administram organizacao" on public.paf_organizacoes;

create policy "organizacao visivel para membros"
on public.paf_organizacoes for select to authenticated
using (id = (select private.paf_organizacao_atual()));

create policy "gestores administram organizacao"
on public.paf_organizacoes for update to authenticated
using (
  id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
)
with check (
  id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

drop policy if exists "perfil proprio ou equipe gestora" on public.paf_perfis;
drop policy if exists "gestores administram perfis" on public.paf_perfis;

create policy "perfil proprio ou equipe gestora"
on public.paf_perfis for select to authenticated
using (
  id = (select auth.uid())
  or (
    organizacao_id = (select private.paf_organizacao_atual())
    and (select private.paf_eh_gestor())
  )
);

create policy "gestores incluem perfis"
on public.paf_perfis for insert to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

create policy "gestores atualizam perfis"
on public.paf_perfis for update to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

create policy "gestores removem perfis"
on public.paf_perfis for delete to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'headcount_colaboradores', 'paf_comunidades', 'paf_produtores',
    'paf_propriedades', 'mobile_dispositivos', 'mobile_sync_lotes',
    'mobile_gps', 'mobile_anexos', 'paf_assistencias', 'paf_agenda',
    'paf_tarefas', 'paf_eventos', 'paf_publicacoes', 'paf_conversas',
    'paf_mensagens'
  ]
  loop
    execute format('drop policy if exists "equipe le dados da organizacao" on public.%I', table_name);
    execute format('drop policy if exists "equipe inclui dados da organizacao" on public.%I', table_name);
    execute format('drop policy if exists "equipe atualiza dados da organizacao" on public.%I', table_name);
    execute format('drop policy if exists "gestores removem dados da organizacao" on public.%I', table_name);

    execute format(
      'create policy "equipe le dados da organizacao" on public.%I for select to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_pode_ler_dados()))',
      table_name
    );
    execute format(
      'create policy "equipe inclui dados da organizacao" on public.%I for insert to authenticated with check (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_equipe()))',
      table_name
    );
    execute format(
      'create policy "equipe atualiza dados da organizacao" on public.%I for update to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_equipe())) with check (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_equipe()))',
      table_name
    );
    execute format(
      'create policy "gestores removem dados da organizacao" on public.%I for delete to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_gestor()))',
      table_name
    );
  end loop;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['paf_modulos', 'mobile_formularios']
  loop
    execute format('drop policy if exists "equipe le catalogo da organizacao" on public.%I', table_name);
    execute format('drop policy if exists "gestores administram catalogo da organizacao" on public.%I', table_name);

    execute format(
      'create policy "equipe le catalogo da organizacao" on public.%I for select to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_pode_ler_dados()))',
      table_name
    );
    execute format(
      'create policy "gestores incluem catalogo da organizacao" on public.%I for insert to authenticated with check (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_gestor()))',
      table_name
    );
    execute format(
      'create policy "gestores atualizam catalogo da organizacao" on public.%I for update to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_gestor())) with check (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_gestor()))',
      table_name
    );
    execute format(
      'create policy "gestores removem catalogo da organizacao" on public.%I for delete to authenticated using (organizacao_id = (select private.paf_organizacao_atual()) and (select private.paf_eh_gestor()))',
      table_name
    );
  end loop;
end
$$;

drop policy if exists "equipe le respostas da organizacao" on public.mobile_respostas;
drop policy if exists "tecnicos criam as proprias respostas" on public.mobile_respostas;
drop policy if exists "tecnicos editam respostas ainda nao aprovadas" on public.mobile_respostas;
drop policy if exists "gestores removem respostas" on public.mobile_respostas;

create policy "equipe le respostas da organizacao"
on public.mobile_respostas for select to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_pode_ler_dados())
);

create policy "tecnicos criam as proprias respostas"
on public.mobile_respostas for insert to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_equipe())
  and (
    tecnico_id = (select auth.uid())
    or (select private.paf_eh_gestor())
  )
  and status_validacao in ('rascunho', 'pendente')
);

create policy "tecnicos editam respostas ainda nao aprovadas"
on public.mobile_respostas for update to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      tecnico_id = (select auth.uid())
      and status_validacao in ('rascunho', 'pendente', 'rejeitado')
    )
  )
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      tecnico_id = (select auth.uid())
      and status_validacao in ('rascunho', 'pendente')
    )
  )
);

create policy "gestores removem respostas"
on public.mobile_respostas for delete to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

revoke all on function public.paf_organizacao_atual() from public, anon, authenticated;
revoke all on function public.paf_papel_atual() from public, anon, authenticated;
revoke all on function public.paf_eh_gestor() from public, anon, authenticated;
revoke all on function public.paf_eh_equipe() from public, anon, authenticated;
revoke all on function public.paf_pode_ler_dados() from public, anon, authenticated;

drop function public.paf_eh_equipe();
drop function public.paf_eh_gestor();
drop function public.paf_pode_ler_dados();
drop function public.paf_papel_atual();
drop function public.paf_organizacao_atual();

create or replace function private.paf_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organizacao uuid;
  papel_inicial public.paf_papel := 'tecnico';
  nome_inicial text;
begin
  select o.id into organizacao
  from public.paf_organizacoes o
  where o.slug = 'vila-nova-agroindustrial'
  limit 1;

  if organizacao is null then
    raise exception 'Organizacao Vila Nova Agroindustrial nao configurada';
  end if;

  if not exists (select 1 from public.paf_perfis) then
    papel_inicial := 'super_admin';
  end if;

  nome_inicial := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(new.email, 'Usuario PAF'), '@', 1)
  );

  insert into public.paf_perfis (
    id,
    organizacao_id,
    nome,
    email,
    papel,
    ativo
  )
  values (
    new.id,
    organizacao,
    nome_inicial,
    coalesce(new.email, new.id::text || '@sem-email.local'),
    papel_inicial,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.paf_handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.paf_handle_new_user();
