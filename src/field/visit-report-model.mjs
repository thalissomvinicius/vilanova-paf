import { buildVisitReportHtml } from './visit-report.generated.mjs';

export function dashboardVisitReport(row, directories, property, evidence, options = {}) {
  const form = directories.forms.find(item => item.id === row.formulario_id);
  const formId = form?.codigo || row.formulario_id;
  const answers = Object.fromEntries(Object.entries(row.dados_json || {}).filter(([key]) => !key.startsWith('_')));
  const definition = form?.definicao_json;
  const defined = (Array.isArray(definition) ? definition : definition?.fields || []).filter(field => field && typeof field.id === 'string' && !field.id.startsWith('_'));
  const fields = [...defined, ...Object.keys(answers).filter(id => !defined.some(field => field.id === id)).map(id => ({ id, label: id, type: 'text', section: 'Outras informações registradas' }))];
  const point = evidence.gps.find(item => item.tipo === 'ponto') || evidence.gps[0];
  const gpsNumber = value => value === null || value === undefined || value === '' ? undefined : Number.isFinite(Number(value)) ? Number(value) : undefined;
  const area = row.dados_json?._areaVerification;
  const collection = {
    id: row.id, remoteId: row.id, formId, producerId: row.produtor_id, communityId: row.comunidade_id,
    propertyId: row.propriedade_id, technicianId: row.tecnico_id, createdAt: row.coletado_em || row.recebido_em || '',
    answers, notes: row.observacoes, reviewNote: row.nota_revisao,
    syncStatus: row.status_validacao === 'rascunho' ? 'draft' : 'synced',
    reviewStatus: { aprovado: 'approved', rejeitado: 'rejected' }[row.status_validacao] || 'pending',
    latitude: gpsNumber(point?.latitude), longitude: gpsNumber(point?.longitude),
    areaVerification: area && Array.isArray(area.points) ? { ...area, points: area.points.filter(item => item && Number.isFinite(item.distanceMeters)) } : undefined,
  };
  const data = {
    producers: directories.producers.map(item => ({ id: item.id, name: item.nome, producerType: item.tipo_produtor })),
    users: directories.users.map(item => ({ id: item.id, name: item.nome })),
    communities: directories.communities.map(item => ({ id: item.id, name: item.nome, municipality: item.municipio })),
    properties: property ? [{ id: property.id, name: property.nome, municipality: property.municipio }] : directories.properties.map(item => ({ id: item.id, name: item.nome })),
    forms: [{ id: formId, fields }],
  };
  return buildVisitReportHtml(data, collection, options);
}
