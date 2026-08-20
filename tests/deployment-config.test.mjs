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
