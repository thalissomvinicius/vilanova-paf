import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = {
  dashboard: {url:'https://vilanova-paf.vercel.app',dir:path.join(root,'dist')},
  app: {url:'https://vna-comunidade-paf-dashboard.vercel.app',dir:path.resolve(root,'../paf-app/dist')},
};
const name = process.argv[2];
const site = sites[name];
if (!site) throw new Error('Escolha dashboard ou app.');
const page = await fetch(site.url, {cache:'no-store'});
if (!page.ok) throw new Error(`Pagina indisponivel: ${page.status}`);
const html = await page.text();
const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(match=>match[1]);
const localHtml = readFileSync(path.join(site.dir,'index.html'),'utf8');
const localScripts = [...localHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(match=>match[1]);
const assets=[];
for (const script of scripts) {
  const url = new URL(script,site.url);
  if (url.origin !== site.url) continue;
  const response = await fetch(url, {cache:'no-store'});
  if (!response.ok) throw new Error(`Bundle indisponivel: ${response.status}`);
  const remote = Buffer.from(await response.arrayBuffer());
  const localMatch = localScripts.includes(script);
  const local = localMatch ? readFileSync(path.join(site.dir,url.pathname.slice(1))) : null;
  assets.push({path:url.pathname,status:response.status,bytes:remote.length,localMatch,hashMatch:local ? createHash('sha256').update(local).digest('hex')===createHash('sha256').update(remote).digest('hex') : false});
}
if (!assets.length) throw new Error('Nenhum bundle verificavel encontrado.');
console.log(JSON.stringify({site:site.url,status:page.status,assets}));
if (assets.some(asset=>!asset.hashMatch)) process.exitCode=2;
