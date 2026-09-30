import { test, expect } from '@playwright/test';

const producer = {id:'11111111-1111-4111-8111-111111111111',nome:'Produtor de Teste',cpf:'52998224725',telefone:'91999999999'};
const technician = {id:'22222222-2222-4222-8222-222222222222',nome:'Técnica de Teste',papel:'tecnico'};
for (const width of [390,1440]) test(`canonical visits and tasks can be created and revised at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:850});
  const records = {visit:[],task:[]};
  await page.route('**/api/**', async route => {
    const req=route.request(), url=new URL(req.url()), path=url.pathname;
    const respond=json => route.fulfill({json});
    if(path === '/api/auth/me') return respond({user:{role:'admin',name:'Equipe Teste'}});
    if(path === '/api/operations/directories') return respond({team:[technician],municipalities:[]});
    if(path === '/api/operations/producers') return respond({producers:[producer],total:1,page:1,pageSize:25});
    if(path === `/api/operations/producers/${producer.id}`) return respond({producer,properties:[],visits:records.visit,tasks:records.task});
    for(const [kind,list] of [['visit','visits'],['task','tasks']]) {
      if(path === `/api/operations/${list}`) return respond({records:records[kind],total:records[kind].length,page:1,pageSize:25});
      if(path === `/api/operations/${kind}` && req.method()==='POST') {
        const body=req.postDataJSON();expect(body.produtor_id).toBe(producer.id);
        const record={...body,id:'33333333-3333-4333-8333-333333333333',updated_at:'2026-09-30T10:00:00.123456+00:00',producer_name:producer.nome,responsible_name:technician.nome};
        records[kind].push(record);return respond({record});
      }
      if(path === `/api/operations/${kind}/33333333-3333-4333-8333-333333333333` && req.method()==='PATCH') {
        const body=req.postDataJSON();expect(body.updated_at).toBe(records[kind][0].updated_at);
        records[kind][0]={...records[kind][0],...body};return respond({record:records[kind][0]});
      }
    }
    return respond({statuses:[],agencies:[],communities:[],designers:[],years:[],technicians:[],producers:[],reports:[],visits:[],tasks:[],documents:[],summary:{},accesses:[]});
  });
  for (const [kind,path,button,title,completed] of [['visit','visitas','Programar visita','Assunto da visita','realizado'],['task','pendencias','Cadastrar pendência','Assunto da pendência','concluida']]) {
    await page.goto(`/admin/${path}`);
    await page.getByRole('button',{name:button,exact:true}).click();
    await page.getByLabel('Buscar produtor por nome ou CPF').fill('Produtor');
    await page.getByRole('button',{name:/Produtor de Teste/}).click();
    const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
    await dialog.getByLabel(title,{exact:false}).fill(`Registro ${kind}`);
    await dialog.getByLabel(kind==='visit'?'Técnico responsável':'Responsável',{exact:false}).selectOption(technician.id);
    await dialog.getByRole('button',{name:'Continuar',exact:true}).click();
    if(kind === 'visit') await dialog.getByLabel('Data e horário',{exact:false}).fill('2026-10-01T09:00');
    await dialog.getByRole('button',{name:'Salvar cadastro',exact:true}).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading',{name:`Registro ${kind}`})).toBeVisible();
    await page.getByRole('button',{name:`Editar Registro ${kind}`,exact:true}).click();
    await dialog.getByRole('button',{name:'Continuar',exact:true}).click();
    await dialog.getByLabel('Situação',{exact:false}).selectOption(completed);
    await dialog.getByRole('button',{name:'Salvar cadastro',exact:true}).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(`.ops-state-${completed}`)).toBeVisible();
    expect(records[kind]).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    await page.screenshot({path:`verification/canonical-${kind}-${width}.png`,fullPage:true});
  }
});
