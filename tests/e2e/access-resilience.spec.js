import { test, expect } from '@playwright/test';

test('successful login confirms only after server authentication and blocks duplicate submission', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release, attempts = 0, authorized = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/admin-login') {
      attempts++;
      await new Promise(resolve => { release = resolve; });
      authorized = true;
      return route.fulfill({ json: { user: { role: 'admin', name: 'Auditoria PAF' } } });
    }
    const responses = {
      '/api/auth/me': { user: authorized ? { role: 'admin', name: 'Auditoria PAF' } : null },
      '/api/options': { statuses: [], agencies: [], communities: [], designers: [], years: [], technicians: [] },
      '/api/producers': { producers: [], summary: {} },
      '/api/operations/overview': { counts: {}, queue: [], agenda: [], pipeline: [], activity: [], team: [], conflicts: 0 },
      '/api/operations/directories': { team: [], municipalities: [] },
    };
    return route.fulfill({ json: responses[path] || { reports: [], requests: [], total: 0 } });
  });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/admin');
  await expect(page.locator('img[src*="login-equipe"]')).toHaveCount(0);
  await page.getByLabel('Login', { exact: true }).fill('admin');
  await page.getByLabel('Senha', { exact: true }).fill('isolated-test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.paf-access-success')).toHaveCount(0);
  await expect(page.getByLabel('Login', { exact: true })).toBeDisabled();
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await expect.poll(() => Boolean(release)).toBe(true);
  expect(attempts).toBe(1);
  release();
  await expect(page.getByRole('heading', { name: 'Acesso confirmado' })).toBeVisible();
  await expect(page.locator('.paf-access-success')).toHaveCSS('opacity', '1');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await page.screenshot({ path: 'verification/login-success.png' });
  await expect(page.locator('.paf-access-form')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('malformed authentication response never displays success', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
  await page.route('**/api/auth/admin-login', route => route.fulfill({ contentType: 'text/html', body: '<html>Unavailable</html>' }));
  await page.goto('/admin');
  await page.getByLabel('Login', { exact: true }).fill('admin');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Resposta inesperada');
  await expect(page.locator('.paf-access-success')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
});

test('session network failure has recovery instead of masquerading as logout', async ({ page }) => {
  let failed = true;
  await page.route('**/api/auth/me', route => failed ? route.abort('internetdisconnected') : route.fulfill({ json: { user: null } }));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Vamos restabelecer a conexão' })).toBeVisible();
  await expect(page.locator('.paf-access-form')).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible();
});
