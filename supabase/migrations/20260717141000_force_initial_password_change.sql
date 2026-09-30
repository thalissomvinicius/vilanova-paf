-- Acessos criados por gestores usam senha inicial e exigem troca no primeiro login.

alter table public.paf_perfis
  add column if not exists deve_trocar_senha boolean not null default false;

create or replace function public.paf_concluir_troca_senha()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.paf_perfis
  set deve_trocar_senha = false,
      updated_at = now()
  where id = auth.uid();
$$;

revoke all on function public.paf_concluir_troca_senha() from public, anon;
grant execute on function public.paf_concluir_troca_senha() to authenticated;
