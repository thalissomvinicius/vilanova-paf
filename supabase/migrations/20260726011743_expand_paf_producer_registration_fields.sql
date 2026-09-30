alter table public.paf_produtores
  add column if not exists data_nascimento date,
  add column if not exists rg text,
  add column if not exists nome_mae text,
  add column if not exists naturalidade text,
  add column if not exists estado_civil text,
  add column if not exists conjuge text,
  add column if not exists tipo_produtor text,
  add column if not exists area_total_ha numeric,
  add column if not exists tecnico_responsavel text,
  add column if not exists fonte_cadastral text,
  add column if not exists confianca_cruzamento numeric,
  add column if not exists status_importacao text,
  add column if not exists observacoes text,
  add column if not exists dados_cadastrais_json jsonb not null default '{}'::jsonb;

alter table public.paf_propriedades
  add column if not exists nome_provisorio boolean not null default false,
  add column if not exists car text,
  add column if not exists caf text,
  add column if not exists aprt text,
  add column if not exists endereco_rural text,
  add column if not exists comunidade_fonte text,
  add column if not exists observacoes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'paf_produtores_area_total_ha_check'
  ) then
    alter table public.paf_produtores
      add constraint paf_produtores_area_total_ha_check
      check (area_total_ha is null or area_total_ha >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'paf_produtores_confianca_cruzamento_check'
  ) then
    alter table public.paf_produtores
      add constraint paf_produtores_confianca_cruzamento_check
      check (
        confianca_cruzamento is null
        or (
          confianca_cruzamento >= 0
          and confianca_cruzamento <= 1
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'paf_produtores_status_importacao_check'
  ) then
    alter table public.paf_produtores
      add constraint paf_produtores_status_importacao_check
      check (
        status_importacao is null
        or status_importacao in (
          'PRONTO_COMPLETO',
          'PRONTO_SEM_NASCIMENTO',
          'PENDENTE_CPF'
        )
      );
  end if;
end
$$;

comment on column public.paf_produtores.data_nascimento is
  'Data de nascimento confirmada na base cadastral PAF.';

comment on column public.paf_produtores.dados_cadastrais_json is
  'Metadados complementares rastreáveis da consolidação cadastral.';

comment on column public.paf_produtores.status_importacao is
  'Qualidade cadastral do lote importado, sem substituir o status operacional.';

comment on column public.paf_propriedades.nome_provisorio is
  'Indica nome de unidade produtiva gerado quando a fonte não informou nome do imóvel.';
