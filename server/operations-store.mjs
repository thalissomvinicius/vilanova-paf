import { createHash, randomUUID } from "node:crypto";
import {
  getDb,
  listProducers,
  listTechnicians,
  createProducer,
  updateProducer,
} from "./db.mjs";
import { digits } from "../supabase/functions/paf-api/land-domain.mjs";

const uuid = (value) => {
  const h = createHash("sha256").update(String(value)).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
export class LocalOperationsStore {
  constructor(landStore) {
    this.landStore = landStore;
    this.db = getDb();
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS operation_records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS operation_audit(id TEXT PRIMARY KEY,entity_id TEXT,actor TEXT,action TEXT,created_at TEXT);",
    );
    this.db.exec("CREATE TABLE IF NOT EXISTS operation_submissions(request_key TEXT PRIMARY KEY,kind TEXT NOT NULL,input TEXT NOT NULL,result TEXT NOT NULL)");
    const cols = this.landStore.db
      .prepare("PRAGMA table_info(land_requests)")
      .all()
      .map((c) => c.name);
    for (const [name, type] of Object.entries({
      producer_id: "TEXT",
      property_id: "TEXT",
      assigned_to: "TEXT",
      due_date: "TEXT",
      next_action: "TEXT NOT NULL DEFAULT ''",
      internal_note: "TEXT NOT NULL DEFAULT ''",
      checklist: "TEXT NOT NULL DEFAULT '{}'",
      archived_at: "TEXT",
    }))
      if (!cols.includes(name))
        this.landStore.db.exec(
          `ALTER TABLE land_requests ADD COLUMN ${name} ${type}`,
        );
    for (const p of listProducers()) {
      const id = uuid(`producer:${p.id}`);
      if (this.get(id)) continue;
      this.put("producer", {
        id,
        legacy_id: p.id,
        token: p.token,
        nome: p.name,
        cpf: p.cpfDigits || digits(p.cpf),
        telefone: p.phone || "",
        endereco: p.address || "",
        status: "ativo",
        process_status: p.processStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      this.put("property", {
        id: uuid(`property:${p.id}`),
        produtor_id: id,
        nome: p.propertyName || "Propriedade principal",
        area_hectares: p.areaHa || 0,
        municipio: "",
        comunidade_fonte: p.community,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
  get(id) {
    const r = this.db
      .prepare("SELECT payload FROM operation_records WHERE id=?")
      .get(id);
    return r ? JSON.parse(r.payload) : null;
  }
  put(kind, row) {
    this.db
      .prepare(
        "INSERT INTO operation_records VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      )
      .run(row.id, kind, JSON.stringify(row));
    return row;
  }
  rows(kind) {
    return this.db
      .prepare("SELECT payload FROM operation_records WHERE kind=?")
      .all(kind)
      .map((r) => JSON.parse(r.payload));
  }
  directories() {
    return {
      team: listTechnicians().map((t) => ({
        id: uuid(`technician:${t.id}`),
        nome: t.name,
        papel: "tecnico",
      })),
      municipalities: [
        ...new Set(
          this.rows("property")
            .map((p) => p.municipio)
            .filter(Boolean),
        ),
      ].sort(),
    };
  }
  producers(f) {
    let rows = this.rows("producer").map((p) => ({
      ...p,
      properties: this.rows("property").filter((pr) => pr.produtor_id === p.id)
        .length,
      municipality: this.rows("property")
        .filter((pr) => pr.produtor_id === p.id)
        .map((pr) => pr.municipio)
        .filter(Boolean)
        .join(", "),
    }));
    if (f.search)
      rows = rows.filter((p) =>
        `${p.nome} ${p.cpf} ${p.telefone}`
          .toLowerCase()
          .includes(f.search.toLowerCase()),
      );
    if (f.status) rows = rows.filter((p) => p.process_status === f.status);
    if (f.municipality)
      rows = rows.filter((p) =>
        p.municipality.split(", ").includes(f.municipality),
      );
    if (f.responsible)
      rows = rows.filter((p) =>
        this.rows("visit").some(
          (v) => v.produtor_id === p.id && v.responsavel_id === f.responsible,
        ),
      );
    rows.sort((a, b) => a.nome.localeCompare(b.nome));
    return {
      producers: rows.slice((f.page - 1) * 25, f.page * 25),
      total: rows.length,
      page: f.page,
      pageSize: 25,
    };
  }
  dossier(id) {
    const producer = this.get(id);
    if (!producer || !this.rows("producer").some((p) => p.id === id))
      return null;
    const children = (kind) =>
      this.rows(kind).filter((r) => r.produtor_id === id);
    const requests = this.landStore.db
      .prepare("SELECT * FROM land_requests WHERE producer_id=?")
      .all(id)
      .map((r) => ({ ...r, checklist: JSON.parse(r.checklist || "{}") }));
    return {
      producer,
      link: { legacy_id: producer.legacy_id, producer_id: id },
      properties: children("property"),
      visits: children("visit"),
      tasks: children("task"),
      assistances: [],
      requests,
      documents: [],
      assignments: [],
    };
  }
  activity(kind, f) {
    let records = this.rows(kind).map((r) => ({
      ...r,
      producer_name: this.get(r.produtor_id)?.nome || "Produtor",
      responsible_name: this.directories().team.find(
        (t) => t.id === r.responsavel_id,
      )?.nome,
    }));
    if (f.search)
      records = records.filter((r) =>
        `${r.titulo} ${r.producer_name} ${this.get(r.produtor_id)?.cpf || ""}`
          .toLowerCase()
          .includes(f.search.toLowerCase()),
      );
    if (f.status) records = records.filter((r) => r.status === f.status);
    if (f.responsible)
      records = records.filter((r) => r.responsavel_id === f.responsible);
    records.sort(
      (a, b) =>
        (a.inicio_em || a.prazo_em || "9999").localeCompare(
          b.inicio_em || b.prazo_em || "9999",
        ) || a.id.localeCompare(b.id),
    );
    return {
      records: records.slice((f.page - 1) * 25, f.page * 25),
      total: records.length,
      page: f.page,
      pageSize: 25,
    };
  }
  overview(f) {
    const producers = this.producers({ ...f, page: 1 }).total,
      requests = this.landStore
        .list({ search: "", status: "", page: 1 })
        .requests.filter(
          (r) =>
            !r.archived_at &&
            (!f.municipality || r.municipality === f.municipality) &&
            (!f.responsible || r.assigned_to === f.responsible),
        );
    const visits = this.rows("visit").filter(
        (v) => !f.responsible || v.responsavel_id === f.responsible,
      ),
      tasks = this.rows("task");
    const pipeline = Object.entries(
      this.rows("producer").reduce(
        (a, p) => ({
          ...a,
          [p.process_status || "SEM_ETAPA"]:
            (a[p.process_status || "SEM_ETAPA"] || 0) + 1,
        }),
        {},
      ),
    ).map(([status, total]) => ({ status, total }));
    return {
      counts: {
        producers,
        requests: requests.filter((r) => r.status === "EM_ANALISE").length,
        visits: visits.filter((v) => v.status === "agendado").length,
        overdue: tasks.filter(
          (t) =>
            t.prazo_em &&
            t.prazo_em < new Date().toISOString() &&
            !["concluida", "cancelada"].includes(t.status),
        ).length,
        area: this.rows("property").reduce(
          (sum, p) => sum + Number(p.area_hectares || 0),
          0,
        ),
        completedVisits: visits.filter((v) => v.status === "realizado").length,
      },
      queue: requests.slice(0, 12),
      agenda: visits
        .filter((v) => v.status === "agendado")
        .slice(0, 8)
        .map((v) => ({ ...v, nome: this.get(v.produtor_id)?.nome })),
      pipeline,
      activity: [],
      team: this.directories().team.map((t) => ({
        ...t,
        requests: requests.filter((r) => r.assigned_to === t.id).length,
        visits: visits.filter(
          (v) => v.responsavel_id === t.id && v.status === "agendado",
        ).length,
      })),
      conflicts: 0,
      environment: "local",
    };
  }
  write(kind, id, expected, values, actor, requestKey) {
    if (!id && requestKey) {
      const cached = this.db.prepare('SELECT * FROM operation_submissions WHERE request_key=?').get(requestKey);
      if (cached) {
        if (cached.kind !== kind || cached.input !== JSON.stringify(values)) throw new Error('Este envio já foi utilizado com outros dados. Reabra o cadastro.');
        return JSON.parse(cached.result);
      }
    }
    const old = id ? this.get(id) : null;
    if (id && (!old || old.updated_at !== expected)) return null;
    if (
      kind === "producer" &&
      this.rows("producer").some(
        (p) => p.id !== id && digits(p.cpf) === values.cpf,
      )
    )
      throw new Error("CPF já cadastrado.");
    if (
      values.produtor_id &&
      !this.rows("producer").some((p) => p.id === values.produtor_id)
    )
      throw new Error("Produtor não encontrado.");
    if (
      values.propriedade_id &&
      !this.rows("property").some(
        (p) =>
          p.id === values.propriedade_id &&
          p.produtor_id === values.produtor_id,
      )
    )
      throw new Error("Propriedade não encontrada.");
    if (
      values.responsavel_id &&
      !this.directories().team.some((t) => t.id === values.responsavel_id)
    )
      throw new Error("Responsável não encontrado.");
    const now = new Date().toISOString();
    const row = {
      ...old,
      ...values,
      id: id || randomUUID(),
      created_at: old?.created_at || now,
      updated_at: now,
    };
    if (kind === "producer") {
      const legacy = {
        name: values.nome,
        cpf: values.cpf,
        phone: values.telefone,
        address: values.endereco,
        propertyName: old?.propertyName || "Propriedade a cadastrar",
        areaHa: 0,
        processStatus: old?.process_status || "INTERNALIZAR",
      };
      const saved = old?.legacy_id
        ? updateProducer(old.legacy_id, legacy)
        : createProducer(legacy);
      row.legacy_id = saved.id;
      row.token = saved.token;
      row.process_status = saved.processStatus;
      row.status = "ativo";
    }
    this.put(kind, row);
    this.db
      .prepare("INSERT INTO operation_audit VALUES(?,?,?,?,?)")
      .run(randomUUID(), row.id, actor, id ? "UPDATE" : "CREATE", now);
    if (!id && requestKey) this.db.prepare('INSERT INTO operation_submissions VALUES(?,?,?,?)').run(requestKey,kind,JSON.stringify(values),JSON.stringify(row));
    return row;
  }
  async land(id, version, action, patch, actor) {
    const row = this.landStore.get(id);
    if (!row || row.version !== version) return null;
    if (action === "promote") {
      const existing = this.rows("producer").find(
        (p) => digits(p.cpf) === row.cpf,
      );
      if (
        existing &&
        existing.nome.toLowerCase() !== row.full_name.toLowerCase()
      )
        throw new Error("Confira o nome do produtor já cadastrado.");
      const producer =
        existing ||
        this.write(
          "producer",
          null,
          null,
          {
            nome: row.full_name,
            cpf: row.cpf,
            telefone: row.phone,
            data_nascimento: row.birth_date,
            endereco: `${row.community} / ${row.municipality}`,
            observacoes: `Análise ${row.protocol}`,
          },
          actor,
        );
      patch = { ...row, producer_id: producer.id };
      action = "workflow";
    }
    const values =
      action === "archive"
        ? { archived_at: new Date().toISOString() }
        : action === "correct"
          ? Object.fromEntries(
              Object.entries(patch).filter(([key]) =>
                [
                  "full_name",
                  "cpf",
                  "phone",
                  "birth_date",
                  "municipality",
                  "community",
                  "is_federal_settlement",
                  "mother_name",
                  "settlement_name",
                ].includes(key),
              ),
            )
          : Object.fromEntries(
              [
                "assigned_to",
                "producer_id",
                "property_id",
                "due_date",
                "next_action",
                "internal_note",
                "checklist",
              ].map((k) => [
                k,
                k === "checklist"
                  ? JSON.stringify(patch[k] || {})
                  : (patch[k] ?? null),
              ]),
            );
    if (
      values.producer_id &&
      !this.rows("producer").some(
        (p) => p.id === values.producer_id && digits(p.cpf) === row.cpf,
      )
    )
      throw new Error("Confira o CPF do produtor.");
    const fields = Object.keys(values);
    this.landStore.db
      .prepare(
        `UPDATE land_requests SET ${fields.map((k) => `${k}=?`).join(",")},version=version+1,updated_at=? WHERE id=? AND version=?`,
      )
      .run(
        ...Object.values(values).map((v) =>
          typeof v === "boolean" ? Number(v) : v,
        ),
        new Date().toISOString(),
        id,
        version,
      );
    return {
      ...this.landStore.get(id),
      checklist: JSON.parse(this.landStore.get(id).checklist || "{}"),
    };
  }
  conflicts() {
    return [];
  }
  link() {
    throw new Error("Vinculação disponível no banco compartilhado.");
  }
}
