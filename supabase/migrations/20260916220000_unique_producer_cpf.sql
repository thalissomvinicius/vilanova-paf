-- Applied after the explicitly approved duplicate cleanup and private backup.
create unique index paf_producers_cpf_digits_unique
  on public.paf_producers(cpf_digits) where cpf_digits <> '';
