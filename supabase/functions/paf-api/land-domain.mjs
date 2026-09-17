import { PARA_MUNICIPALITIES, LAND_CONSENT_VERSION } from './land-reference.mjs';

export const LAND_STATUSES = {
  EM_ANALISE: 'Em análise',
  DADOS_INCONSISTENTES: 'Dados inconsistentes',
  AREA_REPROVADA: 'Área reprovada',
  POSSIVEL_FINANCIAMENTO: 'Área possível de financiamento'
};

export function digits(value) { return String(value ?? '').replace(/\D/g, ''); }
export function cleanSearch(value) {
  return /^[\d.\s-]+$/.test(value) ? digits(value) : value.replace(/[^\p{L}\p{N}\s-]/gu, '');
}

export function validCpf(value) {
  if (!/^[\d.\s-]+$/.test(String(value ?? ''))) return false;
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = [...cpf.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const check = (sum * 10 % 11) % 10;
    if (check !== Number(cpf[length])) return false;
  }
  return true;
}

function text(value, label, min, max) {
  if (typeof value !== 'string') throw new Error(`Informe ${label}.`);
  const result = value.trim().replace(/\s+/g, ' ');
  if (result.length < min || result.length > max) throw new Error(`${label}: use entre ${min} e ${max} caracteres.`);
  return result;
}

export function validateSubmission(body, today = new Date().toISOString().slice(0, 10)) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dados inválidos.');
  if (body.website) throw new Error('Não foi possível enviar o cadastro.');
  if (body.consent !== true) throw new Error('Confirme a ciência sobre o uso dos dados.');
  if (body.consentVersion !== LAND_CONSENT_VERSION) throw new Error('Atualize a página e leia a autorização de uso dos dados antes de enviar.');
  if (body.state !== 'PA' || !PARA_MUNICIPALITIES.includes(body.municipality)) throw new Error('Selecione um município do Pará.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.clientId || '')) throw new Error('Identificador de envio inválido. Reabra o formulário.');
  if (!validCpf(body.cpf)) throw new Error('Informe um CPF válido.');
  const birth = String(body.birthDate || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !Number.isFinite(Date.parse(birth)) || new Date(birth).toISOString().slice(0, 10) !== birth || birth < '1900-01-01' || birth > today) throw new Error('Informe uma data de nascimento válida.');
  const rawPhone = digits(body.phone);
  const phone = /^55\d{10,11}$/.test(rawPhone) ? rawPhone.slice(2) : rawPhone;
  if (!/^\d{10,11}$/.test(phone)) throw new Error('Informe um telefone de contato com DDD (10 ou 11 números).');
  if (typeof body.isFederalSettlement !== 'boolean') throw new Error('Informe se a área é assentamento federal (INCRA).');
  const motherName = body.isFederalSettlement ? text(body.motherName, 'nome completo da mãe', 5, 160) : null;
  const settlementName = body.isFederalSettlement ? text(body.settlementName, 'nome do assentamento', 2, 160) : null;
  return {
    client_id: body.clientId.toLowerCase(), full_name: text(body.fullName, 'nome completo', 5, 160),
    cpf: digits(body.cpf), birth_date: birth, municipality: text(body.municipality, 'município', 2, 100),
    community: text(body.community, 'comunidade', 2, 120), phone,
    is_federal_settlement: body.isFederalSettlement, mother_name: motherName, settlement_name: settlementName
  };
}

export function validateReview(body) {
  if (!body || !Object.hasOwn(LAND_STATUSES, body.status)) throw new Error('Selecione um resultado válido.');
  if (!Number.isInteger(body.version) || body.version < 1) throw new Error('Reabra a solicitação antes de salvar.');
  return { status: body.status, comment: text(body.comment, 'o motivo da análise', 10, 2000), version: body.version };
}

export function publicRequest(row, history = []) {
  return { protocol: row.protocol, status: row.status, comment: row.comment, created_at: row.created_at, updated_at: row.updated_at,
    history: history.map(item => ({ status: item.status, comment: item.comment, created_at: item.created_at })) };
}

export function newProtocol() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  // Rejection sampling avoids modulo bias and excludes ambiguous 0, 1, I and O.
  let code = '';
  while (code.length < 10) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < 248 && code.length < 10) code += alphabet[byte % alphabet.length];
    }
  }
  return `PAF-${code.slice(0, 5)}-${code.slice(5)}`;
}

export function normalizeProtocol(value) {
  let code = String(value ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (code.length === 13 || code.length === 27) code = code.replace(/^PAF/, '');
  if (/^[2-9A-HJ-NP-Z]{10}$/.test(code)) return `PAF-${code.slice(0, 5)}-${code.slice(5)}`;
  if (/^[0-9A-F]{24}$/.test(code)) return `PAF-${code.match(/.{6}/g).join('-')}`;
  return null;
}

export async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('');
}
