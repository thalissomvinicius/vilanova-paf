import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signatureImageBlob } from '../src/field/signature-image.mjs';

test('canvas signatures become PNG blobs without a network request', async () => {
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4AAAAABJRU5ErkJggg==', 'base64');
  const blob = signatureImageBlob(`data:image/png;base64,${bytes.toString('base64')}`);
  assert.equal(blob.type, 'image/png');
  assert.equal(blob.size, bytes.length);
  assert.deepEqual(Buffer.from(await blob.arrayBuffer()), bytes);
});

test('signature decoder rejects remote URLs, unsupported formats, malformed data and oversized payloads', () => {
  for (const image of [undefined, '', 'https://example.invalid/signature.png', 'blob:signature', 'data:image/svg+xml;base64,AAAA', 'data:image/png;base64,!!!=', 'data:image/png;base64,A===', 'data:image/png;base64,AAAAA', `data:image/png;base64,${'A'.repeat(2400004)}`]) assert.throws(() => signatureImageBlob(image), /assinatura/);
});
