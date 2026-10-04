import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`area summary, analyst registry and technician assignment at ${width}px`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 800 });
    let row = { id: '11111111-1111-4111-8111-111111111111', protocol: 'PAF-7K3M9-X4R2T', full_name: 'Pessoa de Teste', cpf: '52998224725', birth_date: '1980-01-10', phone: '91999999999', municipality: 'Tomé-Açu', community: 'Comunidade de teste', status: 'EM_ANALISE', comment: 'Cadastro recebido. Aguarde a análise da equipe PAF.', version: 1, created_at: '2026-09-16T15:00:00Z', updated_at: '2026-09-16T15:00:00Z', checklist: {} };
    const tech = { id: '22222222-2222-4222-8222-222222222222', nome: 'Técnica de Teste', email: 'tecnica@example.test', papel: 'tecnico' };
    let analysts = [];
    await page.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname;
      let data = {};
      if (path === '/api/auth/me') data = { user: { role: 'admin', name: 'Equipe PAF' } };
      else if (path === '/api/options') data = { statuses: [], agencies: [], communities: [], designers: [], years: [], technicians: [] };
      else if (path === '/api/producers') data = { producers: [], summary: { total: 0, status: {}, agencies: {}, designers: {} } };
      else if (path === '/api/land/admin/requests') data = { requests: [row], total: 62, summary: { EM_ANALISE: 30, DADOS_INCONSISTENTES: 2, AREA_REPROVADA: 10, POSSIVEL_FINANCIAMENTO: 20 } };
      else if (path === '/api/land/admin/settings') data = { analysts, team: [tech] };
      else if (path === '/api/land/admin/analysts') { analysts = [{ id: '33333333-3333-4333-8333-333333333333', name: req.postDataJSON().name, active: true, version: 1 }]; data = { analyst: analysts[0] }; }
      else if (path.startsWith('/api/land/admin/analysts/')) { analysts[0] = { ...analysts[0], ...req.postDataJSON(), version: 2 }; data = { analyst: analysts[0] }; }
      else if (path.startsWith('/api/land/admin/requests/')) data = { request: row, history: [] };
      else if (path === '/api/operations/directories') data = { team: [tech], municipalities: [] };
      else if (path.endsWith('/workflow')) { row = { ...row, assigned_to: req.postDataJSON().assigned_to, version: row.version + 1 }; data = { request: row }; }
      await route.fulfill({ json: data });
    });
    await page.goto('/admin/analises-areas');
    const summary = page.getByRole('region', { name: 'Resumo das solicitações' });
    await expect(summary.locator('dd')).toHaveText(['62', '30', '30', '2', '20', '10']);
    await page.getByRole('button', { name: 'Configuração', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('tecnica@example.test')).toBeVisible();
    await dialog.getByLabel('Nome completo').fill('Analista de Teste');
    await dialog.getByRole('button', { name: 'Cadastrar', exact: true }).click();
    await expect(dialog.getByText('Analista de Teste', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Desativar' }).click();
    await expect(dialog.getByText('Inativo', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Ativar', exact: true }).click();
    await expect(dialog.getByText('Disponível para seleção')).toBeVisible();
    await page.screenshot({ path: `verification/team-settings-${width}.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Configuração', exact: true })).toBeFocused();
    await page.screenshot({ path: `verification/land-summary-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Editar análise de Pessoa de Teste' }).click();
    await expect(page.getByLabel('Nome de quem realizou a análise')).toBeEnabled();
    await page.getByRole('button', { name: 'Definir técnico' }).click();
    await dialog.getByRole('combobox', { name: 'Técnico', exact: true }).selectOption(tech.id);
    await dialog.getByRole('button', { name: 'Salvar responsável' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Técnico: Técnica de Teste', { exact: true })).toBeVisible();
    await page.getByLabel('Nome de quem realizou a análise').selectOption('Analista de Teste');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    const layout = await page.locator('.sidebar-brand').evaluate(el => ({ border: getComputedStyle(el).borderBottomWidth, before: getComputedStyle(el, '::before').content, after: getComputedStyle(el, '::after').content }));
    expect(layout).toEqual({ border: '0px', before: 'none', after: 'none' });
    await page.screenshot({ path: `verification/case-team-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
