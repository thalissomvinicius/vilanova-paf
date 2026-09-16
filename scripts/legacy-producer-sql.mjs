import { readFile, readdir } from 'node:fs/promises';
const folder = new URL('../data/backups/', import.meta.url);
const file = (await readdir(folder)).filter(name => /^legacy-export-\d+\.json$/.test(name)).sort().at(-1);
if (!file) throw new Error('Export backup missing');
const backup = JSON.parse(await readFile(new URL(file, folder), 'utf8'));
const start = Number(process.argv[2] || 0);
const rows = backup.producers.producers.slice(start, start + 60).map(row => ({
  id: row.id, token: row.token, name: row.name, cpf: row.cpf, cpf_digits: row.cpfDigits,
  phone: row.phone, address: row.address, property_name: row.propertyName, community: row.community,
  agency: row.agency, area_ha: row.areaHa, process_status: row.processStatus,
  planting_year: row.plantingYear, designer: row.designer, original_row: row.originalRow,
  created_at: row.createdAt, updated_at: row.updatedAt, last_report_at: row.lastReportAt
}));
const literal = JSON.stringify(rows).replaceAll("'", "''");
console.log(`insert into public.paf_producers select * from jsonb_populate_recordset(null::public.paf_producers, '${literal}'::jsonb) on conflict (id) do nothing;`);
