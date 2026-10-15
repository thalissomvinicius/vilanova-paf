import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`official logo animates without moving or blocking login: ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.route('**/api/**', route => route.fulfill({ json: { user: null } }));
    await page.goto('/admin');
    const mark = page.locator(viewport.width > 899 ? '.pa-login-mark' : '.pa-login-symbol');
    await expect(mark).toHaveAttribute('data-ready', 'true');
    const logo = mark.locator('img');
    const form = page.locator('.paf-access-form');
    await page.evaluate(() => document.fonts.ready);
    await form.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
    const initial = await form.boundingBox();
    const frames = [];

    for (const time of [150, 800, 2100]) {
      frames.push(await logo.evaluate((element, currentTime) => {
        const animation = element.getAnimations().find(item => item.animationName === 'paf-logo-arrive');
        animation.pause();
        animation.currentTime = currentTime;
        const style = getComputedStyle(element);
        return { opacity: Number(style.opacity), transform: style.transform };
      }, time));
      const current = await form.boundingBox();
      for (const dimension of ['x', 'y', 'width', 'height']) expect(current[dimension]).toBeCloseTo(initial[dimension], 1);
      await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({ path: `verification/logo-motion-${viewport.width}-${time}.png`, fullPage: true });
    }

    expect(frames[0].opacity).toBeLessThan(frames[2].opacity);
    expect(frames[0].transform).not.toBe(frames[1].transform);
    expect(frames[2].opacity).toBe(1);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(frames[2].transform);
    await page.getByLabel('Login', { exact: true }).fill('teste@exemplo.invalid');
    expect(await logo.evaluate(element => element.getAnimations()[0].currentTime)).toBe(2100);
    const bounds = await logo.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  });
}

test('reduced motion keeps the complete logo visible without animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', route => route.fulfill({ json: { user: null } }));
  await page.goto('/admin');
  await expect(page.locator('.pa-login-mark')).toHaveAttribute('data-ready', 'true');
  for (const selector of ['.pa-login-mark img', '.pa-login-symbol img', '.pa-login-identity-caption']) {
    await expect(page.locator(selector)).toHaveCSS('animation-name', 'none');
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
  }
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
});

test('authentication pulses the mark and stops after an error, without false success', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release;
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
  await page.route('**/api/auth/admin-login', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({ status: 401, json: { error: 'Login ou senha inválidos.' } });
  });
  await page.goto('/admin');
  await page.getByLabel('Login', { exact: true }).fill('admin');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-invalid-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  const mark = page.locator('.pa-login-mark');
  await expect(mark).toHaveAttribute('data-phase', 'authenticating');
  await expect(mark.locator('.paf-logo-motion-stage')).toHaveCSS('animation-name', 'paf-logo-breathe');
  await expect(page.locator('.paf-access-success')).toHaveCount(0);
  await expect.poll(() => Boolean(release)).toBe(true);
  release();
  await expect(page.getByRole('alert')).toContainText('Login ou senha inválidos.');
  await expect(mark).toHaveAttribute('data-phase', 'idle');
  await expect(mark.locator('.paf-logo-motion-stage')).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
});

test('a slow logo download never delays access to the form', async ({ page }) => {
  let release;
  await page.route('**/api/**', route => route.fulfill({ json: { user: null } }));
  await page.route('**/brand/paf-logo-official.png', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.continue();
  });
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Login', { exact: true })).toBeEditable();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
  await expect(page.locator('.pa-login-mark')).toHaveAttribute('data-ready', 'false');
  await expect.poll(() => Boolean(release)).toBe(true);
  release();
  await expect(page.locator('.pa-login-mark')).toHaveAttribute('data-ready', 'true');
});
