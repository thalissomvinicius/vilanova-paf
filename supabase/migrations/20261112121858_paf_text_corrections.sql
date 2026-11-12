-- Corrections are append-only annotations. Signed source responses are never updated.
create table public.paf_text_corrections (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null,
  resposta_id uuid not null references public.mobile_respostas(id),
  expected_updated_at timestamptz not null,
  expected_previous_id uuid,
  corrections jsonb not null,
  original_json jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  author_name text not null default '',
  created_at timestamptz not null default now()
);
create index paf_text_corrections_response_idx on public.paf_text_corrections(resposta_id, created_at desc, id desc);
alter table public.paf_text_corrections enable row level security;
revoke all on public.paf_text_corrections from public, anon, authenticated;
grant select, insert on public.paf_text_corrections to authenticated;
create policy "authorized users read text corrections" on public.paf_text_corrections for select to authenticated
  using (exists (select 1 from public.mobile_respostas r where r.id=resposta_id and r.organizacao_id=paf_text_corrections.organizacao_id and r.deleted_at is null));
create policy "managers append text corrections" on public.paf_text_corrections for insert to authenticated
  with check (created_by=(select auth.uid()) and exists (select 1 from public.paf_perfis p where p.id=(select auth.uid()) and p.organizacao_id=paf_text_corrections.organizacao_id and p.ativo and not p.deve_trocar_senha and p.papel in ('admin','super_admin','coordenador')));

create function private.paf_validate_text_correction() returns trigger
language plpgsql security invoker set search_path=public,private as $$
declare r public.mobile_respostas; f public.mobile_formularios; p public.paf_perfis; latest uuid; k text; v jsonb; fields jsonb; original jsonb := '{}'::jsonb;
begin
  select * into p from public.paf_perfis where id=auth.uid() and ativo and not deve_trocar_senha and papel in ('admin','super_admin','coordenador');
  if p.id is null or new.created_by is distinct from p.id or new.organizacao_id is distinct from p.organizacao_id then raise exception 'Acesso nao autorizado.'; end if;
  select * into r from public.mobile_respostas where id=new.resposta_id and organizacao_id=p.organizacao_id and deleted_at is null for update;
  if r.id is null or r.updated_at is distinct from new.expected_updated_at then raise exception 'A coleta mudou. Atualize e abra novamente.'; end if;
  select id into latest from public.paf_text_corrections where resposta_id=r.id order by created_at desc,id desc limit 1;
  if latest is distinct from new.expected_previous_id then raise exception 'Outra pessoa revisou este texto. Atualize e tente novamente.'; end if;
  select * into f from public.mobile_formularios where id=r.formulario_id and organizacao_id=r.organizacao_id;
  if f.id is null then raise exception 'Formulario indisponivel.'; end if;
  if jsonb_typeof(new.corrections) <> 'object' or pg_column_size(new.corrections)>100000 or (select count(*) from jsonb_object_keys(new.corrections))>100 then raise exception 'Revisao invalida.'; end if;
  fields := case when jsonb_typeof(f.definicao_json)='array' then f.definicao_json else coalesce(f.definicao_json->'fields','[]'::jsonb) end;
  if jsonb_typeof(fields)<>'array' then raise exception 'Definicao de formulario invalida.'; end if;
  for k,v in select key,value from jsonb_each(new.corrections) loop
    if jsonb_typeof(v)<>'string' or length(v#>>'{}')>10000 then raise exception 'Texto revisado invalido.'; end if;
    if k='__observacoes' then
      if r.observacoes is null then raise exception 'Observacao original indisponivel.'; end if;
      original := original || jsonb_build_object(k,r.observacoes);
    else
      if k like '\_%' escape '\' or jsonb_typeof(r.dados_json->k) is distinct from 'string' or not exists (select 1 from jsonb_array_elements(fields) item where item->>'id'=k and item->>'type' in ('text','multiline')) then raise exception 'Campo nao permite revisao de texto.'; end if;
      original := original || jsonb_build_object(k,r.dados_json->>k);
    end if;
  end loop;
  new.original_json := original; new.author_name := p.nome; new.created_at := clock_timestamp();
  return new;
end $$;
revoke all on function private.paf_validate_text_correction() from public, anon, authenticated;
create trigger paf_validate_text_correction before insert on public.paf_text_corrections for each row execute function private.paf_validate_text_correction();
notify pgrst, 'reload schema';
