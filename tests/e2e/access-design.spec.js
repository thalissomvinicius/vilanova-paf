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
    if (width > 860) expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    expect(await page.locator('.paf-access-scene').evaluate(el => getComputedStyle(el).objectFit)).toBe('contain');
    if (width > 860) {
      expect(scene.height).toBeGreaterThan(0);
      expect(scene.x + scene.width).toBeLessThanOrEqual(panel.x);
    } else if (height > 700) {
      expect(scene.height).toBeGreaterThan(0);
      expect(scene.y + scene.height).toBeLessThanOrEqual(panel.y);
    } else await expect(page.locator('.paf-access-visual')).toBeHidden();
    expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Entrar', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeInViewport();
    await page.screenshot({ path: `verification/login-redesign-${width}.png`, fullPage: true });
  }
});

for (const [path, heading, userLabel, secretLabel] of [
  ['/admin', 'Painel administrativo', 'Login', 'Senha'],
  ['/produtor', 'Bem-vindo, produtor', 'Login', 'Código de acesso'],
  ['/tecnico', 'Acesso técnico', 'Login', 'Código de acesso'],
  ['/campo', 'Acesso da equipe PAF', 'E-mail', 'Senha'],
]) {
  test(`consistent access, keyboard and assets: ${path}`, async ({ page }) => {
    await page.route('**/api/**', route => route.fulfill({ status: 401, json: { error: 'Acesso necessário.' } }));
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    const user = page.getByLabel(userLabel, { exact: true });
    const secret = page.getByLabel(secretLabel, { exact: true });
    await expect(user).toHaveValue('');
    await expect(secret).toHaveValue('');
    await user.focus();
    await page.keyboard.press('Tab');
    await expect(secret).toBeFocused();
    await expect(secret).toHaveAttribute('type', 'password');
    for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [1366, 660], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(await page.locator('.paf-access-input input').evaluateAll(elements => Math.min(...elements.map(el => parseFloat(getComputedStyle(el).fontSize))))).toBeGreaterThanOrEqual(16);
      const form = await page.locator('.paf-access-form').boundingBox();
      expect(form.width).toBeGreaterThanOrEqual(Math.min(280, width - 40));
      await expect(page.locator('.paf-access-submit')).toHaveCSS('min-height', '56px');
      await expect.poll(() => page.locator('.paf-access-scene').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
      if (width > 860) {
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height + 1);
        const caption = await page.locator('.paf-access-caption').boundingBox();
        const photo = await page.locator('.paf-access-photo').boundingBox();
        expect(photo.y + photo.height).toBeLessThanOrEqual(caption.y + 1);
      }
      await page.screenshot({ path: `verification/access-${path.slice(1)}-${width}.png`, fullPage: true });
    }
    const links = page.locator('.paf-access-portals a');
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute('href', path === '/admin' ? '/produtor' : '/admin');
  });
}
