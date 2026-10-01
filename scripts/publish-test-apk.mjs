import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const [filename, commit] = process.argv.slice(2);
if (!filename || !/^[a-f0-9]{40}$/i.test(commit || '')) throw new Error('Informe o APK e o commit verificado do aplicativo.');
const repo = 'thalissomvinicius/vna-comunidade-paf-dashboard';
const version = path.basename(filename).match(/^PAF-VNA-(\d+\.\d+\.\d+)-homologacao\.apk$/)?.[1];
if (!version) throw new Error('Use o nome PAF-VNA-X.Y.Z-homologacao.apk.');
const tag = `paf-vna-${version}-homologacao`;
const bytes = readFileSync(path.resolve(filename));
const sha256 = createHash('sha256').update(bytes).digest('hex');
let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    const credentials = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe','pipe','pipe'],
    });
    token = credentials.split('\n').find(line => line.startsWith('password='))?.slice(9).trim();
  } catch { throw new Error('Autenticacao GitHub indisponivel.'); }
}
if (!token) throw new Error('Autenticacao GitHub indisponivel.');
const headers = {Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'};
async function api(url, method = 'GET', body) {
  const response = await fetch(url, {method, headers:{...headers,...(body ? {'Content-Type':'application/json'} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
  if (response.status === 404 && method === 'GET') return null;
  if (!response.ok) throw new Error(`GitHub respondeu ${response.status}; publicacao nao confirmada.`);
  return response.json();
}
const base = `https://api.github.com/repos/${repo}`;
let release = await api(`${base}/releases/tags/${tag}`);
if (!release) release = await api(`${base}/releases`, 'POST', {
  tag_name:tag, target_commitish:commit, name:`PAF VNA ${version} - Homologacao`, draft:true, prerelease:true,
  body:`Versao para homologacao, nao distribuicao oficial.\n\nLogin redesenhado com identidade PAF VNA, campos acessiveis, navegacao pelo teclado e adaptacao a telas pequenas. Usa o banco PAF compartilhado com o dashboard e preserva os fluxos de autenticacao existentes.\n\nAssinatura Android de testes (debug). Pacote com.vilanova.vnacomunidade.piloto preservado para compatibilidade das versoes de teste. Nao desinstale o app original com dados pendentes. Testes fisicos de GPS, fotos, modo aviao e atualizacao ainda obrigatorios.\n\nCommit: ${commit}\nSHA-256: ${sha256}`,
});
const name = path.basename(filename);
let asset = release.assets.find(item => item.name === name);
if (asset && (asset.size !== bytes.length || asset.digest !== `sha256:${sha256}`)) throw new Error('Existe um APK diferente nessa release. Nada foi substituido.');
if (!asset) {
  const upload = release.upload_url.split('{')[0] + `?name=${encodeURIComponent(name)}`;
  if (new URL(upload).hostname !== 'uploads.github.com') throw new Error('Destino de upload inesperado.');
  const response = await fetch(upload, {method:'POST',headers:{...headers,'Content-Type':'application/vnd.android.package-archive'},body:bytes});
  if (!response.ok) throw new Error(`Upload respondeu ${response.status}; a release permanece rascunho.`);
  asset = await response.json();
}
if (release.draft) release = await api(`${base}/releases/${release.id}`, 'PATCH', {draft:false,prerelease:true});
release = await api(`${base}/releases/${release.id}`);
asset = release.assets.find(item => item.name === name);
console.log(JSON.stringify({release:release.html_url,apk:asset.browser_download_url,sha256,size:bytes.length}));
