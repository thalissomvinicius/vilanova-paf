import { test, expect } from '@playwright/test';

const paths = ['dashboard', 'analises-areas', 'produtores', 'cadastros', 'acessos', 'relatorios', 'coletas', 'abastecimento', 'visitas', 'pendencias', 'documentos'];
async function mockWorkspace(page) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const payloads = {
      '/api/auth/me': { user: { role: 'admin', name: 'Equipe PAF' } },
      '/api/options': { statuses: ['INTERNALIZAR', 'INTERNALIZADO', 'APROVADO', 'PLANTADO', 'CANCELADO'], agencies: [], communities: [], designers: [], years: [], technicians: [] },
      '/api/producers': { producers: [], summary: { total: 0, reported: 0, pending: 0, needsVisit: 0, planted: 0, approved: 0, totalArea: 0, responseRate: 0, status: {}, agencies: {}, designers: {} } },
      '/api/admin/reports': { reports: [], summary: {} },
      '/api/admin/visits': { visits: [], summary: {} },
      '/api/admin/tasks': { tasks: [], summary: {} },
      '/api/admin/documents': { documents: [], summary: {} },
      '/api/admin/fuel': { records: [], vehicles: [], drivers: [], summary: null, options: {} },
      '/api/admin/technicians': { technicians: [] },
      '/api/admin/accesses': { accesses: [] }
    };
    await route.fulfill({ json: payloads[path] || { requests: [], total: 0, summary: {} } });
  });
}

test('short desktop sidebar has a branded scrollbar and all links remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await mockWorkspace(page);
  await page.goto('/admin/dashboard');
  const nav = page.getByRole('navigation', { name: 'Navegação' });
  await expect(page.locator('.executive-kpi')).toHaveCount(4);
  const scrollbar = await nav.evaluate(element => ({
    overflows: element.scrollHeight > element.clientHeight,
    width: getComputedStyle(element, '::-webkit-scrollbar').width,
    track: getComputedStyle(element, '::-webkit-scrollbar-track').backgroundColor
  }));
  expect(scrollbar.overflows).toBe(true);
  expect(scrollbar.width).toBe('6px');
  expect(scrollbar.track).toBe('rgb(28, 58, 49)');
  await page.screenshot({ path: 'verification/sidebar-scrollbar.png', animations: 'disabled' });
  const access = nav.getByRole('button', { name: 'Acessos', exact: true });
  await access.scrollIntoViewIfNeeded();
  await expect(access).toBeInViewport();
  expect(await nav.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await access.click();
  await expect(page).toHaveURL(/\/admin\/acessos$/);
});

for (const width of [390, 768, 1024, 1440]) {
  test(`all workspaces and registration dialogs fit ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await mockWorkspace(page);
    for (const path of paths) {
      await page.goto(`/admin/${path}`);
      await expect(page.locator('.admin-main')).toBeVisible();
      if (path === 'dashboard') await expect(page.locator('.executive-kpi')).toHaveCount(4);
      if (path === 'analises-areas') await expect(page.locator('.land-admin')).toBeVisible();
      if (path === 'coletas') await expect(page.getByRole('heading', { name: 'Acesso da equipe PAF' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Poppins');
      await page.screenshot({ path: `verification/workspace-${path}-${width}.png`, fullPage: true, animations: 'disabled' });
    }
    await page.goto('/admin/cadastros');
    for (const label of ['Novo produtor', 'Novo técnico']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(901);
      await expect(dialog.getByRole('button', { name: 'Fechar', exact: true })).toBeInViewport();
      await page.screenshot({ path: `verification/dialog-${label}-${width}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('button', { name: label, exact: true })).toBeFocused();
    }
    if (width < 981) {
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Navegação' }).getByRole('button', { name: 'Painel', exact: true }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard$/);
      await expect(page.locator('.admin-layout')).not.toHaveClass(/nav-open/);
    }
    expect(errors).toEqual([]);
  });
}
