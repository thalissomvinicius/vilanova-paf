import {
  validCpf,
  digits,
  cleanSearch,
  validateSubmission,
} from "./land-domain.mjs";
import {
  LAND_CONSENT_VERSION,
  PARA_MUNICIPALITIES,
} from "./land-reference.mjs";

export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || "",
  );
const text = (value, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const optionalId = (value) => {
  if (!value) return null;
  if (!isUuid(value)) throw new Error("Identificador inválido.");
  return value;
};
const member = (value, list) => {
  if (!list.includes(value)) throw new Error("Opção inválida.");
  return value;
};
function date(value, required = false) {
  if (!value && !required) return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
      value,
    ) ||
    Number.isNaN(Date.parse(value)) ||
    (new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10) &&
      value.length === 10)
  )
    throw new Error("Informe uma data válida, incluindo o ano.");
  return value;
}
function number(value, min, max, optional = false) {
  if (optional && (value === "" || value == null)) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    throw new Error("Valor numérico inválido.");
  return n;
}
export function validateOperation(kind, input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Dados inválidos.");
  if (kind === "producer") {
    const cpf = digits(input.cpf),
      phone = digits(input.telefone).replace(/^55(?=\d{10,11}$)/, "");
    if (
      text(input.nome).length < 5 ||
      !validCpf(cpf) ||
      !/^[1-9]{2}\d{8,9}$/.test(phone)
    )
      throw new Error("Informe nome completo, CPF válido e telefone com DDD.");
    const email = text(input.email, 180);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("E-mail inválido.");
    return {
      nome: text(input.nome, 160),
      cpf,
      telefone: phone,
      email,
      endereco: text(input.endereco, 300),
      data_nascimento: date(input.data_nascimento),
      observacoes: text(input.observacoes, 3000),
    };
  }
  const produtor_id = optionalId(input.produtor_id);
  if (!produtor_id && kind !== "task") throw new Error("Selecione o produtor.");
  if (kind === "property") {
    if (text(input.nome).length < 2)
      throw new Error("Informe o nome da propriedade.");
    const latitude = number(input.latitude, -90, 90, true),
      longitude = number(input.longitude, -180, 180, true);
    if ((latitude == null) !== (longitude == null))
      throw new Error("Informe latitude e longitude juntas.");
    return {
      produtor_id,
      nome: text(input.nome, 160),
      municipio: member(input.municipio, PARA_MUNICIPALITIES),
      area_hectares: number(input.area_hectares, 0, 1000000),
      comunidade_fonte: text(input.comunidade_fonte, 160),
      car: text(input.car, 100),
      caf: text(input.caf, 100),
      endereco_rural: text(input.endereco_rural, 300),
      latitude,
      longitude,
      observacoes: text(input.observacoes, 3000),
    };
  }
  if (!["visit", "task"].includes(kind) || text(input.titulo).length < 3)
    throw new Error("Informe o título.");
  const common = {
    produtor_id,
    propriedade_id: optionalId(input.propriedade_id),
    responsavel_id: optionalId(input.responsavel_id),
    titulo: text(input.titulo, 160),
    descricao: text(input.descricao, 3000),
  };
  if (kind === "visit") {
    if (!common.responsavel_id)
      throw new Error("Selecione o técnico responsável.");
    return {
      ...common,
      inicio_em: date(input.inicio_em, true),
      status: member(input.status || "agendado", [
        "agendado",
        "realizado",
        "cancelado",
      ]),
      local: text(input.local, 300),
    };
  }
  return {
    ...common,
    prazo_em: date(input.prazo_em),
    status: member(input.status || "pendente", [
      "pendente",
      "em_andamento",
      "concluida",
      "cancelada",
    ]),
    prioridade: member(input.prioridade || "media", [
      "baixa",
      "media",
      "alta",
      "urgente",
    ]),
  };
}
export function validateWorkflow(input) {
  if (!Number.isInteger(input.version) || input.version < 1)
    throw new Error("Versão inválida. Reabra a solicitação.");
  const checklist = {};
  for (const key of [
    "identity",
    "contact",
    "location",
    "documents",
    "field",
    "bank",
  ]) {
    if (
      input.checklist?.[key] != null &&
      typeof input.checklist[key] !== "boolean"
    )
      throw new Error("Checklist inválido.");
    checklist[key] = input.checklist?.[key] === true;
  }
  return {
    assigned_to: optionalId(input.assigned_to),
    producer_id: optionalId(input.producer_id),
    property_id: optionalId(input.property_id),
    due_date: date(input.due_date),
    next_action: text(input.next_action, 500),
    internal_note: text(input.internal_note, 3000),
    checklist,
  };
}
const reply = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
async function bodyOf(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Envie JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Dados inválidos.");
  const chunks = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 16000) {
      await reader.cancel();
      throw new Error("Dados excedem o limite.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new Error("Dados inválidos.");
  return value;
}
export async function operationsRoute({ request, path, store, admin, actor, manageRecords = admin }) {
  if (!path.startsWith("/api/operations")) return null;
  if (!admin) return reply({ error: "Acesso administrativo necessário." }, 401);
  const method = request.method,
    params = new URL(request.url).searchParams;
  if (!manageRecords && ((method === 'GET' && path === '/api/operations/conflicts') || (method !== 'GET' && !/^\/api\/operations\/(?:visit|task)(?:\/[^/]+)?$/.test(path) && !/^\/api\/operations\/land\/[^/]+\/workflow$/.test(path))))
    return reply({error:'Esta operação é exclusiva da administração.'},403);
  try {
    if (method === "GET" && path === "/api/operations/directories")
      return reply(await store.directories());
    const filters = {
      search: cleanSearch(params.get("search") || "").slice(0, 100),
      page: Math.max(
        1,
        Math.min(100000, Math.floor(Number(params.get("page")) || 1)),
      ),
      municipality: text(params.get("municipality"), 160),
      status: text(params.get("status"), 40),
      responsible: optionalId(params.get("responsible")),
    };
    if (method === "GET" && path === "/api/operations/overview")
      return reply(
        await store.overview({
          ...filters,
          days: Math.min(90, Math.max(7, Number(params.get("days")) || 30)),
        }),
      );
    if (method === "GET" && path === "/api/operations/producers")
      return reply(await store.producers(filters));
    if (
      method === "GET" &&
      ["/api/operations/visits", "/api/operations/tasks"].includes(path)
    )
      return reply(
        await store.activity(
          path.endsWith("visits") ? "visit" : "task",
          filters,
        ),
      );
    if (method === "GET" && path === "/api/operations/conflicts")
      return reply({ conflicts: await store.conflicts() });
    if (method === "POST" && path === "/api/operations/link") {
      const b = await bodyOf(request);
      if (
        !isUuid(b.producer_id) ||
        !Number.isInteger(b.legacy_id) ||
        b.confirmation !== "VINCULAR"
      )
        throw new Error(
          "Confirme a vinculação após conferir os dois cadastros.",
        );
      return reply(await store.link(b, actor));
    }
    const dossier = path.match(
      /^\/api\/operations\/producers\/([0-9a-f-]{36})$/i,
    );
    if (dossier && method === "GET") {
      if (!isUuid(dossier[1])) throw new Error("Identificador inválido.");
      const row = await store.dossier(dossier[1]);
      return row
        ? reply(row)
        : reply({ error: "Produtor não encontrado." }, 404);
    }
    const write = path.match(
      /^\/api\/operations\/(producer|property|visit|task)(?:\/([0-9a-f-]{36}))?$/i,
    );
    if (write && ["POST", "PATCH"].includes(method)) {
      if (
        (method === "PATCH") !== Boolean(write[2]) ||
        (write[2] && !isUuid(write[2]))
      )
        throw new Error("Operação inválida.");
      const b = await bodyOf(request),
        values = validateOperation(write[1], b);
      if (method === "POST" && !isUuid(b.clientRequestId))
        throw new Error("Identificador de envio inválido. Reabra o formulário.");
      if (write[2] && !b.updated_at)
        throw new Error("Reabra o registro antes de editar.");
      const row = await store.write(
        write[1],
        write[2] || null,
        date(b.updated_at),
        values,
        actor,
        method === "POST" ? b.clientRequestId : null,
      );
      return row
        ? reply({ record: row }, method === "POST" ? 201 : 200)
        : reply(
            {
              error:
                "Registro alterado por outra pessoa. Atualize antes de editar.",
            },
            409,
          );
    }
    const land = path.match(
      /^\/api\/operations\/land\/([0-9a-f-]{36})\/(workflow|promote|archive|correct)$/i,
    );
    if (land && method === "POST") {
      if (!isUuid(land[1])) throw new Error("Identificador inválido.");
      const b = await bodyOf(request);
      if (!Number.isInteger(b.version) || b.version < 1)
        throw new Error("Versão inválida.");
      let patch = land[2] === "workflow" ? validateWorkflow(b) : {};
      if (land[2] === "correct")
        patch = validateSubmission({
          ...b,
          clientId: "00000000-0000-4000-8000-000000000001",
          state: "PA",
          consent: true,
          consentVersion: LAND_CONSENT_VERSION,
          website: "",
        });
      const row = await store.land(land[1], b.version, land[2], patch, actor);
      return row
        ? reply({ request: row })
        : reply({ error: "Solicitação alterada. Reabra para conferir." }, 409);
    }
    return reply({ error: "Rota não encontrada." }, 404);
  } catch (error) {
    return reply(
      {
        error: error.database
          ? "Banco indisponível. Tente novamente."
          : error instanceof SyntaxError
            ? "Dados inválidos."
            : error.message || "Não foi possível concluir.",
      },
      error.database ? 503 : 400,
    );
  }
}
function checked(result) {
  if (result.error) {
    const error = new Error(
      ["23505", "P0001"].includes(result.error.code)
        ? result.error.message
        : "Database operation failed",
    );
    error.database = !["23505", "P0001"].includes(result.error.code);
    throw error;
  }
  return result.data;
}
export async function allRows(makeQuery) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const part = checked(await makeQuery().range(offset, offset + 499));
    rows.push(...part);
    if (part.length < 500) return rows;
  }
}
export class SupabaseOperationsStore {
  constructor(db) {
    this.db = db;
  }
  async org() {
    return checked(
      await this.db
        .from("paf_dashboard_binding")
        .select("organizacao_id")
        .eq("id", 1)
        .single(),
    ).organizacao_id;
  }
  async directories() {
    const org = await this.org();
    const team = await allRows(() =>
      this.db
        .from("paf_perfis")
        .select("id,nome,papel")
        .eq("organizacao_id", org)
        .eq("ativo", true)
        .in("papel", [
          "super_admin",
          "admin",
          "coordenador",
          "tecnico",
          "agente",
        ])
        .order("nome")
        .order("id"),
    );
    const properties = await allRows(() =>
      this.db
        .from("paf_propriedades")
        .select("municipio")
        .eq("organizacao_id", org)
        .is("deleted_at", null)
        .order("id"),
    );
    return {
      team,
      municipalities: [
        ...new Set(properties.map((p) => p.municipio).filter(Boolean)),
      ].sort(),
    };
  }
  async overview(f) {
    return checked(
      await this.db.rpc("paf_operations_overview", {
        p_days: f.days,
        p_municipality: f.municipality,
        p_responsible: f.responsible,
      }),
    );
  }
  async producers(f) {
    return checked(
      await this.db.rpc("paf_operations_producers", {
        p_search: f.search,
        p_page: f.page,
        p_municipality: f.municipality,
        p_status: f.status,
        p_responsible: f.responsible,
      }),
    );
  }
  async activity(kind, f) {
    return checked(
      await this.db.rpc("paf_operations_activity", {
        p_kind: kind,
        p_search: f.search,
        p_status: f.status,
        p_responsible: f.responsible,
        p_page: f.page,
      }),
    );
  }
  async dossier(id) {
    const org = await this.org(),
      producer = checked(
        await this.db
          .from("paf_produtores")
          .select()
          .eq("organizacao_id", org)
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle(),
      );
    if (!producer) return null;
    const link = checked(
      await this.db
        .from("paf_producer_links")
        .select()
        .eq("producer_id", id)
        .eq("organizacao_id", org)
        .maybeSingle(),
    );
    const children = async (table, field = "produtor_id") =>
      allRows(() =>
        this.db
          .from(table)
          .select()
          .eq("organizacao_id", org)
          .eq(field, id)
          .order("created_at", { ascending: false })
          .order("id"),
      );
    const properties = (await children("paf_propriedades")).filter(
        (r) => !r.deleted_at,
      ),
      visits = (await children("paf_agenda")).filter(
        (r) => !r.deleted_at && r.tipo === "visita",
      ),
      tasks = (await children("paf_tarefas")).filter((r) => !r.deleted_at),
      assistances = (await children("paf_assistencias")).filter(
        (r) => !r.deleted_at,
      ),
      requests = await children("paf_land_requests", "producer_id");
    const documents = link
      ? await allRows(() =>
          this.db
            .from("paf_documents")
            .select("id,title,category,status,created_at")
            .eq("producer_id", link.legacy_id)
            .order("id"),
        )
      : [];
    const assignments = checked(
      await this.db
        .from("paf_produtor_tecnicos")
        .select("tecnico_id,principal")
        .eq("organizacao_id", org)
        .eq("produtor_id", id),
    );
    return {
      producer,
      link,
      properties,
      visits,
      tasks,
      assistances,
      requests,
      documents,
      assignments,
    };
  }
  async write(kind, id, expected, values, actor, requestKey) {
    if (!id && requestKey) return checked(await this.db.rpc("paf_operations_write_once", {
      p_key: requestKey, p_kind: kind, p_values: values, p_actor: actor,
    }));
    return checked(
      await this.db.rpc("paf_operations_write", {
        p_kind: kind,
        p_id: id,
        p_expected: expected,
        p_values: values,
        p_actor: actor,
      }),
    );
  }
  async land(id, version, action, patch, actor) {
    return checked(
      await this.db.rpc(`paf_land_${action}`, {
        p_id: id,
        p_version: version,
        ...(["workflow", "correct"].includes(action) ? { p_patch: patch } : {}),
        p_actor: actor,
      }),
    );
  }
  async conflicts() {
    const org = await this.org(),
      links = await allRows(() =>
        this.db
          .from("paf_producer_links")
          .select("legacy_id,producer_id")
          .eq("organizacao_id", org)
          .order("legacy_id"),
      );
    const native = await allRows(() =>
      this.db
        .from("paf_produtores")
        .select("id,nome,cpf,telefone")
        .eq("organizacao_id", org)
        .is("deleted_at", null)
        .order("id"),
    );
    const legacy = await allRows(() =>
      this.db
        .from("paf_producers")
        .select("id,name,cpf_digits,phone")
        .order("id"),
    );
    return legacy
      .filter((l) => !links.some((b) => b.legacy_id === l.id))
      .flatMap((l) =>
        native
          .filter(
            (n) =>
              digits(n.cpf) === l.cpf_digits &&
              !links.some((b) => b.producer_id === n.id),
          )
          .map((n) => ({ legacy: l, producer: n })),
      );
  }
  async link(body, actor) {
    return checked(
      await this.db.rpc("paf_link_producer", {
        p_legacy: body.legacy_id,
        p_producer: body.producer_id,
        p_actor: actor,
      }),
    );
  }
}
