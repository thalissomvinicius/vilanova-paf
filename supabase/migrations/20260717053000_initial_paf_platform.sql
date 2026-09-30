-- Plataforma PAF / VNA Comunidade
-- Base compartilhada para aplicativos de campo, painel administrativo e relatórios.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.paf_papel as enum (
    'super_admin',
    'admin',
    'coordenador',
    'tecnico',
    'agente',
    'auditor',
    'produtor'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.paf_status_validacao as enum (
    'rascunho',
    'pendente',
    'aprovado',
    'rejeitado'
  );
exception
  when duplicate_object then null;
end
$$;

create or replace function public.paf_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.paf_organizacoes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  nome_fantasia text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paf_modulos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  codigo text not null,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, codigo)
);

create table if not exists public.paf_perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete restrict,
  nome text not null,
  email text not null,
  telefone text,
  papel public.paf_papel not null default 'tecnico',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, email)
);

create table if not exists public.headcount_colaboradores (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  perfil_id uuid unique references public.paf_perfis(id) on delete set null,
  matricula text not null,
  nome text not null,
  cargo text,
  setor text,
  telefone text,
  email text,
  status text not null default 'ativo'
    check (status in ('ativo', 'afastado', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, matricula)
);

create or replace function public.paf_organizacao_atual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.organizacao_id
  from public.paf_perfis p
  where p.id = auth.uid() and p.ativo = true
  limit 1;
$$;

create or replace function public.paf_papel_atual()
returns public.paf_papel
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel
  from public.paf_perfis p
  where p.id = auth.uid() and p.ativo = true
  limit 1;
$$;

create or replace function public.paf_eh_gestor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.paf_papel_atual() in ('super_admin', 'admin', 'coordenador'),
    false
  );
$$;

create or replace function public.paf_eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.paf_papel_atual() in (
      'super_admin', 'admin', 'coordenador', 'tecnico', 'agente'
    ),
    false
  );
$$;

create or replace function public.paf_pode_ler_dados()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.paf_papel_atual() in (
      'super_admin', 'admin', 'coordenador', 'tecnico', 'agente', 'auditor'
    ),
    false
  );
$$;

create table if not exists public.paf_comunidades (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete restrict,
  codigo_externo text,
  nome text not null,
  municipio text not null,
  uf char(2) not null default 'PA',
  numero_familias integer check (numero_familias is null or numero_familias >= 0),
  coordenador_nome text,
  latitude double precision,
  longitude double precision,
  ativo boolean not null default true,
  origem text not null default 'app_mobile'
    check (origem in ('app_mobile', 'excel_historico', 'painel_web', 'integracao')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organizacao_id, codigo_externo)
);

create table if not exists public.paf_produtores (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete restrict,
  comunidade_id uuid references public.paf_comunidades(id) on delete set null,
  codigo_externo text,
  nome text not null,
  cpf text,
  telefone text,
  email text,
  endereco text,
  status text not null default 'ativo'
    check (status in ('ativo', 'pendente', 'inativo')),
  origem text not null default 'app_mobile'
    check (origem in ('app_mobile', 'excel_historico', 'painel_web', 'integracao')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organizacao_id, codigo_externo)
);

create unique index if not exists paf_produtores_cpf_uk
  on public.paf_produtores (organizacao_id, cpf)
  where cpf is not null and deleted_at is null;

create table if not exists public.paf_propriedades (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete restrict,
  produtor_id uuid not null references public.paf_produtores(id) on delete restrict,
  codigo_externo text,
  nome text not null,
  municipio text,
  area_hectares numeric(12, 4) check (area_hectares is null or area_hectares >= 0),
  cultura_principal text,
  latitude double precision,
  longitude double precision,
  origem text not null default 'app_mobile'
    check (origem in ('app_mobile', 'excel_historico', 'painel_web', 'integracao')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organizacao_id, codigo_externo)
);

create table if not exists public.mobile_formularios (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  modulo_id uuid references public.paf_modulos(id) on delete set null,
  codigo text not null,
  titulo text not null,
  descricao text,
  categoria text not null,
  escopo text not null default 'produtor'
    check (escopo in ('produtor', 'comunidade', 'propriedade', 'operacao', 'geral')),
  versao integer not null check (versao > 0),
  definicao_json jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  publicado_em timestamptz,
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, codigo, versao)
);

create table if not exists public.mobile_dispositivos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  usuario_id uuid not null references public.paf_perfis(id) on delete cascade,
  identificador text not null,
  plataforma text,
  versao_app text,
  ultimo_sync_em timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, identificador)
);

create table if not exists public.mobile_sync_lotes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  dispositivo_id uuid references public.mobile_dispositivos(id) on delete set null,
  usuario_id uuid references public.paf_perfis(id) on delete set null,
  status text not null default 'iniciado'
    check (status in ('iniciado', 'concluido', 'parcial', 'erro')),
  itens_recebidos integer not null default 0 check (itens_recebidos >= 0),
  itens_processados integer not null default 0 check (itens_processados >= 0),
  detalhes_json jsonb not null default '{}'::jsonb,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz
);

create table if not exists public.mobile_respostas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete restrict,
  modulo_id uuid references public.paf_modulos(id) on delete set null,
  formulario_id uuid not null references public.mobile_formularios(id) on delete restrict,
  formulario_versao integer not null check (formulario_versao > 0),
  produtor_id uuid references public.paf_produtores(id) on delete set null,
  comunidade_id uuid references public.paf_comunidades(id) on delete set null,
  propriedade_id uuid references public.paf_propriedades(id) on delete set null,
  tecnico_id uuid references public.paf_perfis(id) on delete set null,
  dispositivo_id uuid references public.mobile_dispositivos(id) on delete set null,
  sync_lote_id uuid references public.mobile_sync_lotes(id) on delete set null,
  dados_json jsonb not null default '{}'::jsonb,
  observacoes text,
  status_validacao public.paf_status_validacao not null default 'rascunho',
  revisado_por uuid references public.paf_perfis(id) on delete set null,
  revisado_em timestamptz,
  nota_revisao text,
  origem text not null default 'app_mobile'
    check (origem in ('app_mobile', 'excel_historico', 'painel_web', 'integracao')),
  coletado_em timestamptz not null,
  client_updated_at timestamptz not null,
  recebido_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organizacao_id, client_id)
);

create index if not exists mobile_respostas_formulario_idx
  on public.mobile_respostas (organizacao_id, formulario_id, coletado_em desc);
create index if not exists mobile_respostas_produtor_idx
  on public.mobile_respostas (organizacao_id, produtor_id, coletado_em desc);
create index if not exists mobile_respostas_comunidade_idx
  on public.mobile_respostas (organizacao_id, comunidade_id, coletado_em desc);
create index if not exists mobile_respostas_validacao_idx
  on public.mobile_respostas (organizacao_id, status_validacao, coletado_em desc);

create table if not exists public.mobile_gps (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  resposta_id uuid not null references public.mobile_respostas(id) on delete cascade,
  client_id uuid not null,
  tipo text not null default 'ponto'
    check (tipo in ('ponto', 'trilha', 'ocorrencia')),
  sequencia integer,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  precisao_metros numeric(10, 2),
  altitude_metros numeric(10, 2),
  capturado_em timestamptz not null,
  metadados_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organizacao_id, client_id)
);

create index if not exists mobile_gps_resposta_idx
  on public.mobile_gps (resposta_id, sequencia, capturado_em);

create table if not exists public.mobile_anexos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  resposta_id uuid not null references public.mobile_respostas(id) on delete cascade,
  client_id uuid not null,
  tipo text not null default 'foto'
    check (tipo in ('foto', 'documento', 'audio', 'assinatura', 'outro')),
  bucket text not null default 'paf-anexos',
  storage_path text not null,
  nome_arquivo text,
  mime_type text,
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes >= 0),
  hash_sha256 text,
  capturado_em timestamptz,
  metadados_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organizacao_id, client_id),
  unique (bucket, storage_path)
);

create table if not exists public.paf_assistencias (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  produtor_id uuid not null references public.paf_produtores(id) on delete restrict,
  propriedade_id uuid references public.paf_propriedades(id) on delete set null,
  responsavel_id uuid references public.paf_perfis(id) on delete set null,
  titulo text not null,
  descricao text,
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  status text not null default 'aberta'
    check (status in ('aberta', 'em_atendimento', 'concluida', 'cancelada')),
  data_prevista date,
  concluida_em timestamptz,
  origem text not null default 'app_mobile'
    check (origem in ('app_mobile', 'excel_historico', 'painel_web', 'integracao')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_agenda (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  comunidade_id uuid references public.paf_comunidades(id) on delete set null,
  produtor_id uuid references public.paf_produtores(id) on delete set null,
  responsavel_id uuid references public.paf_perfis(id) on delete set null,
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('visita', 'treinamento', 'reuniao', 'outro')),
  inicio_em timestamptz not null,
  fim_em timestamptz,
  local text,
  status text not null default 'agendado'
    check (status in ('agendado', 'realizado', 'cancelado')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_tarefas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  modulo_id uuid references public.paf_modulos(id) on delete set null,
  responsavel_id uuid references public.paf_perfis(id) on delete set null,
  titulo text not null,
  descricao text,
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  status text not null default 'pendente'
    check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  prazo_em timestamptz,
  concluida_em timestamptz,
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_eventos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  comunidade_id uuid references public.paf_comunidades(id) on delete set null,
  titulo text not null,
  descricao text,
  inicio_em timestamptz not null,
  fim_em timestamptz,
  local text,
  capacidade integer check (capacidade is null or capacidade >= 0),
  participantes integer not null default 0 check (participantes >= 0),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_publicacoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  comunidade_id uuid references public.paf_comunidades(id) on delete set null,
  autor_id uuid references public.paf_perfis(id) on delete set null,
  texto text not null,
  imagem_path text,
  local text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_conversas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  produtor_id uuid references public.paf_produtores(id) on delete set null,
  assunto text not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'encerrada')),
  created_by uuid references public.paf_perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.paf_mensagens (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.paf_organizacoes(id) on delete cascade,
  conversa_id uuid not null references public.paf_conversas(id) on delete cascade,
  remetente_id uuid references public.paf_perfis(id) on delete set null,
  corpo text not null,
  lida_em timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace view public.vw_paf_coletas
with (security_invoker = true)
as
select
  r.id,
  r.client_id,
  r.organizacao_id,
  m.codigo as modulo_codigo,
  f.codigo as formulario_codigo,
  f.titulo as formulario_titulo,
  r.formulario_versao,
  r.produtor_id,
  p.nome as produtor_nome,
  r.comunidade_id,
  c.nome as comunidade_nome,
  r.propriedade_id,
  pr.nome as propriedade_nome,
  r.tecnico_id,
  t.nome as tecnico_nome,
  r.status_validacao,
  r.origem,
  r.coletado_em,
  r.recebido_em,
  r.dados_json,
  r.deleted_at
from public.mobile_respostas r
join public.mobile_formularios f on f.id = r.formulario_id
left join public.paf_modulos m on m.id = r.modulo_id
left join public.paf_produtores p on p.id = r.produtor_id
left join public.paf_comunidades c on c.id = r.comunidade_id
left join public.paf_propriedades pr on pr.id = r.propriedade_id
left join public.paf_perfis t on t.id = r.tecnico_id;

insert into public.paf_organizacoes (slug, nome, nome_fantasia)
values ('vila-nova-agroindustrial', 'Vila Nova Agroindustrial', 'Vila Nova')
on conflict (slug) do update
set nome = excluded.nome,
    nome_fantasia = excluded.nome_fantasia,
    updated_at = now();

insert into public.paf_modulos (organizacao_id, codigo, nome, descricao)
select o.id, seed.codigo, seed.nome, seed.descricao
from public.paf_organizacoes o
cross join (
  values
    ('cadastros', 'Cadastros PAF', 'Comunidades, produtores e propriedades'),
    ('socioambiental', 'Socioambiental', 'Diagnosticos familiares e comunitarios'),
    ('assistencia_tecnica', 'Assistencia tecnica', 'Visitas, orientacoes e acompanhamentos'),
    ('cqo', 'CQO', 'Qualidade operacional de corte e carreamento'),
    ('agenda_tarefas', 'Agenda e tarefas', 'Planejamento das equipes de campo'),
    ('comunicacao', 'Comunicacao', 'Publicacoes, eventos e mensagens'),
    ('relatorios', 'Relatorios', 'Indicadores, validacao e auditoria')
) as seed(codigo, nome, descricao)
where o.slug = 'vila-nova-agroindustrial'
on conflict (organizacao_id, codigo) do update
set nome = excluded.nome,
    descricao = excluded.descricao,
    ativo = true,
    updated_at = now();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'paf_organizacoes', 'paf_modulos', 'paf_perfis', 'headcount_colaboradores',
    'paf_comunidades',
    'paf_produtores', 'paf_propriedades', 'mobile_formularios',
    'mobile_dispositivos', 'mobile_respostas', 'paf_assistencias',
    'paf_agenda', 'paf_tarefas', 'paf_eventos', 'paf_publicacoes',
    'paf_conversas'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.paf_set_updated_at()',
      table_name
    );
  end loop;
end
$$;

alter table public.paf_organizacoes enable row level security;
alter table public.paf_modulos enable row level security;
alter table public.paf_perfis enable row level security;
alter table public.headcount_colaboradores enable row level security;
alter table public.paf_comunidades enable row level security;
alter table public.paf_produtores enable row level security;
alter table public.paf_propriedades enable row level security;
alter table public.mobile_formularios enable row level security;
alter table public.mobile_dispositivos enable row level security;
alter table public.mobile_sync_lotes enable row level security;
alter table public.mobile_respostas enable row level security;
alter table public.mobile_gps enable row level security;
alter table public.mobile_anexos enable row level security;
alter table public.paf_assistencias enable row level security;
alter table public.paf_agenda enable row level security;
alter table public.paf_tarefas enable row level security;
alter table public.paf_eventos enable row level security;
alter table public.paf_publicacoes enable row level security;
alter table public.paf_conversas enable row level security;
alter table public.paf_mensagens enable row level security;

create policy "organizacao visivel para membros"
on public.paf_organizacoes for select to authenticated
using (id = public.paf_organizacao_atual());

create policy "gestores administram organizacao"
on public.paf_organizacoes for update to authenticated
using (id = public.paf_organizacao_atual() and public.paf_eh_gestor())
with check (id = public.paf_organizacao_atual() and public.paf_eh_gestor());

create policy "perfil proprio ou equipe gestora"
on public.paf_perfis for select to authenticated
using (
  id = auth.uid()
  or (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor())
);

create policy "gestores administram perfis"
on public.paf_perfis for all to authenticated
using (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor())
with check (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'headcount_colaboradores', 'paf_comunidades', 'paf_produtores',
    'paf_propriedades',
    'mobile_dispositivos', 'mobile_sync_lotes', 'mobile_gps',
    'mobile_anexos', 'paf_assistencias',
    'paf_agenda', 'paf_tarefas', 'paf_eventos', 'paf_publicacoes',
    'paf_conversas', 'paf_mensagens'
  ]
  loop
    execute format(
      'create policy "equipe le dados da organizacao" on public.%I for select to authenticated using (organizacao_id = public.paf_organizacao_atual() and public.paf_pode_ler_dados())',
      table_name
    );
    execute format(
      'create policy "equipe inclui dados da organizacao" on public.%I for insert to authenticated with check (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_equipe())',
      table_name
    );
    execute format(
      'create policy "equipe atualiza dados da organizacao" on public.%I for update to authenticated using (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_equipe()) with check (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_equipe())',
      table_name
    );
    execute format(
      'create policy "gestores removem dados da organizacao" on public.%I for delete to authenticated using (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor())',
      table_name
    );
  end loop;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['paf_modulos', 'mobile_formularios']
  loop
    execute format(
      'create policy "equipe le catalogo da organizacao" on public.%I for select to authenticated using (organizacao_id = public.paf_organizacao_atual() and public.paf_pode_ler_dados())',
      table_name
    );
    execute format(
      'create policy "gestores administram catalogo da organizacao" on public.%I for all to authenticated using (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor()) with check (organizacao_id = public.paf_organizacao_atual() and public.paf_eh_gestor())',
      table_name
    );
  end loop;
end
$$;

create policy "equipe le respostas da organizacao"
on public.mobile_respostas for select to authenticated
using (
  organizacao_id = public.paf_organizacao_atual()
  and public.paf_pode_ler_dados()
);

create policy "tecnicos criam as proprias respostas"
on public.mobile_respostas for insert to authenticated
with check (
  organizacao_id = public.paf_organizacao_atual()
  and public.paf_eh_equipe()
  and (tecnico_id = auth.uid() or public.paf_eh_gestor())
  and status_validacao in ('rascunho', 'pendente')
);

create policy "tecnicos editam respostas ainda nao aprovadas"
on public.mobile_respostas for update to authenticated
using (
  organizacao_id = public.paf_organizacao_atual()
  and (
    public.paf_eh_gestor()
    or (
      tecnico_id = auth.uid()
      and status_validacao in ('rascunho', 'pendente', 'rejeitado')
    )
  )
)
with check (
  organizacao_id = public.paf_organizacao_atual()
  and (
    public.paf_eh_gestor()
    or (
      tecnico_id = auth.uid()
      and status_validacao in ('rascunho', 'pendente')
    )
  )
);

create policy "gestores removem respostas"
on public.mobile_respostas for delete to authenticated
using (
  organizacao_id = public.paf_organizacao_atual()
  and public.paf_eh_gestor()
);

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.paf_organizacao_atual() to authenticated;
grant execute on function public.paf_papel_atual() to authenticated;
grant execute on function public.paf_eh_gestor() to authenticated;
grant execute on function public.paf_eh_equipe() to authenticated;
grant execute on function public.paf_pode_ler_dados() to authenticated;
