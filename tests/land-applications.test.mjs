import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalLandStore } from '../server/land-store.mjs';
import { landRoute } from '../supabase/functions/paf-api/land-routes.mjs';
import { validateSubmission, validCpf, newProtocol } from '../supabase/functions/paf-api/land-domain.mjs';
import { LAND_CONSENT_VERSION, PARA_MUNICIPALITIES } from '../supabase/functions/paf-api/land-reference.mjs';

const payload = () => ({ clientId: crypto.randomUUID(), fullName: 'Pessoa de Teste', cpf: '529.982.247-25', birthDate: '1980-01-10', state: 'PA', consentVersion: LAND_CONSENT_VERSION, municipality: 'Tomé-Açu', community: 'Comunidade de teste', phone: '91999999999', isFederalSettlement: false, consent: true });
const call = (store, path, method, body, admin = false) => landRoute({ store, path, request: new Request(`https://test.local${path}`, { method, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) }), admin, actor: 'Analista de teste', ip: 'test', salt: 'test-only' });

test('validates CPF, dates, lengths and consent at the boundary', () => {
  assert.equal(validCpf('52998224725'), true);
  assert.equal(validCpf('11111111111'), false);
  assert.equal(validCpf('52998224724'), false);
  assert.equal(validCpf('52998224725a'), false);
  for (const invalid of [{ cpf: '123' }, { birthDate: '2025-02-30' }, { birthDate: '2999-01-01' }, { consent: false }, { fullName: 'Ab' }, { municipality: '' }, { phone: '123' }, { website: 'bot' }]) assert.throws(() => validateSubmission({ ...payload(), ...invalid }));
  assert.match(newProtocol(), /^PAF-(?:[0-9A-F]{6}-){3}[0-9A-F]{6}$/);
});

test('requires a mother name only for federal settlements', () => {
  for (const phone of ['', '   ', undefined, '123']) assert.throws(() => validateSubmission({ ...payload(), phone }));
  assert.equal(validateSubmission({ ...payload(), phone: '+55 (91) 99999-9999' }).phone, '91999999999');
  assert.equal(PARA_MUNICIPALITIES.length, 144);
  for (const invalid of [{ state: 'SP' }, { municipality: 'São Paulo' }, { consentVersion: '2026-09-v1' }, { consent: false }]) assert.throws(() => validateSubmission({ ...payload(), ...invalid }));
  for (const isFederalSettlement of [undefined, null, '', 'false', 1]) assert.throws(() => validateSubmission({ ...payload(), isFederalSettlement }));
  for (const motherName of [undefined, '', '   ', 'Ana', 'a'.repeat(161)]) assert.throws(() => validateSubmission({ ...payload(), isFederalSettlement: true, motherName }));
  assert.equal(validateSubmission({ ...payload(), motherName: 'Discard this name' }).mother_name, null);
  assert.equal(validateSubmission({ ...payload(), isFederalSettlement: true, motherName: '  Maria   de Teste  ' }).mother_name, 'Maria de Teste');
});

test('public submission is idempotent and consultation does not reveal personal data', async () => {
  const store = new LocalLandStore(':memory:'); const body = { ...payload(), isFederalSettlement: true, motherName: 'Maria de Teste' };
  try {
    const first = await call(store, '/api/land/requests', 'POST', body); assert.equal(first.status, 201);
    const result = (await first.json()).request;
    const second = await call(store, '/api/land/requests', 'POST', body);
    assert.equal((await second.json()).request.protocol, result.protocol);
    const collision = await call(store, '/api/land/requests', 'POST', { ...body, fullName: 'Outra Pessoa' }); assert.equal(collision.status, 409);
    const wrong = await call(store, '/api/land/lookup', 'POST', { protocol: result.protocol, cpf: '00000000000' }); assert.equal(wrong.status, 404);
    const found = await call(store, '/api/land/lookup', 'POST', { protocol: result.protocol, cpf: body.cpf });
    const output = (await found.json()).request;
    for (const key of ['cpf', 'full_name', 'phone', 'birth_date', 'client_id', 'fingerprint', 'mother_name', 'is_federal_settlement']) assert.equal(key in output, false);
    const saved = store.list({ status: '', search: '', page: 1 }).requests[0];
    assert.equal(saved.is_federal_settlement, true);
    assert.equal(saved.mother_name, 'Maria de Teste');
    assert.equal(saved.consent_version, LAND_CONSENT_VERSION);
    const adminResult = await call(store, `/api/land/admin/requests/${saved.id}`, 'GET', null, true);
    assert.equal((await adminResult.json()).request.mother_name, 'Maria de Teste');
    assert.equal(store.list({ status: '', search: '', page: 1 }).total, 1);
    assert.equal(store.list({ status: '', search: '529.982.247-25', page: 1 }).total, 1);
  } finally { store.db.close(); }
});

test('only administrators review, history is atomic, stale versions cannot overwrite', async () => {
  const store = new LocalLandStore(':memory:');
  try {
    await call(store, '/api/land/requests', 'POST', payload());
    const row = store.list({ status: '', search: '', page: 1 }).requests[0];
    const path = `/api/land/admin/requests/${row.id}`;
    const review = { status: 'DADOS_INCONSISTENTES', comment: 'Dados informados divergem da documentação. Verificar com a equipe.', version: 1 };
    for (const [url, method, body] of [[path, 'GET'], [path, 'PATCH', review], ['/api/land/admin/requests', 'GET']]) assert.equal((await call(store, url, method, body)).status, 401);
    assert.equal((await call(store, path, 'PATCH', { ...review, comment: '' }, true)).status, 400);
    assert.equal((await call(store, path, 'PATCH', review, true)).status, 200);
    assert.equal((await call(store, path, 'PATCH', review, true)).status, 409);
    assert.equal(store.history(row.id).length, 1);
    assert.equal(store.get(row.id).version, 2);
    const lookup = await call(store, '/api/land/lookup', 'POST', { protocol: row.protocol, cpf: row.cpf });
    const found = (await lookup.json()).request;
    assert.equal(found.status, review.status); assert.equal(found.history[0].comment, review.comment); assert.equal('actor' in found.history[0], false);
    assert.equal(store.list({ status: 'EM_ANALISE', search: '', page: 1 }).total, 0);
  } finally { store.db.close(); }
});

test('rate limits persist in the store and fail closed', async () => {
  const store = new LocalLandStore(':memory:');
  try { for (let i = 0; i < 12; i++) await call(store, '/api/land/requests', 'POST', {}); assert.equal((await call(store, '/api/land/requests', 'POST', payload())).status, 429); }
  finally { store.db.close(); }
});
