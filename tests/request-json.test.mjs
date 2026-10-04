import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../src/lib/request-json.mjs';

test('request deadlines and response validation', async t => {
  const original = globalThis.fetch;
  try {
    await t.test('successful JSON and server errors retain status', async () => {
      globalThis.fetch = async () => Response.json({ ok: true });
      assert.deepEqual(await requestJson('/test'), { ok: true });
      globalThis.fetch = async () => Response.json({ error: 'Aguarde' }, { status: 429 });
      await assert.rejects(requestJson('/test'), error => error.status === 429 && error.message === 'Aguarde');
    });
    await t.test('HTML and malformed successful responses never become fake success', async () => {
      globalThis.fetch = async () => new Response('<html>Login</html>');
      await assert.rejects(requestJson('/test'), /Resposta inesperada/);
      globalThis.fetch = async () => Response.json(null);
      await assert.rejects(requestJson('/test'), /Resposta inesperada/);
    });
    await t.test('deadline covers hanging headers with external signal', async () => {
      globalThis.fetch = async () => new Promise(() => {});
      await assert.rejects(requestJson('/test', { timeoutMs: 15, signal: new AbortController().signal }), /demorou/);
    });
    await t.test('deadline covers hanging response body', async () => {
      globalThis.fetch = async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) });
      await assert.rejects(requestJson('/test', { timeoutMs: 15 }), /demorou/);
    });
    await t.test('deadline covers session preparation and prevents late fetch', async () => {
      let called = false;
      globalThis.fetch = async () => { called = true; return Response.json({}); };
      await assert.rejects(requestJson('/test', { timeoutMs: 15 }, () => new Promise(() => {})), /demorou/);
      assert.equal(called, false);
    });
    await t.test('caller cancellation is preserved', async () => {
      const controller = new AbortController();
      globalThis.fetch = async () => new Promise(() => {});
      const request = requestJson('/test', { timeoutMs: 500, signal: controller.signal });
      controller.abort();
      await assert.rejects(request, error => error.name === 'AbortError');
    });
    await t.test('network failure is actionable, never automatically retries writes', async () => {
      let count = 0;
      globalThis.fetch = async () => { count++; throw new TypeError('Failed to fetch'); };
      await assert.rejects(requestJson('/test', { method: 'POST' }), /Verifique sua internet/);
      assert.equal(count, 1);
    });
  } finally { globalThis.fetch = original; }
});
