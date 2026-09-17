import { test, expect } from '@playwright/test';

const record = () => ({ id: '11111111-1111-4111-8111-111111111111', protocol: 'PAF-123ABC-456DEF-789ABC-123DEF', full_name: 'Pessoa de Teste', cpf: '52998224725', birth_date: '1980-01-10', phone: '91999999999', municipality: 'Tomé-Açu', community: 'Comunidade de teste', status: 'EM_ANALISE', comment: 'Cadastro recebido. Aguarde a análise da equipe PAF.', version: 1, created_at: '2026-09-16T15:00:00Z', updated_at: '2026-09-16T15:00:00Z' });
async function mock(page) {
  let row = record(); let history = []; const bodies = [];
  await page.route('**/api/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    let data = {};
    if (path === '/api/auth/me') data = { user: { role: 'admin', name: 'Equipe PAF' } };
    else if (path === '/api/options') data = { statuses: [], agencies: [], communities: [], designers: [], years: [], technicians: [] };
    else if (path === '/api/producers') data = { producers: [], summary: { total: 0, status: {}, agencies: {}, designers: {} } };
    else if (path === '/api/land/requests') { bodies.push(request.postDataJSON()); data = { request: row }; }
    else if (path === '/api/land/lookup') {
      const body = request.postDataJSON();
      if (body.cpf.replace(/\D/g, '') !== row.cpf) return route.fulfill({ status: 404, json: { error: 'Protocolo ou CPF não conferem.' } });
      data = { request: { ...row, history } };
    }
    else if (path === '/api/land/admin/requests') data = { requests: !url.searchParams.get('search') || row.full_name.includes(url.searchParams.get('search')) ? [row] : [], total: 1, page: 1, pageSize: 25 };
    else if (path.startsWith('/api/land/admin/requests/')) {
      if (request.method() === 'PATCH') { const body = request.postDataJSON(); bodies.push(body); row = { ...row, ...body, reviewer_name: body.reviewerName, version: row.version + 1 }; history = [{ ...body, reviewer_name: body.reviewerName, actor: 'Equipe PAF', created_at: row.created_at }]; }
      data = { request: row, history };
    }
    else if (path === '/api/admin/fuel') data = { records: [], vehicles: [], drivers: [], summary: null, options: {} };
    else data = { reports: [], visits: [], tasks: [], documents: [], accesses: [], technicians: [], summary: {} };
    await route.fulfill({ json: data });
  });
  return bodies;
}

test('public tabs support keyboard navigation and retain unsent fields', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await mock(page);
  await page.goto('/analise-de-area');
  await page.getByLabel('Nome completo', { exact: true }).fill('Pessoa de Teste');
  const create = page.getByRole('tab', { name: 'Nova solicitação' });
  const track = page.getByRole('tab', { name: 'Consultar andamento' });
  await create.focus();
  await page.keyboard.press('ArrowRight');
  await expect(track).toBeFocused();
  await expect(track).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Protocolo', { exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(create).toBeFocused();
  await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Pessoa de Teste');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('phone stays aligned with CPF regardless of validation feedback', async ({ page }) => {
  await mock(page);
  await page.goto('/analise-de-area');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const value of ['', '11111111111', '52998224725']) {
      await page.getByLabel('CPF', { exact: true }).fill(value);
      await expect.poll(async () => {
        const cpf = await page.getByLabel('CPF', { exact: true }).boundingBox();
        const phone = await page.getByLabel('Telefone de contato com DDD').boundingBox();
        return Math.abs(cpf.height - phone.height);
      }).toBeLessThan(1);
      const cpf = await page.getByLabel('CPF', { exact: true }).boundingBox();
      const phone = await page.getByLabel('Telefone de contato com DDD').boundingBox();
      if (phone.x > cpf.x + 5) expect(Math.abs(cpf.y - phone.y)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: `verification/land-phone-alignment-${width}.png`, fullPage: true });
  }
});

test('CPF gives inline feedback and blocks invalid input', async ({ page }) => {
  await mock(page);
  await page.goto('/analise-de-area');
  const cpf = page.getByLabel('CPF', { exact: true });
  await cpf.fill('11111111111');
  await expect(page.getByText('CPF inválido. Confira os números digitados.')).toBeVisible();
  await expect(cpf).toHaveAttribute('aria-invalid', 'true');
  expect(await cpf.evaluate(el => el.checkValidity())).toBe(false);
  await cpf.fill('529.982.247-25');
  await expect(page.getByText('CPF válido.', { exact: true })).toBeVisible();
  expect(await cpf.evaluate(el => el.checkValidity())).toBe(true);
  await cpf.fill('529');
  await cpf.blur();
  await expect(page.getByText('Informe os 11 números do CPF.')).toBeVisible();
  await cpf.fill('52998224724');
  expect(await cpf.evaluate(el => el.checkValidity())).toBe(false);
});

test('birth date requires all parts and handles leap years and future dates', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-16T12:00:00'));
  const bodies = await mock(page);
  await page.goto('/analise-de-area');
  await page.getByLabel('Nome completo', { exact: true }).fill('Pessoa de Teste');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Quem solicita a análise?' })).toBeVisible();
  const day = page.getByLabel('Dia', { exact: true });
  const month = page.getByLabel('Mês', { exact: true });
  const year = page.getByLabel('Ano', { exact: true });
  await day.selectOption('31');
  await month.selectOption('02');
  await expect(day).toHaveValue('');
  await year.selectOption('2000');
  await day.selectOption('29');
  await year.selectOption('1900');
  await expect(day).toHaveValue('');
  await expect(day.locator('option[value="29"]')).toHaveCount(0);
  await month.selectOption('09');
  await day.selectOption('30');
  await year.selectOption('2026');
  await expect(day).toHaveValue('');
  await expect(day.locator('option[value="17"]')).toHaveCount(0);
  await expect(month.locator('option[value="10"]')).toHaveCount(0);
  await expect(year.locator('option[value="2027"]')).toHaveCount(0);
  expect(bodies).toHaveLength(0);
});

for (const width of [1440, 390, 320]) {
  test(`public registration, receipt and consultation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); const bodies = await mock(page);
    await page.goto('/analise-de-area');
    await expect(page.getByRole('heading', { name: 'Cadastro de Áreas para Análise - Plantio de Dendê' })).toBeVisible();
    await expect(page.locator('.land-footer-credit')).toHaveText('Desenvolvido por Vinicius Dev');
    expect(await page.getByLabel('Nome completo', { exact: true }).evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
    await page.screenshot({ path: `verification/land-intake-${width}.png`, fullPage: true });
    await page.getByLabel('Nome completo', { exact: true }).fill('Pessoa de Teste');
    await page.getByLabel('CPF', { exact: true }).fill('52998224725');
    await page.getByLabel('Dia', { exact: true }).selectOption('10');
    await page.getByLabel('Mês', { exact: true }).selectOption('01');
    await page.getByLabel('Ano', { exact: true }).selectOption('1980');
    const phone = page.getByLabel('Telefone de contato com DDD');
    await expect(phone).toHaveAttribute('required', '');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Quem solicita a análise?' })).toBeVisible();
    await phone.fill('91999999999');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('select[name=state]')).toBeDisabled();
    await expect(page.locator('select[name=state]')).toHaveValue('PA');
    await expect(page.getByLabel('Município da área').locator('option')).toHaveCount(145);
    await page.getByLabel('Município da área').selectOption('Tomé-Açu');
    await page.getByLabel('Comunidade da área').fill('Comunidade de teste');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Onde fica a área?' })).toBeVisible();
    await page.getByRole('radio', { name: 'Sim', exact: true }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByLabel('Nome completo da mãe do solicitante')).toBeVisible();
    await page.getByLabel('Nome completo da mãe do solicitante').fill('Maria de Teste');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Onde fica a área?' })).toBeVisible();
    await expect(page.getByLabel('Nome do assentamento', { exact: true })).toHaveAttribute('required', '');
    await page.getByLabel('Nome do assentamento', { exact: true }).fill('PA de Teste');
    await page.getByRole('radio', { name: 'Não', exact: true }).check();
    await expect(page.getByLabel('Nome do assentamento', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Nome completo da mãe do solicitante')).toHaveCount(0);
    if (width !== 1440) {
      await page.getByRole('radio', { name: 'Sim', exact: true }).check();
      await expect(page.getByLabel('Nome completo da mãe do solicitante')).toHaveValue('');
      await expect(page.getByLabel('Nome do assentamento', { exact: true })).toHaveValue('');
      await page.getByLabel('Nome do assentamento', { exact: true }).fill('PA de Teste');
      await page.getByLabel('Nome completo da mãe do solicitante').fill('Maria de Teste');
    }
    await page.screenshot({ path: `verification/land-settlement-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Pessoa de Teste');
    await expect(page.getByLabel('Dia', { exact: true })).toHaveValue('10');
    await expect(page.getByLabel('Mês', { exact: true })).toHaveValue('01');
    await expect(page.getByLabel('Ano', { exact: true })).toHaveValue('1980');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByLabel('Comunidade da área')).toHaveValue('Comunidade de teste');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    await expect(page.getByRole('heading', { name: 'Proteção de dados e autorização' })).toBeVisible();
    await page.getByRole('button', { name: 'Enviar solicitação' }).click();
    expect(bodies).toHaveLength(0);
    await page.getByRole('checkbox').check();
    await page.screenshot({ path: `verification/land-form-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Enviar solicitação' }).click();
    await expect(page.getByRole('heading', { name: 'Solicitação recebida' })).toBeVisible();
    expect(bodies).toHaveLength(1); expect(bodies[0].consent).toBe(true);
    expect(bodies[0].birthDate).toBe('1980-01-10');
    expect(bodies[0].state).toBe('PA');
    expect(bodies[0].consentVersion).toBe('2026-09-v2');
    expect(bodies[0].isFederalSettlement).toBe(width !== 1440);
    expect(bodies[0].motherName).toBe(width !== 1440 ? 'Maria de Teste' : '');
    expect(bodies[0].settlementName).toBe(width !== 1440 ? 'PA de Teste' : '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `verification/land-receipt-${width}.png`, fullPage: true });
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Salvar protocolo' }).click(); expect((await download).suggestedFilename()).toContain('PAF-');
    await page.getByRole('tab', { name: 'Consultar andamento' }).click();
    await page.getByLabel('Protocolo', { exact: true }).fill(record().protocol);
    await page.getByLabel('CPF do solicitante').fill('00000000000');
    await page.getByRole('button', { name: 'Consultar andamento', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('não conferem');
    await page.getByLabel('CPF do solicitante').fill(record().cpf);
    await page.getByRole('button', { name: 'Consultar andamento', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Andamento da solicitação' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `verification/land-tracking-${width}.png`, fullPage: true });
  });
  test(`administrative review dialog and public result at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 }); const bodies = await mock(page);
    await page.goto('/admin/analises-areas');
    await page.getByRole('button', { name: 'Editar análise de Pessoa de Teste' }).click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await page.getByLabel('Resultado da análise').selectOption(width === 320 ? 'DADOS_INCONSISTENTES' : 'POSSIVEL_FINANCIAMENTO');
    await page.getByLabel('Nome de quem realizou a análise').fill('Ana de Teste');
    await page.getByLabel('Parecer para o solicitante').fill('Área apta a seguir para avaliação documental pela instituição financeira.');
    await page.getByRole('button', { name: 'Salvar parecer' }).click();
    await expect(page.getByText('Parecer salvo e disponível para consulta.')).toBeVisible();
    expect(bodies[0].version).toBe(1);
    await page.screenshot({ path: `verification/land-review-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Fechar análise' }).click();
    await page.screenshot({ path: `verification/land-admin-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto('/analise-de-area'); await page.getByRole('tab', { name: 'Consultar andamento' }).click();
    await page.getByLabel('Protocolo', { exact: true }).fill(record().protocol);
    await page.getByLabel('CPF do solicitante').fill(record().cpf);
    await page.getByRole('button', { name: 'Consultar andamento', exact: true }).click();
    await expect(page.locator('.land-tracking-result .land-status').first()).toHaveText(width === 320 ? 'Dados inconsistentes' : 'Área possível de financiamento');
  });
}
