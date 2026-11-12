import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendCorrectionAnnex, currentTextCorrections, editableTextFields } from '../src/field/text-corrections.mjs';
const row = { dados_json: { recomendacoes: 'Area original', numero: 12, _visitSignatures: ['sign'] }, observacoes: 'Nota original' };
const fields = [{ id: 'recomendacoes', label: 'Recomendações', type: 'multiline' }, { id: 'numero', type: 'number' }, { id: '_visitSignatures', type: 'text' }];
const revision = { author_name: '<Gestora>', created_at: '2026-11-12T12:00:00Z', corrections: { recomendacoes: 'Área <corrigida>' }, original_json: { recomendacoes: 'Area original' } };
test('only ordinary text and observations can be edited', () => { assert.deepEqual(editableTextFields(row, fields).map(field => field.id), ['recomendacoes','__observacoes']); });
test('PDF retains the signed original, escapes revision content and labels signatures correctly', () => {
  const html = appendCorrectionAnnex('<body><p>Area original</p><p>Assinatura</p></body>', row, fields, revision);
  assert.ok(html.includes('Area original')); assert.ok(html.includes('Área &lt;corrigida&gt;')); assert.ok(html.includes('&lt;Gestora&gt;')); assert.ok(html.includes('Assinatura')); assert.ok(html.includes('assinaturas do documento referem-se exclusivamente ao conteúdo original'));
  assert.equal(row.dados_json.recomendacoes, 'Area original');
});
test('revisions based on a changed original are marked stale and not presented as current', () => {
  const changed = { ...row, dados_json: { ...row.dados_json, recomendacoes: 'Novo original' } };
  assert.deepEqual(currentTextCorrections(changed, fields, revision), { corrections: {}, stale: ['recomendacoes'] });
  const html = appendCorrectionAnnex('<body>Original</body>', changed, fields, revision);
  assert.ok(html.includes('o conteúdo original mudou')); assert.ok(!html.includes('Área &lt;corrigida&gt;'));
});
