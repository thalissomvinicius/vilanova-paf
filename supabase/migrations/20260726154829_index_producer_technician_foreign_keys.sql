create index if not exists paf_produtor_tecnicos_created_by_idx
  on public.paf_produtor_tecnicos (created_by)
  where created_by is not null;

create index if not exists paf_produtor_tecnicos_produtor_org_idx
  on public.paf_produtor_tecnicos (produtor_id, organizacao_id);

create index if not exists paf_produtor_tecnicos_tecnico_org_idx
  on public.paf_produtor_tecnicos (tecnico_id, organizacao_id);
