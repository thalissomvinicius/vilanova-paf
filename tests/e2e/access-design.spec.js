import { test, expect } from '@playwright/test';

test('login controls, error recovery and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
  let release;
  await page.route('**/api/auth/admin-login', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({ status: 401, json: { error: 'Login ou senha inválidos.' } });
  });
  await page.goto('/admin/analises-areas');
  await expect(page.getByLabel('Login', { exact: true })).toHaveValue('');
  await page.getByLabel('Login', { exact: true }).fill('admin');
  await expect(page.locator('.paf-access-scene')).toHaveAttribute('src', '/brand/login-equipe-dende-realista.png');
  await page.getByLabel('Senha', { exact: true }).fill('incorrect-test-password');
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Conectando...' })).toBeDisabled();
  await expect.poll(() => Boolean(release)).toBe(true); release();
  await expect(page.getByRole('alert')).toHaveText('Login ou senha inválidos.');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
  expect(await page.locator('.paf-access-scene').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  for (const [width, height] of [[320, 568], [390, 844], [1366, 660], [1536, 720], [1920, 720], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    const panel = await page.locator('.paf-access-form').boundingBox();
    const scene = await page.locator('.paf-access-scene').boundingBox();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    expect(scene.height).toBeGreaterThan(0);
    expect(await page.locator('.paf-access-scene').evaluate(el => getComputedStyle(el).objectFit)).toBe('cover');
    if (width > 800) expect(scene.x + scene.width).toBeLessThanOrEqual(panel.x);
    else expect(scene.y + scene.height).toBeLessThanOrEqual(panel.y);
    expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Entrar', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeInViewport();
    await page.screenshot({ path: `verification/login-redesign-${width}.png`, fullPage: true });
  }
});
