import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const edgeFunctionSource = await readFile(
  new URL("../supabase/functions/paf-api/index.ts", import.meta.url),
  "utf8"
);

test("mantém consulta diária de atividade do Supabase", () => {
  const heartbeat = vercelConfig.crons?.find((cron) => cron.path === "/api/health");

  assert.ok(heartbeat, "Agendamento diário do banco não foi configurado.");
  assert.equal(heartbeat.schedule, "17 9 * * *");
  assert.match(
    edgeFunctionSource,
    /path === "\/api\/health"[\s\S]*?db\.from\("paf_producers"\)\.select/,
    "A rota de saúde precisa executar uma consulta real ao banco."
  );
});

test('field integration CSP allows only the field API and its private signed images', () => {
  const header = vercelConfig.headers.find(rule => rule.source === '/(.*)').headers.find(header => header.key === 'Content-Security-Policy').value;
  const directives = Object.fromEntries(header.split(';').map(value => value.trim().split(/\s+/)).map(([name, ...values]) => [name, values]));
  const origin = 'https://eeivxgbbslnojbbpzweb.supabase.co';
  assert.ok(directives['connect-src'].includes(origin));
  assert.ok(directives['img-src'].includes(origin));
  assert.deepEqual(directives['script-src'], ["'self'"]);
  assert.ok(!directives['connect-src'].includes('*'));
  assert.ok(vercelConfig.rewrites.find(rule => rule.source === '/api/:path*').destination.startsWith(`${origin}/functions/v1/paf-api/`));
  assert.ok(!JSON.stringify(vercelConfig).includes('auisvfbloziehspzpnvg'));
});

test('development watcher excludes locked release artifacts and generated data', async () => {
  const source = await readFile(new URL('../server/index.mjs', import.meta.url), 'utf8');
  assert.match(source, /hmr:\s*\{\s*server\s*\}/);
  for (const path of ['**/releases/**', '**/*.apk', '**/data/**', '**/logs/**']) {
    assert.ok(source.includes(JSON.stringify(path)), `Watcher must ignore ${path}`);
  }
});
