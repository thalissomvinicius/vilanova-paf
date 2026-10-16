import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardVisitReport } from '../src/field/visit-report-model.mjs';

const directories = { producers: [{ id: 'p', nome: 'Produtor <teste>', tipo_produtor: 'PRONAF | PARCERIA' }], users: [{ id: 't', nome: 'Técnica do campo' }], communities: [], properties: [], forms: [{ id: 'remote', codigo: 'assistencia-tecnica-propriedade', definicao_json: { fields: [{ id: 'objetivo', label: 'Objetivo', section: 'Identificação' }, { id: 'outraAtividade', label: 'Outra atividade' }] } }] };
const row = { id: 'visit', formulario_id: 'remote', produtor_id: 'p', tecnico_id: 't', propriedade_id: 'prop', status_validacao: 'aprovado', coletado_em: '2026-10-16T12:00:00Z', dados_json: { objetivo: '<script>alert(1)</script>', outraAtividade: 'STALE', extra: 'Informação adicional', _visitSignatures: ['SECRET'] }, nota_revisao: 'Aprovada' };
test('dashboard uses app report with canonical form, author, modality, review and safe fields', () => {
  const html = dashboardVisitReport(row, directories, { id: 'prop', nome: 'Propriedade', municipio: 'Tomé-Açu' }, { gps: [{ latitude: -3, longitude: -49 }, { tipo: 'ponto', latitude: -2, longitude: -48 }] });
  for (const text of ['Produtor &lt;teste&gt;', 'Pronaf · Parceria', 'Técnica do campo', 'Propriedade', 'Tomé-Açu', 'Validada pela equipe', 'Informação adicional', '-2.000000, -48.000000', 'Aprovada']) assert.ok(html.includes(text), text);
  for (const text of ['<script>', 'SECRET', 'STALE', '_visitSignatures']) assert.ok(!html.includes(text), text);
});
test('dashboard report embeds evidence without substituting missing GPS with zero', () => {
  const png = 'data:image/png;base64,aGVsbG8=';
  const html = dashboardVisitReport(row, directories, null, { gps: [{ latitude: null, longitude: null }] }, { photos: [{ dataUrl: png, caption: 'Foto de campo', stamp: ['Autor original'] }], evidenceSignatures: [{ role: 'attendee', signerName: 'Acompanhante', capturedAt: row.coletado_em, dataUrl: png }], logo: png, companyLogo: png });
  assert.ok(html.includes('Sem GPS'));
  assert.ok(html.includes('1 fotos'));
  assert.ok(html.includes('1 assinaturas'));
  assert.ok(html.includes('alt="Vila Nova Agroindustrial"'));
  assert.ok(html.includes('Acompanhante'));
  assert.ok(!html.includes('0.000000, 0.000000'));
});
