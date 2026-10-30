import { test, expect } from '@playwright/test';
import { pafDocumentForms } from '../../src/field/visit-report.generated.mjs';

for (const width of [390, 1366]) for (const formId of ['paf-liberacao-ater', 'paf-notificacao']) test(`${formId} creation, upload recovery and PDF at ${width}px`, async ({ page }) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width, height: 900 });
  const org = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', userId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const profile = { id: userId, nome: 'Técnico de Teste', papel: 'admin', ativo: true, organizacao_id: org, email: 'teste@example.invalid', deve_trocar_senha: false };
  const forms = pafDocumentForms.map((form, index) => ({ id: `form-${index}`, codigo: form.id, titulo: form.title, versao: 1, modulo_id: null, definicao_json: { fields: form.fields, evidencePolicy: form.evidencePolicy } }));
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.fixture`;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4AAAAABJRU5ErkJggg==', 'base64');
  let saved = null, attachments = [], failUpload = true, finalizeCalls = 0;
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://eeivxgbbslnojbbpzweb.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method();
    let data = [];
    if (path.includes('/auth/v1/token')) data = { access_token: token, token_type: 'bearer', expires_in: 3600, refresh_token: 'fixture-only', user: { id: userId, email: profile.email } };
    else if (path.includes('/auth/v1/user')) data = { id: userId, email: profile.email };
    else if (path.endsWith('/paf_perfis')) data = url.searchParams.has('id') ? profile : [profile];
    else if (path.endsWith('/paf_produtores')) data = [{ id: 'producer', nome: 'Produtor de Teste', cpf: '12345678901', endereco: 'Ramal de Teste', tipo_produtor: 'PRONAF' }];
    else if (path.endsWith('/paf_propriedades')) { const property = { id: 'property', nome: 'Área de Teste', produtor_id: 'producer', municipio: 'Tomé-Açu', endereco_rural: 'Ramal de Teste' }; data = url.searchParams.has('id') ? property : [property]; }
    else if (path.endsWith('/mobile_formularios')) data = forms;
    else if (path.endsWith('/mobile_respostas')) {
      if (method === 'POST' || method === 'PATCH') { saved = { ...saved, ...request.postDataJSON(), id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', updated_at: new Date().toISOString(), recebido_em: new Date().toISOString() }; data = saved; }
      else if (url.searchParams.has('client_id')) data = saved;
      else data = saved ? [saved] : [];
    } else if (path.endsWith('/mobile_anexos')) {
      if (method === 'POST') { const payload = request.postDataJSON(); const existing = attachments.find(item => item.client_id === payload.client_id); if (existing) Object.assign(existing, payload); else attachments.push({ ...payload, id: crypto.randomUUID() }); }
      data = attachments;
    } else if (path.endsWith('/rpc/paf_finalize_field_collection')) { expect(attachments.filter(item => item.tipo === 'foto')).toHaveLength(2); expect(attachments.filter(item => item.tipo === 'assinatura')).toHaveLength(formId === 'paf-notificacao' ? 2 : 1); saved.status_validacao = 'pendente'; finalizeCalls++; data = { id: saved.id, status_validacao: 'pendente' }; }
    else if (path.includes('/storage/v1/object/sign/')) return method === 'POST' ? route.fulfill({ json: { signedURL: '/object/sign/paf-anexos/test.png?token=test' } }) : route.fulfill({ body: png, contentType: 'image/png' });
    else if (path.includes('/storage/v1/object/paf-anexos/')) return failUpload ? route.fulfill({ status: 400, json: { message: 'Falha de envio simulada' } }) : route.fulfill({ json: { Key: 'test' } });
    await route.fulfill({ json: data, headers: { 'content-range': data?.length ? `0-${data.length - 1}/${data.length}` : '*/0' } });
  });
  await page.goto('/campo/coletas');
  await page.getByLabel('E-mail', { exact: true }).fill(profile.email); await page.getByLabel('Senha', { exact: true }).fill('fixture-only-password');
  await page.getByRole('button', { name: 'Entrar na equipe PAF' }).click();
  await page.getByRole('button', { name: 'Emitir documento', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Emitir documento', exact: true });
  await editor.getByLabel('Tipo de documento').selectOption(formId);
  await editor.getByLabel('Produtor', { exact: true }).selectOption('producer');
  const form = pafDocumentForms.find(item => item.id === formId);
  const values = { numeroDocumento: 'LAU-TESTE-2', dataElaboracao: '2026-10-20', nomeProdutor: 'Produtor de Teste', cpfProdutor: '12345678901', denominacaoImovel: 'Área de Teste', enderecoImovel: 'Ramal de Teste', municipio: 'Tomé-Açu', localEmissao: 'Tomé-Açu / PA', registroProfissional: 'REG-TESTE', numeroParcela: '2', numeroVistoria: '04', dataVisita: '2026-10-19', numeroOperacao: 'TESTE-01', dataContratacao: '2026-01-01', recursos: 'Linha informada no contrato', creditoLiberado: '138.431,26', finalidade: 'Manutenção e insumos', parecerTecnico: 'Descrição técnica de teste.', proximaVistoria: '2026-11-20' };
  Object.assign(values, { dataOcorrencia: '2026-10-18', motivoNotificacao: 'Motivo de teste preenchido pelo técnico', providenciasSolicitadas: 'Providências de teste', prazoDias: '15', nomeConfirmacaoProdutor: 'Destinatário de Teste', dataCiencia: '2026-10-20' });
  for (let step = 0; step < (formId === 'paf-liberacao-ater' ? 4 : 3); step++) {
    for (const field of form.fields.filter(item => item.section.startsWith(`${step + 1}.`))) {
      if (field.id === 'tecnicoResponsavel' || field.id === 'itensOrcamento') continue;
      const control = editor.getByLabel(`${field.label}${field.required ? ' *' : ''}`, { exact: true });
      if (field.type === 'select') await control.selectOption(field.id === 'situacaoCiencia' ? 'Assinou a ciência' : field.options[0]); else await control.fill(values[field.id] || '');
    }
    if (step === 2 && formId === 'paf-liberacao-ater') {
      await editor.getByRole('button', { name: 'Adicionar item do orçamento' }).click();
      await editor.getByLabel('Descrição do item 1').fill('Manutenção do palmar');
      await editor.getByLabel('Valor do item 1').fill('1.837,89'); await editor.getByLabel('Data do item 1').fill('2026-11-10');
      await expect(editor.locator('.paf-doc-total')).toContainText('1.837,89');
    }
    await page.screenshot({ path: `verification/doc-release-${width}-${step}.png` });
    await editor.getByRole('button', { name: 'Avançar', exact: true }).click();
  }
  await editor.getByLabel('Adicionar fotos ao documento').setInputFiles([{ name: 'foto1.png', mimeType: 'image/png', buffer: png }, { name: 'foto2.png', mimeType: 'image/png', buffer: png }]);
  await editor.getByLabel('Legenda da foto 1', { exact: true }).fill('Área após manutenção'); await editor.getByLabel('Legenda da foto 2', { exact: true }).fill('Detalhe do plantio');
  for (const canvas of await editor.locator('canvas').all()) { await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox(); await page.mouse.move(box.x + 20, box.y + 60); await page.mouse.down(); for (let x = 20; x < 180; x += 10) await page.mouse.move(box.x + x, box.y + 60 + Math.sin(x / 20) * 20); await page.mouse.up(); }
  await expect(editor.getByText('Assinatura registrada', { exact: true })).toHaveCount(formId === 'paf-notificacao' ? 2 : 1);
  await editor.getByRole('button', { name: 'Concluir documento', exact: true }).click();
  await expect(editor.getByRole('alert')).toBeVisible(); expect(finalizeCalls).toBe(0); expect(saved.status_validacao).toBe('rascunho');
  failUpload = false;
  await editor.getByRole('button', { name: 'Concluir documento', exact: true }).click();
  await expect(editor).toHaveCount(0); expect(finalizeCalls).toBe(1);
  const detail = page.getByRole('dialog');
  await detail.getByRole('button', { name: 'Baixar relatório PDF', exact: true }).click();
  const report = page.getByRole('dialog', { name: 'Documento PAF', exact: true });
  await expect(report.getByRole('button', { name: 'Salvar PDF / imprimir' })).toBeEnabled();
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: formId === 'paf-liberacao-ater' ? 'Laudo de acompanhamento' : 'Notificação ao produtor' })).toBeVisible();
  if (formId === 'paf-liberacao-ater') await expect(frame.getByRole('heading', { name: 'Parecer do agente financeiro' })).toBeVisible();
  else { await expect(frame.getByText('Motivo de teste preenchido pelo técnico')).toBeVisible(); await expect(frame.getByText('Destinatário de Teste', { exact: true })).toHaveCount(2); }
  await expect(frame.getByText('Área após manutenção', { exact: false })).toBeVisible();
  if (width === 1366) { const iframe = await page.locator('iframe').elementHandle(), reportFrame = await iframe.contentFrame(), printable = await page.context().newPage(); await printable.setContent(await reportFrame.content()); await printable.evaluate(() => document.fonts.ready); await printable.pdf({ path: `verification/${formId}-document.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true }); await printable.close(); }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
