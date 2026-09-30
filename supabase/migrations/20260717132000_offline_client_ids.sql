-- Identificadores idempotentes para os modulos que tambem nascem offline.

alter table public.paf_assistencias add column if not exists client_id text;
alter table public.paf_agenda add column if not exists client_id text;
alter table public.paf_tarefas add column if not exists client_id text;
alter table public.paf_eventos add column if not exists client_id text;
alter table public.paf_publicacoes add column if not exists client_id text;
alter table public.paf_conversas add column if not exists client_id text;
alter table public.paf_mensagens add column if not exists client_id text;

update public.paf_assistencias set client_id = id::text where client_id is null;
update public.paf_agenda set client_id = id::text where client_id is null;
update public.paf_tarefas set client_id = id::text where client_id is null;
update public.paf_eventos set client_id = id::text where client_id is null;
update public.paf_publicacoes set client_id = id::text where client_id is null;
update public.paf_conversas set client_id = id::text where client_id is null;
update public.paf_mensagens set client_id = id::text where client_id is null;

alter table public.paf_assistencias alter column client_id set not null;
alter table public.paf_agenda alter column client_id set not null;
alter table public.paf_tarefas alter column client_id set not null;
alter table public.paf_eventos alter column client_id set not null;
alter table public.paf_publicacoes alter column client_id set not null;
alter table public.paf_conversas alter column client_id set not null;
alter table public.paf_mensagens alter column client_id set not null;

create unique index if not exists paf_assistencias_org_client_uidx on public.paf_assistencias (organizacao_id, client_id);
create unique index if not exists paf_agenda_org_client_uidx on public.paf_agenda (organizacao_id, client_id);
create unique index if not exists paf_tarefas_org_client_uidx on public.paf_tarefas (organizacao_id, client_id);
create unique index if not exists paf_eventos_org_client_uidx on public.paf_eventos (organizacao_id, client_id);
create unique index if not exists paf_publicacoes_org_client_uidx on public.paf_publicacoes (organizacao_id, client_id);
create unique index if not exists paf_conversas_org_client_uidx on public.paf_conversas (organizacao_id, client_id);
create unique index if not exists paf_mensagens_org_client_uidx on public.paf_mensagens (organizacao_id, client_id);

alter table public.paf_publicacoes add column if not exists curtidas integer not null default 0 check (curtidas >= 0);
alter table public.paf_publicacoes add column if not exists comentarios integer not null default 0 check (comentarios >= 0);
