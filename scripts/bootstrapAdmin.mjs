import { pbkdf2Sync, randomBytes } from "node:crypto";

const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const name = String(process.env.PAF_BOOTSTRAP_ADMIN_NAME || "Administrador PAF").trim();
const login = normalizeLogin(process.env.PAF_BOOTSTRAP_ADMIN_LOGIN || "ADMIN");
const password = String(process.env.PAF_BOOTSTRAP_ADMIN_PASSWORD || "");

if (!url || !serviceRoleKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY somente no ambiente local desta operação.");
}
if (!login) throw new Error("Informe PAF_BOOTSTRAP_ADMIN_LOGIN.");
if (!isStrongPassword(password)) {
  throw new Error("PAF_BOOTSTRAP_ADMIN_PASSWORD deve ter 12 ou mais caracteres, com maiúsculas, minúsculas e números.");
}

const response = await fetch(`${url}/rest/v1/paf_access_accounts?on_conflict=login`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "resolution=merge-duplicates,return=minimal"
  },
  body: JSON.stringify({
    name,
    login,
    access_code_hash: hashSecret(password),
    code_hint: password.slice(-4),
    account_type: "ADMIN",
    active: true,
    can_submit_reports: false,
    can_manage_visits: false
  })
});

if (!response.ok) {
  const message = await response.text();
  throw new Error(`Não foi possível criar o administrador (${response.status}): ${message}`);
}

console.log(`Administrador ${login} criado ou atualizado com sucesso.`);

function normalizeLogin(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "")
    .slice(0, 60);
}

function isStrongPassword(value) {
  return value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

function hashSecret(secret) {
  const iterations = 210000;
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(secret, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}
