import { expect, test } from "@playwright/test";
import { getDb } from "../../server/db.mjs";

test.describe.serial("cadastros e acessos administrativos", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const producerName = `Produtor Cadastro ${suffix}`;
  const technicianName = `Técnico Cadastro ${suffix}`;
  const accessName = `Acesso Cadastro ${suffix}`;
  const accessLogin = `TECNICO-${suffix}`;
  const accessCode = `ACESSO-${suffix}`;

  test.afterAll(() => {
    const database = getDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      const accounts = database.prepare("SELECT id FROM access_accounts WHERE login = ?").all(accessLogin);
      for (const account of accounts) {
        database.prepare("DELETE FROM auth_sessions WHERE access_account_id = ?").run(account.id);
        database.prepare("DELETE FROM access_account_producers WHERE access_account_id = ?").run(account.id);
        database.prepare("DELETE FROM access_accounts WHERE id = ?").run(account.id);
      }
      database.prepare("DELETE FROM technicians WHERE name = ?").run(technicianName);
      database.prepare("DELETE FROM producers WHERE name = ?").run(producerName);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("cria produtor, técnico, vínculo, bloqueia e exclui acesso", async ({ browser, page }) => {
    const password = process.env.PAF_E2E_ADMIN_PASSWORD;
    test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar os cadastros administrativos.");
    await loginAdmin(page, password);

    await page.goto("/admin/cadastros");
    await page.getByRole("button", { name: "Novo produtor" }).click();
    await page.getByLabel("Nome do produtor").fill(producerName);
    await page.getByLabel("CPF").fill(suffix.slice(-11).padStart(11, "0"));
    await page.getByRole("button", { name: "02 Operação" }).click();
    await page.getByLabel("Área (ha)").fill("6.75");
    await page.getByRole("button", { name: "03 Localização" }).click();
    await page.getByLabel("Nome da propriedade").fill("Sítio Cadastro E2E");
    await page.getByLabel("Comunidade").fill("Comunidade Cadastro E2E");
    await page.getByRole("button", { name: "Cadastrar produtor" }).click();
    await expect(page.getByText("Cadastro concluído")).toBeVisible();
    await page.getByRole("button", { name: "Concluir" }).click();

    await page.getByRole("button", { name: "Novo técnico" }).click();
    await page.getByLabel("Nome do técnico").fill(technicianName);
    await page.getByRole("button", { name: "02 Atuação" }).click();
    await page.getByLabel("Função").fill("Técnico de campo");
    await page.getByLabel("Região / agência").fill("Tomé-Açu");
    await page.getByRole("button", { name: "03 Status" }).click();
    await page.getByRole("button", { name: "Cadastrar técnico" }).click();
    await expect(page.getByRole("dialog", { name: "Cadastrar técnico" })).toBeHidden();

    await page.goto("/admin/acessos");
    await page.getByRole("button", { name: "Cadastrar acesso" }).click();
    await page.getByLabel("Nome do acesso").fill(accessName);
    await page.locator('input[name="accountType"][value="TECNICO"]').check();
    await page.getByLabel("Login").fill(accessLogin);
    await page.getByLabel("Código (opcional)").fill(accessCode);
    await page.getByRole("button", { name: "02 Produtores" }).click();
    await page.getByLabel("Técnico vinculado").selectOption({ label: technicianName });
    await page.locator(".access-producer-search input").fill(producerName);
    await page.locator(".access-producer-list label").filter({ hasText: producerName }).getByRole("checkbox").check();
    await page.getByRole("button", { name: "03 Permissões" }).click();
    await page.getByRole("button", { name: "Criar acesso" }).click();
    await expect(page.getByText("Código gerado")).toBeVisible();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();

    await page.locator('.access-filters input[placeholder*="Buscar nome"]').fill(accessLogin);
    await expect(page.getByText(accessName, { exact: true })).toBeVisible();

    const activeContext = await browser.newContext();
    const activePage = await activeContext.newPage();
    await activePage.goto("http://127.0.0.1:5173/tecnico");
    await activePage.getByLabel("Login").fill(accessLogin);
    await activePage.getByLabel("Código de acesso").fill(accessCode);
    await activePage.getByRole("button", { name: "Entrar" }).click();
    await expect(activePage.getByRole("heading", { name: accessName })).toBeVisible();

    await page.getByRole("row", { name: new RegExp(`Editar acesso de ${escapeRegExp(accessName)}`) }).click();
    await page.getByRole("button", { name: "02 Produtores" }).click();
    await page.getByRole("button", { name: "03 Permissões" }).click();
    await page.getByLabel("Acesso ativo", { exact: false }).uncheck();
    await page.getByRole("button", { name: "Salvar acesso" }).click();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByText("BLOQUEADO", { exact: true })).toBeVisible();

    expect((await activePage.request.get("/api/technical/me")).status()).toBe(401);
    await activePage.reload();
    await expect(activePage.getByRole("heading", { name: "Acesso técnico" })).toBeVisible();
    await activePage.getByLabel("Login").fill(accessLogin);
    await activePage.getByLabel("Código de acesso").fill(accessCode);
    await activePage.getByRole("button", { name: "Entrar" }).click();
    await expect(activePage.getByText("Login ou código inválidos para este portal.")).toBeVisible();
    await activeContext.close();

    await page.getByRole("row", { name: new RegExp(`Editar acesso de ${escapeRegExp(accessName)}`) }).click();
    await page.getByRole("button", { name: "02 Produtores" }).click();
    await page.getByRole("button", { name: "03 Permissões" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir acesso" }).click();
    await expect(page.getByText(accessName, { exact: true })).toHaveCount(0);
    await page.request.post("/api/auth/logout");
  });
});

async function loginAdmin(page, password) {
  await page.goto("/admin");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
