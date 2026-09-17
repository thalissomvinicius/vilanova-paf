import { test, expect } from '@playwright/test';

for (const width of [1440, 390, 320]) {
  test(`producer login and single portal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let submitted;
    await page.route('**/api/**', route => {
      if (route.request().url().includes('producer-login')) {
        submitted = route.request().postDataJSON();
        return route.fulfill({ status: 401, json: { error: 'Login ou código incorreto.' } });
      }
      return route.fulfill({ status: 401, json: { error: 'Acesso necessário.' } });
    });
    await page.goto('/admin');
    await expect(page.locator('.paf-access-portals a')).toHaveCount(1);
    await page.getByRole('link', { name: /Sou produtor/ }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo, produtor' })).toBeVisible();
    await page.getByLabel('Login', { exact: true }).fill('PAF-TESTE');
    await page.getByLabel('Código de acesso', { exact: true }).fill('test-only');
    await page.getByRole('button', { name: 'Mostrar código' }).click();
    await expect(page.getByLabel('Código de acesso', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar código' }).click();
    await page.getByRole('button', { name: 'Acessar meus relatórios' }).click();
    await expect(page.getByRole('alert')).toHaveText('Login ou código incorreto.');
    expect(submitted).toEqual({ login: 'PAF-TESTE', accessCode: 'test-only' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `verification/producer-login-${width}.png`, fullPage: true });
  });
}
