import { test, expect } from '@playwright/test';

test('shared app accounts can be created, edited, blocked and reset from mobile dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const org = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const profile = { id, nome: 'Gestora', email: 'gestora@example.test', papel: 'admin', ativo: true, organizacao_id: org };
  const target = { id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc', nome: 'Tecnico de campo', email: 'campo@example.test', papel: 'tecnico', ativo: true, organizacao_id: org, updated_at: '2026-09-16T12:00:00Z' };
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  const mutations = [];
  await page.route('https://eeivxgbbslnojbbpzweb.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url());
    let data = {};
    if (url.pathname.includes('/auth/v1/token')) data = { access_token: token, token_type: 'bearer', expires_in: 3600, refresh_token: 'fixture', user: { id, email: profile.email } };
    else if (url.pathname.includes('/auth/v1/user')) data = { id, email: profile.email };
    else if (url.pathname.endsWith('/paf_perfis')) data = url.searchParams.has('id') ? profile : [profile, target];
    else if (url.pathname.includes('/functions/')) { mutations.push(request.postDataJSON()); data = { email: target.email, temporaryPassword: 'fixture-password-only', emailStatus: 'not_configured' }; }
    else if (url.pathname.includes('/rpc/')) { const input = request.postDataJSON(); mutations.push(input); target.nome = input.new_name; target.ativo = input.new_active; data = null; }
    await route.fulfill({ json: data });
  });
  await page.goto('/campo/acessos');
  await page.getByLabel('E-mail', { exact: true }).fill(profile.email);
  await page.getByLabel('Senha', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Entrar na comunidade' }).click();
  await expect(page.getByRole('heading', { name: 'Equipe e aplicativo' })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar acesso' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Nova tecnica');
  await dialog.getByLabel('E-mail', { exact: true }).fill('nova@example.test');
  await expect(dialog.getByRole('button', { name: 'Salvar acesso' })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Salvar acesso' }).click();
  await expect(page.getByRole('dialog', { name: 'Credencial temporaria' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByText('fixture-password-only')).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar Tecnico de campo', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Tecnico revisado');
  await page.getByRole('button', { name: 'Salvar acesso' }).click();
  await page.getByRole('button', { name: 'Redefinir senha de Tecnico revisado' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Credencial temporaria' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: 'Bloquear Tecnico revisado' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reativar Tecnico revisado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar Gestora', exact: true })).toBeDisabled();
  await page.getByLabel('Buscar acessos da equipe').fill('nao existe');
  await expect(page.getByText('Nenhum acesso encontrado.')).toBeVisible();
  expect(mutations).toHaveLength(4);
  expect(mutations[0].role).toBe('tecnico');
  expect(mutations[3].new_active).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'verification/accesses-mobile.png', fullPage: true });
});
