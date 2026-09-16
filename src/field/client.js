import { createClient } from '@supabase/supabase-js';
import { normalizeSearch, reviewPatch } from './model.mjs';
import { FIELD_URL, FIELD_PUBLIC_KEY } from './public-config';

const url = import.meta.env.VITE_PAF_FIELD_URL || FIELD_URL;
const key = import.meta.env.VITE_PAF_FIELD_PUBLISHABLE_KEY || FIELD_PUBLIC_KEY;
export const fieldClient = url && key ? createClient(url, key, {
  auth: { storageKey: 'paf-field-dashboard', storage: window.sessionStorage, persistSession: true, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(20000) }) }
}) : null;

function requireClient() {
  if (!fieldClient) throw new Error('A conexao de campo nao foi configurada neste ambiente.');
  return fieldClient;
}

export async function fieldSignOut() {
  try { await fieldClient?.auth.signOut({ scope: 'local' }).catch(() => null); }
  finally { window.sessionStorage.removeItem('paf-field-dashboard'); }
}

export async function loadFieldProfile() {
  const client = requireClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return null;
  const { data, error } = await client.from('paf_perfis').select('id,nome,email,papel,ativo,organizacao_id,deve_trocar_senha').eq('id', auth.user.id).single();
  if (error) throw new Error('Nao foi possivel validar seu perfil PAF.');
  if (!data.ativo || !data.organizacao_id || data.papel === 'produtor') {
    await fieldSignOut();
    throw new Error('Este acesso nao esta autorizado para a equipe de campo.');
  }
  return data;
}

export async function fieldSignIn(email, password) {
  const { error } = await requireClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(error.status === 400 ? 'E-mail ou senha invalidos.' : 'Nao foi possivel conectar ao PAF. Verifique sua conexao e tente novamente.');
  return loadFieldProfile();
}

export async function changeFieldPassword(password) {
  if (password.length < 10) throw new Error('Use pelo menos 10 caracteres.');
  const client = requireClient();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error('Nao foi possivel alterar sua senha.');
  const { error: completeError } = await client.functions.invoke('complete-password-change', { body: {} });
  if (completeError) throw new Error('Senha alterada, mas a confirmacao falhou. Entre novamente para concluir.');
  return loadFieldProfile();
}

async function allRows(table, columns, organizationId) {
  const result = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await requireClient().from(table).select(columns).eq('organizacao_id', organizationId).order('id').range(start, start + 499);
    if (error) throw new Error(`Nao foi possivel carregar ${table}.`);
    result.push(...data);
    if (data.length < 500) return result;
  }
}

export async function loadFieldDirectories(profile) {
  const organization = profile.organizacao_id;
  const producers = await allRows('paf_produtores', 'id,nome', organization);
  const communities = await allRows('paf_comunidades', 'id,nome', organization);
  const properties = await allRows('paf_propriedades', 'id,nome', organization);
  const forms = await allRows('mobile_formularios', 'id,titulo,versao,definicao_json', organization);
  const users = await allRows('paf_perfis', 'id,nome', organization);
  return { producers, communities, properties, forms, users };
}

export async function loadFieldCollections(profile, directories, filters, page = 0) {
  let query = requireClient().from('mobile_respostas').select('*', { count: 'exact' }).eq('organizacao_id', profile.organizacao_id).is('deleted_at', null).neq('status_validacao', 'rascunho');
  if (filters.status) query = query.eq('status_validacao', filters.status);
  if (filters.form) query = query.eq('formulario_id', filters.form);
  if (filters.technician) query = query.eq('tecnico_id', filters.technician);
  if (filters.from) query = query.gte('coletado_em', `${filters.from}T00:00:00-03:00`);
  if (filters.to) query = query.lt('coletado_em', new Date(Date.parse(`${filters.to}T00:00:00-03:00`) + 86400000).toISOString());
  const search = normalizeSearch(filters.search);
  if (search) {
    const fields = { producers: 'produtor_id', communities: 'comunidade_id', properties: 'propriedade_id', forms: 'formulario_id', users: 'tecnico_id' };
    const clauses = Object.entries(fields).flatMap(([directory, column]) => {
      const ids = directories[directory].filter(item => normalizeSearch(item.nome ?? item.titulo).includes(search)).map(item => item.id);
      return ids.length ? [`${column}.in.(${ids.join(',')})`] : [];
    });
    if (!clauses.length) return { rows: [], total: 0 };
    query = query.or(clauses.join(','));
  }
  const { data, error, count } = await query.order('coletado_em', { ascending: false }).order('id').range(page * 25, page * 25 + 24);
  if (error) throw new Error('Nao foi possivel receber as coletas. Seus dados anteriores foram preservados.');
  return { rows: data, total: count ?? 0 };
}

export async function loadFieldCounts(profile) {
  const counts = {};
  for (const status of ['pendente', 'aprovado', 'rejeitado']) {
    const { count, error } = await requireClient().from('mobile_respostas').select('id', { count: 'exact', head: true }).eq('organizacao_id', profile.organizacao_id).is('deleted_at', null).eq('status_validacao', status);
    if (error) throw new Error('Nao foi possivel atualizar os indicadores de campo.');
    counts[status] = count ?? 0;
  }
  return counts;
}

export async function loadFieldEvidence(collection) {
  const client = requireClient();
  const { data: gps, error: gpsError } = await client.from('mobile_gps').select('*').eq('resposta_id', collection.id).eq('organizacao_id', collection.organizacao_id);
  const { data: attachments, error } = await client.from('mobile_anexos').select('*').eq('resposta_id', collection.id).eq('organizacao_id', collection.organizacao_id);
  if (error || gpsError) throw new Error('Nao foi possivel carregar as evidencias.');
  const photos = [];
  for (const attachment of attachments) {
    const { data, error: signedError } = await client.storage.from(attachment.bucket).createSignedUrl(attachment.storage_path, 300);
    if (signedError) throw new Error('Nao foi possivel liberar a visualizacao de uma evidencia.');
    photos.push({ ...attachment, url: data.signedUrl });
  }
  return { gps, photos };
}

export async function reviewFieldCollection(collection, profile, status, note) {
  const patch = reviewPatch(collection, profile, status, note);
  const { data, error } = await requireClient().from('mobile_respostas').update(patch).eq('id', collection.id).eq('organizacao_id', profile.organizacao_id).eq('updated_at', collection.updated_at).select('id').maybeSingle();
  if (error) throw new Error('Nao foi possivel salvar a revisao.');
  if (!data) throw new Error('A coleta mudou ou seu acesso foi alterado. Atualize e abra novamente.');
}

export async function loadFieldAccesses(profile) {
  return allRows('paf_perfis', 'id,nome,email,papel,ativo,organizacao_id,deve_trocar_senha,updated_at', profile.organizacao_id);
}

export async function issueFieldAccess(input, reset = false) {
  const { data, error } = await requireClient().functions.invoke(reset ? 'reset-paf-user-password' : 'create-paf-user', { body: input });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(details?.error ?? 'Nao foi possivel emitir o acesso. Tente novamente.');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function saveFieldAccess(target, changes) {
  const { error } = await requireClient().rpc('paf_manage_access', {
    target_id: target.id, new_name: changes.nome, new_role: changes.papel,
    new_active: changes.ativo, expected_updated_at: target.updated_at
  });
  if (error) throw new Error(error.message || 'Nao foi possivel atualizar o acesso.');
}
