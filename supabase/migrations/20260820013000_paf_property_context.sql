-- Property and community context for field visits. The current pilot tracks
-- one principal property per producer while preserving a visit-time snapshot.

alter table public.paf_producers
  add column if not exists property_name text,
  add column if not exists community text;

update public.paf_producers
set property_name = 'Propriedade principal'
where property_name is null or btrim(property_name) = '';

alter table public.paf_producers
  alter column property_name set default 'Propriedade principal',
  alter column property_name set not null;

alter table public.paf_producers
  drop constraint if exists paf_producers_property_name_length,
  add constraint paf_producers_property_name_length check (char_length(property_name) between 1 and 180),
  drop constraint if exists paf_producers_community_length,
  add constraint paf_producers_community_length check (community is null or char_length(community) <= 160);

alter table public.paf_technical_visits
  add column if not exists property_name text,
  add column if not exists community text;

update public.paf_technical_visits as visit
set property_name = producer.property_name,
    community = coalesce(visit.community, producer.community)
from public.paf_producers as producer
where producer.id = visit.producer_id
  and (visit.property_name is null or btrim(visit.property_name) = '');

alter table public.paf_technical_visits
  drop constraint if exists paf_visits_property_name_length,
  add constraint paf_visits_property_name_length check (property_name is null or char_length(property_name) <= 180),
  drop constraint if exists paf_visits_community_length,
  add constraint paf_visits_community_length check (community is null or char_length(community) <= 160);

create index if not exists paf_producers_community_idx
  on public.paf_producers (community)
  where community is not null;

create index if not exists paf_visits_property_idx
  on public.paf_technical_visits (producer_id, property_name);
