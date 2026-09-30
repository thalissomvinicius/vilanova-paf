revoke all privileges
  on public.paf_produtor_tecnicos
  from anon;

revoke truncate, references, trigger
  on public.paf_produtor_tecnicos
  from authenticated;

grant select, insert, update, delete
  on public.paf_produtor_tecnicos
  to authenticated;
