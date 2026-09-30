-- Os formulários CQO não fazem parte da operação do PAF VNA Comunidade.
-- Respostas existentes permanecem preservadas para auditoria e histórico.
update public.mobile_formularios
set ativo = false,
    updated_at = now()
where codigo in ('cqo-corte', 'cqo-carreamento')
  and ativo = true;
