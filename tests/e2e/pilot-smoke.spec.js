import { expect, test } from "@playwright/test";

test("admin entra e visualiza a prontidão do piloto", async ({ page }) => {
  const password = process.env.PAF_E2E_ADMIN_PASSWORD;
  test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar o login administrativo.");

  await page.goto("/admin");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();
  await expect(page.getByText("87%", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preparar acessos" })).toBeVisible();
  await page.request.post("/api/auth/logout");
});

for (const portal of [
  { path: "/tecnico", heading: "Acesso técnico", manifest: "/manifest-tecnico.webmanifest" },
  { path: "/produtor", heading: "Acesso do produtor", manifest: "/manifest-produtor.webmanifest" }
]) {
  test(`${portal.path} abre corretamente em celular`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(portal.path);

    await expect(page.getByRole("heading", { name: portal.heading })).toBeVisible();
    const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifest).toBe(portal.manifest);
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}
