-- Bucket privado de evidencias das coletas PAF. Os arquivos sao organizados
-- como <organizacao>/<usuario>/<anexo> e nunca sao publicados diretamente.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'paf-anexos',
  'paf-anexos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "equipe le anexos privados paf" on storage.objects;
drop policy if exists "equipe envia anexos privados paf" on storage.objects;
drop policy if exists "equipe atualiza anexos privados paf" on storage.objects;
drop policy if exists "equipe remove anexos privados paf" on storage.objects;

create policy "equipe le anexos privados paf"
on storage.objects for select to authenticated
using (
  bucket_id = 'paf-anexos'
  and (storage.foldername(name))[1] = (select private.paf_organizacao_atual())::text
  and (select private.paf_pode_ler_dados())
);

create policy "equipe envia anexos privados paf"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'paf-anexos'
  and (storage.foldername(name))[1] = (select private.paf_organizacao_atual())::text
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (select private.paf_eh_gestor())
  )
  and (select private.paf_eh_equipe())
);

create policy "equipe atualiza anexos privados paf"
on storage.objects for update to authenticated
using (
  bucket_id = 'paf-anexos'
  and (storage.foldername(name))[1] = (select private.paf_organizacao_atual())::text
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (select private.paf_eh_gestor())
  )
)
with check (
  bucket_id = 'paf-anexos'
  and (storage.foldername(name))[1] = (select private.paf_organizacao_atual())::text
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (select private.paf_eh_gestor())
  )
);

create policy "equipe remove anexos privados paf"
on storage.objects for delete to authenticated
using (
  bucket_id = 'paf-anexos'
  and (storage.foldername(name))[1] = (select private.paf_organizacao_atual())::text
  and (select private.paf_eh_gestor())
);
