export const REVIEW_LABELS = { rascunho: 'Rascunho', pendente: 'Pendente', aprovado: 'Aprovada', rejeitado: 'Ajuste solicitado' };
export const MANAGER_ROLES = new Set(['super_admin', 'admin', 'coordenador']);

export function canReview(profile) {
  return Boolean(profile?.ativo && profile.organizacao_id && MANAGER_ROLES.has(profile.papel) && !profile.deve_trocar_senha);
}

export function reviewPatch(collection, profile, status, note, now = new Date().toISOString()) {
  if (!canReview(profile) || collection.organizacao_id !== profile.organizacao_id) throw new Error('Sem permissao para revisar esta coleta.');
  if (!['aprovado', 'rejeitado'].includes(status)) throw new Error('Situacao de revisao invalida.');
  if (collection.status_validacao === 'rascunho') throw new Error('Rascunhos nao podem ser revisados.');
  const trimmed = String(note ?? '').trim();
  if (status === 'rejeitado' && trimmed.length < 5) throw new Error('Descreva o ajuste necessario com pelo menos 5 caracteres.');
  return { status_validacao: status, nota_revisao: trimmed || null, revisado_por: profile.id, revisado_em: now };
}

export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^\s*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function answerText(value) {
  if (value === null || value === undefined || value === '') return 'Nao informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
  if (Array.isArray(value)) return value.map(answerText).join(', ');
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function mapUrl(point) {
  const lat = Number(point?.latitude), lng = Number(point?.longitude);
  if (point?.latitude == null || point?.longitude == null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
