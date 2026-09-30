-- Vínculo administrativo entre famílias produtoras e técnicos de campo.
-- O campo textual legado paf_produtores.tecnico_responsavel é preservado
-- para manter rastreabilidade dos nomes que vieram das planilhas.

create unique index if not exists paf_produtores_id_organizacao_uk
  on public.paf_produtores (id, organizacao_id);

create unique index if not exists paf_perfis_id_organizacao_uk
  on public.paf_perfis (id, organizacao_id);

create table if not exists public.paf_produtor_tecnicos (
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  produtor_id uuid not null,
  tecnico_id uuid not null,
  principal boolean not null default false,
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (produtor_id, tecnico_id),
  constraint paf_produtor_tecnicos_produtor_org_fkey
    foreign key (produtor_id, organizacao_id)
    references public.paf_produtores(id, organizacao_id)
    on delete cascade,
  constraint paf_produtor_tecnicos_tecnico_org_fkey
    foreign key (tecnico_id, organizacao_id)
    references public.paf_perfis(id, organizacao_id)
    on delete cascade
);

create unique index if not exists paf_produtor_tecnicos_principal_uk
  on public.paf_produtor_tecnicos (produtor_id)
  where principal;

create index if not exists paf_produtor_tecnicos_tecnico_idx
  on public.paf_produtor_tecnicos (organizacao_id, tecnico_id, produtor_id);

alter table public.paf_produtor_tecnicos enable row level security;

grant select, insert, update, delete
  on public.paf_produtor_tecnicos
  to authenticated;

drop policy if exists "equipe le vinculos produtor tecnico" on public.paf_produtor_tecnicos;
drop policy if exists "gestores incluem vinculos produtor tecnico" on public.paf_produtor_tecnicos;
drop policy if exists "gestores atualizam vinculos produtor tecnico" on public.paf_produtor_tecnicos;
drop policy if exists "gestores removem vinculos produtor tecnico" on public.paf_produtor_tecnicos;

create policy "equipe le vinculos produtor tecnico"
on public.paf_produtor_tecnicos for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_pode_ler_dados())
);

create policy "gestores incluem vinculos produtor tecnico"
on public.paf_produtor_tecnicos for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.paf_perfis perfil
    where perfil.id = tecnico_id
      and perfil.organizacao_id = paf_produtor_tecnicos.organizacao_id
      and perfil.ativo
      and perfil.papel in ('coordenador', 'tecnico', 'agente')
  )
);

create policy "gestores atualizam vinculos produtor tecnico"
on public.paf_produtor_tecnicos for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
  and exists (
    select 1
    from public.paf_perfis perfil
    where perfil.id = tecnico_id
      and perfil.organizacao_id = paf_produtor_tecnicos.organizacao_id
      and perfil.ativo
      and perfil.papel in ('coordenador', 'tecnico', 'agente')
  )
);

create policy "gestores removem vinculos produtor tecnico"
on public.paf_produtor_tecnicos for delete
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

comment on table public.paf_produtor_tecnicos is
  'Técnicos de campo designados para acompanhar cada família produtora.';

comment on column public.paf_produtor_tecnicos.principal is
  'Identifica o técnico principal quando houver mais de um responsável.';
