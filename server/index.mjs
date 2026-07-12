import express from "express";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import {
  accessAccountCanUseProducer,
  buildFuelSummary,
  changeAdminPassword,
  cleanupExpiredSessions,
  createAccessAccount,
  createAuthSession,
  createDocumentRecord,
  createFuelDriver,
  createFuelRecord,
  createProducer,
  createReport,
  createReportForProducer,
  createTask,
  createTechnician,
  createVisit,
  deleteAccessAccount,
  deleteAuthSession,
  deleteFuelDriver,
  deleteFuelVehicle,
  getAccessAccountById,
  getAuthSession,
  getDocumentById,
  getFuelOptions,
  getOptions,
  getProducersForAccessAccount,
  getProducerById,
  getProducerByToken,
  getReportsForProducer,
  getVisitsForProducer,
  listAccessAccounts,
  listDocuments,
  listFuelDrivers,
  listFuelRecords,
  listFuelVehicles,
  listReports,
  listProducers,
  listTasks,
  listTechnicians,
  listVisits,
  resetAccessAccountCode,
  updateAccessAccount,
  updateDocument,
  updateFuelDriver,
  updateFuelVehicle,
  updateProducer,
  updateReportReview,
  updateTechnician,
  updateTask,
  updateVisit,
  upsertFuelVehicle,
  verifyAccessAccountCredentials,
  verifyAdminCredentials,
  verifyProducerCredentials
} from "./db.mjs";
import { importFuelWorkbook } from "./importFuelExcel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = "paf_session";
const UPLOAD_DIR = path.join(rootDir, "data", "uploads");
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const loginAttempts = new Map();

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

cleanupExpiredSessions();
setInterval(cleanupExpiredSessions, 60 * 60 * 1000).unref();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const auth = readAuth(req);

  if (!auth) {
    res.json({ user: null });
    return;
  }

  if (auth.role === "access") {
    const account = getAccessAccountById(auth.accessAccountId);

    if (!account?.active) {
      clearSessionCookie(res);
      res.json({ user: null });
      return;
    }

    const producers = getProducersForAccessAccount(account.id);
    if (account.accountType === "PRODUTOR") {
      const producer = producers[0] || null;
      res.json({
        user: { role: "producer", name: account.name },
        account,
        producer,
        reports: producer ? getReportsForProducer(producer.id) : [],
        visits: producer ? getVisitsForProducer(producer.id) : []
      });
      return;
    }

    res.json({
      user: { role: "technical", name: account.name },
      account,
      producers
    });
    return;
  }

  res.json({ user: { role: "admin", name: process.env.PAF_ADMIN_USER || "admin" } });
});

app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body || {};
  const key = loginKey(req, username || "admin");

  if (isRateLimited(key)) {
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
    return;
  }

  if (!verifyAdminCredentials(username, password)) {
    recordLoginFailure(key);
    res.status(401).json({ error: "Login ou senha inválidos." });
    return;
  }

  clearLoginFailures(key);
  const session = createAuthSession({ role: "admin", ttlHours: 12 });
  setSessionCookie(res, session);
  res.json({ user: { role: "admin", name: process.env.PAF_ADMIN_USER || "admin" } });
});

app.post("/api/auth/producer-login", (req, res) => handleAccessLogin(req, res, "producer"));
app.post("/api/auth/access-login", (req, res) => handleAccessLogin(req, res, "technical"));

app.post("/api/auth/logout", (req, res) => {
  const token = getCookie(req, COOKIE_NAME);
  deleteAuthSession(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post("/api/auth/change-password", requireRole("admin"), (req, res) => {
  const currentPassword = String(req.body?.currentPassword ?? "");
  const newPassword = String(req.body?.newPassword ?? "");

  if (newPassword.length < 12 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    res.status(400).json({ error: "Use pelo menos 12 caracteres, com letras maiúsculas, minúsculas e números." });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ error: "A nova senha deve ser diferente da senha atual." });
    return;
  }
  if (!changeAdminPassword(currentPassword, newPassword)) {
    res.status(401).json({ error: "A senha atual não confere." });
    return;
  }

  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/options", requireRole("admin"), (_req, res) => {
  res.json(getOptions());
});

app.get("/api/producers", requireRole("admin"), (req, res) => {
  const producers = listProducers(req.query);
  res.json({
    producers,
    summary: buildSummary(producers)
  });
});

app.get("/api/producers/:token", requireRole("admin"), (req, res) => {
  const producer = getProducerByToken(req.params.token, { includeCredentials: true });

  if (!producer) {
    res.status(404).json({ error: "Produtor não encontrado." });
    return;
  }

  res.json({
    producer,
    reports: getReportsForProducer(producer.id)
  });
});

app.post("/api/admin/producers", requireRole("admin"), (req, res) => {
  try {
    const producer = createProducer(req.body || {});

    io.emit("producer:updated", {
      producer,
      at: new Date().toISOString()
    });

    res.status(201).json({ producer });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível cadastrar o produtor." });
  }
});

app.patch("/api/admin/producers/:id", requireRole("admin"), (req, res) => {
  const producer = updateProducer(Number(req.params.id), req.body || {});

  if (!producer) {
    res.status(404).json({ error: "Produtor não encontrado." });
    return;
  }

  io.emit("producer:updated", {
    producer,
    at: new Date().toISOString()
  });

  res.json({ producer });
});

app.get("/api/admin/technicians", requireRole("admin"), (req, res) => {
  res.json({
    technicians: listTechnicians(req.query)
  });
});

app.post("/api/admin/technicians", requireRole("admin"), (req, res) => {
  try {
    const technician = createTechnician(req.body || {});

    io.emit("technician:updated", {
      technician,
      at: new Date().toISOString()
    });

    res.status(201).json({ technician });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível cadastrar o técnico." });
  }
});

app.patch("/api/admin/technicians/:id", requireRole("admin"), (req, res) => {
  const technician = updateTechnician(Number(req.params.id), req.body || {});

  if (!technician) {
    res.status(404).json({ error: "Técnico não encontrado." });
    return;
  }

  io.emit("technician:updated", {
    technician,
    at: new Date().toISOString()
  });

  res.json({ technician });
});

app.get("/api/admin/accesses", requireRole("admin"), (req, res) => {
  res.json({ accesses: listAccessAccounts(req.query) });
});

app.post("/api/admin/accesses", requireRole("admin"), (req, res) => {
  try {
    const result = createAccessAccount(req.body || {});
    io.emit("access:updated", { access: result.account, at: new Date().toISOString() });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível cadastrar o acesso." });
  }
});

app.patch("/api/admin/accesses/:id", requireRole("admin"), (req, res) => {
  try {
    const access = updateAccessAccount(Number(req.params.id), req.body || {});
    if (!access) {
      res.status(404).json({ error: "Acesso não encontrado." });
      return;
    }

    io.emit("access:updated", { access, at: new Date().toISOString() });
    res.json({ access });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível atualizar o acesso." });
  }
});

app.post("/api/admin/accesses/:id/reset-code", requireRole("admin"), (req, res) => {
  const result = resetAccessAccountCode(Number(req.params.id));
  if (!result) {
    res.status(404).json({ error: "Acesso não encontrado." });
    return;
  }

  io.emit("access:updated", { access: result.account, at: new Date().toISOString() });
  res.json(result);
});

app.delete("/api/admin/accesses/:id", requireRole("admin"), (req, res) => {
  const access = deleteAccessAccount(Number(req.params.id));
  if (!access) {
    res.status(404).json({ error: "Acesso não encontrado." });
    return;
  }

  io.emit("access:updated", { accessId: access.id, deleted: true, at: new Date().toISOString() });
  res.json({ ok: true, access });
});

app.get("/api/admin/reports", requireRole("admin"), (req, res) => {
  const reports = listReports(req.query);
  res.json({
    reports,
    summary: buildReportSummary(reports)
  });
});

app.patch("/api/admin/reports/:id/review", requireRole("admin"), (req, res) => {
  const report = updateReportReview(Number(req.params.id), req.body || {}, process.env.PAF_ADMIN_USER || "admin");

  if (!report) {
    res.status(404).json({ error: "Relatório não encontrado." });
    return;
  }

  io.emit("report:reviewed", {
    report,
    producerId: report.producerId,
    at: new Date().toISOString()
  });

  res.json({ report });
});

app.get("/api/admin/visits", requireRole("admin"), (req, res) => {
  const visits = listVisits(req.query);
  res.json({
    visits,
    summary: buildVisitSummary(visits)
  });
});

app.patch("/api/admin/visits/:id", requireRole("admin"), (req, res) => {
  const visit = updateVisit(Number(req.params.id), req.body || {}, process.env.PAF_ADMIN_USER || "admin");

  if (!visit) {
    res.status(404).json({ error: "Visita técnica não encontrada." });
    return;
  }

  io.emit("visit:updated", {
    visit,
    producerId: visit.producerId,
    reportId: visit.reportId,
    at: new Date().toISOString()
  });

  res.json({ visit });
});

app.get("/api/admin/tasks", requireRole("admin"), (req, res) => {
  const tasks = listTasks(req.query);
  res.json({
    tasks,
    summary: buildTaskSummary(tasks)
  });
});

app.post("/api/admin/tasks", requireRole("admin"), (req, res) => {
  try {
    const task = createTask(req.body || {}, process.env.PAF_ADMIN_USER || "admin");

    if (!task) {
      res.status(400).json({ error: "Não foi possível criar a pendência." });
      return;
    }

    io.emit("task:updated", {
      task,
      producerId: task.producerId,
      reportId: task.reportId,
      visitId: task.visitId,
      at: new Date().toISOString()
    });

    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível criar a pendência." });
  }
});

app.patch("/api/admin/tasks/:id", requireRole("admin"), (req, res) => {
  const task = updateTask(Number(req.params.id), req.body || {}, process.env.PAF_ADMIN_USER || "admin");

  if (!task) {
    res.status(404).json({ error: "Pendência não encontrada." });
    return;
  }

  io.emit("task:updated", {
    task,
    producerId: task.producerId,
    reportId: task.reportId,
    visitId: task.visitId,
    at: new Date().toISOString()
  });

  res.json({ task });
});

app.get("/api/admin/documents", requireRole("admin"), (req, res) => {
  const documents = listDocuments(req.query);
  res.json({
    documents,
    summary: buildDocumentSummary(documents)
  });
});

app.post("/api/admin/documents", requireRole("admin"), (req, res) => {
  let fileData = {};
  try {
    fileData = saveUploadedFile(req.body || {});
    const document = createDocumentRecord(
      {
        ...(req.body || {}),
        ...fileData
      },
      process.env.PAF_ADMIN_USER || "admin"
    );

    io.emit("document:updated", {
      document,
      producerId: document.producerId,
      reportId: document.reportId,
      visitId: document.visitId,
      taskId: document.taskId,
      at: new Date().toISOString()
    });

    res.status(201).json({ document });
  } catch (error) {
    if (fileData.filePath && existsSync(fileData.filePath)) {
      try {
        unlinkSync(fileData.filePath);
      } catch {
        // The validation error is still more useful to the operator.
      }
    }
    res.status(400).json({ error: error.message || "Não foi possível salvar o documento." });
  }
});

app.patch("/api/admin/documents/:id", requireRole("admin"), (req, res) => {
  const document = updateDocument(Number(req.params.id), req.body || {}, process.env.PAF_ADMIN_USER || "admin");

  if (!document) {
    res.status(404).json({ error: "Documento não encontrado." });
    return;
  }

  io.emit("document:updated", {
    document,
    producerId: document.producerId,
    reportId: document.reportId,
    visitId: document.visitId,
    taskId: document.taskId,
    at: new Date().toISOString()
  });

  res.json({ document });
});

app.get("/api/admin/documents/:id/download", requireRole("admin"), (req, res) => {
  const document = getDocumentById(Number(req.params.id));

  if (!document?.filePath || !existsSync(document.filePath)) {
    res.status(404).json({ error: "Arquivo não encontrado." });
    return;
  }

  res.download(document.filePath, document.fileName || `documento-${document.id}`);
});

app.get("/api/admin/fuel", requireRole("admin"), (req, res) => {
  const records = listFuelRecords(req.query);
  const vehicles = listFuelVehicles(req.query.plate ? { plate: req.query.plate } : {});
  const drivers = listFuelDrivers();

  res.json({
    records,
    vehicles,
    drivers,
    summary: buildFuelSummary(records, vehicles),
    options: getFuelOptions()
  });
});

app.post("/api/admin/fuel", requireRole("admin"), (req, res) => {
  try {
    const record = createFuelRecord(req.body || {});

    io.emit("fuel:updated", {
      record,
      at: new Date().toISOString()
    });

    res.status(201).json({ record });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível lançar o abastecimento." });
  }
});

app.post("/api/admin/fuel/vehicles", requireRole("admin"), (req, res) => {
  try {
    const vehicle = upsertFuelVehicle(req.body || {});

    if (!vehicle) {
      res.status(400).json({ error: "Informe a placa do veículo." });
      return;
    }

    io.emit("fuel:updated", {
      vehicle,
      at: new Date().toISOString()
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível cadastrar o veículo." });
  }
});

app.patch("/api/admin/fuel/vehicles/:id", requireRole("admin"), (req, res) => {
  try {
    const vehicle = updateFuelVehicle(Number(req.params.id), req.body || {});
    if (!vehicle) {
      res.status(404).json({ error: "Veículo não encontrado." });
      return;
    }

    io.emit("fuel:updated", { vehicle, at: new Date().toISOString() });
    res.json({ vehicle });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível atualizar o veículo." });
  }
});

app.delete("/api/admin/fuel/vehicles/:id", requireRole("admin"), (req, res) => {
  const vehicle = deleteFuelVehicle(Number(req.params.id));
  if (!vehicle) {
    res.status(404).json({ error: "Veículo não encontrado." });
    return;
  }

  io.emit("fuel:updated", { vehicleId: vehicle.id, deleted: true, at: new Date().toISOString() });
  res.json({ ok: true, vehicle });
});

app.post("/api/admin/fuel/drivers", requireRole("admin"), (req, res) => {
  try {
    const driver = createFuelDriver(req.body || {});
    io.emit("fuel:updated", { driver, at: new Date().toISOString() });
    res.status(201).json({ driver });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível cadastrar o motorista." });
  }
});

app.patch("/api/admin/fuel/drivers/:id", requireRole("admin"), (req, res) => {
  const driver = updateFuelDriver(Number(req.params.id), req.body || {});
  if (!driver) {
    res.status(404).json({ error: "Motorista não encontrado." });
    return;
  }

  io.emit("fuel:updated", { driver, at: new Date().toISOString() });
  res.json({ driver });
});

app.delete("/api/admin/fuel/drivers/:id", requireRole("admin"), (req, res) => {
  const driver = deleteFuelDriver(Number(req.params.id));
  if (!driver) {
    res.status(404).json({ error: "Motorista não encontrado." });
    return;
  }

  io.emit("fuel:updated", { driverId: driver.id, deleted: true, at: new Date().toISOString() });
  res.json({ ok: true, driver });
});

app.post("/api/admin/fuel/import", requireRole("admin"), async (req, res) => {
  try {
    const fileData = saveUploadedFile(req.body || {});

    if (!fileData.filePath) {
      throw new Error("Envie um arquivo .xlsx ou .xlsm para importar.");
    }

    const extension = path.extname(fileData.fileName || "").toLowerCase();
    if (![".xlsx", ".xlsm"].includes(extension)) {
      throw new Error("Formato inválido. Use .xlsx ou .xlsm.");
    }

    const result = await importFuelWorkbook(fileData.filePath, { sourceFile: fileData.fileName });

    io.emit("fuel:updated", {
      import: result,
      at: new Date().toISOString()
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível importar a planilha de abastecimento." });
  }
});

app.get("/api/technical/me", requireAccessPermission("canManageVisits", ["TECNICO", "ORGANIZACAO"]), (req, res) => {
  const producers = getProducersForAccessAccount(req.access.id);
  const producerIds = new Set(producers.map((producer) => producer.id));
  const visits = listVisits().filter((visit) => producerIds.has(visit.producerId));

  res.json({ account: req.access, producers, visits, summary: buildVisitSummary(visits) });
});

app.post("/api/technical/visits", requireAccessPermission("canManageVisits", ["TECNICO", "ORGANIZACAO"]), (req, res) => {
  const producerId = Number(req.body?.producerId);
  if (!accessAccountCanUseProducer(req.access.id, producerId)) {
    res.status(403).json({ error: "Esse produtor não está vinculado ao seu acesso." });
    return;
  }

  const visit = createVisit(req.body || {}, req.access.name);
  if (!visit) {
    res.status(400).json({ error: "Não foi possível cadastrar a visita." });
    return;
  }

  io.emit("visit:updated", {
    visit,
    producerId: visit.producerId,
    reportId: visit.reportId,
    at: new Date().toISOString()
  });
  res.status(201).json({ visit });
});

app.patch("/api/technical/visits/:id", requireAccessPermission("canManageVisits", ["TECNICO", "ORGANIZACAO"]), (req, res) => {
  const visitId = Number(req.params.id);
  const current = listVisits().find((visit) => visit.id === visitId);

  if (!current) {
    res.status(404).json({ error: "Visita técnica não encontrada." });
    return;
  }

  if (!accessAccountCanUseProducer(req.access.id, current.producerId)) {
    res.status(403).json({ error: "Essa visita não pertence ao seu escopo de produtores." });
    return;
  }

  const visit = updateVisit(visitId, req.body || {}, req.access.name);
  io.emit("visit:updated", {
    visit,
    producerId: visit.producerId,
    reportId: visit.reportId,
    at: new Date().toISOString()
  });
  res.json({ visit });
});

app.get("/api/producer/me", requireAccessPermission("canSubmitReports", ["PRODUTOR"]), (req, res) => {
  const producer = getProducersForAccessAccount(req.access.id)[0] || null;

  if (!producer) {
    res.status(404).json({ error: "Produtor não encontrado." });
    return;
  }

  res.json({
    producer,
    reports: getReportsForProducer(producer.id),
    visits: getVisitsForProducer(producer.id)
  });
});

app.post("/api/producer/reports", requireAccessPermission("canSubmitReports", ["PRODUTOR"]), (req, res) => {
  const scopedProducer = getProducersForAccessAccount(req.access.id)[0] || null;
  const producer = scopedProducer ? createReportForProducer(scopedProducer.id, req.body || {}) : null;

  if (!producer) {
    res.status(404).json({ error: "Produtor não encontrado." });
    return;
  }

  io.emit("report:created", {
    producer,
    at: new Date().toISOString()
  });

  res.status(201).json({
    producer,
    reports: getReportsForProducer(producer.id),
    visits: getVisitsForProducer(producer.id)
  });
});

app.post("/api/reports/:token", requireRole("admin"), (req, res) => {
  const producer = createReport(req.params.token, req.body || {});

  if (!producer) {
    res.status(404).json({ error: "Produtor não encontrado." });
    return;
  }

  io.emit("report:created", {
    producer,
    at: new Date().toISOString()
  });

  res.status(201).json({ producer });
});

if (isProduction) {
  const distDir = path.join(rootDir, "dist");
  app.use(express.static(distDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: "spa"
  });

  app.use(vite.middlewares);
}

io.on("connection", (socket) => {
  socket.emit("connected", { at: new Date().toISOString() });
});

listenWithFallback(Number(process.env.PORT || 5173));

function buildSummary(producers) {
  const status = {};
  const agencies = {};
  const designers = {};
  let totalArea = 0;
  let reported = 0;
  let needsVisit = 0;
  let planted = 0;
  let approved = 0;

  for (const producer of producers) {
    status[producer.processStatus] = (status[producer.processStatus] || 0) + 1;
    agencies[producer.agency || "SEM AGÊNCIA"] = (agencies[producer.agency || "SEM AGÊNCIA"] || 0) + 1;
    designers[producer.designer || "SEM PROJETISTA"] =
      (designers[producer.designer || "SEM PROJETISTA"] || 0) + 1;
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

function buildReportSummary(reports) {
  let needsVisit = 0;
  const byStatus = {};
  const byReviewStatus = {};

  for (const report of reports) {
    if (report.needsVisit) needsVisit += 1;
    byStatus[report.processStatus || "SEM STATUS"] = (byStatus[report.processStatus || "SEM STATUS"] || 0) + 1;
    byReviewStatus[report.reviewStatus || "PENDENTE"] = (byReviewStatus[report.reviewStatus || "PENDENTE"] || 0) + 1;
  }

  return {
    total: reports.length,
    needsVisit,
    byStatus,
    byReviewStatus
  };
}

function buildVisitSummary(visits) {
  let open = 0;
  let completed = 0;
  let scheduled = 0;
  let urgent = 0;
  const byStatus = {};

  for (const visit of visits) {
    byStatus[visit.status || "SEM STATUS"] = (byStatus[visit.status || "SEM STATUS"] || 0) + 1;
    if (visit.status === "CONCLUÍDA") completed += 1;
    if (visit.status !== "CONCLUÍDA" && visit.status !== "CANCELADA") open += 1;
    if (visit.status === "PROGRAMADA" || visit.status === "REPROGRAMADA") scheduled += 1;
    if (visit.priority === "ALTA" || visit.priority === "CRÍTICA") urgent += 1;
  }

  return {
    total: visits.length,
    open,
    completed,
    scheduled,
    urgent,
    byStatus
  };
}

function buildTaskSummary(tasks) {
  let open = 0;
  let overdue = 0;
  let urgent = 0;
  let completed = 0;
  const byStatus = {};
  const today = new Date().toISOString().slice(0, 10);

  for (const task of tasks) {
    byStatus[task.status || "SEM STATUS"] = (byStatus[task.status || "SEM STATUS"] || 0) + 1;
    if (task.status === "CONCLUÍDA") completed += 1;
    if (task.status !== "CONCLUÍDA" && task.status !== "CANCELADA") open += 1;
    if (task.priority === "ALTA" || task.priority === "CRÍTICA") urgent += 1;
    if (task.dueDate && task.dueDate < today && task.status !== "CONCLUÍDA" && task.status !== "CANCELADA") overdue += 1;
  }

  return {
    total: tasks.length,
    open,
    overdue,
    urgent,
    completed,
    byStatus
  };
}

function buildDocumentSummary(documents) {
  let pending = 0;
  let valid = 0;
  let rejected = 0;
  let analysis = 0;
  const byCategory = {};

  for (const document of documents) {
    byCategory[document.category || "OUTRO"] = (byCategory[document.category || "OUTRO"] || 0) + 1;
    if (document.status === "PENDENTE") pending += 1;
    if (document.status === "EM ANÁLISE") analysis += 1;
    if (document.status === "VALIDADO") valid += 1;
    if (document.status === "REJEITADO" || document.status === "VENCIDO") rejected += 1;
  }

  return {
    total: documents.length,
    pending,
    analysis,
    valid,
    rejected,
    byCategory
  };
}

function saveUploadedFile(payload = {}) {
  if (!payload.fileBase64) {
    return {};
  }

  const base64 = String(payload.fileBase64).includes(",")
    ? String(payload.fileBase64).split(",").pop()
    : String(payload.fileBase64);
  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) {
    throw new Error("Arquivo vazio ou inválido.");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo excede o limite de 6 MB.");
  }

  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const originalName = sanitizeFileName(payload.fileName || "documento.bin");
  const extension = path.extname(originalName).slice(0, 12);
  const storedName = `${randomUUID()}${extension}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  writeFileSync(filePath, buffer);

  return {
    fileName: originalName,
    fileMime: payload.fileMime || "application/octet-stream",
    fileSize: buffer.length,
    filePath
  };
}

function sanitizeFileName(name) {
  const cleaned = String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 180) || "documento.bin";
}

function handleAccessLogin(req, res, portal) {
  const { login, accessCode } = req.body || {};
  const key = loginKey(req, login || portal);

  if (isRateLimited(key)) {
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
    return;
  }

  const account = verifyAccessAccountCredentials(login, accessCode);
  const isProducerPortal = portal === "producer";
  const allowed = account && (
    isProducerPortal
      ? account.accountType === "PRODUTOR" && account.canSubmitReports
      : account.accountType !== "PRODUTOR" && account.canManageVisits
  );

  if (!allowed) {
    recordLoginFailure(key);
    res.status(401).json({ error: "Login ou código inválidos para este portal." });
    return;
  }

  clearLoginFailures(key);
  const session = createAuthSession({
    role: "access",
    accessAccountId: account.id,
    ttlHours: isProducerPortal ? 24 * 14 : 12
  });
  setSessionCookie(res, session);

  const producers = getProducersForAccessAccount(account.id);
  if (isProducerPortal) {
    const producer = producers[0] || null;
    res.json({
      user: { role: "producer", name: account.name },
      account,
      producer,
      reports: producer ? getReportsForProducer(producer.id) : [],
      visits: producer ? getVisitsForProducer(producer.id) : []
    });
    return;
  }

  res.json({ user: { role: "technical", name: account.name }, account, producers });
}

function requireAccessPermission(permission, accountTypes = []) {
  return (req, res, next) => {
    const auth = readAuth(req);
    if (!auth || auth.role !== "access" || !auth.accessAccountId) {
      res.status(401).json({ error: "Acesso não autenticado." });
      return;
    }

    const account = getAccessAccountById(auth.accessAccountId);
    if (!account?.active || !account[permission] || (accountTypes.length && !accountTypes.includes(account.accountType))) {
      res.status(403).json({ error: "Acesso não autorizado para esta operação." });
      return;
    }

    req.auth = auth;
    req.access = account;
    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    const auth = readAuth(req);

    if (!auth) {
      res.status(401).json({ error: "Acesso não autenticado." });
      return;
    }

    if (auth.role !== role) {
      res.status(403).json({ error: "Acesso não autorizado." });
      return;
    }

    req.auth = auth;
    next();
  };
}

function readAuth(req) {
  const token = getCookie(req, COOKIE_NAME);
  return getAuthSession(token);
}

function setSessionCookie(res, session) {
  res.cookie(COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    expires: new Date(session.expiresAt)
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/"
  });
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return "";
}

function loginKey(req, subject) {
  return `${req.ip}|${String(subject).toUpperCase()}`;
}

function isRateLimited(key) {
  const attempt = loginAttempts.get(key);
  if (!attempt) {
    return false;
  }

  if (Date.now() > attempt.resetAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= 8;
}

function recordLoginFailure(key) {
  const current = loginAttempts.get(key);
  const resetAt = Date.now() + 15 * 60 * 1000;

  loginAttempts.set(key, {
    count: current ? current.count + 1 : 1,
    resetAt: current?.resetAt && current.resetAt > Date.now() ? current.resetAt : resetAt
  });
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

function listenWithFallback(port) {
  const onError = (error) => {
    if (error.code === "EADDRINUSE" && port < 5190) {
      server.off("error", onError);
      listenWithFallback(port + 1);
      return;
    }

    throw error;
  };

  server.once("error", onError);
  server.listen(port, "0.0.0.0", () => {
    server.off("error", onError);
    console.log(`PAF System em http://localhost:${port}/admin`);
  });
}
