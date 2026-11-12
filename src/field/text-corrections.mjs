export function editableTextFields(row, fields) {
  const items = fields.filter(field => ['text', 'multiline'].includes(field?.type) && typeof row.dados_json?.[field.id] === 'string' && !field.id.startsWith('_')).map(field => ({ id: field.id, label: field.label || field.id, original: row.dados_json[field.id] }));
  if (row.observacoes != null) items.push({ id: '__observacoes', label: 'Observações complementares', original: row.observacoes });
  return items;
}
export function currentTextCorrections(row, fields, revision) {
  const items = editableTextFields(row, fields);
  const originals = Object.fromEntries(items.map(item => [item.id, item.original]));
  const corrections = {}, stale = [];
  for (const [id, value] of Object.entries(revision?.corrections || {})) {
    if (!(id in originals) || revision.original_json?.[id] !== originals[id] || typeof value !== 'string') { stale.push(id); continue; }
    corrections[id] = value;
  }
  return { corrections, stale };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export function correctionAnnex(row, fields, revision) {
  if (!revision) return '';
  const { corrections, stale } = currentTextCorrections(row, fields, revision);
  const entries = editableTextFields(row, fields).filter(item => Object.hasOwn(corrections, item.id));
  if (!entries.length && !stale.length) return '';
  const blocks = entries.map(item => `<section style="break-inside:avoid;margin:16px 0"><strong>${escape(item.label)}</strong><p style="white-space:pre-wrap">${escape(corrections[item.id])}</p><p style="white-space:pre-wrap;font-size:10px;color:#555">Original: ${escape(item.original)}</p></section>`).join('');
  return `<section style="break-before:page;page-break-before:always"><h1>Revisão textual</h1><p>Revisão feita por ${escape(revision.author_name)} em ${escape(new Date(revision.created_at).toLocaleString('pt-BR'))}. As assinaturas do documento referem-se exclusivamente ao conteúdo original.</p>${stale.length ? '<p>Algumas revisões anteriores não são exibidas porque o conteúdo original mudou. Consulte o histórico no portal.</p>' : ''}${blocks}</section>`;
}
export function appendCorrectionAnnex(html, row, fields, revision) {
  const annex = correctionAnnex(row, fields, revision);
  if (!annex) return html;
  if (!html.includes('</body>')) throw new Error('Não foi possível inserir a revisão no relatório.');
  return html.replace('</body>', `${annex}</body>`);
}
