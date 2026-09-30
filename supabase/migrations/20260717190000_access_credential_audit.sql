-- Auditoria da emissão de credenciais temporárias.
-- Senhas nunca são persistidas; somente o evento e o status do e-mail são registrados.

create table if not exists public.paf_acesso_eventos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  ator_id uuid references public.paf_perfis(id) on delete set null,
  usuario_id uuid not null references public.paf_perfis(id) on delete cascade,
  tipo text not null check (tipo in ('acesso_criado', 'senha_redefinida')),
  email_status text not null check (email_status in ('sent', 'not_configured', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists paf_acesso_eventos_organizacao_created_idx
  on public.paf_acesso_eventos (organizacao_id, created_at desc);

create index if not exists paf_acesso_eventos_usuario_created_idx
  on public.paf_acesso_eventos (usuario_id, created_at desc);

create index if not exists paf_acesso_eventos_ator_created_idx
  on public.paf_acesso_eventos (ator_id, created_at desc);

alter table public.paf_acesso_eventos enable row level security;

drop policy if exists "gestores leem auditoria de acessos" on public.paf_acesso_eventos;
create policy "gestores leem auditoria de acessos"
on public.paf_acesso_eventos for select to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

revoke all on table public.paf_acesso_eventos from public, anon, authenticated;
grant select on table public.paf_acesso_eventos to authenticated;

comment on table public.paf_acesso_eventos is
  'Auditoria sem segredos da criação e redefinição de credenciais temporárias.';
