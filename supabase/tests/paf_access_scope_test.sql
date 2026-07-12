begin;

select plan(14);

insert into public.paf_producers (id, token, name, cpf, cpf_digits)
values
  (-9101, 'paf-test-producer-1', 'Produtor Teste 1', '000.000.000-01', '00000000001'),
  (-9102, 'paf-test-producer-2', 'Produtor Teste 2', '000.000.000-02', '00000000002');

insert into public.paf_access_accounts (
  id, name, login, access_code_hash, code_hint, account_type,
  active, can_submit_reports, can_manage_visits
)
values (
  -9101, 'Conta Teste', 'TEST-ACCOUNT', 'hash-inicial', '0001', 'ORGANIZACAO',
  true, false, true
);

insert into public.paf_access_account_producers (access_account_id, producer_id)
values (-9101, -9101);

insert into public.paf_auth_sessions (token_hash, role, access_account_id, expires_at)
values (repeat('a', 64), 'access', -9101, now() + interval '1 hour');

select lives_ok(
  $$
    select * from public.paf_update_access_account(
      -9101, 'Conta Atualizada', 'TEST-UPDATED', 'hash-atualizado', '0002',
      'PRODUTOR', null, null, true, true, false, null,
      array[-9102]::bigint[], true
    )
  $$,
  'atualiza conta, escopo e sessões em uma transação'
);

select is(
  (select name from public.paf_access_accounts where id = -9101),
  'Conta Atualizada',
  'atualiza o nome da conta'
);

select is(
  (select account_type from public.paf_access_accounts where id = -9101),
  'PRODUTOR',
  'atualiza o tipo da conta'
);

select is(
  (select can_manage_visits from public.paf_access_accounts where id = -9101),
  false,
  'acesso de produtor não recebe permissão de visitas'
);

select throws_ok(
  $$
    update public.paf_access_accounts
    set can_manage_visits = true
    where id = -9101
  $$
);

select is(
  (select producer_id from public.paf_access_account_producers where access_account_id = -9101),
  -9102::bigint,
  'substitui o escopo do acesso'
);

select is(
  (select count(*) from public.paf_auth_sessions where access_account_id = -9101),
  0::bigint,
  'revoga sessões na atualização sensível'
);

select throws_ok(
  $$
    select * from public.paf_update_access_account(
      -9101, 'Não Persistir', 'SHOULD-NOT-PERSIST', 'hash-inválido', '9999',
      'PRODUTOR', null, null, true, true, false, null,
      array[-9999]::bigint[], false
    )
  $$
);

select is(
  (select login from public.paf_access_accounts where id = -9101),
  'TEST-UPDATED',
  'falha de escopo não persiste atualização parcial'
);

insert into public.paf_auth_sessions (token_hash, role, access_account_id, expires_at)
values (repeat('b', 64), 'access', -9101, now() + interval '1 hour');

select lives_ok(
  $$
    select * from public.paf_change_access_secret(-9101, 'hash-final', 'final')
  $$,
  'troca segredo e revoga sessões em uma transação'
);

select is(
  (select access_code_hash from public.paf_access_accounts where id = -9101),
  'hash-final',
  'persiste o novo segredo'
);

select is(
  (select count(*) from public.paf_auth_sessions where access_account_id = -9101),
  0::bigint,
  'revoga sessões ao trocar segredo'
);

insert into public.paf_reports (id, producer_id)
values (-9101, -9101);

insert into public.paf_technical_visits (id, producer_id)
values (-9102, -9102);

select throws_ok(
  $$
    insert into public.paf_operational_tasks (producer_id, visit_id, title)
    values (-9101, -9102, 'Vínculo inválido')
  $$
);

select throws_ok(
  $$
    insert into public.paf_documents (producer_id, report_id, visit_id, title)
    values (-9101, -9101, -9102, 'Vínculo inválido')
  $$
);

select * from finish();

rollback;
