import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerText, canReview, csvCell, mapUrl, normalizeSearch, reviewPatch } from '../src/field/model.mjs';

const profile = { id: 'reviewer', papel: 'admin', ativo: true, organizacao_id: 'paf' };
const collection = { organizacao_id: 'paf', tecnico_id: 'original-author', status_validacao: 'pendente', dados_json: { text: 'original' } };
test('review changes only review metadata and preserves author and answers', () => {
  const patch = reviewPatch(collection, profile, 'aprovado', '', '2026-09-16T00:00:00Z');
  assert.equal(patch.revisado_por, 'reviewer');
  assert.equal(patch.tecnico_id, undefined);
  assert.equal(patch.dados_json, undefined);
  assert.equal({ ...collection, ...patch }.tecnico_id, 'original-author');
  assert.deepEqual(Object.keys(patch).sort(), ['nota_revisao', 'revisado_em', 'revisado_por', 'status_validacao']);
});
test('review rejects foreign organizations, inactive profiles, technicians and initial passwords', () => {
  for (const update of [{ organizacao_id: 'other' }, { ativo: false }, { papel: 'tecnico' }, { deve_trocar_senha: true }]) {
    assert.throws(() => reviewPatch(collection, { ...profile, ...update }, 'aprovado'));
  }
  assert.equal(canReview(null), false);
});
test('review validates status, draft and meaningful adjustment note', () => {
  assert.throws(() => reviewPatch(collection, profile, 'pendente'));
  assert.throws(() => reviewPatch({ ...collection, status_validacao: 'rascunho' }, profile, 'aprovado'));
  assert.throws(() => reviewPatch(collection, profile, 'rejeitado', '  x  '));
  assert.equal(reviewPatch(collection, profile, 'rejeitado', '  Revisar CPF  ').nota_revisao, 'Revisar CPF');
});
test('CSV escapes delimiters and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('a"b;c'), '"a""b;c"');
  for (const value of ['=CMD()', '+SUM()', '@formula', '-1', '  =SUM()']) assert.ok(csvCell(value).startsWith('"\''));
});
test('search and answer formatters handle accents, arrays and booleans', () => {
  assert.equal(normalizeSearch('  Jo\u00e3o '), 'joao');
  assert.equal(answerText(false), 'Nao');
  assert.equal(answerText(['campo', 12]), 'campo, 12');
  assert.equal(answerText(null), 'Nao informado');
});
test('map links reject invalid coordinates but allow equator and meridian', () => {
  assert.equal(mapUrl({ latitude: 0, longitude: 0 }), 'https://www.google.com/maps?q=0,0');
  for (const point of [null, {}, { latitude: 91, longitude: 1 }, { latitude: 1, longitude: -181 }, { latitude: 'bad', longitude: 1 }]) assert.equal(mapUrl(point), null);
});
