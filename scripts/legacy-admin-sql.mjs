import { readFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
const credential = await readFile(new URL('../data/credentials/production-admin.txt', import.meta.url), 'utf8');
const value = label => credential.split(/\r?\n/).find(line => line.startsWith(`${label}:`))?.split(':').slice(1).join(':').trim();
const password = value('Senha temporaria'), login = value('Login');
if (!password || !/^[a-z0-9._-]{3,60}$/i.test(login)) throw new Error('Credential format mismatch');
const salt = randomBytes(16).toString('hex');
const hash = `pbkdf2$210000$${salt}$${pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex')}`;
console.log(`insert into public.paf_access_accounts(name,login,access_code_hash,account_type,active) values ('Administrador PAF','${login.toUpperCase()}','${hash}','ADMIN',true) on conflict(login) do nothing;`);
