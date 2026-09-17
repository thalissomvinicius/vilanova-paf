import { digest, newProtocol, normalizeProtocol, publicRequest, validateReview, validateSubmission, digits, cleanSearch, LAND_STATUSES } from './land-domain.mjs';
import { LAND_CONSENT_VERSION } from './land-reference.mjs';

const reply = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'private, no-store' } });
async function bodyOf(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Envie os dados em JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Dados inválidos.');
  const decoder = new TextDecoder(); let content = ''; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12000) { await reader.cancel(); throw new Error('Dados excedem o limite de envio.'); }
    content += decoder.decode(value, { stream: true });
  }
  content += decoder.decode();
  const body = JSON.parse(content);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dados inválidos.');
  return body;
}

// The store is server-only. No public database policy exposes these records.
export async function landRoute({ request, path, store, admin, actor, ip, salt }) {
  if (!path.startsWith('/api/land/')) return null;
  const method = request.method;
  try {
    if (path.startsWith('/api/land/admin') && !admin) return reply({ error: 'Acesso administrativo necessário.' }, 401);
    if (method === 'POST' && ['/api/land/requests', '/api/land/lookup'].includes(path)) {
      const submit = path.endsWith('/requests');
      const key = await digest(`${salt}:${submit ? 'submit' : 'lookup'}:${ip}`);
      if (!await store.rate(key, submit ? 12 : 120, 3600)) return reply({ error: 'Muitas tentativas. Aguarde até uma hora e tente novamente.' }, 429);
      const body = await bodyOf(request);
      if (submit) {
        const values = validateSubmission(body);
        const fingerprint = await digest(JSON.stringify(values));
        let result;
        for (let attempt = 0; attempt < 3 && !result; attempt++) {
          result = await store.submit({ ...values, fingerprint, protocol: newProtocol(), consent_version: LAND_CONSENT_VERSION });
        }
        if (!result) return reply({ error: 'Não foi possível gerar o protocolo. Tente novamente.' }, 503);
        if (!result || result.fingerprint !== fingerprint) return reply({ error: 'Este envio já foi utilizado com outros dados. Inicie uma nova solicitação.' }, 409);
        return reply({ request: publicRequest(result) }, 201);
      }
      const protocol = normalizeProtocol(body.protocol);
      if (!protocol || !/^\d{11}$/.test(digits(body.cpf))) return reply({ error: 'Protocolo ou CPF não conferem.' }, 404);
      const row = await store.lookup(protocol, digits(body.cpf));
      if (!row) return reply({ error: 'Protocolo ou CPF não conferem.' }, 404);
      return reply({ request: publicRequest(row, await store.history(row.id)) });
    }
    if (method === 'GET' && path === '/api/land/admin/requests') {
      const params = new URL(request.url).searchParams;
      const status = params.get('status') || '';
      if (status && !Object.hasOwn(LAND_STATUSES, status)) return reply({ error: 'Filtro inválido.' }, 400);
      const search = (params.get('search') || '').trim().slice(0, 100);
      const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page')) || 1)));
      return reply(await store.list({ status, search, page }));
    }
    const match = path.match(/^\/api\/land\/admin\/requests\/([0-9a-f-]{36})$/i);
    if (match && method === 'DELETE') {
      const body = await bodyOf(request);
      if (body.confirmation !== 'EXCLUIR' || !Number.isInteger(body.version) || body.version < 1 || typeof body.protocol !== 'string') return reply({ error: 'Confirme a exclusão digitando EXCLUIR.' }, 400);
      const removed = await store.remove(match[1], body.version, body.protocol);
      if (!removed) return reply({ error: 'A solicitação foi alterada ou já excluída. Feche e reabra a análise antes de tentar novamente.' }, 409);
      return reply({ deleted: true });
    }
    if (match && method === 'GET') {
      const row = await store.get(match[1]);
      if (!row) return reply({ error: 'Solicitação não encontrada.' }, 404);
      return reply({ request: row, history: await store.history(row.id) });
    }
    if (match && method === 'PATCH') {
      const review = validateReview(await bodyOf(request));
      const row = await store.review(match[1], review, actor);
      if (!row) return reply({ error: 'Esta solicitação foi alterada por outra pessoa. Reabra para conferir o parecer mais recente.' }, 409);
      return reply({ request: row, history: await store.history(row.id) });
    }
    return reply({ error: 'Rota não encontrada.' }, 404);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ error: 'Dados inválidos.' }, 400);
    if (error?.database) return reply({ error: 'Não foi possível acessar as solicitações. Tente novamente.' }, 503);
    return reply({ error: error instanceof Error ? error.message : 'Não foi possível concluir.' }, 400);
  }
}

function checked(result) {
  if (result.error) { const error = new Error('Database operation failed'); error.database = true; throw error; }
  return result.data;
}
const TABLE = 'paf_land_requests';
export class SupabaseLandStore {
  constructor(db) { this.db = db; }
  async remove(id, version, protocol) { return checked(await this.db.rpc('paf_land_delete', { p_id: id, p_version: version, p_protocol: protocol })); }
  async rate(key, limit, seconds) { return checked(await this.db.rpc('paf_land_rate', { p_key: key, p_limit: limit, p_seconds: seconds })); }
  async submit(values) {
    const result = await this.db.from(TABLE).insert(values).select().single();
    if (result.error?.code === '23505') return checked(await this.db.from(TABLE).select().eq('client_id', values.client_id).maybeSingle());
    return checked(result);
  }
  async lookup(protocol, cpf) { return checked(await this.db.from(TABLE).select().eq('protocol', protocol).eq('cpf', cpf).maybeSingle()); }
  async get(id) { return checked(await this.db.from(TABLE).select().eq('id', id).maybeSingle()); }
  async history(id) { return checked(await this.db.from('paf_land_reviews').select().eq('request_id', id).order('created_at', { ascending: false })); }
  async list({ status, search, page }) {
    let query = this.db.from(TABLE).select('id,protocol,full_name,cpf,birth_date,phone,municipality,community,is_federal_settlement,mother_name,settlement_name,status,created_at,updated_at,version', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (search) {
      const clean = cleanSearch(search);
      query = query.or(['full_name', 'cpf', 'protocol', 'municipality', 'community'].map(field => `${field}.ilike.%${clean}%`).join(','));
    }
    const result = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * 25, page * 25 - 1);
    return { requests: checked(result), total: result.count, page, pageSize: 25 };
  }
  async review(id, review, actor) { return checked(await this.db.rpc('paf_land_review', { p_id: id, p_version: review.version, p_status: review.status, p_comment: review.comment, p_actor: actor, p_reviewer_name: review.reviewerName })); }
}
