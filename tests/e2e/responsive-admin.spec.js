import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "notebook", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "celular", width: 390, height: 844 }
];

const adminPaths = [
  "/admin/dashboard",
  "/admin/produtores",
  "/admin/cadastros",
  "/admin/acessos",
  "/admin/relatorios",
  "/admin/abastecimento",
  "/admin/visitas",
  "/admin/pendencias",
  "/admin/documentos"
];

for (const viewport of viewports) {
  test(`admin não cria overflow global em ${viewport.name}`, async ({ page }) => {
    const password = process.env.PAF_E2E_ADMIN_PASSWORD;
    test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar a responsividade administrativa.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/admin");
    await page.getByLabel("Login").fill("admin");
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();

    for (const path of adminPaths) {
      await page.goto(path);
      await expect(page.locator(".admin-main")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth
      }));
      expect(Math.max(dimensions.body, dimensions.document), `${path} excedeu a largura em ${viewport.name}`).toBeLessThanOrEqual(dimensions.viewport + 1);
    }

    await page.request.post("/api/auth/logout");
  });
}

test("modal de produtor ocupa e rola corretamente no celular", async ({ page }) => {
  const password = process.env.PAF_E2E_ADMIN_PASSWORD;
  test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar o modal administrativo.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/admin/cadastros");
  await page.getByRole("button", { name: "Novo produtor" }).click();

  const dialog = page.getByRole("dialog", { name: "Cadastrar produtor" });
  await expect(dialog).toBeVisible();
  const layout = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const body = element.querySelector(".modal-body");
    return {
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      bodyOverflowY: getComputedStyle(body).overflowY
    };
  });
  expect(layout.top).toBeGreaterThanOrEqual(0);
  expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.width).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.bodyOverflowY).toBe("auto");

  await page.getByLabel("Nome do produtor").fill("Produtor Responsividade");
  await page.getByLabel("CPF").fill("00000000000");
  await page.getByRole("button", { name: "02 Operação" }).click();
  await page.getByRole("button", { name: "03 Localização" }).click();
  await expect(page.getByLabel("Nome da propriedade")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.request.post("/api/auth/logout");
});
