-- Mantém somente os dois formulários oficiais do PAF para novas coletas.
-- Registros históricos permanecem preservados em mobile_respostas.

do $$
declare
  org_id uuid;
  socio_module_id uuid;
  assistance_module_id uuid;
  socio_definition jsonb;
begin
  select id into org_id
  from public.paf_organizacoes
  where slug = 'vila-nova-agroindustrial';

  if org_id is null then
    raise exception 'Organização Vila Nova Agroindustrial não localizada';
  end if;

  select id into socio_module_id
  from public.paf_modulos
  where organizacao_id = org_id and codigo = 'socioambiental';

  select id into assistance_module_id
  from public.paf_modulos
  where organizacao_id = org_id and codigo = 'assistencia_tecnica';

  select definicao_json into socio_definition
  from public.mobile_formularios
  where organizacao_id = org_id
    and codigo = 'levantamento-socioambiental-comunitario'
  order by versao desc
  limit 1;

  socio_definition := jsonb_set(
    coalesce(socio_definition, '{"fields":[]}'::jsonb),
    '{evidencePolicy}',
    '{"gpsRequired":true,"minPhotos":1,"cameraOnly":true,"photoLocationRequired":true}'::jsonb,
    true
  );

  update public.mobile_formularios
  set ativo = false,
      updated_at = now()
  where organizacao_id = org_id;

  insert into public.mobile_formularios (
    organizacao_id,
    modulo_id,
    codigo,
    titulo,
    descricao,
    categoria,
    escopo,
    versao,
    definicao_json,
    ativo,
    publicado_em
  )
  values (
    org_id,
    socio_module_id,
    'levantamento-socioambiental-comunitario',
    'Levantamento socioambiental comunitário',
    'Diagnóstico socioeconômico e comunitário do Programa de Agricultura Familiar.',
    'Socioambiental',
    'comunidade',
    2,
    socio_definition,
    true,
    now()
  )
  on conflict (organizacao_id, codigo, versao) do update
  set modulo_id = excluded.modulo_id,
      titulo = excluded.titulo,
      descricao = excluded.descricao,
      categoria = excluded.categoria,
      escopo = excluded.escopo,
      definicao_json = excluded.definicao_json,
      ativo = true,
      publicado_em = excluded.publicado_em,
      updated_at = now();

  insert into public.mobile_formularios (
    organizacao_id,
    modulo_id,
    codigo,
    titulo,
    descricao,
    categoria,
    escopo,
    versao,
    definicao_json,
    ativo,
    publicado_em
  )
  values (
    org_id,
    assistance_module_id,
    'assistencia-tecnica-propriedade',
    'Assistência técnica e visita à propriedade',
    'Ficha de campo PAF para orientação técnica, documentação, retorno e evidências georreferenciadas.',
    'Campo',
    'produtor',
    2,
    '{
      "evidencePolicy": {
        "gpsRequired": true,
        "minPhotos": 2,
        "cameraOnly": true,
        "photoLocationRequired": true
      },
      "fields": [
        {"id":"dataVisita","label":"Data da visita","type":"date","required":true,"section":"1. Identificação da visita"},
        {"id":"tecnicoResponsavel","label":"Técnico responsável","type":"text","required":true,"section":"1. Identificação da visita"},
        {"id":"anoPlantio","label":"Ano de plantio","type":"number","section":"1. Identificação da visita"},
        {"id":"enderecoImovel","label":"Endereço do imóvel","type":"text","section":"1. Identificação da visita"},
        {"id":"municipio","label":"Município","type":"text","required":true,"section":"1. Identificação da visita"},
        {"id":"uf","label":"UF","type":"text","required":true,"section":"1. Identificação da visita"},
        {"id":"denominacaoImovel","label":"Denominação do imóvel","type":"text","required":true,"section":"1. Identificação da visita"},
        {"id":"objetivoAssistencia","label":"Objetivo da assistência técnica","type":"multiline","required":true,"section":"1. Identificação da visita","placeholder":"Descreva o motivo da visita e a demanda do produtor."},
        {"id":"atividadesManutencao","label":"Atividades de manutenção acompanhadas","type":"multi_select","required":true,"section":"2. Atividades de manutenção","options":["Colheita","Adubação NPK","Coroamento físico","Poda","Fitossanidade","Rebaixo/empilhamento","Qualidade CFF","Limpeza da área total","Outros"]},
        {"id":"outraAtividade","label":"Outra atividade","type":"text","section":"2. Atividades de manutenção"},
        {"id":"recomendacoesTecnicas","label":"Recomendações técnicas","type":"multiline","required":true,"section":"3. Recomendações técnicas","placeholder":"Registre as orientações fornecidas, medidas, prazos e responsáveis."},
        {"id":"statusCAR","label":"Situação do CAR","type":"select","required":true,"section":"4. Documentação da propriedade","options":["Ativo","Pendente","Suspenso","Cancelado","Não informado"]},
        {"id":"statusCAF","label":"Situação do CAF","type":"select","required":true,"section":"4. Documentação da propriedade","options":["Ativo","Inativo","Não possui","Não informado"]},
        {"id":"statusDLA","label":"Situação da DLA","type":"select","required":true,"section":"4. Documentação da propriedade","options":["Ativa","Inativa","Não possui","Não informado"]},
        {"id":"observacoes","label":"Observações da visita","type":"multiline","section":"5. Encerramento e retorno"},
        {"id":"proximaVistoria","label":"Próxima vistoria","type":"date","section":"5. Encerramento e retorno"},
        {"id":"localVisita","label":"Local da visita","type":"text","required":true,"section":"5. Encerramento e retorno"},
        {"id":"confirmacaoProdutor","label":"O produtor confirma o recebimento das orientações?","type":"boolean","required":true,"section":"5. Encerramento e retorno"},
        {"id":"nomeConfirmacaoProdutor","label":"Nome do produtor que confirmou","type":"text","required":true,"section":"5. Encerramento e retorno"}
      ]
    }'::jsonb,
    true,
    now()
  )
  on conflict (organizacao_id, codigo, versao) do update
  set modulo_id = excluded.modulo_id,
      titulo = excluded.titulo,
      descricao = excluded.descricao,
      categoria = excluded.categoria,
      escopo = excluded.escopo,
      definicao_json = excluded.definicao_json,
      ativo = true,
      publicado_em = excluded.publicado_em,
      updated_at = now();
end
$$;
