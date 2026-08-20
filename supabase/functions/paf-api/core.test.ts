import {
  DOCUMENT_CATEGORIES,
  clientIp,
  hashSecret,
  makeAccessCode,
  mapDocument,
  mapReport,
  normalizeApiPath,
  normalizeDate,
  normalizeLogin,
  toIdList,
  verifySecret
} from "./core.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("normaliza entradas vindas dos formulários", () => {
  assert(normalizeLogin("  técnico coopá 01 ") === "TECNICOCOOPA01", "login normalizado incorretamente");
  assert(normalizeDate("7/2/2026") === "2026-02-07", "data brasileira normalizada incorretamente");
  assert(JSON.stringify(toIdList([3, "2", 3, 0, "x"])) === JSON.stringify([3, 2]), "lista de ids incorreta");
});

Deno.test("normaliza rotas diretas e rotas do Edge Function", () => {
  assert(normalizeApiPath("/functions/v1/paf-api/api/health") === "/api/health", "rota do Edge incorreta");
  assert(normalizeApiPath("/api/admin/producers/") === "/api/admin/producers", "rota da aplicação incorreta");
});

Deno.test("prioriza o IP fornecido pela infraestrutura", () => {
  const trustedRequest = new Request("https://example.com", {
    headers: {
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.4, 192.0.2.8"
    }
  });
  const forwardedRequest = new Request("https://example.com", {
    headers: { "x-forwarded-for": "198.51.100.4, 192.0.2.8" }
  });
  assert(clientIp(trustedRequest) === "203.0.113.10", "IP confiável não foi priorizado");
  assert(clientIp(forwardedRequest) === "192.0.2.8", "cadeia encaminhada não foi tratada com segurança");
});

Deno.test("gera códigos sem caracteres ambíguos", () => {
  assert(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(makeAccessCode()), "formato do código inválido");
});

Deno.test("protege e valida segredos com PBKDF2", async () => {
  const hash = await hashSecret("SenhaForte123!", 1_000);
  assert(await verifySecret("SenhaForte123!", hash), "senha correta rejeitada");
  assert(!await verifySecret("SenhaErrada123!", hash), "senha incorreta aceita");
});

Deno.test("mantém todas as categorias aceitas pelo formulário", () => {
  for (const category of ["IDENTIFICAÇÃO", "DAP/CAF", "LICENÇA", "LAUDO", "FOTO"]) {
    assert(DOCUMENT_CATEGORIES.includes(category), `categoria ausente: ${category}`);
  }
});

Deno.test("preserva metadados de idempotência e armazenamento", () => {
  const report = mapReport({ id: 1, producer_id: 2, client_submission_id: "report-test-123" });
  const document = mapDocument({
    id: 3,
    producer_id: 2,
    storage_bucket: "paf-documents",
    storage_path: "2/teste.png",
    client_submission_id: "photo-test-123"
  });
  assert(report.clientSubmissionId === "report-test-123", "id da submissão do relatório foi perdido");
  assert(document.storageBucket === "paf-documents", "bucket do documento foi perdido");
  assert(document.clientSubmissionId === "photo-test-123", "id da submissão do documento foi perdido");
});
