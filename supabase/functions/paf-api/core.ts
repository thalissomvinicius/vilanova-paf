export const PROCESS_STATUSES = ["INTERNALIZAR", "INTERNALIZADO", "APROVADO", "PLANTADO", "CANCELADO"];
export const REPORT_REVIEW_STATUSES = ["PENDENTE", "EM ANÁLISE", "VISITA PROGRAMADA", "CONCLUÍDO", "DEVOLVIDO"];
export const VISIT_STATUSES = ["PROGRAMADA", "EM CAMPO", "CONCLUÍDA", "REPROGRAMADA", "CANCELADA"];
export const VISIT_PRIORITIES = ["NORMAL", "ALTA", "CRÍTICA"];
export const TASK_STATUSES = ["ABERTA", "EM ANDAMENTO", "BLOQUEADA", "CONCLUÍDA", "CANCELADA"];
export const TASK_TYPES = ["RELATÓRIO", "VISITA", "DOCUMENTO", "CONTATO", "CAMPO", "OUTRO"];
export const DOCUMENT_STATUSES = ["PENDENTE", "EM ANÁLISE", "VALIDADO", "REJEITADO", "VENCIDO"];
export const DOCUMENT_CATEGORIES = [
  "DOCUMENTO PESSOAL",
  "COMPROVANTE",
  "CONTRATO",
  "CAR",
  "FOTO DE CAMPO",
  "EVIDÊNCIA",
  "IDENTIFICAÇÃO",
  "DAP/CAF",
  "LICENÇA",
  "LAUDO",
  "FOTO",
  "OUTRO"
];
export const ACCESS_ACCOUNT_TYPES = ["PRODUTOR", "TECNICO", "ORGANIZACAO"];

const encoder = new TextEncoder();

export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json(details ? { error: message, details } : { error: message }, status);
}

export function normalizeApiPath(pathname: string) {
  const apiIndex = pathname.indexOf("/api/");
  if (apiIndex >= 0) return pathname.slice(apiIndex).replace(/\/+$/, "") || "/api";
  return pathname.replace(/^\/functions\/v1\/paf-api/, "").replace(/^\/paf-api/, "").replace(/\/+$/, "") || "/api/health";
}

export function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeUpper(value: unknown, fallback = "") {
  return normalizeText(value).toUpperCase() || fallback;
}

export function normalizeDigits(value: unknown) {
  return String(value ?? "").replace(/\D+/g, "");
}

export function normalizeLogin(value: unknown) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "")
    .slice(0, 60);
}

export function normalizePlate(value: unknown) {
  return normalizeUpper(value).replace(/\s+/g, "").slice(0, 20);
}

export function toNumberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function toIntegerOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toIdList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(toIntegerOrNull).filter((item): item is number => item !== null && Number.isInteger(item) && item > 0))];
}

export function normalizeDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const brazilian = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

export function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function sessionCookie(token: string, expiresAt: string) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `paf_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return "paf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function clientIp(request: Request) {
  return normalizeText(request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("cf-connecting-ip") || "unknown").slice(0, 80);
}

export function randomHex(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function makeAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const raw = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}

export async function sha256Hex(value: unknown) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(String(value ?? ""))));
  return bytesToHex(digest);
}

export async function hashSecret(secret: unknown, iterations = 210000) {
  const saltHex = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const material = await crypto.subtle.importKey("raw", encoder.encode(String(secret ?? "")), "PBKDF2", false, ["deriveBits"]);
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(saltHex), iterations }, material, 256)
  );
  return `pbkdf2$${iterations}$${saltHex}$${bytesToHex(derived)}`;
}

export async function verifySecret(secret: unknown, storedHash: unknown) {
  const [algorithm, iterationText, saltHex, expectedHex] = String(storedHash || "").split("$");
  const iterations = Number.parseInt(iterationText, 10);
  if (algorithm !== "pbkdf2" || !Number.isFinite(iterations) || !saltHex || !expectedHex) return false;
  const expected = hexToBytes(expectedHex);
  const material = await crypto.subtle.importKey("raw", encoder.encode(String(secret ?? "")), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(saltHex), iterations }, material, expected.length * 8)
  );
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) mismatch |= actual[index] ^ expected[index];
  return mismatch === 0;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (!value || value.length % 2) return new Uint8Array();
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

export function mapProducer(row: Record<string, any>, latestReport?: Record<string, any> | null) {
  return {
    id: row.id,
    token: row.token,
    name: row.name,
    cpf: row.cpf,
    cpfDigits: row.cpf_digits,
    phone: row.phone,
    address: row.address,
    agency: row.agency,
    areaHa: Number(row.area_ha || 0),
    processStatus: row.process_status,
    plantingYear: row.planting_year,
    designer: row.designer,
    originalRow: row.original_row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastReportAt: row.last_report_at,
    latestReport: latestReport ? {
      id: latestReport.id,
      reportDate: latestReport.report_date,
      contactPhone: latestReport.contact_phone,
      areaStatus: latestReport.area_status,
      crop: latestReport.crop,
      needsVisit: Boolean(latestReport.needs_visit),
      notes: latestReport.notes,
      createdAt: latestReport.created_at
    } : null
  };
}

export function mapTechnician(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    region: row.region,
    active: Boolean(row.active),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAccessAccount(
  row: Record<string, any>,
  producers: Array<Record<string, any>> = [],
  technicianName: string | null = null
) {
  return {
    id: row.id,
    name: row.name,
    login: row.login,
    codeHint: row.code_hint,
    accountType: row.account_type,
    technicianId: row.technician_id,
    technicianName,
    organization: row.organization,
    active: Boolean(row.active),
    canSubmitReports: Boolean(row.can_submit_reports),
    canManageVisits: Boolean(row.can_manage_visits),
    notes: row.notes,
    producerIds: producers.map((producer) => producer.id),
    producers: producers.map((producer) => ({ id: producer.id, name: producer.name, cpf: producer.cpf, agency: producer.agency })),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapReport(row: Record<string, any>) {
  const producer = row.producer || {};
  return {
    id: row.id,
    producerId: row.producer_id,
    producerName: producer.name,
    producerCpf: producer.cpf,
    producerAgency: producer.agency,
    producerDesigner: producer.designer,
    reportDate: row.report_date,
    contactPhone: row.contact_phone,
    processStatus: row.process_status,
    areaStatus: row.area_status,
    address: row.address,
    areaHa: row.area_ha === null ? null : Number(row.area_ha),
    plantingYear: row.planting_year,
    crop: row.crop,
    plantingDate: row.planting_date,
    productionNote: row.production_note,
    needsVisit: Boolean(row.needs_visit),
    notes: row.notes,
    reviewStatus: row.review_status || "PENDENTE",
    technicalNote: row.technical_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapVisit(row: Record<string, any>) {
  const producer = row.producer || {};
  const report = row.report || {};
  return {
    id: row.id,
    reportId: row.report_id,
    producerId: row.producer_id,
    producerName: producer.name,
    producerCpf: producer.cpf,
    producerAgency: producer.agency,
    producerAddress: producer.address,
    producerAreaHa: producer.area_ha === null ? null : Number(producer.area_ha || 0),
    reportAreaStatus: report.area_status,
    reportCreatedAt: report.created_at,
    status: row.status,
    priority: row.priority,
    scheduledDate: row.scheduled_date,
    technician: row.technician,
    objective: row.objective,
    resultNote: row.result_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}

export function mapTask(row: Record<string, any>) {
  const producer = row.producer || {};
  const report = row.report || {};
  const visit = row.visit || {};
  return {
    id: row.id,
    producerId: row.producer_id,
    reportId: row.report_id,
    visitId: row.visit_id,
    producerName: producer.name,
    producerCpf: producer.cpf,
    producerAgency: producer.agency,
    reportAreaStatus: report.area_status,
    reportCreatedAt: report.created_at,
    visitStatus: visit.status,
    visitScheduledDate: visit.scheduled_date,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}

export function mapDocument(row: Record<string, any>) {
  const producer = row.producer || {};
  const report = row.report || {};
  const visit = row.visit || {};
  const task = row.task || {};
  return {
    id: row.id,
    producerId: row.producer_id,
    reportId: row.report_id,
    visitId: row.visit_id,
    taskId: row.task_id,
    producerName: producer.name,
    producerCpf: producer.cpf,
    producerAgency: producer.agency,
    reportAreaStatus: report.area_status,
    visitStatus: visit.status,
    taskTitle: task.title,
    title: row.title,
    category: row.category,
    status: row.status,
    fileName: row.file_name,
    fileMime: row.file_mime,
    fileSize: row.file_size,
    filePath: row.storage_path,
    uploadedBy: row.uploaded_by,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at
  };
}

export function mapFuelDriver(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    phone: row.phone,
    licenseNumber: row.license_number,
    licenseCategory: row.license_category,
    licenseExpiresAt: row.license_expires_at,
    active: Boolean(row.active),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapFuelVehicle(row: Record<string, any>, driverName?: string | null) {
  return {
    id: row.id,
    costCenter: row.cost_center,
    department: row.department,
    category: row.category,
    area: row.area,
    vehicle: row.vehicle,
    plate: row.plate,
    driverId: row.driver_id,
    driverName: driverName || null,
    assignedTo: row.assigned_to,
    quotaLiters: row.quota_liters === null ? null : Number(row.quota_liters),
    fleetType: row.fleet_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapFuelRecord(row: Record<string, any>, vehicle?: Record<string, any> | null) {
  return {
    id: row.id,
    sourceKey: row.source_key,
    sourceFile: row.source_file,
    sourceRow: row.source_row,
    year: row.year,
    month: row.month,
    driverId: row.driver_id,
    driver: row.driver,
    plate: row.plate,
    vehicleResponsible: row.vehicle_responsible,
    servedDate: row.served_date,
    requestedLiters: numberOrNull(row.requested_liters),
    suppliedLiters: numberOrNull(row.supplied_liters),
    kmStart: numberOrNull(row.km_start),
    kmEnd: numberOrNull(row.km_end),
    kmDriven: numberOrNull(row.km_driven),
    kmPerLiter: numberOrNull(row.km_per_liter),
    requisition: row.requisition,
    notes: row.notes,
    quantity: numberOrNull(row.quantity),
    location: row.location,
    quotaLiters: numberOrNull(row.quota_liters),
    vehicleName: vehicle?.vehicle || null,
    fleetType: vehicle?.fleet_type || null,
    assignedTo: vehicle?.assigned_to || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function numberOrNull(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

export function buildProducerSummary(producers: Array<Record<string, any>>) {
  const status: Record<string, number> = {};
  const agencies: Record<string, number> = {};
  const designers: Record<string, number> = {};
  let totalArea = 0;
  let reported = 0;
  let needsVisit = 0;
  let planted = 0;
  let approved = 0;
  for (const producer of producers) {
    status[producer.processStatus] = (status[producer.processStatus] || 0) + 1;
    const agency = producer.agency || "SEM AGÊNCIA";
    agencies[agency] = (agencies[agency] || 0) + 1;
    const designer = producer.designer || "SEM PROJETISTA";
    designers[designer] = (designers[designer] || 0) + 1;
    totalArea += Number(producer.areaHa || 0);
    if (producer.lastReportAt) reported += 1;
    if (producer.latestReport?.needsVisit) needsVisit += 1;
    if (producer.processStatus === "PLANTADO") planted += 1;
    if (producer.processStatus === "APROVADO") approved += 1;
  }
  return {
    total: producers.length,
    reported,
    pending: producers.length - reported,
    needsVisit,
    totalArea,
    planted,
    approved,
    responseRate: producers.length ? Math.round((reported / producers.length) * 100) : 0,
    status,
    agencies,
    designers
  };
}

export function buildReportSummary(reports: Array<Record<string, any>>) {
  const byStatus: Record<string, number> = {};
  const byReviewStatus: Record<string, number> = {};
  let needsVisit = 0;
  for (const report of reports) {
    if (report.needsVisit) needsVisit += 1;
    const status = report.processStatus || "SEM STATUS";
    const review = report.reviewStatus || "PENDENTE";
    byStatus[status] = (byStatus[status] || 0) + 1;
    byReviewStatus[review] = (byReviewStatus[review] || 0) + 1;
  }
  return { total: reports.length, needsVisit, byStatus, byReviewStatus };
}

export function buildVisitSummary(visits: Array<Record<string, any>>) {
  const byStatus: Record<string, number> = {};
  let open = 0;
  let completed = 0;
  let scheduled = 0;
  let urgent = 0;
  for (const visit of visits) {
    const status = visit.status || "SEM STATUS";
    byStatus[status] = (byStatus[status] || 0) + 1;
    if (status === "CONCLUÍDA") completed += 1;
    if (status !== "CONCLUÍDA" && status !== "CANCELADA") open += 1;
    if (status === "PROGRAMADA" || status === "REPROGRAMADA") scheduled += 1;
    if (visit.priority === "ALTA" || visit.priority === "CRÍTICA") urgent += 1;
  }
  return { total: visits.length, open, completed, scheduled, urgent, byStatus };
}

export function buildTaskSummary(tasks: Array<Record<string, any>>) {
  const byStatus: Record<string, number> = {};
  const today = new Date().toISOString().slice(0, 10);
  let open = 0;
  let overdue = 0;
  let urgent = 0;
  let completed = 0;
  for (const task of tasks) {
    const status = task.status || "SEM STATUS";
    byStatus[status] = (byStatus[status] || 0) + 1;
    if (status === "CONCLUÍDA") completed += 1;
    if (status !== "CONCLUÍDA" && status !== "CANCELADA") open += 1;
    if (task.priority === "ALTA" || task.priority === "CRÍTICA") urgent += 1;
    if (task.dueDate && task.dueDate < today && status !== "CONCLUÍDA" && status !== "CANCELADA") overdue += 1;
  }
  return { total: tasks.length, open, overdue, urgent, completed, byStatus };
}

export function buildDocumentSummary(documents: Array<Record<string, any>>) {
  const byCategory: Record<string, number> = {};
  let pending = 0;
  let analysis = 0;
  let valid = 0;
  let rejected = 0;
  for (const document of documents) {
    const category = document.category || "OUTRO";
    byCategory[category] = (byCategory[category] || 0) + 1;
    if (document.status === "PENDENTE") pending += 1;
    if (document.status === "EM ANÁLISE") analysis += 1;
    if (document.status === "VALIDADO") valid += 1;
    if (document.status === "REJEITADO" || document.status === "VENCIDO") rejected += 1;
  }
  return { total: documents.length, pending, analysis, valid, rejected, byCategory };
}

export function buildFuelSummary(records: Array<Record<string, any>>, vehicles: Array<Record<string, any>>) {
  const drivers = new Set<string>();
  const plates = new Set<string>();
  const locations: Record<string, number> = {};
  const byMonth: Record<string, any> = {};
  const byDriver: Record<string, any> = {};
  const byPlate: Record<string, any> = {};
  const today = new Date().toISOString().slice(0, 10);
  const futureRecords: any[] = [];
  const efficiencyAlerts: any[] = [];
  let totalSuppliedLiters = 0;
  let totalRequestedLiters = 0;
  let totalKmDriven = 0;

  for (const record of records) {
    const supplied = Number(record.suppliedLiters || 0);
    const requested = Number(record.requestedLiters || 0);
    const km = Number(record.kmDriven || 0);
    totalSuppliedLiters += supplied;
    totalRequestedLiters += requested;
    totalKmDriven += km;
    if (record.servedDate && record.servedDate > today) futureRecords.push(record);
    if (record.kmPerLiter && (record.kmPerLiter < 2 || record.kmPerLiter > 35)) efficiencyAlerts.push(record);
    if (record.driver) drivers.add(record.driver);
    if (record.plate) plates.add(record.plate);
    if (record.location) locations[record.location] = (locations[record.location] || 0) + 1;

    const monthKey = fuelMonthKey(record);
    if (monthKey) {
      byMonth[monthKey] ||= { key: monthKey, label: record.month || monthKey, year: record.year, records: 0, suppliedLiters: 0, kmDriven: 0 };
      byMonth[monthKey].records += 1;
      byMonth[monthKey].suppliedLiters += supplied;
      byMonth[monthKey].kmDriven += km;
    }

    const driverKey = record.driver || "Sem condutor";
    byDriver[driverKey] ||= { label: driverKey, records: 0, suppliedLiters: 0, kmDriven: 0, quotaLiters: Number(record.quotaLiters || 0) };
    byDriver[driverKey].records += 1;
    byDriver[driverKey].suppliedLiters += supplied;
    byDriver[driverKey].kmDriven += km;
    byDriver[driverKey].quotaLiters = Math.max(byDriver[driverKey].quotaLiters, Number(record.quotaLiters || 0));

    const plateKey = record.plate || "Sem placa";
    byPlate[plateKey] ||= { label: plateKey, vehicle: record.vehicleName || "", fleetType: record.fleetType || "", records: 0, suppliedLiters: 0, kmDriven: 0 };
    byPlate[plateKey].records += 1;
    byPlate[plateKey].suppliedLiters += supplied;
    byPlate[plateKey].kmDriven += km;
  }

  const monthRows = Object.values(byMonth).map(withAverage).sort((left: any, right: any) => left.key.localeCompare(right.key));
  const driverRows = Object.values(byDriver).map((row: any) => ({ ...withAverage(row), quotaBalance: row.quotaLiters ? row.quotaLiters - row.suppliedLiters : null })).sort((left: any, right: any) => right.suppliedLiters - left.suppliedLiters);
  const plateRows = Object.values(byPlate).map(withAverage).sort((left: any, right: any) => right.suppliedLiters - left.suppliedLiters);
  return {
    total: records.length,
    totalSuppliedLiters,
    totalRequestedLiters,
    totalKmDriven,
    averageKmPerLiter: totalSuppliedLiters ? totalKmDriven / totalSuppliedLiters : 0,
    activeVehicles: plates.size || vehicles.length,
    registeredVehicles: vehicles.length,
    drivers: drivers.size,
    locations,
    byMonth: monthRows.slice(-14),
    byDriver: driverRows.slice(0, 12),
    byPlate: plateRows.slice(0, 12),
    efficiencyByPlate: plateRows.filter((row: any) => row.suppliedLiters > 0 && row.kmDriven > 0).sort((left: any, right: any) => right.averageKmPerLiter - left.averageKmPerLiter).slice(0, 8),
    quotaRisks: driverRows.filter((row: any) => row.quotaLiters && row.quotaBalance !== null).sort((left: any, right: any) => left.quotaBalance - right.quotaBalance).slice(0, 8),
    futureRecords: futureRecords.slice(0, 8),
    efficiencyAlerts: efficiencyAlerts.slice(0, 8)
  };
}

function withAverage(row: any) {
  return { ...row, averageKmPerLiter: row.suppliedLiters ? row.kmDriven / row.suppliedLiters : 0 };
}

function fuelMonthKey(record: Record<string, any>) {
  if (record.servedDate) return String(record.servedDate).slice(0, 7);
  if (record.year && record.month) return `${record.year}-${String(record.month).padStart(2, "0")}`;
  return "";
}
