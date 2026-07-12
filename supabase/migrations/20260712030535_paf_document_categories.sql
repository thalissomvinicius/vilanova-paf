alter table public.paf_documents
  drop constraint if exists paf_documents_category_check;

alter table public.paf_documents
  add constraint paf_documents_category_check
  check (category in (
    'DOCUMENTO PESSOAL',
    'COMPROVANTE',
    'CONTRATO',
    'CAR',
    'FOTO DE CAMPO',
    'EVIDÊNCIA',
    'IDENTIFICAÇÃO',
    'DAP/CAF',
    'LICENÇA',
    'LAUDO',
    'FOTO',
    'OUTRO'
  ));
