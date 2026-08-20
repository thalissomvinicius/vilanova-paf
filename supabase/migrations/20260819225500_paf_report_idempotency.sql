alter table public.paf_reports
  add column if not exists client_submission_id text;

alter table public.paf_reports
  drop constraint if exists paf_reports_client_submission_format;

alter table public.paf_reports
  add constraint paf_reports_client_submission_format
  check (
    client_submission_id is null
    or client_submission_id ~ '^[a-z0-9][a-z0-9._:-]{7,79}$'
  );

create unique index if not exists paf_reports_client_submission_unique
  on public.paf_reports (producer_id, client_submission_id)
  where client_submission_id is not null;

alter table public.paf_technical_visits
  add column if not exists client_submission_id text,
  add column if not exists started_at timestamptz,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists location_accuracy numeric(10, 2);

alter table public.paf_technical_visits
  drop constraint if exists paf_visits_client_submission_format,
  drop constraint if exists paf_visits_latitude_range,
  drop constraint if exists paf_visits_longitude_range,
  drop constraint if exists paf_visits_accuracy_range;

alter table public.paf_technical_visits
  add constraint paf_visits_client_submission_format check (
    client_submission_id is null
    or client_submission_id ~ '^[a-z0-9][a-z0-9._:-]{7,79}$'
  ),
  add constraint paf_visits_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint paf_visits_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint paf_visits_accuracy_range check (location_accuracy is null or location_accuracy >= 0),
  add constraint paf_visits_location_pair check ((latitude is null) = (longitude is null));

create unique index if not exists paf_visits_client_submission_unique
  on public.paf_technical_visits (producer_id, client_submission_id)
  where client_submission_id is not null;

alter table public.paf_documents
  add column if not exists client_submission_id text;

alter table public.paf_documents
  add constraint paf_documents_client_submission_format check (
    client_submission_id is null
    or client_submission_id ~ '^[a-z0-9][a-z0-9._:-]{7,79}$'
  );

create unique index if not exists paf_documents_client_submission_unique
  on public.paf_documents (visit_id, client_submission_id)
  where visit_id is not null and client_submission_id is not null;
