import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  apiError,
  clearSessionCookie,
  clientIp,
  getCookie,
  hashSecret,
  json,
  normalizeApiPath,
  normalizeLogin,
  normalizeText,
  randomHex,
  sessionCookie,
  sha256Hex,
  toIntegerOrNull,
  verifySecret
} from "./core.ts";
import { PafRepository } from "./repository.ts";
import { importFuelWorkbook } from "./fuel-import.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);
const ALLOWED_ORIGINS = new Set([
  "https://vilanova-paf.vercel.app",
  ...(Deno.env.get("PAF_ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean)
]);

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const originAllowed = !origin || ALLOWED_ORIGINS.has(origin);
  const corsHeaders: Record<string, string> = origin && originAllowed
    ? { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "vary": "Origin" }
    : {};

  if (!originAllowed) return apiError("Origem não autorizada.", 403);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,authorization,x-requested-with",
        "access-control-max-age": "86400"
      }
    });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return apiError("Configuração do banco indisponível.", 503);

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "vila-nova-paf" } }
  });
  const repository = new PafRepository(db);
  const url = new URL(request.url);
  const path = normalizeApiPath(url.pathname);
  const method = request.method.toUpperCase();
  const ipAddress = clientIp(request);

  try {
    let response = await route({ request, method, path, url, ipAddress, repository, db });
    if (!response) response = apiError("Rota não encontrada.", 404);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "same-origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    console.error("PAF API error", method, path, error);
    const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
    const response = apiError(message, message.includes("não encontrado") ? 404 : 400);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  }
});

type RouteContext = {
  request: Request;
  method: string;
  path: string;
  url: URL;
  ipAddress: string;
  repository: PafRepository;
  db: any;
};

async function route(context: RouteContext): Promise<Response | null> {
  const { request, method, path, url, ipAddress, repository, db } = context;
  const filters = Object.fromEntries(url.searchParams.entries());

  if (method === "GET" && path === "/api/health") {
    const { error } = await db.from("paf_producers").select("id", { head: true, count: "exact" }).limit(1);
    return error ? apiError("Banco indisponível.", 503) : json({ ok: true, service: "paf-api", database: "supabase", at: new Date().toISOString() });
  }

  if (method === "POST" && path === "/api/auth/admin-login") {
    const body = await readBody(request);
    return login(repository, ipAddress, body.username, body.password, "admin");
  }

  if (method === "POST" && path === "/api/auth/producer-login") {
    const body = await readBody(request);
    return login(repository, ipAddress, body.login, body.accessCode, "producer");
  }

  if (method === "POST" && path === "/api/auth/access-login") {
    const body = await readBody(request);
    return login(repository, ipAddress, body.login, body.accessCode, "technical");
  }

  if (method === "POST" && path === "/api/auth/logout") {
    const token = getCookie(request, "paf_session");
    await repository.deleteSession(token);
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
  }

  if (method === "GET" && path === "/api/auth/me") {
    const auth = await authenticate(repository, request);
    if (!auth) return json({ user: null });
    const account = await repository.getAccessAccountById(auth.account.id);
    if (!account?.active) return json({ user: null }, 200, { "set-cookie": clearSessionCookie() });
    if (auth.role === "admin") return json({ user: { role: "admin", name: account.name } });
    const producers = await repository.getScopedProducers(account.id);
    if (account.accountType === "PRODUTOR") {
      const producer = producers[0] || null;
      return json({
        user: { role: "producer", name: account.name },
        account,
        producer,
        reports: producer ? await repository.getReportsForProducer(producer.id) : [],
        visits: producer ? await repository.getVisitsForProducer(producer.id) : []
      });
    }
    return json({ user: { role: "technical", name: account.name }, account, producers });
  }

  const auth = await authenticate(repository, request);

  if (method === "POST" && path === "/api/auth/change-password") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const body = await readBody(request);
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!await verifySecret(currentPassword, auth.account.access_code_hash)) {
      return apiError("A senha atual não confere.", 401);
    }
    if (!isStrongPassword(newPassword)) {
      return apiError("Use pelo menos 12 caracteres, com letras maiúsculas, minúsculas e números.", 400);
    }
    if (await verifySecret(newPassword, auth.account.access_code_hash)) {
      return apiError("A nova senha deve ser diferente da senha atual.", 400);
    }

    const passwordHash = await hashSecret(newPassword);
    await repository.changeAccessSecret(auth.account.id, passwordHash, newPassword.slice(-4));
    await repository.audit(auth.account, "CHANGE_PASSWORD", "ACCESS", auth.account.id, ipAddress);
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
  }

  if (method === "GET" && path === "/api/options") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.getOptions());
  }

  if (method === "GET" && path === "/api/producers") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listProducers(filters));
  }

  const producerTokenMatch = path.match(/^\/api\/producers\/([^/]+)$/);
  if (method === "GET" && producerTokenMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const producer = await repository.getProducerByToken(decodeURIComponent(producerTokenMatch[1]));
    if (!producer) return apiError("Produtor não encontrado.", 404);
    return json({ producer, reports: await repository.getReportsForProducer(producer.id) });
  }

  if (method === "POST" && path === "/api/admin/producers") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const producer = await repository.createProducer(await readBody(request));
    await repository.audit(auth.account, "CREATE", "PRODUCER", producer.id, ipAddress);
    return json({ producer }, 201);
  }

  const adminProducerMatch = path.match(/^\/api\/admin\/producers\/(\d+)$/);
  if (method === "PATCH" && adminProducerMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const producer = await repository.updateProducer(Number(adminProducerMatch[1]), await readBody(request));
    if (!producer) return apiError("Produtor não encontrado.", 404);
    await repository.audit(auth.account, "UPDATE", "PRODUCER", producer.id, ipAddress);
    return json({ producer });
  }

  if (method === "GET" && path === "/api/admin/technicians") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json({ technicians: await repository.listTechnicians(filters) });
  }

  if (method === "POST" && path === "/api/admin/technicians") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const technician = await repository.createTechnician(await readBody(request));
    await repository.audit(auth.account, "CREATE", "TECHNICIAN", technician.id, ipAddress);
    return json({ technician }, 201);
  }

  const technicianMatch = path.match(/^\/api\/admin\/technicians\/(\d+)$/);
  if (method === "PATCH" && technicianMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const technician = await repository.updateTechnician(Number(technicianMatch[1]), await readBody(request));
    if (!technician) return apiError("Técnico não encontrado.", 404);
    await repository.audit(auth.account, "UPDATE", "TECHNICIAN", technician.id, ipAddress);
    return json({ technician });
  }

  if (method === "GET" && path === "/api/admin/accesses") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json({ accesses: await repository.listAccessAccounts(filters) });
  }

  if (method === "POST" && path === "/api/admin/accesses") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const result = await repository.createAccessAccount(await readBody(request));
    await repository.audit(auth.account, "CREATE", "ACCESS", result.account.id, ipAddress, { accountType: result.account.accountType });
    return json(result, 201);
  }

  const accessResetMatch = path.match(/^\/api\/admin\/accesses\/(\d+)\/reset-code$/);
  if (method === "POST" && accessResetMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const result = await repository.resetAccessCode(Number(accessResetMatch[1]));
    if (!result) return apiError("Acesso não encontrado.", 404);
    await repository.audit(auth.account, "RESET_CODE", "ACCESS", result.account.id, ipAddress);
    return json(result);
  }

  const accessMatch = path.match(/^\/api\/admin\/accesses\/(\d+)$/);
  if (method === "PATCH" && accessMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const access = await repository.updateAccessAccount(Number(accessMatch[1]), await readBody(request));
    if (!access) return apiError("Acesso não encontrado.", 404);
    await repository.audit(auth.account, access.active ? "UPDATE" : "BLOCK", "ACCESS", access.id, ipAddress);
    return json({ access });
  }
  if (method === "DELETE" && accessMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const access = await repository.deleteAccessAccount(Number(accessMatch[1]));
    if (!access) return apiError("Acesso não encontrado.", 404);
    await repository.audit(auth.account, "DELETE", "ACCESS", access.id, ipAddress);
    return json({ ok: true, access });
  }

  if (method === "GET" && path === "/api/admin/reports") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listReports(filters));
  }

  const reportReviewMatch = path.match(/^\/api\/admin\/reports\/(\d+)\/review$/);
  if (method === "PATCH" && reportReviewMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const report = await repository.updateReportReview(Number(reportReviewMatch[1]), await readBody(request), auth.account.name);
    if (!report) return apiError("Relatório não encontrado.", 404);
    await repository.audit(auth.account, "REVIEW", "REPORT", report.id, ipAddress, { reviewStatus: report.reviewStatus });
    return json({ report });
  }

  if (method === "GET" && path === "/api/admin/visits") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listVisits(filters));
  }

  const adminVisitMatch = path.match(/^\/api\/admin\/visits\/(\d+)$/);
  if (method === "PATCH" && adminVisitMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const visit = await repository.updateVisit(Number(adminVisitMatch[1]), await readBody(request), auth.account.name);
    if (!visit) return apiError("Visita técnica não encontrada.", 404);
    await repository.audit(auth.account, "UPDATE", "VISIT", visit.id, ipAddress, { status: visit.status });
    return json({ visit });
  }

  if (method === "GET" && path === "/api/admin/tasks") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listTasks(filters));
  }

  if (method === "POST" && path === "/api/admin/tasks") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const task = await repository.createTask(await readBody(request), auth.account.name);
    if (!task) return apiError("Não foi possível criar a pendência.", 400);
    await repository.audit(auth.account, "CREATE", "TASK", task.id, ipAddress);
    return json({ task }, 201);
  }

  const taskMatch = path.match(/^\/api\/admin\/tasks\/(\d+)$/);
  if (method === "PATCH" && taskMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const task = await repository.updateTask(Number(taskMatch[1]), await readBody(request));
    if (!task) return apiError("Pendência não encontrada.", 404);
    await repository.audit(auth.account, "UPDATE", "TASK", task.id, ipAddress, { status: task.status });
    return json({ task });
  }

  if (method === "GET" && path === "/api/admin/documents") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listDocuments(filters));
  }

  if (method === "POST" && path === "/api/admin/documents") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const body = await readBody(request);
    const uploaded: Record<string, any> = body.fileBase64 ? await uploadDocument(db, body) : {};
    let document;
    try {
      document = await repository.createDocument(body, auth.account.name, uploaded);
      if (!document) throw new Error("Não foi possível salvar o documento.");
    } catch (error) {
      if (uploaded.storagePath) await db.storage.from("paf-documents").remove([uploaded.storagePath]);
      throw error;
    }
    await repository.audit(auth.account, "CREATE", "DOCUMENT", document.id, ipAddress, { category: document.category });
    return json({ document }, 201);
  }

  const documentDownloadMatch = path.match(/^\/api\/admin\/documents\/(\d+)\/download$/);
  if (method === "GET" && documentDownloadMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const document = await repository.getDocumentById(Number(documentDownloadMatch[1]));
    if (!document?.filePath) return apiError("Arquivo não encontrado.", 404);
    const { data, error } = await db.storage.from("paf-documents").download(document.filePath);
    if (error || !data) return apiError("Arquivo não encontrado.", 404);
    return new Response(data, {
      headers: {
        "content-type": document.fileMime || data.type || "application/octet-stream",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName || `documento-${document.id}`)}`,
        "cache-control": "private, no-store"
      }
    });
  }

  const documentMatch = path.match(/^\/api\/admin\/documents\/(\d+)$/);
  if (method === "PATCH" && documentMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const document = await repository.updateDocument(Number(documentMatch[1]), await readBody(request));
    if (!document) return apiError("Documento não encontrado.", 404);
    await repository.audit(auth.account, "UPDATE", "DOCUMENT", document.id, ipAddress, { status: document.status });
    return json({ document });
  }

  if (method === "GET" && path === "/api/admin/fuel") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    return json(await repository.listFuel(filters));
  }

  if (method === "POST" && path === "/api/admin/fuel") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const record = await repository.createFuelRecord(await readBody(request));
    await repository.audit(auth.account, "CREATE", "FUEL_RECORD", record.id, ipAddress);
    return json({ record }, 201);
  }

  if (method === "POST" && path === "/api/admin/fuel/vehicles") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const vehicle = await repository.upsertFuelVehicle(await readBody(request));
    if (!vehicle) return apiError("Não foi possível cadastrar o veículo.", 400);
    await repository.audit(auth.account, "CREATE", "FUEL_VEHICLE", vehicle.id, ipAddress);
    return json({ vehicle }, 201);
  }

  const vehicleMatch = path.match(/^\/api\/admin\/fuel\/vehicles\/(\d+)$/);
  if (method === "PATCH" && vehicleMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const vehicle = await repository.updateFuelVehicle(Number(vehicleMatch[1]), await readBody(request));
    if (!vehicle) return apiError("Veículo não encontrado.", 404);
    await repository.audit(auth.account, "UPDATE", "FUEL_VEHICLE", vehicle.id, ipAddress);
    return json({ vehicle });
  }
  if (method === "DELETE" && vehicleMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const vehicle = await repository.deleteFuelVehicle(Number(vehicleMatch[1]));
    if (!vehicle) return apiError("Veículo não encontrado.", 404);
    await repository.audit(auth.account, "DELETE", "FUEL_VEHICLE", vehicle.id, ipAddress);
    return json({ ok: true, vehicle });
  }

  if (method === "POST" && path === "/api/admin/fuel/drivers") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const driver = await repository.createFuelDriver(await readBody(request));
    await repository.audit(auth.account, "CREATE", "FUEL_DRIVER", driver.id, ipAddress);
    return json({ driver }, 201);
  }

  const driverMatch = path.match(/^\/api\/admin\/fuel\/drivers\/(\d+)$/);
  if (method === "PATCH" && driverMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const driver = await repository.updateFuelDriver(Number(driverMatch[1]), await readBody(request));
    if (!driver) return apiError("Motorista não encontrado.", 404);
    await repository.audit(auth.account, "UPDATE", "FUEL_DRIVER", driver.id, ipAddress);
    return json({ driver });
  }
  if (method === "DELETE" && driverMatch) {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const driver = await repository.deleteFuelDriver(Number(driverMatch[1]));
    if (!driver) return apiError("Motorista não encontrado.", 404);
    await repository.audit(auth.account, "DELETE", "FUEL_DRIVER", driver.id, ipAddress);
    return json({ ok: true, driver });
  }

  if (method === "POST" && path === "/api/admin/fuel/import") {
    if (!isAdmin(auth)) return apiError("Acesso administrativo necessário.", 401);
    const result = await importFuelWorkbook(await readBody(request), repository, auth.account.name);
    await repository.audit(auth.account, "IMPORT", "FUEL", null, ipAddress, result);
    return json(result, 201);
  }

  if (method === "GET" && path === "/api/technical/me") {
    const technical = await requireAccess(repository, auth, "canManageVisits");
    if (technical instanceof Response) return technical;
    const producers = await repository.getScopedProducers(technical.id);
    const result = await repository.listVisits({}, producers.map((producer) => producer.id));
    return json({ account: technical, producers, ...result });
  }

  if (method === "POST" && path === "/api/technical/visits") {
    const technical = await requireAccess(repository, auth, "canManageVisits");
    if (technical instanceof Response) return technical;
    const body = await readBody(request);
    const producerId = toIntegerOrNull(body.producerId);
    if (!producerId || !(await repository.accessCanUseProducer(technical.id, producerId))) return apiError("Esse produtor não está vinculado ao seu acesso.", 403);
    const visit = await repository.createVisit(body, technical.id, technical.name);
    if (!visit) return apiError("Não foi possível cadastrar a visita.", 400);
    await repository.audit(auth!.account, "CREATE", "VISIT", visit.id, ipAddress, { producerId });
    return json({ visit }, 201);
  }

  const technicalVisitMatch = path.match(/^\/api\/technical\/visits\/(\d+)$/);
  if (method === "PATCH" && technicalVisitMatch) {
    const technical = await requireAccess(repository, auth, "canManageVisits");
    if (technical instanceof Response) return technical;
    const current = await repository.getVisitById(Number(technicalVisitMatch[1]));
    if (!current) return apiError("Visita técnica não encontrada.", 404);
    if (!(await repository.accessCanUseProducer(technical.id, current.producerId))) return apiError("Essa visita não pertence ao seu escopo de produtores.", 403);
    const visit = await repository.updateVisit(current.id, await readBody(request), technical.name);
    await repository.audit(auth!.account, "UPDATE", "VISIT", visit!.id, ipAddress, { status: visit!.status });
    return json({ visit });
  }

  if (method === "GET" && path === "/api/producer/me") {
    const producerAccess = await requireAccess(repository, auth, "canSubmitReports");
    if (producerAccess instanceof Response) return producerAccess;
    const producer = (await repository.getScopedProducers(producerAccess.id))[0] || null;
    if (!producer) return apiError("Produtor não encontrado.", 404);
    return json({ producer, reports: await repository.getReportsForProducer(producer.id), visits: await repository.getVisitsForProducer(producer.id) });
  }

  if (method === "POST" && path === "/api/producer/reports") {
    const producerAccess = await requireAccess(repository, auth, "canSubmitReports");
    if (producerAccess instanceof Response) return producerAccess;
    const producer = (await repository.getScopedProducers(producerAccess.id))[0] || null;
    if (!producer) return apiError("Produtor não encontrado.", 404);
    const updatedProducer = await repository.createReport(producer.id, await readBody(request), producerAccess.id);
    await repository.audit(auth!.account, "CREATE", "REPORT", updatedProducer?.latestReport?.id, ipAddress, { producerId: producer.id });
    return json({
      producer: updatedProducer,
      reports: await repository.getReportsForProducer(producer.id),
      visits: await repository.getVisitsForProducer(producer.id)
    }, 201);
  }

  return null;
}

async function login(repository: PafRepository, ipAddress: string, loginValue: unknown, secret: unknown, mode: "admin" | "producer" | "technical") {
  const normalized = normalizeLogin(loginValue);
  const attemptKey = await sha256Hex(`${ipAddress}|${normalized}`);
  const attempt = await repository.getLoginAttempt(attemptKey);
  if (attempt && Number(attempt.attempts) >= 8 && new Date(attempt.reset_at).getTime() > Date.now()) {
    return apiError("Muitas tentativas. Aguarde alguns minutos.", 429);
  }

  const account = normalized ? await repository.getAccessAccountByLogin(normalized) : null;
  const validSecret = Boolean(account?.active) && await verifySecret(secret, account?.access_code_hash);
  const validMode = mode === "admin"
    ? account?.account_type === "ADMIN"
    : mode === "producer"
      ? account?.account_type === "PRODUTOR" && account?.can_submit_reports
      : ["TECNICO", "ORGANIZACAO"].includes(account?.account_type) && account?.can_manage_visits;

  if (!validSecret || !validMode) {
    await repository.recordLoginFailure(attemptKey);
    return apiError(mode === "admin" ? "Login ou senha inválidos." : "Login ou código de acesso inválidos.", 401);
  }

  await repository.clearLoginFailures(attemptKey);
  await repository.recordSuccessfulLogin(account.id);
  const ttlHours = mode === "producer" ? 24 * 14 : 12;
  const session = await repository.createSession(account.id, mode === "admin" ? "admin" : "access", ttlHours);
  await repository.audit(account, "LOGIN", "SESSION", null, ipAddress, { mode });
  const hydrated = await repository.getAccessAccountById(account.id);
  const role = mode === "admin" ? "admin" : mode === "producer" ? "producer" : "technical";
  if (mode === "producer") {
    const producer = (await repository.getScopedProducers(account.id))[0] || null;
    return json({
      user: { role, name: account.name },
      account: hydrated,
      producer,
      reports: producer ? await repository.getReportsForProducer(producer.id) : [],
      visits: producer ? await repository.getVisitsForProducer(producer.id) : []
    }, 200, { "set-cookie": sessionCookie(session.token, session.expiresAt) });
  }
  if (mode === "technical") {
    return json({
      user: { role, name: account.name },
      account: hydrated,
      producers: await repository.getScopedProducers(account.id)
    }, 200, { "set-cookie": sessionCookie(session.token, session.expiresAt) });
  }
  return json({ user: { role, name: account.name }, account: hydrated }, 200, { "set-cookie": sessionCookie(session.token, session.expiresAt) });
}

async function authenticate(repository: PafRepository, request: Request) {
  const token = getCookie(request, "paf_session");
  return repository.getSession(token);
}

function isAdmin(auth: Awaited<ReturnType<typeof authenticate>>): auth is NonNullable<Awaited<ReturnType<typeof authenticate>>> {
  return Boolean(auth && auth.role === "admin" && auth.account?.account_type === "ADMIN" && auth.account.active);
}

function isStrongPassword(value: string) {
  return value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

async function requireAccess(repository: PafRepository, auth: Awaited<ReturnType<typeof authenticate>>, permission: "canManageVisits" | "canSubmitReports") {
  if (!auth || auth.role !== "access" || !auth.account?.active) return apiError("Sessão inválida ou expirada.", 401);
  const account = await repository.getAccessAccountById(auth.account.id);
  if (!account || !account[permission]) return apiError("Seu acesso não possui permissão para esta operação.", 403);
  return account;
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  try {
    return await request.json();
  } catch {
    throw new Error("Dados enviados em formato inválido.");
  }
}

async function uploadDocument(db: any, payload: Record<string, any>) {
  const base64 = String(payload.fileBase64 || "").includes(",") ? String(payload.fileBase64).split(",").pop() || "" : String(payload.fileBase64 || "");
  const bytes = decodeBase64(base64);
  if (!bytes.length) throw new Error("Arquivo vazio ou inválido.");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("Arquivo excede o limite de 6 MB.");
  const fileName = safeFileName(payload.fileName || "documento");
  const fileMime = normalizeDocumentMime(fileName, payload.fileMime);
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(fileMime)) {
    throw new Error("Formato não permitido. Envie PDF, imagem ou planilha Excel.");
  }
  const producerFolder = toIntegerOrNull(payload.producerId) || "geral";
  const date = new Date();
  const storagePath = `${producerFolder}/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomHex(12)}-${fileName}`;
  const { error } = await db.storage.from("paf-documents").upload(storagePath, bytes, { contentType: fileMime, upsert: false });
  if (error) throw new Error("Não foi possível armazenar o arquivo.");
  return { fileName, fileMime, fileSize: bytes.length, storageBucket: "paf-documents", storagePath };
}

function decodeBase64(value: string) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}

function safeFileName(value: unknown) {
  return normalizeText(value).replace(/[^a-zA-Z0-9._() -]/g, "_").replace(/\s+/g, "-").slice(0, 180) || "documento";
}

function normalizeDocumentMime(fileName: string, mimeValue: unknown) {
  const supplied = normalizeText(mimeValue).toLowerCase();
  if (ALLOWED_DOCUMENT_MIME_TYPES.has(supplied)) return supplied;
  const extension = fileName.split(".").pop()?.toLowerCase();
  return {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel"
  }[extension || ""] || supplied;
}
