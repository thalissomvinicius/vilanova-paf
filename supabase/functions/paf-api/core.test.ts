import {
  DOCUMENT_CATEGORIES,
  hashSecret,
  makeAccessCode,
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
