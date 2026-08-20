import { expect, test } from "@playwright/test";
import { createAccessAccount, createProducer, getDb } from "../../server/db.mjs";

test.describe.serial("isolamento de perfis e sessão", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const producerLogin = `limite.produtor.${suffix}`;
  const technicalLogin = `limite.tecnico.${suffix}`;
  const producerCode = `Produtor-${suffix}`;
  const technicalCode = `Tecnico-${suffix}`;
  let scopedProducer;
  let outsideProducer;
  let producerAccess;
  let technicalAccess;

  test.beforeAll(() => {
    scopedProducer = createProducer({
      name: `Produtor Escopo ${suffix}`,
      cpf: suffix.slice(-11).padStart(11, "0"),
      propertyName: "Propriedade do escopo"
    });
    outsideProducer = createProducer({
      name: `Produtor Fora Escopo ${suffix}`,
      cpf: String(BigInt(suffix.slice(-11).padStart(11, "0")) + 1n).padStart(11, "0"),
      propertyName: "Propriedade fora do escopo"
    });
    producerAccess = createAccessAccount({
      name: scopedProducer.name,
      login: producerLogin,
      accessCode: producerCode,
      accountType: "PRODUTOR",
      producerIds: [scopedProducer.id]
    }).account;
    technicalAccess = createAccessAccount({
      name: `Técnico Escopo ${suffix}`,
      login: technicalLogin,
      accessCode: technicalCode,
      accountType: "TECNICO",
      producerIds: [scopedProducer.id]
    }).account;
  });

  test.afterAll(() => {
    const database = getDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const account of [producerAccess, technicalAccess].filter(Boolean)) {
        database.prepare("DELETE FROM auth_sessions WHERE access_account_id = ?").run(account.id);
        database.prepare("DELETE FROM access_account_producers WHERE access_account_id = ?").run(account.id);
        database.prepare("DELETE FROM access_accounts WHERE id = ?").run(account.id);
      }
      for (const producer of [scopedProducer, outsideProducer].filter(Boolean)) {
        database.prepare("DELETE FROM producers WHERE id = ?").run(producer.id);
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("produtor mantém sessão, não atravessa portais e não forja outro produtor", async ({ page }) => {
    const clientFailures = watchClientHealth(page);
    await loginAccess(page, "/produtor", producerLogin, producerCode);
    await expect(page.getByRole("heading", { name: scopedProducer.name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: scopedProducer.name })).toBeVisible();

    expect((await page.request.get("/api/admin/reports")).status()).toBe(403);
    expect((await page.request.get("/api/technical/me")).status()).toBe(403);

    const forged = await page.request.post("/api/producer/reports", {
      data: {
        producerId: outsideProducer.id,
        clientSubmissionId: `boundary-report-${suffix}`,
        reportDate: "2026-08-20",
        productionNote: "Tentativa controlada de troca de produtor"
      }
    });
    expect(forged.status()).toBe(201);
    const persisted = getDb().prepare("SELECT producer_id FROM reports WHERE client_submission_id = ?").get(`boundary-report-${suffix}`);
    expect(persisted.producer_id).toBe(scopedProducer.id);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
    await page.goto("/tecnico");
    await expect(page.getByRole("heading", { name: "Acesso técnico" })).toBeVisible();
    await page.goto("/produtor");
    await expect(page.getByRole("heading", { name: scopedProducer.name })).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Acesso do produtor" })).toBeVisible();
    expect(clientFailures).toEqual([]);
  });

  test("técnico mantém sessão e não consulta nem grava fora do vínculo", async ({ page }) => {
    const clientFailures = watchClientHealth(page);
    await loginAccess(page, "/tecnico", technicalLogin, technicalCode);
    await expect(page.getByRole("heading", { name: `Técnico Escopo ${suffix}` })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: `Técnico Escopo ${suffix}` })).toBeVisible();

    expect((await page.request.get("/api/admin/visits")).status()).toBe(403);
    expect((await page.request.get("/api/producer/me")).status()).toBe(403);
    const outsideVisit = await page.request.post("/api/technical/visits", {
      data: {
        producerId: outsideProducer.id,
        clientSubmissionId: `boundary-visit-${suffix}`,
        objective: "Tentativa controlada fora do escopo"
      }
    });
    expect(outsideVisit.status()).toBe(403);
    expect(getDb().prepare("SELECT count(*) AS total FROM technical_visits WHERE producer_id = ?").get(outsideProducer.id).total).toBe(0);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
    await page.goto("/produtor");
    await expect(page.getByRole("heading", { name: "Acesso do produtor" })).toBeVisible();
    await page.goto("/tecnico");
    await expect(page.getByRole("heading", { name: `Técnico Escopo ${suffix}` })).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Acesso técnico" })).toBeVisible();
    expect(clientFailures).toEqual([]);
  });

  test("administrador mantém sessão e não assume portal de campo", async ({ page }) => {
    const password = process.env.PAF_E2E_ADMIN_PASSWORD;
    test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar a sessão administrativa.");
    const clientFailures = watchClientHealth(page);

    await page.goto("/admin");
    await page.getByLabel("Login").fill("admin");
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();

    for (const [path, title] of [
      ["/admin/dashboard", "Painel PAF 2026/2027"],
      ["/admin/produtores", "Produtores e áreas"],
      ["/admin/cadastros", "Cadastros"],
      ["/admin/acessos", "Gestão de acessos"],
      ["/admin/relatorios", "Triagem de relatórios"],
      ["/admin/abastecimento", "Controle de abastecimento"],
      ["/admin/visitas", "Visitas técnicas"],
      ["/admin/pendencias", "Pendências internas"],
      ["/admin/documentos", "Documentos e anexos"]
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    }

    expect((await page.request.get("/api/technical/me")).status()).toBe(401);
    expect((await page.request.get("/api/producer/me")).status()).toBe(401);
    await page.goto("/produtor");
    await expect(page.getByRole("heading", { name: "Acesso do produtor" })).toBeVisible();
    await page.goto("/tecnico");
    await expect(page.getByRole("heading", { name: "Acesso técnico" })).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
    expect(clientFailures).toEqual([]);
  });
});

async function loginAccess(page, path, login, code) {
  await page.goto(path);
  await page.getByLabel("Login").fill(login);
  await page.getByLabel("Código de acesso").fill(code);
  await page.getByRole("button", { name: "Entrar" }).click();
}

function watchClientHealth(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === "http://127.0.0.1:5173" && url.pathname.startsWith("/api/") && response.status() >= 500) {
      failures.push(`http ${response.status()}: ${url.pathname}`);
    }
  });
  return failures;
}
