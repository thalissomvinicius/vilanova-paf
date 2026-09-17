import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cleanSearch } from '../supabase/functions/paf-api/land-domain.mjs';

const decode = row => row ? { ...row, is_federal_settlement: row.is_federal_settlement == null ? null : Boolean(row.is_federal_settlement) } : row;

// Local development follows the same route contract as the production API.
export class LocalLandStore {
  constructor(filename = process.env.PAF_LAND_DB_PATH || path.resolve('data', 'land-requests.sqlite')) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS land_requests (
        id TEXT PRIMARY KEY, client_id TEXT UNIQUE NOT NULL, protocol TEXT UNIQUE NOT NULL,
        fingerprint TEXT NOT NULL, full_name TEXT NOT NULL, cpf TEXT NOT NULL, birth_date TEXT NOT NULL,
        municipality TEXT NOT NULL, community TEXT NOT NULL, phone TEXT NOT NULL,
        consent_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'EM_ANALISE',
        comment TEXT NOT NULL DEFAULT 'Cadastro recebido. Aguarde a análise da equipe PAF.',
        version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS land_reviews (
        id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES land_requests(id), status TEXT NOT NULL,
        comment TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS land_rates (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);`);
    const columns = this.db.prepare('PRAGMA table_info(land_requests)').all().map(column => column.name);
    if (!columns.includes('is_federal_settlement')) this.db.exec('ALTER TABLE land_requests ADD COLUMN is_federal_settlement INTEGER');
    if (!columns.includes('mother_name')) this.db.exec('ALTER TABLE land_requests ADD COLUMN mother_name TEXT');
    if (!columns.includes('settlement_name')) this.db.exec('ALTER TABLE land_requests ADD COLUMN settlement_name TEXT');
  }
  rate(key, limit, seconds) {
    const now = Date.now(); this.db.prepare('DELETE FROM land_rates WHERE expires < ?').run(now);
    const row = this.db.prepare('INSERT INTO land_rates VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 RETURNING hits').get(key, now + seconds * 1000);
    return row.hits <= limit;
  }
  submit(values) {
    const existing = this.db.prepare('SELECT * FROM land_requests WHERE client_id = ?').get(values.client_id);
    if (existing) return decode(existing);
    if (this.db.prepare('SELECT 1 FROM land_requests WHERE protocol = ?').get(values.protocol)) return null;
    const now = new Date().toISOString(), id = randomUUID();
    const row = { id, ...values, created_at: now, updated_at: now };
    const fields = Object.keys(row);
    this.db.prepare(`INSERT INTO land_requests (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`).run(...Object.values(row).map(value => typeof value === 'boolean' ? Number(value) : value));
    return this.get(id);
  }
  lookup(protocol, cpf) { return decode(this.db.prepare('SELECT * FROM land_requests WHERE protocol = ? AND cpf = ?').get(protocol, cpf)); }
  get(id) { return decode(this.db.prepare('SELECT * FROM land_requests WHERE id = ?').get(id)); }
  history(id) { return this.db.prepare('SELECT * FROM land_reviews WHERE request_id = ? ORDER BY created_at DESC, id').all(id); }
  list({ status, search, page }) {
    const clean = cleanSearch(search);
    const where = `WHERE (? = '' OR status = ?) AND (? = '' OR full_name LIKE ? OR cpf LIKE ? OR protocol LIKE ? OR municipality LIKE ? OR community LIKE ?)`;
    const args = [status, status, clean, ...Array(5).fill(`%${clean}%`)];
    return { requests: this.db.prepare(`SELECT * FROM land_requests ${where} ORDER BY created_at DESC, id LIMIT 25 OFFSET ?`).all(...args, (page - 1) * 25).map(decode), total: this.db.prepare(`SELECT count(*) total FROM land_requests ${where}`).get(...args).total, page, pageSize: 25 };
  }
  review(id, review, actor) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const now = new Date().toISOString();
      const updated = this.db.prepare('UPDATE land_requests SET status = ?, comment = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').run(review.status, review.comment, now, id, review.version);
      if (!updated.changes) { this.db.exec('ROLLBACK'); return null; }
      this.db.prepare('INSERT INTO land_reviews VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), id, review.status, review.comment, actor, now);
      const result = this.get(id); this.db.exec('COMMIT'); return result;
    } catch (err) { this.db.exec('ROLLBACK'); throw err; }
  }
}
