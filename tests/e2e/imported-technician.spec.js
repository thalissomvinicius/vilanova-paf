import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) test(`carteira importada sem login pode ser consultada em ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 850 });
  let importedFilter = '';
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    const reply = json => route.fulfill({ json });
    if (url.pathname === '/api/auth/me') return reply({ user: { role: 'admin', name: 'Auditoria' } });
    if (url.pathname === '/api/operations/directories') return reply({ team: [], municipalities: ['Tomé-Açu'], importedTechnicians: ['MARCELO'] });
    if (url.pathname === '/api/operations/producers') {
      importedFilter = url.searchParams.get('importedTechnician') || '';
      return reply({ producers: [{ id: '11111111-1111-4111-8111-111111111111', nome: 'Produtor de Auditoria', telefone: '', municipality: 'Tomé-Açu', properties: 1, technician_names: 'MARCELO', process_status: 'INTERNALIZAR' }], total: importedFilter ? 73 : 213, page: 1, pageSize: 25 });
    }
    return reply({ producers: [], summary: {}, statuses: [], years: [], designers: [], agencies: [], communities: [], technicians: [] });
  });
  await page.goto('/admin/produtores');
  if (width >= 700) await expect(page.getByRole('columnheader', { name: 'Técnico', exact: true })).toBeVisible();
  await expect(page.locator('.ops-table').getByText('MARCELO', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Responsável', exact: true }).selectOption('imported:MARCELO');
  await expect.poll(() => importedFilter).toBe('MARCELO');
  await expect(page.getByText(/73 produtores/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
