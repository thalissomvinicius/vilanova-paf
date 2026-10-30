import { fieldClient } from './client';
import { documentSignatureRoles, isPafDocument, normalizeFormAnswers, signatureContentHash, validateFormAnswers, RELEASE_FORM_ID } from './visit-report.generated.mjs';

export function canWriteDocument(profile, row) {
  return !!(profile?.ativo && !profile.deve_trocar_senha && ['super_admin', 'admin', 'coordenador', 'tecnico'].includes(profile.papel) && (!row || (row.organizacao_id === profile.organizacao_id && row.status_validacao !== 'aprovado' && (row.tecnico_id === profile.id || ['super_admin', 'admin', 'coordenador'].includes(profile.papel)))));
}
export const documentHash = (answers, photos, producerId, propertyId) => signatureContentHash({ answers, photos: photos.map(item => ({ id: item.id, caption: item.caption })), producerId, propertyId });
export function documentIssues(form, answers, photos, signatures) {
  const errors = validateFormAnswers(form, answers);
  const issues = Object.values(errors);
  if (photos.length < (form.evidencePolicy?.minPhotos || 0)) issues.push('Anexe pelo menos duas fotos para a liberação.');
  if (photos.length > 20) issues.push('Use até 20 fotos por documento.');
  if (form.id === RELEASE_FORM_ID && photos.some(item => !item.caption?.trim())) issues.push('Informe a legenda de cada foto.');
  for (const role of documentSignatureRoles(form.id, answers)) if (!signatures[role]) issues.push(`Registre a assinatura ${role === 'technician' ? 'do técnico' : 'do destinatário'}.`);
  return issues;
}
function check(result) { if (result.error) throw new Error(result.error.message || 'Não foi possível salvar o documento.'); return result.data; }
async function imageBlob(photo) {
  if (photo.file) return photo.file;
  const result = await fetch(photo.url, { signal: AbortSignal.timeout(20000) });
  if (!result.ok) throw new Error('Uma foto não está disponível. Reabra a visita de origem.');
  return result.blob();
}

// One stable client ID per editing session makes retries recover the saved draft.
export async function saveDocument({ profile, form, remoteForm, producerId, propertyId, answers, photos, signatures, session, draft }) {
  if (!canWriteDocument(profile, session.row) || !isPafDocument(form.id)) throw new Error('Seu acesso não permite emitir este documento.');
  if (!remoteForm) throw new Error('O formulário ainda não foi publicado. Atualize os dados.');
  if (!draft && (!producerId || !propertyId)) throw new Error('Selecione produtor e propriedade.');
  const normalized = normalizeFormAnswers(form, answers);
  if (!draft) { const issues = documentIssues(form, normalized, photos, signatures); if (issues.length) throw new Error(issues.join(' ')); }
  const client = fieldClient;
  const previous = check(await client.from('mobile_respostas').select('*').eq('organizacao_id', profile.organizacao_id).eq('client_id', session.clientId).maybeSingle());
  if (previous && (!canWriteDocument(profile, previous) || (session.row?.updated_at && previous.updated_at !== session.row.updated_at && previous.client_updated_at !== session.lastAttempt))) throw new Error('O documento mudou. Feche e abra a versão atual antes de editar.');
  const now = new Date().toISOString(); session.lastAttempt = now;
  const descriptors = Object.entries(signatures).filter(([role]) => documentSignatureRoles(form.id, normalized).includes(role)).map(([role, image]) => ({ clientId: session.signatureIds[role] || (session.signatureIds[role] = crypto.randomUUID()), role, signerName: String(role === 'technician' ? normalized.tecnicoResponsavel : normalized.nomeConfirmacaoProdutor), relationship: role === 'attendee' ? normalized.vinculoParticipante : undefined, capturedAt: now, contentHash: documentHash(normalized, photos, producerId, propertyId), image }));
  const payload = { client_id: session.clientId, organizacao_id: profile.organizacao_id, modulo_id: remoteForm.modulo_id, formulario_id: remoteForm.id, formulario_versao: remoteForm.versao, produtor_id: producerId || null, propriedade_id: propertyId || null, tecnico_id: previous?.tecnico_id || profile.id, dados_json: { ...normalized, _visitSignatures: descriptors.map(({ image, ...meta }) => meta) }, status_validacao: 'rascunho', origem: previous?.origem || 'painel_web', coletado_em: previous?.coletado_em || now, client_updated_at: now };
  let row;
  if (previous) row = check(await client.from('mobile_respostas').update(payload).eq('id', previous.id).eq('updated_at', previous.updated_at).select('*').maybeSingle());
  else row = check(await client.from('mobile_respostas').insert(payload).select('*').single());
  if (!row) throw new Error('O documento foi alterado por outro acesso. Atualize a lista.');
  session.row = row;
  const uploaded = [];
  for (const photo of photos) {
    const blob = await imageBlob(photo);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(blob.type) || blob.size > 12000000) throw new Error('Use fotos JPG, PNG ou WebP de até 12 MB. O rascunho foi preservado.');
    const path = `${profile.organizacao_id}/${profile.id}/${photo.id}.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`;
    check(await client.storage.from('paf-anexos').upload(path, blob, { upsert: true, contentType: blob.type }));
    check(await client.from('mobile_anexos').upsert({ organizacao_id: profile.organizacao_id, resposta_id: row.id, client_id: photo.id, tipo: 'foto', bucket: 'paf-anexos', storage_path: path, nome_arquivo: photo.file?.name || 'registro-fotografico', mime_type: blob.type, tamanho_bytes: blob.size, capturado_em: photo.capturedAt, metadados_json: { fonte: 'gallery', origem: 'painel_web', legenda: photo.caption || '', evidence_client_id: photo.id, latitude: photo.latitude, longitude: photo.longitude, removido: false } }, { onConflict: 'organizacao_id,client_id' }));
    uploaded.push(photo.id);
  }
  for (const item of descriptors) {
    const blob = await (await fetch(item.image)).blob();
    if (blob.type !== 'image/png' || blob.size > 1800000) throw new Error('Confira o formato e tamanho da assinatura.');
    const path = `${profile.organizacao_id}/${profile.id}/${item.clientId}.png`;
    check(await client.storage.from('paf-anexos').upload(path, blob, { upsert: true, contentType: 'image/png' }));
    const { image, ...meta } = item;
    check(await client.from('mobile_anexos').upsert({ organizacao_id: profile.organizacao_id, resposta_id: row.id, client_id: item.clientId, tipo: 'assinatura', bucket: 'paf-anexos', storage_path: path, nome_arquivo: `${item.role}.png`, mime_type: 'image/png', tamanho_bytes: blob.size, capturado_em: now, metadados_json: meta }, { onConflict: 'organizacao_id,client_id' }));
  }
  const attachments = check(await client.from('mobile_anexos').select('id,client_id,tipo,metadados_json').eq('resposta_id', row.id).eq('organizacao_id', profile.organizacao_id));
  const unused = attachments.filter(item => item.tipo === 'foto' ? !uploaded.includes(item.client_id) : item.tipo === 'assinatura' && !descriptors.some(signature => signature.clientId === item.client_id));
  for (const item of unused) check(await client.from('mobile_anexos').update({ metadados_json: { ...item.metadados_json, removido: true } }).eq('id', item.id).eq('resposta_id', row.id).eq('organizacao_id', profile.organizacao_id));
  if (!draft) check(await client.rpc('paf_finalize_field_collection', { p_response: row.id, p_client_updated_at: now, p_photos: uploaded }));
  return { ...row, status_validacao: draft ? 'rascunho' : 'pendente' };
}
