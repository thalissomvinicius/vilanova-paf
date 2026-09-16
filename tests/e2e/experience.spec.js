import { test, expect } from '@playwright/test';

const sizes = [{ name: 'desktop', width: 1440, height: 960 }, { name: 'notebook', width: 1024, height: 768 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }];
async function mockDashboard(page, authenticated = true) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = {};
    if (path === '/api/auth/me') data = { user: authenticated ? { role: 'admin', name: 'Equipe PAF' } : null };
    else if (path === '/api/options') data = { statuses: ['INTERNALIZAR', 'INTERNALIZADO', 'APROVADO', 'PLANTADO', 'CANCELADO'], agencies: ['Tome-Acu', 'Copafmita'], communities: [], designers: [], years: [], technicians: [] };
    else if (path === '/api/producers') data = { producers: [], summary: { total: 204, reported: 42, pending: 162, needsVisit: 12, planted: 64, approved: 48, totalArea: 3850, responseRate: 21, status: { INTERNALIZAR: 37, INTERNALIZADO: 50, APROVADO: 48, PLANTADO: 64, CANCELADO: 5 }, agencies: { 'Tome-Acu': 120, Copafmita: 84 }, designers: { 'Equipe tecnica': 120 } } };
    else if (path === '/api/admin/reports') data = { reports: [], summary: { total: 0 } };
    else if (path === '/api/admin/visits') data = { visits: [], summary: {} };
    else if (path === '/api/admin/tasks') data = { tasks: [], summary: {} };
    else if (path === '/api/admin/documents') data = { documents: [], summary: {} };
    else if (path === '/api/admin/fuel') data = { records: [], vehicles: [], drivers: [], summary: null, options: {} };
    else if (path === '/api/admin/technicians') data = { technicians: [] };
    else if (path === '/api/admin/accesses') data = { accesses: [] };
    await route.fulfill({ json: data });
  });
}
async function assertFits(page) {
  const sizes = await page.evaluate(() => ({ body: document.body.scrollWidth, root: document.documentElement.scrollWidth, width: innerWidth }));
  expect(Math.max(sizes.body, sizes.root)).toBeLessThanOrEqual(sizes.width + 1);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  const contrasts = await page.locator('.primary-button:visible:not(:disabled)').evaluateAll(buttons => {
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    return buttons.map(button => {
      const style = getComputedStyle(button), foreground = luminance(style.color), background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  });
  for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
}
for (const size of sizes) {
  test(`redesigned dashboard and login fit ${size.name}`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(size);
    await mockDashboard(page);
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Panorama da opera\u00e7\u00e3o' })).toBeVisible();
    await expect(page.locator('.executive-kpi')).toHaveCount(4);
    await expect(page.locator('.executive-kpi').first().locator('strong')).toContainText('204');
    await expect(page.locator('.executive-kpi').first()).toContainText('Produtores cadastrados');
    await expect(page.locator('.executive-kpi').first()).not.toContainText('204 propriedades');
    if (size.width >= 1024) {
      const logo = await page.locator('.sidebar-paf-logo').boundingBox();
      const name = await page.locator('.sidebar-brand strong').boundingBox();
      expect(logo.y + logo.height).toBeLessThanOrEqual(name.y);
    }
    await assertFits(page);
    await page.screenshot({ path: `verification/new-dashboard-${size.name}.png`, fullPage: true, animations: 'disabled' });
    await page.goto('/admin/coletas');
    await expect(page.getByRole('heading', { name: 'Acesso da equipe PAF' })).toBeVisible();
    await assertFits(page);
    await page.unroute('**/api/**'); await mockDashboard(page, false);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible();
    await assertFits(page);
    const panel = await page.locator('.premium-login-panel').boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(size.width + 1);
    await page.screenshot({ path: `verification/new-login-${size.name}.png`, fullPage: true, animations: 'disabled' });
    await page.goto('/campo');
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await assertFits(page);
    expect(errors).toEqual([]);
  });
}

test('field login, filters, evidence and review preserve original author', async ({ page }) => {
  const org = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', author = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', reviewer = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
  const profile = { id: reviewer, nome: 'Gestora PAF', email: 'gestora@example.test', papel: 'admin', ativo: true, organizacao_id: org, deve_trocar_senha: false };
  const row = { id: 'dddddddd-dddd-4ddd-dddd-dddddddddddd', organizacao_id: org, tecnico_id: author, formulario_id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', formulario_versao: 2, produtor_id: 'ffffffff-ffff-4fff-ffff-ffffffffffff', comunidade_id: null, dados_json: { rendimento: 12 }, status_validacao: 'pendente', updated_at: '2026-09-16T12:00:00Z', coletado_em: '2026-09-16T12:00:00Z', recebido_em: '2026-09-16T13:00:00Z' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: reviewer, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-signature`;
  let review = null;
  await page.route('https://eeivxgbbslnojbbpzweb.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.includes('/auth/v1/token')) return route.fulfill({ json: { access_token: token, token_type: 'bearer', expires_in: 3600, refresh_token: 'test-refresh', user: { id: reviewer, email: profile.email } } });
    if (url.pathname.includes('/auth/v1/user')) return route.fulfill({ json: { id: reviewer, email: profile.email } });
    const table = url.pathname.split('/').pop();
    let data = [];
    if (table === 'paf_perfis') data = url.searchParams.has('id') ? profile : [{ id: reviewer, nome: profile.nome }, { id: author, nome: 'Tecnico original' }];
    if (table === 'paf_produtores') data = [{ id: row.produtor_id, nome: 'Familia Oliveira' }];
    if (table === 'mobile_formularios') data = [{ id: row.formulario_id, titulo: 'Assistencia tecnica', versao: 2, definicao_json: { fields: [{ id: 'rendimento', label: 'Rendimento observado' }] } }];
    if (table === 'mobile_respostas') {
      if (request.method() === 'PATCH') { review = request.postDataJSON(); data = { id: row.id }; }
      else if (request.method() === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': '0-0/1' }, body: '' });
      else data = [row];
    }
    await route.fulfill({ json: data, headers: { 'content-range': '0-0/1' } });
  });
  await page.goto('/campo');
  await page.getByLabel('E-mail', { exact: true }).fill(profile.email);
  await page.getByLabel('Senha', { exact: true }).fill('fixture-password-not-real');
  await page.getByRole('button', { name: 'Entrar na comunidade' }).click();
  await expect(page.getByRole('heading', { name: 'Coletas de campo' })).toBeVisible();
  await expect(page.getByText('Familia Oliveira')).toBeVisible();
  await page.getByLabel('Buscar coletas').fill('Oliveira');
  await expect(page.locator('.field-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Abrir coleta dddddddd' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Rendimento observado')).toBeVisible();
  await expect(dialog.getByText('Sem anexos registrados.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Aprovar coleta' }).click();
  await expect(dialog).toBeHidden();
  expect(review.status_validacao).toBe('aprovado'); expect(review.revisado_por).toBe(reviewer);
  expect(review.tecnico_id).toBeUndefined(); expect(review.dados_json).toBeUndefined();
});

test('reduced motion removes dashboard animations', async ({ page }) => {
  await mockDashboard(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/admin');
  await expect(page.locator('.executive-kpi')).toHaveCount(4);
  expect(await page.locator('.executive-kpi').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});

test('admin can sign out even when the field module cannot be downloaded', async ({ page }) => {
  await mockDashboard(page);
  await page.route('**/src/field/client.js*', route => route.abort('internetdisconnected'));
  await page.goto('/admin/dashboard');
  await expect(page.locator('.executive-kpi')).toHaveCount(4);
  await page.evaluate(() => sessionStorage.setItem('paf-field-dashboard', 'test-session-not-a-token'));
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('paf-field-dashboard'))).toBeNull();
});

test('invalid field credentials show an error without opening private data', async ({ page }) => {
  await page.route('https://eeivxgbbslnojbbpzweb.supabase.co/auth/v1/token*', route => route.fulfill({ status: 400, json: { code: 'invalid_credentials', msg: 'Invalid login credentials' } }));
  await page.goto('/campo');
  await page.getByLabel('E-mail', { exact: true }).fill('not-a-real-account@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('not-a-real-password');
  await page.getByRole('button', { name: 'Entrar na comunidade' }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha invalidos.');
  await expect(page.locator('.field-table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Entrar na comunidade' })).toBeEnabled();
});

test('app administrator uses the same email session in dashboard and access management', async ({ page }) => {
  const profile = { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', nome: 'Gestora integrada', email: 'gestora@example.test', papel: 'admin', ativo: true, organizacao_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' };
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: profile.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  await mockDashboard(page, false);
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: route.request().headers().authorization === `Bearer ${token}` ? { role: 'admin', name: profile.nome, identity: 'supabase' } : null } }));
  await page.route('https://eeivxgbbslnojbbpzweb.supabase.co/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/v1/token')) return route.fulfill({ json: { access_token: token, token_type: 'bearer', expires_in: 3600, refresh_token: 'fixture', user: { id: profile.id, email: profile.email } } });
    if (url.pathname.includes('/auth/v1/user')) return route.fulfill({ json: { id: profile.id, email: profile.email } });
    return route.fulfill({ json: url.searchParams.has('id') ? profile : [profile] });
  });
  await page.goto('/admin');
  await page.getByLabel('Login', { exact: true }).fill(profile.email);
  await page.getByLabel('Senha', { exact: true }).fill('fixture-password-only');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.executive-kpi')).toHaveCount(4);
  await page.goto('/admin/acessos');
  await page.getByRole('button', { name: 'Equipe e aplicativo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Equipe e aplicativo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acesso da equipe PAF' })).toHaveCount(0);
});
