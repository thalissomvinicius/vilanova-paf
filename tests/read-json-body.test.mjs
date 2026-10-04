import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJsonBody } from '../supabase/functions/paf-api/read-json-body.mjs';
const request = body => new Request('https://paf.test', { method: 'POST', headers: { 'content-type': 'application/json' }, body });

test('JSON body validates structure without disclosing malformed input', async () => {
  assert.deepEqual(await readJsonBody(request('{"nome":"Joao"}')), { nome: 'Joao' });
  for (const body of ['null', '[]', '"private-text"', '{"password":secret}']) await assert.rejects(readJsonBody(request(body)), error => error.status === 400 && !error.message.includes('secret'));
});
test('JSON size is bounded even without content-length', async () => {
  await assert.rejects(readJsonBody(request('{"name":"' + 'a'.repeat(200) + '"}'), { limit: 100 }), error => error.status === 413);
});
test('interrupted request body has a deadline and cancels the stream', async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{')); }, cancel() { cancelled = true; } });
  const input = new Request('https://paf.test', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' });
  await assert.rejects(readJsonBody(input, { timeoutMs: 15 }), error => error.status === 408);
  assert.equal(cancelled, true);
});
