import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerText, canDeleteCollection, canReview, collectionExportRows, csvCell, deletionArguments, mapUrl, matchesProgram, normalizeSearch, photoStamp, programLabel, reviewPatch } from '../src/field/model.mjs';

test('program filter includes mixed portfolios without matching partial labels', () => {
  assert.equal(matchesProgram('PRONAF | PARCERIA', 'PARCERIA'), true);
  assert.equal(matchesProgram('PRONAF', 'PARCERIA'), false);
  assert.equal(matchesProgram(null, 'PRONAF'), false);
  assert.equal(matchesProgram('NAO PRONAF', 'PRONAF'), false);
  assert.equal(matchesProgram(null, ''), true);
});
test('field export includes answers, modality, review and displacement without signature payloads', () => {
  const directories = { producers: [{ id: 'p', nome: 'Teste', tipo_produtor: 'PRONAF' }], users: [], properties: [], communities: [], forms: [{ id: 'f', titulo: 'Visita', definicao_json: { fields: [{ id: 'goal', label: 'Objetivo' }] } }] };
  const rows = collectionExportRows([{ id: 'v', produtor_id: 'p', formulario_id: 'f', status_validacao: 'rejeitado', nota_revisao: 'Revisar', dados_json: { goal: '=CMD()', _visitSignatures: ['private'], _areaVerification: { displacement: true, justification: 'Conferir' } } }], directories);
  assert.equal(rows[0].length, rows[1].length);
  assert.ok(rows[0].includes('Objetivo [goal]'));
  assert.ok(rows[1].includes('Pronaf'));
  assert.ok(rows[1].includes('Revisar'));
  assert.ok(rows[1].includes('Conferir'));
  assert.ok(!JSON.stringify(rows).includes('private'));
  assert.ok(rows[1].map(csvCell).join(';').includes("'=CMD()"));
});

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
test('deletion is admin-only, scoped, reasoned and optimistic', () => {
  const row = { ...collection, id: 'visit', updated_at: '2026-10-15T12:00:00Z' };
  assert.deepEqual(deletionArguments(row, profile, '  Registro de teste  '), { p_response: 'visit', p_expected_updated_at: row.updated_at, p_reason: 'Registro de teste' });
  for (const update of [{ papel: 'tecnico' }, { papel: 'coordenador' }, { ativo: false }, { deve_trocar_senha: true }]) {
    assert.equal(canDeleteCollection({ ...profile, ...update }), false);
    assert.throws(() => deletionArguments(row, { ...profile, ...update }, 'Teste excluído'));
  }
  assert.throws(() => deletionArguments({ ...row, organizacao_id: 'other' }, profile, 'Teste excluído'));
  assert.throws(() => deletionArguments(row, profile, 'x'));
  assert.throws(() => deletionArguments({ ...row, deleted_at: row.updated_at }, profile, 'Teste excluído'));
});
test('photo labels use matching photo GPS, preserve zero and registered modalities', () => {
  const lines = photoStamp({ client_id: 'photo-1', capturado_em: '2026-10-15T15:00:00Z' }, [{ latitude: 0, longitude: -48, metadados_json: { evidence_client_id: 'photo-1' } }], 'Produtor', 'Técnico');
  assert.match(lines.join(' '), /12:00/);
  assert.match(lines.join(' '), /0.000000, -48.000000/);
  assert.equal(programLabel('PRONAF | PARCERIA'), 'Pronaf · Parceria');
  assert.equal(programLabel('PRODUTIVO'), 'Produtivo');
  assert.match(photoStamp({}, [], 'Produtor', 'Técnico').join(' '), /não registrado/);
});
