import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const databasePath = path.resolve("data", `paf-test-${process.pid}.sqlite`);
process.env.PAF_DB_PATH = databasePath;

const database = await import("../server/db.mjs");

test.after(() => {
  database.getDb().close();
  for (const suffix of ["", "-shm", "-wal"]) {
    const target = `${databasePath}${suffix}`;
    if (existsSync(target)) rmSync(target, { force: true });
  }
});

test("relatórios repetidos preservam uma única submissão", () => {
  const producer = database.createProducer({ name: "Produtor Teste Idempotência", cpf: "00000000001" });
  const payload = { clientSubmissionId: "report-test-0001", reportDate: "2026-08-20", contactPhone: "000" };
  database.createReportForProducer(producer.id, payload);
  database.createReportForProducer(producer.id, payload);
  const total = database.getDb().prepare("select count(*) as total from reports where producer_id = ?").get(producer.id).total;
  assert.equal(total, 1);
});

test("visita mantém GPS, início e idempotência", () => {
  const producer = database.createProducer({
    name: "Produtor Teste Visita",
    cpf: "00000000002",
    propertyName: "Sítio Teste PAF",
    community: "Comunidade Teste"
  });
  const payload = {
    producerId: producer.id,
    clientSubmissionId: "visit-test-0001",
    status: "EM CAMPO",
    latitude: -2.420674,
    longitude: -48.152221,
    locationAccuracy: 8
  };
  const first = database.createVisit(payload, "Técnico Teste");
  const repeated = database.createVisit(payload, "Técnico Teste");
  assert.equal(first.id, repeated.id);
  assert.equal(first.latitude, -2.420674);
  assert.equal(first.longitude, -48.152221);
  assert.equal(first.propertyName, "Sítio Teste PAF");
  assert.equal(first.community, "Comunidade Teste");
  assert.ok(first.startedAt);
  assert.throws(() => database.createVisit({ ...payload, clientSubmissionId: "visit-test-0002", latitude: 200 }, "Técnico Teste"), /Latitude inválida/);
});

test("evidência repetida não duplica documento", () => {
  const producer = database.createProducer({ name: "Produtor Teste Evidência", cpf: "00000000003" });
  const visit = database.createVisit({ producerId: producer.id, clientSubmissionId: "visit-test-0003" }, "Técnico Teste");
  const payload = {
    producerId: producer.id,
    visitId: visit.id,
    title: "Foto de campo",
    category: "FOTO DE CAMPO",
    clientSubmissionId: "photo-test-0001"
  };
  const first = database.createDocumentRecord(payload, "Técnico Teste");
  const repeated = database.createDocumentRecord(payload, "Técnico Teste");
  assert.equal(first.id, repeated.id);
  const total = database.getDb().prepare("select count(*) as total from documents where visit_id = ?").get(visit.id).total;
  assert.equal(total, 1);
});
