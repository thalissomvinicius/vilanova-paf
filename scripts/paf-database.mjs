import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const project = 'eeivxgbbslnojbbpzweb';
const directory = path.resolve('data/backups');
mkdirSync(directory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js');
function query(file) {
  const result = spawnSync(process.execPath, [npmCli, '--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', project, '--file', file, '--output', 'json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Database command failed');
  const begin = result.stdout.indexOf('{');
  return JSON.parse(result.stdout.slice(begin));
}
const action = process.argv[2];
if (action === 'backup') {
  const tables = ['paf_producers','paf_produtores','paf_propriedades','paf_comunidades','paf_produtor_tecnicos','paf_land_requests','paf_land_reviews','paf_technical_visits','paf_operational_tasks','paf_documents','paf_assistencias','paf_agenda','paf_tarefas','mobile_respostas','mobile_anexos','mobile_gps'];
  const file = path.join(directory, `backup-query-${stamp}.sql`);
  writeFileSync(file, `select jsonb_build_object(${tables.map(table => `'${table}',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.${table} t)`).join(',')}) as snapshot;`);
  const result = query(file);
  const snapshot = result.rows[0].snapshot;
  const destination = path.join(directory, `pre-unification-${stamp}.json`);
  writeFileSync(destination, JSON.stringify({ project, createdAt: new Date().toISOString(), snapshot }));
  console.log(JSON.stringify({ backup: destination, counts: Object.fromEntries(Object.entries(snapshot).map(([table, values]) => [table, values.length])) }));
} else if (action === 'verify-migration') {
  const migration = process.argv.slice(3).map(file => readFileSync(file, 'utf8')).join('\n');
  const checks = readFileSync('tests/database/unified_operations_smoke.sql', 'utf8');
  const file = path.join(directory, `migration-rehearsal-${stamp}.sql`);
  writeFileSync(file, `BEGIN;\n${migration}\n${checks}\nROLLBACK;`);
  const result = query(file);
  console.log(JSON.stringify({ verified: true, persisted: false, rows: result.rows }));
} else if (action === 'apply-migration') {
  const migrationFile = path.resolve(process.argv[3]);
  const migration = readFileSync(migrationFile, 'utf8');
  const version = path.basename(migrationFile).split('_')[0];
  if (!/^\d{14}$/.test(version)) throw new Error('Invalid migration filename');
  const file = path.join(directory, `migration-apply-${stamp}.sql`);
  const escaped = migration.replaceAll("'", "''");
  writeFileSync(file, `BEGIN;\n${migration}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${path.basename(migrationFile, '.sql').slice(15)}',array['${escaped}']);\nCOMMIT;`);
  query(file);
  console.log(JSON.stringify({ applied: version, project }));
} else throw new Error('Use backup, verify-migration <file> or apply-migration <file>.');
