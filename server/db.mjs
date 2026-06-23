import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual
} from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = process.env.PAF_DB_PATH || path.join(DATA_DIR, "paf.sqlite");
const HASH_ITERATIONS = 120000;

let db;

export const PROCESS_STATUSES = [
  "INTERNALIZAR",
  "INTERNALIZADO",
  "APROVADO",
  "PLANTADO",
  "CANCELADO"
];

export const REPORT_REVIEW_STATUSES = [
  "PENDENTE",
  "EM ANÁLISE",
  "VISITA PROGRAMADA",
  "CONCLUÍDO",
  "DEVOLVIDO"
];

export const VISIT_STATUSES = [
  "PROGRAMADA",
  "EM CAMPO",
  "CONCLUÍDA",
  "REPROGRAMADA",
  "CANCELADA"
];

export const VISIT_PRIORITIES = [
  "NORMAL",
  "ALTA",
  "CRÍTICA"
];

export const TASK_STATUSES = [
  "ABERTA",
  "EM ANDAMENTO",
  "BLOQUEADA",
  "CONCLUÍDA",
  "CANCELADA"
];

export const TASK_TYPES = [
  "RELATÓRIO",
  "VISITA",
  "DOCUMENTO",
  "CONTATO",
  "CAMPO",
  "OUTRO"
];

export const DOCUMENT_STATUSES = [
  "PENDENTE",
  "EM ANÁLISE",
  "VALIDADO",
  "REJEITADO",
  "VENCIDO"
];

export const DOCUMENT_CATEGORIES = [
  "DOCUMENTO PESSOAL",
  "COMPROVANTE",
  "CONTRATO",
  "CAR",
  "FOTO DE CAMPO",
  "EVIDÊNCIA",
  "OUTRO"
];

export function getDb() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    migrate(db);
  }

  return db;
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS producers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL,
      cpf_digits TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      agency TEXT,
      area_ha REAL NOT NULL DEFAULT 0,
      process_status TEXT NOT NULL DEFAULT 'INTERNALIZAR',
      planting_year INTEGER,
      designer TEXT,
      original_row INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_report_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL,
      report_date TEXT NOT NULL,
      contact_phone TEXT,
      process_status TEXT,
      area_status TEXT,
      address TEXT,
      area_ha REAL,
      planting_year INTEGER,
      crop TEXT,
      planting_date TEXT,
      production_note TEXT,
      needs_visit INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      producer_id INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS technical_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      producer_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PROGRAMADA',
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      scheduled_date TEXT,
      technician TEXT,
      objective TEXT,
      result_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operational_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER,
      report_id INTEGER,
      visit_id INTEGER,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'OUTRO',
      status TEXT NOT NULL DEFAULT 'ABERTA',
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      assignee TEXT,
      due_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
      FOREIGN KEY (visit_id) REFERENCES technical_visits(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER,
      report_id INTEGER,
      visit_id INTEGER,
      task_id INTEGER,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'OUTRO',
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      file_name TEXT,
      file_mime TEXT,
      file_size INTEGER,
      file_path TEXT,
      uploaded_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
      FOREIGN KEY (visit_id) REFERENCES technical_visits(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES operational_tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT,
      region TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn(database, "producers", "phone", "TEXT");
  ensureColumn(database, "producers", "access_login", "TEXT");
  ensureColumn(database, "producers", "access_code_hash", "TEXT");
  ensureColumn(database, "producers", "access_issued_at", "TEXT");
  ensureColumn(database, "reports", "review_status", "TEXT NOT NULL DEFAULT 'PENDENTE'");
  ensureColumn(database, "reports", "technical_note", "TEXT");
  ensureColumn(database, "reports", "reviewed_at", "TEXT");
  ensureColumn(database, "reports", "reviewed_by", "TEXT");

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_producers_token ON producers(token);
    CREATE INDEX IF NOT EXISTS idx_producers_status ON producers(process_status);
    CREATE INDEX IF NOT EXISTS idx_producers_agency ON producers(agency);
    CREATE INDEX IF NOT EXISTS idx_producers_designer ON producers(designer);
    CREATE INDEX IF NOT EXISTS idx_producers_year ON producers(planting_year);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_producers_access_login ON producers(access_login);
    CREATE INDEX IF NOT EXISTS idx_reports_producer ON reports(producer_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
    CREATE INDEX IF NOT EXISTS idx_reports_review_status ON reports(review_status);
    CREATE INDEX IF NOT EXISTS idx_visits_report ON technical_visits(report_id);
    CREATE INDEX IF NOT EXISTS idx_visits_producer ON technical_visits(producer_id);
    CREATE INDEX IF NOT EXISTS idx_visits_status ON technical_visits(status);
    CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON technical_visits(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_producer ON operational_tasks(producer_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_report ON operational_tasks(report_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_visit ON operational_tasks(visit_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON operational_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON operational_tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_documents_producer ON documents(producer_id);
    CREATE INDEX IF NOT EXISTS idx_documents_report ON documents(report_id);
    CREATE INDEX IF NOT EXISTS idx_documents_visit ON documents(visit_id);
    CREATE INDEX IF NOT EXISTS idx_documents_task ON documents(task_id);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
    CREATE INDEX IF NOT EXISTS idx_technicians_name ON technicians(name);
    CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(active);
    CREATE INDEX IF NOT EXISTS idx_technicians_role ON technicians(role);
    CREATE INDEX IF NOT EXISTS idx_technicians_region ON technicians(region);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON auth_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON auth_sessions(expires_at);
  `);

  backfillProducerCredentials(database);
}

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function backfillProducerCredentials(database) {
  const producers = database
    .prepare("SELECT id, token, original_row FROM producers WHERE access_login IS NULL OR access_code_hash IS NULL")
    .all();

  const update = database.prepare(`
    UPDATE producers
    SET access_login = $accessLogin,
        access_code_hash = $accessCodeHash,
        access_issued_at = COALESCE(access_issued_at, $accessIssuedAt),
        updated_at = $updatedAt
    WHERE id = $id
  `);

  for (const producer of producers) {
    const credentials = makeProducerCredentials(producer);
    const now = nowIso();
    update.run({
      $accessLogin: credentials.login,
      $accessCodeHash: hashSecret(credentials.code),
      $accessIssuedAt: now,
      $updatedAt: now,
      $id: producer.id
    });
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCpfDigits(value) {
  return normalizeText(value).replace(/\D/g, "");
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value).replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function toIntegerOrNull(value) {
  const numeric = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeStatus(value) {
  const status = normalizeText(value).toUpperCase();
  return PROCESS_STATUSES.includes(status) ? status : "INTERNALIZAR";
}

export function normalizeReviewStatus(value) {
  const status = normalizeText(value).toUpperCase();
  return REPORT_REVIEW_STATUSES.includes(status) ? status : "PENDENTE";
}

export function normalizeVisitStatus(value) {
  const status = normalizeText(value).toUpperCase();
  return VISIT_STATUSES.includes(status) ? status : "PROGRAMADA";
}

export function normalizeVisitPriority(value) {
  const priority = normalizeText(value).toUpperCase();
  return VISIT_PRIORITIES.includes(priority) ? priority : "NORMAL";
}

export function normalizeTaskStatus(value) {
  const status = normalizeText(value).toUpperCase();
  return TASK_STATUSES.includes(status) ? status : "ABERTA";
}

export function normalizeTaskType(value) {
  const type = normalizeText(value).toUpperCase();
  return TASK_TYPES.includes(type) ? type : "OUTRO";
}

export function normalizeDocumentStatus(value) {
  const status = normalizeText(value).toUpperCase();
  return DOCUMENT_STATUSES.includes(status) ? status : "PENDENTE";
}

export function normalizeDocumentCategory(value) {
  const category = normalizeText(value).toUpperCase();
  return DOCUMENT_CATEGORIES.includes(category) ? category : "OUTRO";
}

export function makeProducerToken({ cpfDigits, name, originalRow }) {
  const identity = `${cpfDigits || "SEM-CPF"}|${normalizeText(name).toUpperCase()}|${originalRow ?? ""}`;
  return createHash("sha256").update(identity).digest("hex").slice(0, 18);
}

export function makeProducerCredentials({ token, original_row, originalRow }) {
  const row = original_row ?? originalRow ?? 0;
  const paddedRow = String(row || 0).padStart(4, "0");
  const codeSeed = normalizeText(token).slice(0, 8).toUpperCase();

  return {
    login: `PAF-${paddedRow}`,
    code: `${codeSeed.slice(0, 4)}-${codeSeed.slice(4, 8)}`
  };
}

export function upsertProducer(producer) {
  const database = getDb();
  const now = nowIso();
  const credentials = makeProducerCredentials({
    token: producer.token,
    originalRow: producer.originalRow
  });

  database
    .prepare(`
      INSERT INTO producers (
        token,
        name,
      cpf,
      cpf_digits,
      phone,
      address,
      agency,
      area_ha,
        process_status,
        planting_year,
        designer,
        original_row,
        access_login,
        access_code_hash,
        access_issued_at,
        created_at,
        updated_at
      )
      VALUES (
        $token,
        $name,
        $cpf,
        $cpfDigits,
        $phone,
        $address,
        $agency,
        $areaHa,
        $processStatus,
        $plantingYear,
        $designer,
        $originalRow,
        $accessLogin,
        $accessCodeHash,
        $accessIssuedAt,
        $createdAt,
        $updatedAt
      )
      ON CONFLICT(token) DO UPDATE SET
        name = excluded.name,
        cpf = excluded.cpf,
        cpf_digits = excluded.cpf_digits,
        phone = COALESCE(excluded.phone, producers.phone),
        address = excluded.address,
        agency = excluded.agency,
        area_ha = excluded.area_ha,
        process_status = excluded.process_status,
        planting_year = excluded.planting_year,
        designer = excluded.designer,
        original_row = excluded.original_row,
        access_login = excluded.access_login,
        access_code_hash = excluded.access_code_hash,
        access_issued_at = COALESCE(producers.access_issued_at, excluded.access_issued_at),
        updated_at = excluded.updated_at
    `)
    .run({
      $token: producer.token,
      $name: producer.name,
      $cpf: producer.cpf,
      $cpfDigits: producer.cpfDigits,
      $phone: producer.phone || null,
      $address: producer.address || null,
      $agency: producer.agency || null,
      $areaHa: producer.areaHa ?? 0,
      $processStatus: producer.processStatus,
      $plantingYear: producer.plantingYear,
      $designer: producer.designer || null,
      $originalRow: producer.originalRow,
      $accessLogin: credentials.login,
      $accessCodeHash: hashSecret(credentials.code),
      $accessIssuedAt: now,
      $createdAt: now,
      $updatedAt: now
    });
}

function nextProducerOriginalRow(database) {
  const row = database.prepare("SELECT COALESCE(MAX(original_row), 0) + 1 AS value FROM producers").get();
  return Number(row?.value || 1);
}

export function createProducer(payload = {}) {
  const database = getDb();
  const name = normalizeText(payload.name).slice(0, 180);

  if (!name) {
    throw new Error("Informe o nome do produtor.");
  }

  const cpf = normalizeText(payload.cpf).slice(0, 40);
  const cpfDigits = normalizeCpfDigits(payload.cpf);
  const baseRow = toIntegerOrNull(payload.originalRow) || nextProducerOriginalRow(database);
  const now = nowIso();
  let lastError = null;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const originalRow = baseRow + attempt;
    const token = makeProducerToken({ cpfDigits, name, originalRow });
    const credentials = makeProducerCredentials({ token, originalRow });

    try {
      database
        .prepare(`
          INSERT INTO producers (
            token,
            name,
            cpf,
            cpf_digits,
            phone,
            address,
            agency,
            area_ha,
            process_status,
            planting_year,
            designer,
            original_row,
            access_login,
            access_code_hash,
            access_issued_at,
            created_at,
            updated_at
          )
          VALUES (
            $token,
            $name,
            $cpf,
            $cpfDigits,
            $phone,
            $address,
            $agency,
            $areaHa,
            $processStatus,
            $plantingYear,
            $designer,
            $originalRow,
            $accessLogin,
            $accessCodeHash,
            $accessIssuedAt,
            $createdAt,
            $updatedAt
          )
        `)
        .run({
          $token: token,
          $name: name,
          $cpf: cpf,
          $cpfDigits: cpfDigits,
          $phone: normalizeText(payload.phone).slice(0, 40) || null,
          $address: normalizeText(payload.address).slice(0, 240) || null,
          $agency: normalizeText(payload.agency).slice(0, 120) || null,
          $areaHa: toNumberOrNull(payload.areaHa) ?? 0,
          $processStatus: normalizeStatus(payload.processStatus),
          $plantingYear: toIntegerOrNull(payload.plantingYear),
          $designer: normalizeText(payload.designer).slice(0, 160) || null,
          $originalRow: originalRow,
          $accessLogin: credentials.login,
          $accessCodeHash: hashSecret(credentials.code),
          $accessIssuedAt: now,
          $createdAt: now,
          $updatedAt: now
        });

      return getProducerByToken(token, { includeCredentials: true });
    } catch (error) {
      lastError = error;
      if (!String(error?.message || "").includes("UNIQUE")) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Não foi possível gerar um login único para o produtor.");
}

export function listProducers(filters = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    params.$searchDigits = `%${normalizeCpfDigits(filters.search)}%`;
    where.push(
      "(p.name LIKE $search OR p.cpf LIKE $search OR p.cpf_digits LIKE $searchDigits OR p.phone LIKE $search OR p.address LIKE $search OR p.access_login LIKE $search)"
    );
  }

  if (filters.status) {
    params.$status = normalizeText(filters.status);
    where.push("p.process_status = $status");
  }

  if (filters.agency) {
    params.$agency = normalizeText(filters.agency);
    where.push("p.agency = $agency");
  }

  if (filters.reviewStatus) {
    params.$reviewStatus = normalizeReviewStatus(filters.reviewStatus);
    where.push("r.review_status = $reviewStatus");
  }

  if (filters.designer) {
    params.$designer = normalizeText(filters.designer);
    where.push("p.designer = $designer");
  }

  if (filters.year) {
    params.$year = toIntegerOrNull(filters.year);
    where.push("p.planting_year = $year");
  }

  if (filters.reported === "yes") {
    where.push("p.last_report_at IS NOT NULL");
  }

  if (filters.reported === "no") {
    where.push("p.last_report_at IS NULL");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = database
    .prepare(`
      SELECT
        p.*,
        r.id AS latest_report_id,
        r.report_date AS latest_report_date,
        r.contact_phone AS latest_contact_phone,
        r.area_status AS latest_area_status,
        r.crop AS latest_crop,
        r.needs_visit AS latest_needs_visit,
        r.notes AS latest_notes,
        r.created_at AS latest_report_created_at
      FROM producers p
      LEFT JOIN reports r
        ON r.id = (
          SELECT id
          FROM reports
          WHERE producer_id = p.id
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        )
      ${whereSql}
      ORDER BY p.name COLLATE NOCASE ASC
    `)
    .all(params);

  return rows.map((row) => mapProducerRow(row, { includeCredentials: true }));
}

export function updateProducer(producerId, payload = {}) {
  const database = getDb();
  const current = getProducerById(producerId);

  if (!current) {
    return null;
  }

  const updated = {
    name: normalizeText(payload.name) || current.name,
    cpf: normalizeText(payload.cpf) || current.cpf,
    cpfDigits: normalizeCpfDigits(payload.cpf) || current.cpfDigits,
    phone: normalizeText(payload.phone).slice(0, 40) || current.phone || null,
    address: normalizeText(payload.address).slice(0, 240) || current.address || null,
    agency: normalizeText(payload.agency).slice(0, 120) || current.agency || null,
    areaHa: toNumberOrNull(payload.areaHa) ?? current.areaHa,
    processStatus: normalizeStatus(payload.processStatus || current.processStatus),
    plantingYear: toIntegerOrNull(payload.plantingYear) ?? current.plantingYear,
    designer: normalizeText(payload.designer).slice(0, 160) || current.designer || null,
    updatedAt: nowIso()
  };

  database
    .prepare(`
      UPDATE producers
      SET
        name = $name,
        cpf = $cpf,
        cpf_digits = $cpfDigits,
        phone = $phone,
        address = $address,
        agency = $agency,
        area_ha = $areaHa,
        process_status = $processStatus,
        planting_year = $plantingYear,
        designer = $designer,
        updated_at = $updatedAt
      WHERE id = $id
    `)
    .run({
      $name: updated.name,
      $cpf: updated.cpf,
      $cpfDigits: updated.cpfDigits,
      $phone: updated.phone,
      $address: updated.address,
      $agency: updated.agency,
      $areaHa: updated.areaHa,
      $processStatus: updated.processStatus,
      $plantingYear: updated.plantingYear,
      $designer: updated.designer,
      $updatedAt: updated.updatedAt,
      $id: producerId
    });

  return getProducerById(producerId, { includeCredentials: true });
}

export function listReports(filters = {}) {
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    params.$searchDigits = `%${normalizeCpfDigits(filters.search)}%`;
    where.push(
      "(p.name LIKE $search OR p.cpf LIKE $search OR p.cpf_digits LIKE $searchDigits OR r.notes LIKE $search OR r.area_status LIKE $search)"
    );
  }

  if (filters.needsVisit === "yes") {
    where.push("r.needs_visit = 1");
  }

  if (filters.status) {
    params.$status = normalizeStatus(filters.status);
    where.push("r.process_status = $status");
  }

  if (filters.agency) {
    params.$agency = normalizeText(filters.agency);
    where.push("p.agency = $agency");
  }

  if (filters.reviewStatus) {
    params.$reviewStatus = normalizeReviewStatus(filters.reviewStatus);
    where.push("r.review_status = $reviewStatus");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return getDb()
    .prepare(`
      SELECT
        r.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        p.designer AS producer_designer,
        p.access_login AS producer_access_login
      FROM reports r
      JOIN producers p ON p.id = r.producer_id
      ${whereSql}
      ORDER BY r.created_at DESC, r.id DESC
    `)
    .all(params)
    .map(mapReportRow);
}

export function getProducerByToken(token, options = {}) {
  const row = producerQuery("p.token = $token").get({ $token: normalizeText(token) });
  return row ? mapProducerRow(row, options) : null;
}

export function getProducerById(id, options = {}) {
  const row = producerQuery("p.id = $id").get({ $id: id });
  return row ? mapProducerRow(row, options) : null;
}

export function getProducerByLogin(login) {
  const row = producerQuery("UPPER(p.access_login) = UPPER($login)").get({
    $login: normalizeText(login)
  });
  return row ? mapProducerRow(row, { includeHash: true }) : null;
}

function producerQuery(whereSql) {
  return getDb().prepare(`
    SELECT
      p.*,
      r.id AS latest_report_id,
      r.report_date AS latest_report_date,
      r.contact_phone AS latest_contact_phone,
      r.area_status AS latest_area_status,
      r.crop AS latest_crop,
      r.needs_visit AS latest_needs_visit,
      r.notes AS latest_notes,
      r.created_at AS latest_report_created_at
    FROM producers p
    LEFT JOIN reports r
      ON r.id = (
        SELECT id
        FROM reports
        WHERE producer_id = p.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      )
    WHERE ${whereSql}
  `);
}

export function verifyProducerCredentials(login, accessCode) {
  const producer = getProducerByLogin(login);

  if (!producer?.accessCodeHash || !verifySecret(accessCode, producer.accessCodeHash)) {
    return null;
  }

  return getProducerById(producer.id);
}

export function createReport(token, payload) {
  const producer = getProducerByToken(token);
  return producer ? createReportForProducer(producer.id, payload) : null;
}

export function createReportForProducer(producerId, payload) {
  const database = getDb();
  const producer = getProducerById(producerId);

  if (!producer) {
    return null;
  }

  const createdAt = nowIso();
  const report = {
    producerId: producer.id,
    reportDate: normalizeText(payload.reportDate) || createdAt.slice(0, 10),
    contactPhone: normalizeText(payload.contactPhone).slice(0, 40) || null,
    processStatus: normalizeStatus(payload.processStatus || producer.processStatus),
    areaStatus: normalizeText(payload.areaStatus).slice(0, 80) || null,
    address: normalizeText(payload.address).slice(0, 240) || producer.address || null,
    areaHa: toNumberOrNull(payload.areaHa) ?? producer.areaHa,
    plantingYear: toIntegerOrNull(payload.plantingYear) ?? producer.plantingYear,
    crop: normalizeText(payload.crop).slice(0, 120) || null,
    plantingDate: normalizeText(payload.plantingDate) || null,
    productionNote: normalizeText(payload.productionNote).slice(0, 240) || null,
    needsVisit: payload.needsVisit ? 1 : 0,
    notes: normalizeText(payload.notes).slice(0, 800) || null
  };

  database
    .prepare(`
      INSERT INTO reports (
        producer_id,
        report_date,
        contact_phone,
        process_status,
        area_status,
        address,
        area_ha,
        planting_year,
        crop,
        planting_date,
        production_note,
        needs_visit,
        notes,
        review_status,
        created_at
      )
      VALUES (
        $producerId,
        $reportDate,
        $contactPhone,
        $processStatus,
        $areaStatus,
        $address,
        $areaHa,
        $plantingYear,
        $crop,
        $plantingDate,
        $productionNote,
        $needsVisit,
        $notes,
        'PENDENTE',
        $createdAt
      )
    `)
    .run({
      $producerId: report.producerId,
      $reportDate: report.reportDate,
      $contactPhone: report.contactPhone,
      $processStatus: report.processStatus,
      $areaStatus: report.areaStatus,
      $address: report.address,
      $areaHa: report.areaHa,
      $plantingYear: report.plantingYear,
      $crop: report.crop,
      $plantingDate: report.plantingDate,
      $productionNote: report.productionNote,
      $needsVisit: report.needsVisit,
      $notes: report.notes,
      $createdAt: createdAt
    });

  database
    .prepare(`
      UPDATE producers
      SET
        address = $address,
        area_ha = $areaHa,
        process_status = $processStatus,
        planting_year = $plantingYear,
        updated_at = $updatedAt,
        last_report_at = $lastReportAt
      WHERE id = $producerId
    `)
    .run({
      $address: report.address,
      $areaHa: report.areaHa,
      $processStatus: report.processStatus,
      $plantingYear: report.plantingYear,
      $updatedAt: createdAt,
      $lastReportAt: createdAt,
      $producerId: producer.id
    });

  return getProducerById(producer.id);
}

export function updateReportReview(reportId, payload, reviewedBy = "admin") {
  const database = getDb();
  const current = database.prepare("SELECT id FROM reports WHERE id = $id").get({ $id: reportId });

  if (!current) {
    return null;
  }

  const reviewedAt = nowIso();

  database
    .prepare(`
      UPDATE reports
      SET
        review_status = $reviewStatus,
        technical_note = $technicalNote,
        reviewed_at = $reviewedAt,
        reviewed_by = $reviewedBy
      WHERE id = $id
    `)
    .run({
      $reviewStatus: normalizeReviewStatus(payload.reviewStatus),
      $technicalNote: normalizeText(payload.technicalNote).slice(0, 1000) || null,
      $reviewedAt: reviewedAt,
      $reviewedBy: normalizeText(reviewedBy).slice(0, 120) || "admin",
      $id: reportId
    });

  return getReportById(reportId);
}

export function listVisits(filters = {}) {
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    params.$searchDigits = `%${normalizeCpfDigits(filters.search)}%`;
    where.push(
      "(p.name LIKE $search OR p.cpf LIKE $search OR p.cpf_digits LIKE $searchDigits OR p.address LIKE $search OR v.objective LIKE $search OR v.result_note LIKE $search)"
    );
  }

  if (filters.status) {
    params.$status = normalizeVisitStatus(filters.status);
    where.push("v.status = $status");
  }

  if (filters.priority) {
    params.$priority = normalizeVisitPriority(filters.priority);
    where.push("v.priority = $priority");
  }

  if (filters.agency) {
    params.$agency = normalizeText(filters.agency);
    where.push("p.agency = $agency");
  }

  if (filters.technician) {
    params.$technician = `%${normalizeText(filters.technician)}%`;
    where.push("v.technician LIKE $technician");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return getDb()
    .prepare(`
      SELECT
        v.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        p.address AS producer_address,
        p.area_ha AS producer_area_ha,
        r.area_status AS report_area_status,
        r.created_at AS report_created_at
      FROM technical_visits v
      JOIN producers p ON p.id = v.producer_id
      LEFT JOIN reports r ON r.id = v.report_id
      ${whereSql}
      ORDER BY
        CASE v.status
          WHEN 'PROGRAMADA' THEN 1
          WHEN 'REPROGRAMADA' THEN 2
          WHEN 'EM CAMPO' THEN 3
          WHEN 'CONCLUÍDA' THEN 4
          ELSE 5
        END,
        COALESCE(v.scheduled_date, v.created_at) ASC,
        v.id DESC
    `)
    .all(params)
    .map(mapVisitRow);
}

export function createVisit(payload = {}, createdBy = "admin") {
  const database = getDb();
  const reportId = toIntegerOrNull(payload.reportId);
  const report = reportId ? getReportById(reportId) : null;
  const producerId = toIntegerOrNull(payload.producerId) || report?.producerId;
  const producer = producerId ? getProducerById(producerId) : null;

  if (!producer) {
    return null;
  }

  const now = nowIso();
  const visit = {
    reportId: report?.id || null,
    producerId: producer.id,
    status: normalizeVisitStatus(payload.status || "PROGRAMADA"),
    priority: normalizeVisitPriority(payload.priority || (report?.needsVisit ? "ALTA" : "NORMAL")),
    scheduledDate: normalizeText(payload.scheduledDate) || null,
    technician: normalizeText(payload.technician).slice(0, 120) || normalizeText(createdBy).slice(0, 120) || "Equipe técnica",
    objective:
      normalizeText(payload.objective).slice(0, 500) ||
      `Visita técnica para ${producer.name}${report?.areaStatus ? ` - ${report.areaStatus}` : ""}`,
    resultNote: normalizeText(payload.resultNote).slice(0, 1000) || null
  };

  const result = database
    .prepare(`
      INSERT INTO technical_visits (
        report_id,
        producer_id,
        status,
        priority,
        scheduled_date,
        technician,
        objective,
        result_note,
        created_at,
        updated_at,
        completed_at
      )
      VALUES (
        $reportId,
        $producerId,
        $status,
        $priority,
        $scheduledDate,
        $technician,
        $objective,
        $resultNote,
        $createdAt,
        $updatedAt,
        $completedAt
      )
    `)
    .run({
      $reportId: visit.reportId,
      $producerId: visit.producerId,
      $status: visit.status,
      $priority: visit.priority,
      $scheduledDate: visit.scheduledDate,
      $technician: visit.technician,
      $objective: visit.objective,
      $resultNote: visit.resultNote,
      $createdAt: now,
      $updatedAt: now,
      $completedAt: visit.status === "CONCLUÍDA" ? now : null
    });

  if (report?.id) {
    const reviewNote =
      normalizeText(payload.technicalNote) ||
      `${visit.objective}${visit.scheduledDate ? ` | Agendada para ${visit.scheduledDate}` : ""}`;
    updateReportReview(report.id, { reviewStatus: "VISITA PROGRAMADA", technicalNote: reviewNote }, createdBy);
  }

  return getVisitById(Number(result.lastInsertRowid));
}

export function updateVisit(visitId, payload = {}, reviewedBy = "admin") {
  const database = getDb();
  const current = getVisitById(visitId);

  if (!current) {
    return null;
  }

  const status = normalizeVisitStatus(payload.status || current.status);
  const updatedAt = nowIso();
  const completedAt = status === "CONCLUÍDA" ? current.completedAt || updatedAt : null;

  database
    .prepare(`
      UPDATE technical_visits
      SET
        status = $status,
        priority = $priority,
        scheduled_date = $scheduledDate,
        technician = $technician,
        objective = $objective,
        result_note = $resultNote,
        updated_at = $updatedAt,
        completed_at = $completedAt
      WHERE id = $id
    `)
    .run({
      $status: status,
      $priority: normalizeVisitPriority(payload.priority || current.priority),
      $scheduledDate:
        payload.scheduledDate === undefined ? current.scheduledDate : normalizeText(payload.scheduledDate) || null,
      $technician: normalizeText(payload.technician).slice(0, 120) || current.technician || normalizeText(reviewedBy) || "Equipe técnica",
      $objective: normalizeText(payload.objective).slice(0, 500) || current.objective || null,
      $resultNote: payload.resultNote === undefined ? current.resultNote : normalizeText(payload.resultNote).slice(0, 1000) || null,
      $updatedAt: updatedAt,
      $completedAt: completedAt,
      $id: visitId
    });

  if (current.reportId && status === "CONCLUÍDA") {
    updateReportReview(
      current.reportId,
      {
        reviewStatus: "CONCLUÍDO",
        technicalNote: normalizeText(payload.resultNote) || current.resultNote || current.objective
      },
      reviewedBy
    );
  }

  return getVisitById(visitId);
}

export function listTasks(filters = {}) {
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    params.$searchDigits = `%${normalizeCpfDigits(filters.search)}%`;
    where.push(
      "(t.title LIKE $search OR t.notes LIKE $search OR t.assignee LIKE $search OR p.name LIKE $search OR p.cpf LIKE $search OR p.cpf_digits LIKE $searchDigits)"
    );
  }

  if (filters.status) {
    params.$status = normalizeTaskStatus(filters.status);
    where.push("t.status = $status");
  }

  if (filters.priority) {
    params.$priority = normalizeVisitPriority(filters.priority);
    where.push("t.priority = $priority");
  }

  if (filters.type) {
    params.$type = normalizeTaskType(filters.type);
    where.push("t.type = $type");
  }

  if (filters.assignee) {
    params.$assignee = `%${normalizeText(filters.assignee)}%`;
    where.push("t.assignee LIKE $assignee");
  }

  if (filters.agency) {
    params.$agency = normalizeText(filters.agency);
    where.push("p.agency = $agency");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return getDb()
    .prepare(`
      SELECT
        t.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        r.area_status AS report_area_status,
        r.created_at AS report_created_at,
        v.status AS visit_status,
        v.scheduled_date AS visit_scheduled_date
      FROM operational_tasks t
      LEFT JOIN producers p ON p.id = t.producer_id
      LEFT JOIN reports r ON r.id = t.report_id
      LEFT JOIN technical_visits v ON v.id = t.visit_id
      ${whereSql}
      ORDER BY
        CASE t.status
          WHEN 'ABERTA' THEN 1
          WHEN 'EM ANDAMENTO' THEN 2
          WHEN 'BLOQUEADA' THEN 3
          WHEN 'CONCLUÍDA' THEN 4
          ELSE 5
        END,
        CASE t.priority
          WHEN 'CRÍTICA' THEN 1
          WHEN 'ALTA' THEN 2
          ELSE 3
        END,
        COALESCE(t.due_date, '9999-12-31') ASC,
        t.updated_at DESC
    `)
    .all(params)
    .map(mapTaskRow);
}

export function createTask(payload = {}, createdBy = "admin") {
  const database = getDb();
  const reportId = toIntegerOrNull(payload.reportId);
  const visitId = toIntegerOrNull(payload.visitId);
  const report = reportId ? getReportById(reportId) : null;
  const visit = visitId ? getVisitById(visitId) : null;
  const producerId = toIntegerOrNull(payload.producerId) || report?.producerId || visit?.producerId || null;
  const now = nowIso();
  const status = normalizeTaskStatus(payload.status || "ABERTA");

  const title =
    normalizeText(payload.title).slice(0, 180) ||
    (visit ? `Acompanhar visita de ${visit.producerName}` : report ? `Tratar relatório de ${report.producerName}` : "Pendência operacional");

  const result = database
    .prepare(`
      INSERT INTO operational_tasks (
        producer_id,
        report_id,
        visit_id,
        title,
        type,
        status,
        priority,
        assignee,
        due_date,
        notes,
        created_at,
        updated_at,
        completed_at
      )
      VALUES (
        $producerId,
        $reportId,
        $visitId,
        $title,
        $type,
        $status,
        $priority,
        $assignee,
        $dueDate,
        $notes,
        $createdAt,
        $updatedAt,
        $completedAt
      )
    `)
    .run({
      $producerId: producerId,
      $reportId: report?.id || null,
      $visitId: visit?.id || null,
      $title: title,
      $type: normalizeTaskType(payload.type || (visit ? "VISITA" : report ? "RELATÓRIO" : "OUTRO")),
      $status: status,
      $priority: normalizeVisitPriority(payload.priority || "NORMAL"),
      $assignee: normalizeText(payload.assignee).slice(0, 120) || normalizeText(createdBy).slice(0, 120) || "Equipe técnica",
      $dueDate: normalizeText(payload.dueDate) || null,
      $notes: normalizeText(payload.notes).slice(0, 1000) || null,
      $createdAt: now,
      $updatedAt: now,
      $completedAt: status === "CONCLUÍDA" ? now : null
    });

  return getTaskById(Number(result.lastInsertRowid));
}

export function updateTask(taskId, payload = {}, reviewedBy = "admin") {
  const database = getDb();
  const current = getTaskById(taskId);

  if (!current) {
    return null;
  }

  const status = normalizeTaskStatus(payload.status || current.status);
  const updatedAt = nowIso();
  const completedAt = status === "CONCLUÍDA" ? current.completedAt || updatedAt : null;

  database
    .prepare(`
      UPDATE operational_tasks
      SET
        title = $title,
        type = $type,
        status = $status,
        priority = $priority,
        assignee = $assignee,
        due_date = $dueDate,
        notes = $notes,
        updated_at = $updatedAt,
        completed_at = $completedAt
      WHERE id = $id
    `)
    .run({
      $title: normalizeText(payload.title).slice(0, 180) || current.title,
      $type: normalizeTaskType(payload.type || current.type),
      $status: status,
      $priority: normalizeVisitPriority(payload.priority || current.priority),
      $assignee: normalizeText(payload.assignee).slice(0, 120) || current.assignee || normalizeText(reviewedBy) || "Equipe técnica",
      $dueDate: payload.dueDate === undefined ? current.dueDate : normalizeText(payload.dueDate) || null,
      $notes: payload.notes === undefined ? current.notes : normalizeText(payload.notes).slice(0, 1000) || null,
      $updatedAt: updatedAt,
      $completedAt: completedAt,
      $id: taskId
    });

  return getTaskById(taskId);
}

export function listDocuments(filters = {}) {
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    params.$searchDigits = `%${normalizeCpfDigits(filters.search)}%`;
    where.push(
      "(d.title LIKE $search OR d.notes LIKE $search OR d.file_name LIKE $search OR d.uploaded_by LIKE $search OR p.name LIKE $search OR p.cpf LIKE $search OR p.cpf_digits LIKE $searchDigits)"
    );
  }

  if (filters.status) {
    params.$status = normalizeDocumentStatus(filters.status);
    where.push("d.status = $status");
  }

  if (filters.category) {
    params.$category = normalizeDocumentCategory(filters.category);
    where.push("d.category = $category");
  }

  if (filters.agency) {
    params.$agency = normalizeText(filters.agency);
    where.push("p.agency = $agency");
  }

  if (filters.producerId) {
    params.$producerId = toIntegerOrNull(filters.producerId);
    where.push("d.producer_id = $producerId");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return getDb()
    .prepare(`
      SELECT
        d.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        r.area_status AS report_area_status,
        v.status AS visit_status,
        t.title AS task_title
      FROM documents d
      LEFT JOIN producers p ON p.id = d.producer_id
      LEFT JOIN reports r ON r.id = d.report_id
      LEFT JOIN technical_visits v ON v.id = d.visit_id
      LEFT JOIN operational_tasks t ON t.id = d.task_id
      ${whereSql}
      ORDER BY
        CASE d.status
          WHEN 'PENDENTE' THEN 1
          WHEN 'EM ANÁLISE' THEN 2
          WHEN 'REJEITADO' THEN 3
          WHEN 'VENCIDO' THEN 4
          ELSE 5
        END,
        d.updated_at DESC,
        d.id DESC
    `)
    .all(params)
    .map(mapDocumentRow);
}

export function createDocumentRecord(payload = {}, uploadedBy = "admin") {
  const database = getDb();
  const reportId = toIntegerOrNull(payload.reportId);
  const visitId = toIntegerOrNull(payload.visitId);
  const taskId = toIntegerOrNull(payload.taskId);
  const report = reportId ? getReportById(reportId) : null;
  const visit = visitId ? getVisitById(visitId) : null;
  const task = taskId ? getTaskById(taskId) : null;
  const producerId = toIntegerOrNull(payload.producerId) || report?.producerId || visit?.producerId || task?.producerId || null;
  const now = nowIso();
  const title = normalizeText(payload.title).slice(0, 180) || normalizeText(payload.fileName).slice(0, 180) || "Documento PAF";

  const result = database
    .prepare(`
      INSERT INTO documents (
        producer_id,
        report_id,
        visit_id,
        task_id,
        title,
        category,
        status,
        file_name,
        file_mime,
        file_size,
        file_path,
        uploaded_by,
        notes,
        created_at,
        updated_at,
        reviewed_at
      )
      VALUES (
        $producerId,
        $reportId,
        $visitId,
        $taskId,
        $title,
        $category,
        $status,
        $fileName,
        $fileMime,
        $fileSize,
        $filePath,
        $uploadedBy,
        $notes,
        $createdAt,
        $updatedAt,
        $reviewedAt
      )
    `)
    .run({
      $producerId: producerId,
      $reportId: report?.id || null,
      $visitId: visit?.id || null,
      $taskId: task?.id || null,
      $title: title,
      $category: normalizeDocumentCategory(payload.category),
      $status: normalizeDocumentStatus(payload.status),
      $fileName: normalizeText(payload.fileName).slice(0, 240) || null,
      $fileMime: normalizeText(payload.fileMime).slice(0, 120) || null,
      $fileSize: toIntegerOrNull(payload.fileSize) || null,
      $filePath: normalizeText(payload.filePath) || null,
      $uploadedBy: normalizeText(uploadedBy).slice(0, 120) || "admin",
      $notes: normalizeText(payload.notes).slice(0, 1000) || null,
      $createdAt: now,
      $updatedAt: now,
      $reviewedAt: normalizeDocumentStatus(payload.status) === "VALIDADO" ? now : null
    });

  return getDocumentById(Number(result.lastInsertRowid));
}

export function updateDocument(documentId, payload = {}, reviewedBy = "admin") {
  const database = getDb();
  const current = getDocumentById(documentId);

  if (!current) {
    return null;
  }

  const status = normalizeDocumentStatus(payload.status || current.status);
  const updatedAt = nowIso();

  database
    .prepare(`
      UPDATE documents
      SET
        title = $title,
        category = $category,
        status = $status,
        uploaded_by = $uploadedBy,
        notes = $notes,
        updated_at = $updatedAt,
        reviewed_at = $reviewedAt
      WHERE id = $id
    `)
    .run({
      $title: normalizeText(payload.title).slice(0, 180) || current.title,
      $category: normalizeDocumentCategory(payload.category || current.category),
      $status: status,
      $uploadedBy: current.uploadedBy || normalizeText(reviewedBy).slice(0, 120) || "admin",
      $notes: payload.notes === undefined ? current.notes : normalizeText(payload.notes).slice(0, 1000) || null,
      $updatedAt: updatedAt,
      $reviewedAt: status === "VALIDADO" ? current.reviewedAt || updatedAt : current.reviewedAt,
      $id: documentId
    });

  return getDocumentById(documentId);
}

export function getOptions() {
  const database = getDb();

  const distinct = (column) =>
    database
      .prepare(`
        SELECT DISTINCT ${column} AS value
        FROM producers
        WHERE ${column} IS NOT NULL AND ${column} != ''
        ORDER BY ${column} COLLATE NOCASE ASC
      `)
      .all()
      .map((row) => row.value);

  const activeTechnicians = database
    .prepare(`
      SELECT name
      FROM technicians
      WHERE active = 1
      ORDER BY name COLLATE NOCASE ASC
    `)
    .all()
    .map((row) => row.name);

  return {
    statuses: PROCESS_STATUSES,
    visitStatuses: VISIT_STATUSES,
    visitPriorities: VISIT_PRIORITIES,
    taskStatuses: TASK_STATUSES,
    taskTypes: TASK_TYPES,
    documentStatuses: DOCUMENT_STATUSES,
    documentCategories: DOCUMENT_CATEGORIES,
    agencies: distinct("agency"),
    designers: distinct("designer"),
    years: distinct("planting_year"),
    technicians: activeTechnicians
  };
}

export function listTechnicians(filters = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  if (filters.search) {
    params.$search = `%${normalizeText(filters.search)}%`;
    where.push(
      "(name LIKE $search OR phone LIKE $search OR email LIKE $search OR role LIKE $search OR region LIKE $search)"
    );
  }

  if (filters.active === "yes") {
    where.push("active = 1");
  }

  if (filters.active === "no") {
    where.push("active = 0");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return database
    .prepare(`
      SELECT *
      FROM technicians
      ${whereSql}
      ORDER BY active DESC, name COLLATE NOCASE ASC
    `)
    .all(params)
    .map(mapTechnicianRow);
}

export function getTechnicianById(technicianId) {
  const row = getDb()
    .prepare("SELECT * FROM technicians WHERE id = $id")
    .get({ $id: technicianId });

  return row ? mapTechnicianRow(row) : null;
}

export function createTechnician(payload = {}) {
  const database = getDb();
  const now = nowIso();
  const name = normalizeText(payload.name).slice(0, 160);

  if (!name) {
    throw new Error("Informe o nome do técnico.");
  }

  const result = database
    .prepare(`
      INSERT INTO technicians (
        name,
        phone,
        email,
        role,
        region,
        active,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $name,
        $phone,
        $email,
        $role,
        $region,
        $active,
        $notes,
        $createdAt,
        $updatedAt
      )
    `)
    .run({
      $name: name,
      $phone: normalizeText(payload.phone).slice(0, 40) || null,
      $email: normalizeText(payload.email).slice(0, 160) || null,
      $role: normalizeText(payload.role).slice(0, 120) || "Técnico de campo",
      $region: normalizeText(payload.region).slice(0, 120) || null,
      $active: payload.active === false ? 0 : 1,
      $notes: normalizeText(payload.notes).slice(0, 800) || null,
      $createdAt: now,
      $updatedAt: now
    });

  return getTechnicianById(result.lastInsertRowid);
}

export function updateTechnician(technicianId, payload = {}) {
  const current = getTechnicianById(technicianId);

  if (!current) {
    return null;
  }

  const updatedAt = nowIso();

  getDb()
    .prepare(`
      UPDATE technicians
      SET
        name = $name,
        phone = $phone,
        email = $email,
        role = $role,
        region = $region,
        active = $active,
        notes = $notes,
        updated_at = $updatedAt
      WHERE id = $id
    `)
    .run({
      $name: normalizeText(payload.name).slice(0, 160) || current.name,
      $phone: payload.phone === undefined ? current.phone : normalizeText(payload.phone).slice(0, 40) || null,
      $email: payload.email === undefined ? current.email : normalizeText(payload.email).slice(0, 160) || null,
      $role: payload.role === undefined ? current.role : normalizeText(payload.role).slice(0, 120) || null,
      $region: payload.region === undefined ? current.region : normalizeText(payload.region).slice(0, 120) || null,
      $active: payload.active === undefined ? (current.active ? 1 : 0) : payload.active ? 1 : 0,
      $notes: payload.notes === undefined ? current.notes : normalizeText(payload.notes).slice(0, 800) || null,
      $updatedAt: updatedAt,
      $id: technicianId
    });

  return getTechnicianById(technicianId);
}

export function getVisitsForProducer(producerId) {
  return getDb()
    .prepare(`
      SELECT
        v.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        p.address AS producer_address,
        p.area_ha AS producer_area_ha,
        r.area_status AS report_area_status,
        r.created_at AS report_created_at
      FROM technical_visits v
      JOIN producers p ON p.id = v.producer_id
      LEFT JOIN reports r ON r.id = v.report_id
      WHERE v.producer_id = $producerId
      ORDER BY COALESCE(v.scheduled_date, v.created_at) DESC, v.id DESC
    `)
    .all({ $producerId: producerId })
    .map(mapVisitRow);
}

export function getReportsForProducer(producerId) {
  return getDb()
    .prepare(`
      SELECT *
      FROM reports
      WHERE producer_id = $producerId
      ORDER BY created_at DESC, id DESC
    `)
    .all({ $producerId: producerId })
    .map((report) => ({
      id: report.id,
      reportDate: report.report_date,
      contactPhone: report.contact_phone,
      processStatus: report.process_status,
      areaStatus: report.area_status,
      address: report.address,
      areaHa: report.area_ha,
      plantingYear: report.planting_year,
      crop: report.crop,
      plantingDate: report.planting_date,
      productionNote: report.production_note,
      needsVisit: Boolean(report.needs_visit),
      notes: report.notes,
      reviewStatus: report.review_status || "PENDENTE",
      technicalNote: report.technical_note,
      reviewedAt: report.reviewed_at,
      reviewedBy: report.reviewed_by,
      createdAt: report.created_at
    }));
}

export function getReportById(reportId) {
  const report = getDb()
    .prepare(`
      SELECT
        r.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        p.designer AS producer_designer,
        p.access_login AS producer_access_login
      FROM reports r
      JOIN producers p ON p.id = r.producer_id
      WHERE r.id = $id
    `)
    .get({ $id: reportId });

  return report ? mapReportRow(report) : null;
}

export function getVisitById(visitId) {
  const visit = getDb()
    .prepare(`
      SELECT
        v.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        p.address AS producer_address,
        p.area_ha AS producer_area_ha,
        r.area_status AS report_area_status,
        r.created_at AS report_created_at
      FROM technical_visits v
      JOIN producers p ON p.id = v.producer_id
      LEFT JOIN reports r ON r.id = v.report_id
      WHERE v.id = $id
    `)
    .get({ $id: visitId });

  return visit ? mapVisitRow(visit) : null;
}

export function getTaskById(taskId) {
  const task = getDb()
    .prepare(`
      SELECT
        t.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        r.area_status AS report_area_status,
        r.created_at AS report_created_at,
        v.status AS visit_status,
        v.scheduled_date AS visit_scheduled_date
      FROM operational_tasks t
      LEFT JOIN producers p ON p.id = t.producer_id
      LEFT JOIN reports r ON r.id = t.report_id
      LEFT JOIN technical_visits v ON v.id = t.visit_id
      WHERE t.id = $id
    `)
    .get({ $id: taskId });

  return task ? mapTaskRow(task) : null;
}

export function getDocumentById(documentId) {
  const document = getDb()
    .prepare(`
      SELECT
        d.*,
        p.name AS producer_name,
        p.cpf AS producer_cpf,
        p.agency AS producer_agency,
        r.area_status AS report_area_status,
        v.status AS visit_status,
        t.title AS task_title
      FROM documents d
      LEFT JOIN producers p ON p.id = d.producer_id
      LEFT JOIN reports r ON r.id = d.report_id
      LEFT JOIN technical_visits v ON v.id = d.visit_id
      LEFT JOIN operational_tasks t ON t.id = d.task_id
      WHERE d.id = $id
    `)
    .get({ $id: documentId });

  return document ? mapDocumentRow(document) : null;
}

function mapReportRow(report) {
  return {
    id: report.id,
    producerId: report.producer_id,
    producerName: report.producer_name,
    producerCpf: report.producer_cpf,
    producerAgency: report.producer_agency,
    producerDesigner: report.producer_designer,
    producerAccessLogin: report.producer_access_login,
    reportDate: report.report_date,
    contactPhone: report.contact_phone,
    processStatus: report.process_status,
    areaStatus: report.area_status,
    address: report.address,
    areaHa: report.area_ha,
    plantingYear: report.planting_year,
    crop: report.crop,
    plantingDate: report.planting_date,
    productionNote: report.production_note,
    needsVisit: Boolean(report.needs_visit),
    notes: report.notes,
    reviewStatus: report.review_status || "PENDENTE",
    technicalNote: report.technical_note,
    reviewedAt: report.reviewed_at,
    reviewedBy: report.reviewed_by,
    createdAt: report.created_at
  };
}

function mapVisitRow(visit) {
  return {
    id: visit.id,
    reportId: visit.report_id,
    producerId: visit.producer_id,
    producerName: visit.producer_name,
    producerCpf: visit.producer_cpf,
    producerAgency: visit.producer_agency,
    producerAddress: visit.producer_address,
    producerAreaHa: visit.producer_area_ha,
    reportAreaStatus: visit.report_area_status,
    reportCreatedAt: visit.report_created_at,
    status: visit.status,
    priority: visit.priority,
    scheduledDate: visit.scheduled_date,
    technician: visit.technician,
    objective: visit.objective,
    resultNote: visit.result_note,
    createdAt: visit.created_at,
    updatedAt: visit.updated_at,
    completedAt: visit.completed_at
  };
}

function mapTaskRow(task) {
  return {
    id: task.id,
    producerId: task.producer_id,
    reportId: task.report_id,
    visitId: task.visit_id,
    producerName: task.producer_name,
    producerCpf: task.producer_cpf,
    producerAgency: task.producer_agency,
    reportAreaStatus: task.report_area_status,
    reportCreatedAt: task.report_created_at,
    visitStatus: task.visit_status,
    visitScheduledDate: task.visit_scheduled_date,
    title: task.title,
    type: task.type,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    dueDate: task.due_date,
    notes: task.notes,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    completedAt: task.completed_at
  };
}

function mapDocumentRow(document) {
  return {
    id: document.id,
    producerId: document.producer_id,
    reportId: document.report_id,
    visitId: document.visit_id,
    taskId: document.task_id,
    producerName: document.producer_name,
    producerCpf: document.producer_cpf,
    producerAgency: document.producer_agency,
    reportAreaStatus: document.report_area_status,
    visitStatus: document.visit_status,
    taskTitle: document.task_title,
    title: document.title,
    category: document.category,
    status: document.status,
    fileName: document.file_name,
    fileMime: document.file_mime,
    fileSize: document.file_size,
    filePath: document.file_path,
    uploadedBy: document.uploaded_by,
    notes: document.notes,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    reviewedAt: document.reviewed_at
  };
}

function mapTechnicianRow(technician) {
  return {
    id: technician.id,
    name: technician.name,
    phone: technician.phone,
    email: technician.email,
    role: technician.role,
    region: technician.region,
    active: Boolean(technician.active),
    notes: technician.notes,
    createdAt: technician.created_at,
    updatedAt: technician.updated_at
  };
}

export function createAuthSession({ role, producerId = null, ttlHours = 12 }) {
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString();

  getDb()
    .prepare(`
      INSERT INTO auth_sessions (token_hash, role, producer_id, created_at, expires_at)
      VALUES ($tokenHash, $role, $producerId, $createdAt, $expiresAt)
    `)
    .run({
      $tokenHash: hashToken(rawToken),
      $role: role,
      $producerId: producerId,
      $createdAt: now.toISOString(),
      $expiresAt: expiresAt
    });

  return { token: rawToken, expiresAt };
}

export function getAuthSession(rawToken) {
  if (!rawToken) {
    return null;
  }

  const row = getDb()
    .prepare(`
      SELECT *
      FROM auth_sessions
      WHERE token_hash = $tokenHash AND expires_at > $now
    `)
    .get({ $tokenHash: hashToken(rawToken), $now: nowIso() });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    producerId: row.producer_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

export function deleteAuthSession(rawToken) {
  if (!rawToken) {
    return;
  }

  getDb()
    .prepare("DELETE FROM auth_sessions WHERE token_hash = $tokenHash")
    .run({ $tokenHash: hashToken(rawToken) });
}

export function cleanupExpiredSessions() {
  getDb().prepare("DELETE FROM auth_sessions WHERE expires_at <= $now").run({ $now: nowIso() });
}

export function verifyAdminCredentials(username, password) {
  const expectedUser = process.env.PAF_ADMIN_USER || "admin";
  const expectedPassword = process.env.PAF_ADMIN_PASSWORD || "paf2027";

  return safeEqual(normalizeText(username), expectedUser) && safeEqual(String(password ?? ""), expectedPassword);
}

function mapProducerRow(row, options = {}) {
  const credentials = makeProducerCredentials(row);
  const producer = {
    id: row.id,
    token: row.token,
    name: row.name,
    cpf: row.cpf,
    cpfDigits: row.cpf_digits,
    phone: row.phone,
    address: row.address,
    agency: row.agency,
    areaHa: row.area_ha,
    processStatus: row.process_status,
    plantingYear: row.planting_year,
    designer: row.designer,
    originalRow: row.original_row,
    accessLogin: row.access_login || credentials.login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastReportAt: row.last_report_at,
    latestReport: row.latest_report_id
      ? {
          id: row.latest_report_id,
          reportDate: row.latest_report_date,
          contactPhone: row.latest_contact_phone,
          areaStatus: row.latest_area_status,
          crop: row.latest_crop,
          needsVisit: Boolean(row.latest_needs_visit),
          notes: row.latest_notes,
          createdAt: row.latest_report_created_at
        }
      : null
  };

  if (options.includeCredentials) {
    producer.accessCode = credentials.code;
  }

  if (options.includeHash) {
    producer.accessCodeHash = row.access_code_hash;
  }

  return producer;
}

function hashToken(rawToken) {
  return createHash("sha256").update(String(rawToken)).digest("hex");
}

function hashSecret(secret) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(String(secret), salt, HASH_ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifySecret(secret, storedHash) {
  const [algorithm, iterationsText, salt, expectedHash] = String(storedHash || "").split("$");

  if (algorithm !== "pbkdf2" || !iterationsText || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number.parseInt(iterationsText, 10);
  const actual = pbkdf2Sync(String(secret), salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHash, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
