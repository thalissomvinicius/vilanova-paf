import { expect, test } from "@playwright/test";

const portals = [
  {
    path: "/tecnico",
    loginHeading: "Acesso técnico",
    cacheKey: "paf:technical-session-cache",
    workspaceHeading: "Técnico PWA Offline",
    snapshot: {
      account: { id: 9001, name: "Técnico PWA Offline", accountType: "TECNICO", canManageVisits: true },
      producers: [{ id: 8001, name: "Produtor disponível offline", propertyName: "Sítio Offline", community: "Comunidade Offline" }],
      visits: [],
      summary: { total: 0, scheduled: 0, completed: 0 }
    }
  },
  {
    path: "/produtor",
    loginHeading: "Acesso do produtor",
    cacheKey: "paf:producer-session-cache",
    workspaceHeading: "Produtor PWA Offline",
    snapshot: {
      producer: {
        id: 8002,
        name: "Produtor PWA Offline",
        cpf: "00000000000",
        processStatus: "ACOMPANHAMENTO",
        areaHa: 4.5,
        propertyName: "Sítio Offline",
        community: "Comunidade Offline"
      },
      reports: [],
      visits: []
    }
  }
];

for (const portal of portals) {
  test(`${portal.path} reabre autenticado e offline depois do primeiro uso`, async ({ context, page }) => {
    await page.goto(portal.path);
    await expect(page.getByRole("heading", { name: portal.loginHeading })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);

    // A primeira recarga entrega o controle ao service worker e armazena os assets versionados.
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.evaluate(({ key, snapshot }) => localStorage.setItem(key, JSON.stringify({ ...snapshot, cachedAt: new Date().toISOString() })), {
      key: portal.cacheKey,
      snapshot: portal.snapshot
    });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: portal.workspaceHeading })).toBeVisible();
    const apiUnavailable = await page.evaluate(() => fetch("/api/health").then(() => false).catch(() => true));
    expect(apiUnavailable).toBe(true);
    const dialogPromise = page.waitForEvent("dialog");
    const logoutClick = page.getByRole("button", { name: "Sair" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/Conecte-se à internet antes de sair|Não foi possível encerrar o acesso agora/);
    await dialog.accept();
    await logoutClick;
    await expect(page.getByRole("heading", { name: portal.workspaceHeading })).toBeVisible();
    await context.setOffline(false);
  });
}

test("não restaura sessão offline expirada", async ({ context, page }) => {
  await page.goto("/tecnico");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(() => localStorage.setItem("paf:technical-session-cache", JSON.stringify({
    account: { id: 9003, name: "Sessão Expirada" },
    producers: [],
    visits: [],
    summary: {},
    cachedAt: new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString()
  })));

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Acesso técnico" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sessão Expirada" })).toHaveCount(0);
  await context.setOffline(false);
});
