import { readFile, mkdir, writeFile } from 'node:fs/promises';

const credential = await readFile(new URL('../data/credentials/production-admin.txt', import.meta.url), 'utf8');
const value = label => credential.split(/\r?\n/).find(line => line.startsWith(`${label}:`))?.split(':').slice(1).join(':').trim();
const origin = process.env.PAF_EXPORT_ORIGIN || 'https://vilanova-paf.vercel.app';
const response = await fetch(`${origin}/api/auth/admin-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: value('Login'), password: value('Senha temporaria') }) });
if (!response.ok) throw new Error(`Legacy authentication failed: ${response.status}`);
const cookie = response.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw new Error('Legacy session not returned');
const result = {};
try {
  for (const path of ['producers', 'admin/technicians', 'admin/accesses', 'admin/reports', 'admin/visits', 'admin/tasks', 'admin/documents', 'admin/fuel']) {
    const data = await fetch(`${origin}/api/${path}`, { headers: { cookie } });
    if (!data.ok) throw new Error(`Export ${path}: ${data.status}`);
    result[path] = await data.json();
    console.log(path, Object.fromEntries(Object.entries(result[path]).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length])));
  }
  const folder = new URL('../data/backups/', import.meta.url);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL(`legacy-export-${Date.now()}.json`, folder), JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log('Private backup saved. No passwords exported.');
} finally {
  await fetch(`${origin}/api/auth/logout`, { method: 'POST', headers: { cookie } });
}
