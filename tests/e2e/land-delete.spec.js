import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`delete confirmation can be cancelled and removes only selected request at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    const row = { id: '11111111-1111-4111-8111-111111111111', full_name: 'Pessoa de Teste', cpf: '52998224725', birth_date: '1980-01-01', protocol: 'PAF-7K3M9-X4R2T', status: 'EM_ANALISE', comment: 'Cadastro recebido para análise.', created_at: '2026-09-17T12:00:00Z', version: 1 };
    let deleted = false; let attempts = 0;
    await page.route('**/api/**', route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (path === '/api/auth/me') return route.fulfill({ json: { user: { role: 'admin', name: 'Teste' } } });
      if (path === '/api/land/admin/requests') return route.fulfill({ json: { requests: deleted ? [] : [row], total: deleted ? 0 : 1 } });
      if (path === `/api/land/admin/requests/${row.id}`) {
        if (request.method() === 'DELETE') {
          attempts++;
          expect(request.postDataJSON()).toEqual({ confirmation: 'EXCLUIR', protocol: row.protocol, version: 1 });
          if (attempts === 1) return route.fulfill({ status: 503, json: { error: 'Tente novamente.' } });
          deleted = true;
          return route.fulfill({ json: { deleted: true } });
        }
        return route.fulfill({ json: { request: row, history: [] } });
      }
      return route.fulfill({ json: { statuses: [], agencies: [], communities: [], designers: [], years: [], technicians: [], producers: [], summary: {}, reports: [], visits: [], tasks: [], documents: [] } });
    });
    await page.goto('/admin/analises-areas');
    await page.getByRole('button', { name: 'Editar análise de Pessoa de Teste' }).click();
    await page.getByRole('button', { name: 'Excluir solicitação', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Excluir definitivamente' })).toBeDisabled();
    await page.getByRole('button', { name: 'Cancelar exclusão' }).click();
    expect(attempts).toBe(0);
    await page.getByRole('button', { name: 'Excluir solicitação', exact: true }).click();
    await page.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR');
    await page.screenshot({ path: `verification/land-delete-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Excluir definitivamente' }).click();
    await expect(page.getByRole('alert')).toHaveText('Tente novamente.');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Excluir definitivamente' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Nenhuma solicitação encontrada')).toBeVisible();
    expect(deleted).toBe(true);
  });
}
