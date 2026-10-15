import { test, expect } from "@playwright/test";

const team = [
  { id: "tech-a", nome: "Ana Martins", papel: "tecnico" },
  { id: "tech-b", nome: "Carlos Oliveira", papel: "tecnico" },
  { id: "tech-c", nome: "Marcos Pereira", papel: "tecnico" },
  { id: "tech-d", nome: "Marcelo Santos", papel: "tecnico" },
];
const producers = [
  "Maria de Nazaré Costa",
  "José Antônio dos Santos",
  "Raimundo Ferreira",
  "Francisca Almeida",
].map((nome, i) => ({
  id: `producer-${i}`,
  nome,
  cpf: "***.***.***-**",
  telefone: "(91) 90000-0000",
  municipality: "Tomé-Açu",
  technician_names: team[i].nome,
  properties: 1,
  process_status: ["PLANTADO", "INTERNALIZADO", "APROVADO", "INTERNALIZAR"][i],
}));
const requests = producers.map((producer, i) => ({
  id: `request-${i}`,
  full_name: producer.nome,
  cpf: "00000000000",
  protocol: `PAF-DEMO-${i + 1}`,
  municipality: "Tomé-Açu",
  community: "Comunidade demonstrativa",
  assigned_to: team[i].id,
  due_date: "2026-10-20",
  next_action: [
    "Conferir documentação",
    "Avaliar área",
    "Agendar visita",
    "Emitir parecer",
  ][i],
  status: [
    "EM_ANALISE",
    "DADOS_INCONSISTENTES",
    "POSSIVEL_FINANCIAMENTO",
    "AREA_REPROVADA",
  ][i],
  created_at: "2026-10-14T12:00:00Z",
}));

async function mockWorkspace(
  page,
  { empty = false, role = "admin", fail = false, delay = 0 } = {},
) {
  const calls = [];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname;
    calls.push({ path, search: url.search, method: route.request().method() });
    if (path === "/api/operations/overview" && delay)
      await new Promise((resolve) => setTimeout(resolve, delay));
    if (path === "/api/operations/overview" && fail)
      return route.fulfill({
        status: 503,
        json: { error: "Serviço temporariamente indisponível." },
      });
    let data = {};
    if (path === "/api/auth/me")
      data = { user: { role, name: "Equipe de demonstração" } };
    else if (path === "/api/options")
      data = {
        statuses: [],
        agencies: [],
        communities: [],
        designers: [],
        years: [],
        technicians: [],
      };
    else if (path === "/api/producers")
      data = {
        producers: [],
        summary: { total: 0, status: {}, agencies: {}, designers: {} },
      };
    else if (path === "/api/operations/directories")
      data = {
        team,
        municipalities: ["Tomé-Açu", "Concórdia do Pará", "Moju"],
      };
    else if (path === "/api/operations/overview") {
      const days = Number(url.searchParams.get("days") || 30);
      data = empty
        ? {
            counts: {},
            pipeline: [],
            activity: [],
            queue: [],
            agenda: [],
            team: [],
          }
        : {
            counts: {
              producers: 204,
              area: 3850,
              requests: days === 7 ? 8 : 24,
              visits: 12,
              completedVisits: 38,
              overdue: 3,
            },
            conflicts: 2,
            pipeline: [
              { status: "INTERNALIZAR", total: 37 },
              { status: "INTERNALIZADO", total: 50 },
              { status: "APROVADO", total: 48 },
              { status: "PLANTADO", total: 64 },
              { status: "CANCELADO", total: 5 },
            ],
            activity: Array.from({ length: days }, (_, i) => ({
              day: new Date(Date.UTC(2026, 9, 14 - days + i))
                .toISOString()
                .slice(0, 10),
              requests: (i * 7 + 3) % 11,
              visits: (i * 3 + 1) % 6,
            })),
            queue: requests,
            agenda: producers.slice(0, 3).map((producer, i) => ({
              id: `visit-${i}`,
              produtor_id: producer.id,
              nome: producer.nome,
              titulo: "Acompanhamento técnico",
              inicio_em: `2026-10-${15 + i}T09:00:00-03:00`,
            })),
            team: team.map((member, i) => ({
              ...member,
              requests: 8 + i,
              visits: 5 + i,
            })),
          };
    } else if (path === "/api/operations/producers")
      data = { producers, total: producers.length };
    else if (path === "/api/land/admin/requests")
      data = {
        requests,
        total: 62,
        summary: {
          EM_ANALISE: 30,
          DADOS_INCONSISTENTES: 2,
          AREA_REPROVADA: 10,
          POSSIVEL_FINANCIAMENTO: 20,
        },
      };
    else if (path === "/api/land/admin/settings") data = { analysts: [], team };
    else if (path === "/api/admin/technicians") data = { technicians: [] };
    else if (path === "/api/admin/accesses") data = { accesses: [] };
    else if (path === "/api/admin/reports")
      data = { reports: [], summary: { total: 0 } };
    else if (path === "/api/admin/visits") data = { visits: [], summary: {} };
    else if (path === "/api/admin/tasks") data = { tasks: [], summary: {} };
    else if (path === "/api/admin/documents")
      data = { documents: [], summary: {} };
    else if (path === "/api/admin/fuel")
      data = {
        records: [],
        vehicles: [],
        drivers: [],
        summary: null,
        options: {},
      };
    else if (
      path === "/api/operations/visits" ||
      path === "/api/operations/tasks"
    )
      data = { records: [], total: 0 };
    await route.fulfill({ json: data });
  });
  return calls;
}

async function fits(page, width) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(width + 1);
  expect(
    await page
      .locator("img:visible")
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  ).toBe(true);
  const broken = await page
    .locator("button:visible, a.primary-button:visible")
    .evaluateAll((elements) =>
      elements
        .filter(
          (el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 3,
        )
        .map((el) => el.textContent),
    );
  expect(broken).toEqual([]);
}

for (const size of [
  { width: 1440, height: 960 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
]) {
  test(`premium workspace at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const calls = await mockWorkspace(page);
    await page.goto("/admin/dashboard");
    await expect(
      page.getByRole("heading", { name: "Panorama da operação" }),
    ).toBeVisible();
    await expect(
      page.locator(".executive-kpi").first().locator("strong"),
    ).toHaveText("204");
    await expect(page.locator(".pa-portfolio-legend a")).toHaveCount(5);
    await expect(page.locator(".pa-chart-day")).toHaveCount(30);
    await page.locator(".pa-chart-day").nth(7).focus();
    await expect(
      page.locator(".pa-chart-day").nth(7).locator(".pa-chart-tooltip"),
    ).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".pa-chart-day").nth(8)).toBeFocused();
    await expect(page.locator('.pa-chart-day[tabindex="0"]')).toHaveCount(1);
    await page.getByRole("button", { name: "7 dias", exact: true }).click();
    await expect(page.locator(".pa-chart-day")).toHaveCount(7);
    await expect(
      page.locator(".executive-kpi").nth(1).locator("strong"),
    ).toHaveText("8");
    await page
      .getByRole("combobox", { name: "Município", exact: true })
      .selectOption("Moju");
    await expect
      .poll(() =>
        calls.some((call) => call.search.includes("municipality=Moju")),
      )
      .toBe(true);
    await page
      .getByRole("combobox", { name: "Município", exact: true })
      .selectOption("");
    await page.getByRole("button", { name: "90 dias", exact: true }).click();
    await expect(page.locator(".pa-chart-day")).toHaveCount(90);
    await fits(page, size.width);
    expect(
      await page
        .locator(".pa-chart-day")
        .evaluateAll((days) =>
          days.every((day) => day.getBoundingClientRect().width > 0),
        ),
    ).toBe(true);
    await page.getByRole("button", { name: "30 dias", exact: true }).click();
    await expect(page.locator(".pa-chart-day")).toHaveCount(30);
    await fits(page, size.width);
    await page.screenshot({
      path: `verification/premium-dashboard-${size.width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.locator(".pa-portfolio-legend a").first().click();
    await expect(page).toHaveURL(/stage=INTERNALIZAR/);
    await expect(
      page.getByRole("heading", { name: "Produtores e propriedades" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Etapa", exact: true }),
    ).toHaveValue("INTERNALIZAR");
    await expect(
      page.getByRole("button", { name: "Abrir ficha", exact: false }),
    ).toHaveCount(4);
    await fits(page, size.width);
    await page.screenshot({
      path: `verification/premium-producers-${size.width}.png`,
      fullPage: true,
    });
    await page.goto("/admin/analises-areas");
    await expect(
      page
        .getByRole("region", { name: "Resumo das solicitações" })
        .locator("dd"),
    ).toHaveText(["62", "30", "30", "2", "20", "10"]);
    await fits(page, size.width);
    await page.screenshot({
      path: `verification/premium-land-${size.width}.png`,
      fullPage: true,
    });
    if (size.width < 981) {
      await page
        .getByRole("button", { name: "Abrir menu", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", { name: "Navegação", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: `verification/premium-menu-${size.width}.png`,
      });
      await page.locator(".sidebar-close").click();
    }
    expect(calls.filter((call) => call.method !== "GET")).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("empty overview has no invented charts or management access for coordinator", async ({
  page,
}) => {
  await mockWorkspace(page, { empty: true, role: "coordinator" });
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Tudo em dia", { exact: true })).toBeVisible();
  await expect(page.locator(".pa-chart-day")).toHaveCount(0);
  await expect(page.locator(".executive-kpi strong")).toHaveText([
    "0",
    "0",
    "0",
    "0",
  ]);
  await expect(
    page.getByRole("link", { name: "Gerenciar acessos" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "verification/premium-empty.png",
    fullPage: true,
  });
});

for (const width of [390, 1440]) {
  test(`shared shell and remaining modules at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const calls = await mockWorkspace(page);
    for (const route of [
      "relatorios",
      "visitas",
      "pendencias",
      "documentos",
      "abastecimento",
      "cadastros",
      "logins",
      "coletas",
    ]) {
      await page.goto(`/admin/${route}`);
      await expect(page.locator(".admin-main h1")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await fits(page, width);
      await page.screenshot({
        path: `verification/premium-${route}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    expect(calls.filter((call) => call.method !== "GET")).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("loading, errors and reduced motion are preserved", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockWorkspace(page, { delay: 1500 });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("status", { name: "Carregando indicadores" }),
  ).toBeVisible();
  await expect(page.locator(".pa-chart-stack").first()).toBeVisible();
  expect(
    await page
      .locator(".pa-chart-stack")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.unroute("**/api/**");
  await mockWorkspace(page, { fail: true });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Serviço temporariamente indisponível",
  );
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
  await expect(page.locator(".executive-kpi")).toHaveCount(0);
});
