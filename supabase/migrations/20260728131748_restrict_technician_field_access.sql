-- A equipe gestora enxerga toda a organização. Técnicos e agentes enxergam
-- apenas sua carteira, suas respostas e os registros operacionais relacionados.

drop policy if exists "equipe le vinculos produtor tecnico" on public.paf_produtor_tecnicos;
create policy "gestores ou tecnico proprio leem vinculos"
on public.paf_produtor_tecnicos
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or tecnico_id = (select auth.uid())
  )
);

drop policy if exists "equipe le dados da organizacao" on public.paf_produtores;
drop policy if exists "equipe inclui dados da organizacao" on public.paf_produtores;
drop policy if exists "equipe atualiza dados da organizacao" on public.paf_produtores;

create policy "gestores ou tecnicos vinculados leem produtores"
on public.paf_produtores
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.paf_produtor_tecnicos vinculo
      where vinculo.organizacao_id = paf_produtores.organizacao_id
        and vinculo.produtor_id = paf_produtores.id
        and vinculo.tecnico_id = (select auth.uid())
    )
  )
);

create policy "gestores incluem produtores"
on public.paf_produtores
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

create policy "gestores atualizam produtores"
on public.paf_produtores
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

drop policy if exists "equipe le dados da organizacao" on public.paf_propriedades;
drop policy if exists "equipe inclui dados da organizacao" on public.paf_propriedades;
drop policy if exists "equipe atualiza dados da organizacao" on public.paf_propriedades;

create policy "gestores ou tecnicos vinculados leem propriedades"
on public.paf_propriedades
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.paf_produtor_tecnicos vinculo
      where vinculo.organizacao_id = paf_propriedades.organizacao_id
        and vinculo.produtor_id = paf_propriedades.produtor_id
        and vinculo.tecnico_id = (select auth.uid())
    )
  )
);

create policy "gestores incluem propriedades"
on public.paf_propriedades
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

create policy "gestores atualizam propriedades"
on public.paf_propriedades
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (select private.paf_eh_gestor())
);

drop policy if exists "equipe le respostas da organizacao" on public.mobile_respostas;
drop policy if exists "tecnicos criam as proprias respostas" on public.mobile_respostas;
drop policy if exists "tecnicos editam respostas ainda nao aprovadas" on public.mobile_respostas;

create policy "gestores ou tecnicos proprios leem respostas"
on public.mobile_respostas
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or tecnico_id = (select auth.uid())
  )
);

create policy "tecnicos criam respostas para sua carteira"
on public.mobile_respostas
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and status_validacao in ('rascunho', 'pendente')
  and (
    (select private.paf_eh_gestor())
    or (
      tecnico_id = (select auth.uid())
      and (
        produtor_id is null
        or exists (
          select 1
          from public.paf_produtor_tecnicos vinculo
          where vinculo.organizacao_id = mobile_respostas.organizacao_id
            and vinculo.produtor_id = mobile_respostas.produtor_id
            and vinculo.tecnico_id = (select auth.uid())
        )
      )
    )
  )
);

create policy "tecnicos editam respostas da sua carteira"
on public.mobile_respostas
for update
to authenticated
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
      and (
        produtor_id is null
        or exists (
          select 1
          from public.paf_produtor_tecnicos vinculo
          where vinculo.organizacao_id = mobile_respostas.organizacao_id
            and vinculo.produtor_id = mobile_respostas.produtor_id
            and vinculo.tecnico_id = (select auth.uid())
        )
      )
    )
  )
);

drop policy if exists "equipe le dados da organizacao" on public.mobile_gps;
drop policy if exists "equipe inclui dados da organizacao" on public.mobile_gps;
drop policy if exists "equipe atualiza dados da organizacao" on public.mobile_gps;

create policy "gestores ou tecnicos proprios leem gps"
on public.mobile_gps
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_gps.resposta_id
        and resposta.organizacao_id = mobile_gps.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

create policy "tecnicos incluem gps nas proprias respostas"
on public.mobile_gps
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_gps.resposta_id
        and resposta.organizacao_id = mobile_gps.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

create policy "tecnicos atualizam gps das proprias respostas"
on public.mobile_gps
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_gps.resposta_id
        and resposta.organizacao_id = mobile_gps.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_gps.resposta_id
        and resposta.organizacao_id = mobile_gps.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

drop policy if exists "equipe le dados da organizacao" on public.mobile_anexos;
drop policy if exists "equipe inclui dados da organizacao" on public.mobile_anexos;
drop policy if exists "equipe atualiza dados da organizacao" on public.mobile_anexos;

create policy "gestores ou tecnicos proprios leem anexos"
on public.mobile_anexos
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_anexos.resposta_id
        and resposta.organizacao_id = mobile_anexos.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

create policy "tecnicos incluem anexos nas proprias respostas"
on public.mobile_anexos
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_anexos.resposta_id
        and resposta.organizacao_id = mobile_anexos.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

create policy "tecnicos atualizam anexos das proprias respostas"
on public.mobile_anexos
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_anexos.resposta_id
        and resposta.organizacao_id = mobile_anexos.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or exists (
      select 1
      from public.mobile_respostas resposta
      where resposta.id = mobile_anexos.resposta_id
        and resposta.organizacao_id = mobile_anexos.organizacao_id
        and resposta.tecnico_id = (select auth.uid())
    )
  )
);

drop policy if exists "equipe le dados da organizacao" on public.paf_assistencias;
drop policy if exists "equipe inclui dados da organizacao" on public.paf_assistencias;
drop policy if exists "equipe atualiza dados da organizacao" on public.paf_assistencias;

create policy "gestores ou tecnicos vinculados leem assistencias"
on public.paf_assistencias
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or responsavel_id = (select auth.uid())
    or exists (
      select 1
      from public.paf_produtor_tecnicos vinculo
      where vinculo.organizacao_id = paf_assistencias.organizacao_id
        and vinculo.produtor_id = paf_assistencias.produtor_id
        and vinculo.tecnico_id = (select auth.uid())
    )
  )
);

create policy "tecnicos incluem assistencias da sua carteira"
on public.paf_assistencias
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      responsavel_id = (select auth.uid())
      and created_by = (select auth.uid())
      and exists (
        select 1
        from public.paf_produtor_tecnicos vinculo
        where vinculo.organizacao_id = paf_assistencias.organizacao_id
          and vinculo.produtor_id = paf_assistencias.produtor_id
          and vinculo.tecnico_id = (select auth.uid())
      )
    )
  )
);

create policy "tecnicos atualizam assistencias da sua carteira"
on public.paf_assistencias
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      (responsavel_id = (select auth.uid()) or created_by = (select auth.uid()))
      and exists (
        select 1
        from public.paf_produtor_tecnicos vinculo
        where vinculo.organizacao_id = paf_assistencias.organizacao_id
          and vinculo.produtor_id = paf_assistencias.produtor_id
          and vinculo.tecnico_id = (select auth.uid())
      )
    )
  )
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      (responsavel_id = (select auth.uid()) or created_by = (select auth.uid()))
      and exists (
        select 1
        from public.paf_produtor_tecnicos vinculo
        where vinculo.organizacao_id = paf_assistencias.organizacao_id
          and vinculo.produtor_id = paf_assistencias.produtor_id
          and vinculo.tecnico_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "equipe le dados da organizacao" on public.paf_agenda;
drop policy if exists "equipe inclui dados da organizacao" on public.paf_agenda;
drop policy if exists "equipe atualiza dados da organizacao" on public.paf_agenda;

create policy "gestores ou responsavel leem agenda"
on public.paf_agenda
for select
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or responsavel_id = (select auth.uid())
  )
);

create policy "tecnicos incluem a propria agenda"
on public.paf_agenda
for insert
to authenticated
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or (
      responsavel_id = (select auth.uid())
      and created_by = (select auth.uid())
    )
  )
);

create policy "tecnicos atualizam a propria agenda"
on public.paf_agenda
for update
to authenticated
using (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or responsavel_id = (select auth.uid())
  )
)
with check (
  organizacao_id = (select private.paf_organizacao_atual())
  and (
    (select private.paf_eh_gestor())
    or responsavel_id = (select auth.uid())
  )
);

create index if not exists paf_produtor_tecnicos_tecnico_produtor_idx
  on public.paf_produtor_tecnicos (tecnico_id, produtor_id);
create index if not exists mobile_respostas_tecnico_coletado_idx
  on public.mobile_respostas (tecnico_id, coletado_em desc)
  where deleted_at is null;
create index if not exists paf_assistencias_responsavel_idx
  on public.paf_assistencias (responsavel_id)
  where deleted_at is null;
create index if not exists paf_agenda_responsavel_inicio_idx
  on public.paf_agenda (responsavel_id, inicio_em)
  where deleted_at is null;
