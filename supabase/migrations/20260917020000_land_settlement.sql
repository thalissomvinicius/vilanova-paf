alter table public.paf_land_requests
  add column is_federal_settlement boolean,
  add column mother_name text;

-- Existing applications remain unanswered instead of being classified as "no".
alter table public.paf_land_requests add constraint paf_land_settlement_mother_check
  check (
    (is_federal_settlement is true and mother_name is not null
      and char_length(trim(mother_name)) between 5 and 160)
    or (is_federal_settlement is not true and mother_name is null)
  );
