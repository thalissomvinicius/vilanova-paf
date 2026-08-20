import { expect, test } from "@playwright/test";
import {
  createAccessAccount,
  createProducer,
  getDb
} from "../../server/db.mjs";

test.describe.serial("jornada operacional do piloto", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const producerLogin = `produtor.piloto.${suffix}`;
  const technicalLogin = `tecnico.piloto.${suffix}`;
  const producerCode = `Produtor-${suffix}`;
  const technicalCode = `Tecnico-${suffix}`;
  let producer;
  let producerAccess;
  let technicalAccess;

  test.beforeAll(() => {
    producer = createProducer({
      name: `Produtor Piloto ${suffix}`,
      cpf: suffix.slice(-11).padStart(11, "0"),
      phone: "91999990000",
      address: "Tomé-Açu, PA",
      propertyName: "Sítio Piloto PAF",
      community: "Comunidade Piloto",
      agency: "PAF",
      areaHa: 12.5,
      plantingYear: 2024
    });

    producerAccess = createAccessAccount({
      name: producer.name,
      login: producerLogin,
      accessCode: producerCode,
      accountType: "PRODUTOR",
      producerIds: [producer.id],
      canSubmitReports: true
    }).account;

    technicalAccess = createAccessAccount({
      name: `Técnico Piloto ${suffix}`,
      login: technicalLogin,
      accessCode: technicalCode,
      accountType: "TECNICO",
      organization: "Vila Nova Agroindustrial",
      producerIds: [producer.id],
      canManageVisits: true
    }).account;
  });

  test.afterAll(() => {
    const database = getDb();
    const accountIds = [producerAccess?.id, technicalAccess?.id].filter(Boolean);
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const accountId of accountIds) {
        database.prepare("DELETE FROM auth_sessions WHERE access_account_id = ?").run(accountId);
        database.prepare("DELETE FROM access_account_producers WHERE access_account_id = ?").run(accountId);
        database.prepare("DELETE FROM access_accounts WHERE id = ?").run(accountId);
      }
      if (producer?.id) database.prepare("DELETE FROM producers WHERE id = ?").run(producer.id);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("produtor envia relatório e permanece limitado ao próprio portal", async ({ page }) => {
    await page.goto("/produtor");
    await page.getByLabel("Login").fill(producerLogin);
    await page.getByLabel("Código de acesso").fill(producerCode);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("heading", { name: producer.name })).toBeVisible();
    await expect(page.getByText("Sítio Piloto PAF", { exact: false })).toBeVisible();

    await page.getByLabel("Telefone para contato").fill("(91) 99999-0000");
    await page.getByRole("button", { name: "02 Produção" }).click();
    await expect(page.getByLabel("Área em hectares")).toBeVisible();
    await page.getByRole("button", { name: "03 Finalização" }).click();
    await expect(page.getByLabel("Produção ou andamento")).toBeVisible();
    await page.getByLabel("Produção ou andamento").fill("Acompanhamento do piloto em campo");
    await page.getByLabel("Observações para a equipe técnica").fill("Registro criado pelo teste de jornada completa.");
    const sendReport = page.getByRole("button", { name: "Enviar relatório" });
    await expect(sendReport).toBeVisible();
    await sendReport.dispatchEvent("click");

    await expect(page.getByText("Relatório enviado e disponível no acompanhamento.")).toBeVisible();
    const forbidden = await page.request.get("/api/admin/reports");
    expect(forbidden.status()).toBe(403);
  });

  test("técnico registra visita somente para produtor vinculado", async ({ page }) => {
    await page.goto("/tecnico");
    await page.getByLabel("Login").fill(technicalLogin);
    await page.getByLabel("Código de acesso").fill(technicalCode);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("heading", { name: `Técnico Piloto ${suffix}` })).toBeVisible();
    await page.getByRole("button", { name: "Cadastrar visita" }).click();
    await expect(page.getByRole("heading", { name: "Cadastrar visita" })).toBeVisible();
    await expect(page.getByLabel("Propriedade atendida")).toHaveValue("Sítio Piloto PAF");
    await expect(page.getByLabel("Comunidade")).toHaveValue("Comunidade Piloto");

    await page.getByRole("button", { name: "02 Atendimento" }).click();
    await page.getByLabel("Status").selectOption("CONCLUÍDA");
    await page.getByLabel("Objetivo da visita").fill("Validar a implantação do piloto PAF");
    await page.getByRole("button", { name: "03 Resultado" }).click();
    await expect(page.getByLabel("Resultado e orientação técnica")).toBeVisible();
    await page.getByLabel("Resultado e orientação técnica").fill("Produtor orientado e visita concluída.");
    const saveVisit = page.getByRole("button", { name: "Salvar visita" });
    await expect(saveVisit).toBeVisible();
    await saveVisit.dispatchEvent("click");

    await expect(page.getByText("Validar a implantação do piloto PAF")).toBeVisible();
    const forbidden = await page.request.get("/api/admin/visits");
    expect(forbidden.status()).toBe(403);
  });

  test("admin enxerga os registros criados em campo", async ({ page }) => {
    const password = process.env.PAF_E2E_ADMIN_PASSWORD;
    test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar a consolidação administrativa.");

    await page.goto("/admin");
    await page.getByLabel("Login").fill("admin");
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();

    const reports = await page.request.get(`/api/admin/reports?search=${encodeURIComponent(producer.name)}`);
    expect(reports.ok()).toBeTruthy();
    expect((await reports.json()).reports).toHaveLength(1);

    const visits = await page.request.get(`/api/admin/visits?search=${encodeURIComponent(producer.name)}`);
    expect(visits.ok()).toBeTruthy();
    expect((await visits.json()).visits).toHaveLength(1);
  });
});
