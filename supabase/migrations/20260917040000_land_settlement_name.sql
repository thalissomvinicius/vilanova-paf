-- Legacy applications keep NULL; the API requires the name on new INCRA submissions.
alter table public.paf_land_requests add column settlement_name text;
alter table public.paf_land_requests add constraint paf_land_settlement_name_check
  check (settlement_name is null or
    (is_federal_settlement is true and char_length(trim(settlement_name)) between 2 and 160));
