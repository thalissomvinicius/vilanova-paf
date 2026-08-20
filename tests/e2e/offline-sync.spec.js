import { expect, test } from "@playwright/test";
import { createAccessAccount, createProducer, getDb } from "../../server/db.mjs";

test.describe.serial("fila offline de visitas técnicas", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const login = `offline.tecnico.${suffix}`;
  const accessCode = `Offline-${suffix}`;
  let producer;
  let access;

  test.beforeAll(() => {
    producer = createProducer({
      name: `Produtor Offline ${suffix}`,
      cpf: suffix.slice(-11).padStart(11, "0"),
      propertyName: "Propriedade Offline PAF",
      community: "Comunidade Offline",
      agency: "PAF"
    });
    access = createAccessAccount({
      name: `Técnico Offline ${suffix}`,
      login,
      accessCode,
      accountType: "TECNICO",
      producerIds: [producer.id],
      canManageVisits: true
    }).account;
  });

  test.afterAll(() => {
    const database = getDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      if (access?.id) {
        database.prepare("DELETE FROM auth_sessions WHERE access_account_id = ?").run(access.id);
        database.prepare("DELETE FROM access_account_producers WHERE access_account_id = ?").run(access.id);
        database.prepare("DELETE FROM access_accounts WHERE id = ?").run(access.id);
      }
      if (producer?.id) database.prepare("DELETE FROM producers WHERE id = ?").run(producer.id);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("preserva múltiplas visitas, fecha a tela e sincroniza sem duplicar", async ({ context, page }) => {
    await page.goto("/tecnico");
    await page.getByLabel("Login").fill(login);
    await page.getByLabel("Código de acesso").fill(accessCode);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: `Técnico Offline ${suffix}` })).toBeVisible();

    await prepareVisit(page, "Visita offline 01");
    await context.setOffline(true);
    await savePreparedVisit(page);
    await expect(page.getByText("Pendente de sincronização")).toBeVisible();

    await prepareVisit(page, "Visita offline 02");
    await savePreparedVisit(page);
    await expect(page.getByText("Aguardando sincronização")).toHaveCount(2);

    const queueKey = `paf:technical-visit-queue:${access.id}`;
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]").length, queueKey)).toBe(2);

    await page.close();
    await context.setOffline(false);
    const reopened = await context.newPage();
    await reopened.goto("/tecnico");
    await expect(reopened.getByRole("heading", { name: `Técnico Offline ${suffix}` })).toBeVisible();

    await expect.poll(() => getDb().prepare("SELECT count(*) AS total FROM technical_visits WHERE producer_id = ?").get(producer.id).total, {
      timeout: 15000
    }).toBe(2);
    await expect.poll(() => reopened.evaluate((key) => localStorage.getItem(key), queueKey), { timeout: 15000 }).toBeNull();
    await expect(reopened.getByText("Sincronizado")).toBeVisible();

    await reopened.evaluate(() => {
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("online"));
    });
    await reopened.waitForTimeout(800);
    const total = getDb().prepare("SELECT count(*) AS total FROM technical_visits WHERE producer_id = ?").get(producer.id).total;
    expect(total).toBe(2);
  });
});

async function prepareVisit(page, objective) {
  await page.getByRole("button", { name: "Cadastrar visita" }).click();
  await expect(page.getByRole("heading", { name: "Cadastrar visita" })).toBeVisible();
  await page.getByRole("button", { name: "02 Atendimento" }).click();
  await page.getByLabel("Status").selectOption("CONCLUÍDA");
  await page.getByLabel("Objetivo da visita").fill(objective);
  await page.getByRole("button", { name: "03 Resultado" }).click();
  await page.getByLabel("Resultado e orientação técnica").fill(`${objective} concluída e preservada no aparelho.`);
}

async function savePreparedVisit(page) {
  const save = page.getByRole("button", { name: "Salvar visita" });
  await expect(save).toBeVisible();
  await save.dispatchEvent("click");
  await expect(page.getByRole("heading", { name: "Cadastrar visita" })).toBeHidden();
}

test.describe.serial("fila offline de relatórios do produtor", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const login = `offline.produtor.${suffix}`;
  const accessCode = `Produtor-${suffix}`;
  let producer;
  let access;

  test.beforeAll(() => {
    producer = createProducer({
      name: `Produtor Relatório Offline ${suffix}`,
      cpf: suffix.slice(-11).padStart(11, "0"),
      phone: "91999990000",
      propertyName: "Sítio Relatório Offline",
      community: "Comunidade Offline",
      agency: "PAF",
      areaHa: 8.5
    });
    access = createAccessAccount({
      name: producer.name,
      login,
      accessCode,
      accountType: "PRODUTOR",
      producerIds: [producer.id],
      canSubmitReports: true
    }).account;
  });

  test.afterAll(() => {
    const database = getDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      if (access?.id) {
        database.prepare("DELETE FROM auth_sessions WHERE access_account_id = ?").run(access.id);
        database.prepare("DELETE FROM access_account_producers WHERE access_account_id = ?").run(access.id);
        database.prepare("DELETE FROM access_accounts WHERE id = ?").run(access.id);
      }
      if (producer?.id) database.prepare("DELETE FROM producers WHERE id = ?").run(producer.id);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("mantém o relatório após fechar e sincroniza uma única vez", async ({ context, page }) => {
    await page.goto("/produtor");
    await page.getByLabel("Login").fill(login);
    await page.getByLabel("Código de acesso").fill(accessCode);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: producer.name })).toBeVisible();

    await page.getByLabel("Telefone para contato").fill("(91) 99999-0000");
    await page.getByRole("button", { name: "02 Produção" }).click();
    await page.getByRole("button", { name: "03 Finalização" }).click();
    await page.getByLabel("Produção ou andamento").fill("Relatório preservado sem internet");
    await page.getByLabel("Observações para a equipe técnica").fill("Sincronizar quando a conexão retornar.");

    await context.setOffline(true);
    const send = page.getByRole("button", { name: "Enviar relatório" });
    await expect(send).toBeVisible();
    await send.dispatchEvent("click");
    await expect(page.getByText("Pendente de sincronização")).toBeVisible();

    const queueKey = `paf:producer-report-queue:${producer.id}`;
    await expect.poll(() => page.evaluate((key) => Boolean(localStorage.getItem(key)), queueKey)).toBe(true);
    await page.close();

    await context.setOffline(false);
    const reopened = await context.newPage();
    await reopened.goto("/produtor");
    await expect(reopened.getByRole("heading", { name: producer.name })).toBeVisible();
    await expect.poll(() => getDb().prepare("SELECT count(*) AS total FROM reports WHERE producer_id = ?").get(producer.id).total, {
      timeout: 15000
    }).toBe(1);
    await expect.poll(() => reopened.evaluate((key) => localStorage.getItem(key), queueKey), { timeout: 15000 }).toBeNull();
    await expect(reopened.getByText("Sincronizado")).toBeVisible();

    await reopened.evaluate(() => {
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("online"));
    });
    await reopened.waitForTimeout(800);
    const total = getDb().prepare("SELECT count(*) AS total FROM reports WHERE producer_id = ?").get(producer.id).total;
    expect(total).toBe(1);
  });
});
