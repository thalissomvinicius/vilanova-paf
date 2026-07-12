import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCESS_ACCOUNT_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  PROCESS_STATUSES,
  REPORT_REVIEW_STATUSES,
  TASK_STATUSES,
  TASK_TYPES,
  VISIT_PRIORITIES,
  VISIT_STATUSES,
  buildDocumentSummary,
  buildFuelSummary,
  buildProducerSummary,
  buildReportSummary,
  buildTaskSummary,
  buildVisitSummary,
  hashSecret,
  makeAccessCode,
  mapAccessAccount,
  mapDocument,
  mapFuelDriver,
  mapFuelRecord,
  mapFuelVehicle,
  mapProducer,
  mapReport,
  mapTask,
  mapTechnician,
  mapVisit,
  normalizeDate,
  normalizeDigits,
  normalizeLogin,
  normalizePlate,
  normalizeText,
  normalizeUpper,
  randomHex,
  sha256Hex,
  toIdList,
  toIntegerOrNull,
  toNumberOrNull
} from "./core.ts";

type Filters = Record<string, string | null | undefined>;
type Row = Record<string, any>;

export class PafRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getOptions() {
    const [producers, technicians] = await Promise.all([this.listProducerRows(), this.listTechnicians()]);
    return {
      statuses: PROCESS_STATUSES,
      reportReviewStatuses: REPORT_REVIEW_STATUSES,
      visitStatuses: VISIT_STATUSES,
      visitPriorities: VISIT_PRIORITIES,
      taskStatuses: TASK_STATUSES,
      taskTypes: TASK_TYPES,
      documentStatuses: DOCUMENT_STATUSES,
      documentCategories: DOCUMENT_CATEGORIES,
      accessAccountTypes: ACCESS_ACCOUNT_TYPES,
      agencies: distinct(producers.map((row) => row.agency)),
      designers: distinct(producers.map((row) => row.designer)),
      years: [...new Set(producers.map((row) => row.planting_year).filter(Boolean))].sort((left, right) => Number(right) - Number(left)),
      technicians: technicians.filter((technician) => technician.active).map((technician) => technician.name)
    };
  }

  async listProducers(filters: Filters = {}) {
    const rows = await this.listProducerRows();
    const reports = await this.listReportRows();
    const latestByProducer = new Map<number, Row>();
    for (const report of reports) {
      if (!latestByProducer.has(report.producer_id)) latestByProducer.set(report.producer_id, report);
    }

    let producers = rows.map((row) => mapProducer(row, latestByProducer.get(row.id) || null));
    const search = normalizedSearch(filters.search);
    const searchDigits = normalizeDigits(filters.search);
    if (search) {
      producers = producers.filter((producer) => [producer.name, producer.cpf, producer.phone, producer.address]
        .some((value) => normalizedSearch(value).includes(search)) || (searchDigits && producer.cpfDigits.includes(searchDigits)));
    }
    if (filters.status) producers = producers.filter((producer) => producer.processStatus === normalizeUpper(filters.status));
    if (filters.agency) producers = producers.filter((producer) => producer.agency === normalizeText(filters.agency));
    if (filters.designer) producers = producers.filter((producer) => producer.designer === normalizeText(filters.designer));
    if (filters.year) producers = producers.filter((producer) => producer.plantingYear === toIntegerOrNull(filters.year));
    if (filters.reported === "yes") producers = producers.filter((producer) => Boolean(producer.lastReportAt));
    if (filters.reported === "no") producers = producers.filter((producer) => !producer.lastReportAt);
    if (filters.reviewStatus) {
      producers = producers.filter((producer) => latestByProducer.get(producer.id)?.review_status === normalizeUpper(filters.reviewStatus));
    }
    return { producers, summary: buildProducerSummary(producers) };
  }

  async getProducerById(id: number) {
    const { data, error } = await this.db.from("paf_producers").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Não foi possível consultar o produtor.");
    if (!data) return null;
    const { data: report, error: reportError } = await this.db
      .from("paf_reports")
      .select("*")
      .eq("producer_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    assertNoError(reportError, "Não foi possível consultar o relatório do produtor.");
    return mapProducer(data, report || null);
  }

  async getProducerByToken(token: string) {
    const { data, error } = await this.db.from("paf_producers").select("id").eq("token", normalizeText(token)).maybeSingle();
    assertNoError(error, "Não foi possível consultar o produtor.");
    return data ? this.getProducerById(data.id) : null;
  }

  async createProducer(payload: Row) {
    const name = normalizeText(payload.name).slice(0, 180);
    const cpf = normalizeText(payload.cpf).slice(0, 32);
    if (!name) throw new Error("Informe o nome do produtor.");
    if (!normalizeDigits(cpf)) throw new Error("Informe o CPF do produtor.");
    const insert = {
      token: randomHex(18),
      name,
      cpf,
      cpf_digits: normalizeDigits(cpf),
      phone: nullableText(payload.phone, 40),
      address: nullableText(payload.address, 260),
      agency: nullableText(payload.agency, 140),
      area_ha: toNumberOrNull(payload.areaHa) || 0,
      process_status: normalizeEnum(payload.processStatus, PROCESS_STATUSES, "INTERNALIZAR"),
      planting_year: toIntegerOrNull(payload.plantingYear),
      designer: nullableText(payload.designer, 180),
      original_row: toIntegerOrNull(payload.originalRow)
    };
    const { data, error } = await this.db.from("paf_producers").insert(insert).select("*").single();
    assertNoError(error, duplicateMessage(error, "Esse produtor já está cadastrado."));
    return mapProducer(data, null);
  }

  async updateProducer(id: number, payload: Row) {
    const current = await this.getProducerById(id);
    if (!current) return null;
    const cpf = payload.cpf === undefined ? current.cpf : normalizeText(payload.cpf).slice(0, 32) || current.cpf;
    const update = {
      name: payload.name === undefined ? current.name : normalizeText(payload.name).slice(0, 180) || current.name,
      cpf,
      cpf_digits: normalizeDigits(cpf),
      phone: payload.phone === undefined ? current.phone : nullableText(payload.phone, 40),
      address: payload.address === undefined ? current.address : nullableText(payload.address, 260),
      agency: payload.agency === undefined ? current.agency : nullableText(payload.agency, 140),
      area_ha: payload.areaHa === undefined ? current.areaHa : toNumberOrNull(payload.areaHa) || 0,
      process_status: payload.processStatus === undefined ? current.processStatus : normalizeEnum(payload.processStatus, PROCESS_STATUSES, current.processStatus),
      planting_year: payload.plantingYear === undefined ? current.plantingYear : toIntegerOrNull(payload.plantingYear),
      designer: payload.designer === undefined ? current.designer : nullableText(payload.designer, 180)
    };
    const { error } = await this.db.from("paf_producers").update(update).eq("id", id);
    assertNoError(error, "Não foi possível atualizar o produtor.");
    return this.getProducerById(id);
  }

  async listTechnicians(filters: Filters = {}) {
    const { data, error } = await this.db.from("paf_technicians").select("*").order("active", { ascending: false }).order("name");
    assertNoError(error, "Não foi possível carregar os técnicos.");
    let technicians = (data || []).map(mapTechnician);
    const search = normalizedSearch(filters.search);
    if (search) technicians = technicians.filter((item) => [item.name, item.phone, item.email, item.role, item.region].some((value) => normalizedSearch(value).includes(search)));
    if (filters.status === "active") technicians = technicians.filter((item) => item.active);
    if (filters.status === "inactive") technicians = technicians.filter((item) => !item.active);
    return technicians;
  }

  async createTechnician(payload: Row) {
    const name = normalizeText(payload.name).slice(0, 180);
    if (!name) throw new Error("Informe o nome do técnico.");
    const { data, error } = await this.db.from("paf_technicians").insert({
      name,
      phone: nullableText(payload.phone, 40),
      email: nullableText(payload.email, 180)?.toLowerCase() || null,
      role: nullableText(payload.role, 100),
      region: nullableText(payload.region, 140),
      active: payload.active !== false,
      notes: nullableText(payload.notes, 1000)
    }).select("*").single();
    assertNoError(error, "Não foi possível cadastrar o técnico.");
    return mapTechnician(data);
  }

  async updateTechnician(id: number, payload: Row) {
    const { data: current, error: currentError } = await this.db.from("paf_technicians").select("*").eq("id", id).maybeSingle();
    assertNoError(currentError, "Não foi possível consultar o técnico.");
    if (!current) return null;
    const { data, error } = await this.db.from("paf_technicians").update({
      name: payload.name === undefined ? current.name : normalizeText(payload.name).slice(0, 180) || current.name,
      phone: payload.phone === undefined ? current.phone : nullableText(payload.phone, 40),
      email: payload.email === undefined ? current.email : nullableText(payload.email, 180)?.toLowerCase() || null,
      role: payload.role === undefined ? current.role : nullableText(payload.role, 100),
      region: payload.region === undefined ? current.region : nullableText(payload.region, 140),
      active: payload.active === undefined ? current.active : Boolean(payload.active),
      notes: payload.notes === undefined ? current.notes : nullableText(payload.notes, 1000)
    }).eq("id", id).select("*").single();
    assertNoError(error, "Não foi possível atualizar o técnico.");
    return mapTechnician(data);
  }

  async getAccessAccountById(id: number, includeAdmin = true) {
    const { data, error } = await this.db.from("paf_access_accounts").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Não foi possível consultar o acesso.");
    if (!data || (!includeAdmin && data.account_type === "ADMIN")) return null;
    return this.hydrateAccessAccount(data);
  }

  async getAccessAccountByLogin(login: string) {
    const { data, error } = await this.db.from("paf_access_accounts").select("*").eq("login", normalizeLogin(login)).maybeSingle();
    assertNoError(error, "Não foi possível consultar o acesso.");
    return data || null;
  }

  async listAccessAccounts(filters: Filters = {}) {
    const { data, error } = await this.db.from("paf_access_accounts").select("*").neq("account_type", "ADMIN").order("active", { ascending: false }).order("name");
    assertNoError(error, "Não foi possível carregar os acessos.");
    const hydrated = await Promise.all((data || []).map((row) => this.hydrateAccessAccount(row)));
    const search = normalizedSearch(filters.search);
    return hydrated.filter((account) => {
      if (filters.type && account.accountType !== normalizeUpper(filters.type)) return false;
      if (filters.status === "active" && !account.active) return false;
      if (filters.status === "blocked" && account.active) return false;
      if (search && ![account.name, account.login, account.organization, account.technicianName, ...account.producers.map((producer: Row) => producer.name)]
        .some((value) => normalizedSearch(value).includes(search))) return false;
      return true;
    });
  }

  async createAccessAccount(payload: Row) {
    const name = normalizeText(payload.name).slice(0, 180);
    const login = normalizeLogin(payload.login);
    const accountType = normalizeEnum(payload.accountType, ACCESS_ACCOUNT_TYPES, "PRODUTOR");
    const producerIds = toIdList(payload.producerIds);
    const accessCode = normalizeText(payload.accessCode) || makeAccessCode();
    if (!name) throw new Error("Informe o nome do acesso.");
    if (login.length < 3) throw new Error("Informe um login válido.");
    if (accessCode.length < 8) throw new Error("O código de acesso deve ter pelo menos 8 caracteres.");
    if (accountType === "PRODUTOR" && producerIds.length !== 1) throw new Error("O acesso de produtor deve estar vinculado a um produtor.");
    const { data, error } = await this.db.from("paf_access_accounts").insert({
      name,
      login,
      access_code_hash: await hashSecret(accessCode),
      code_hint: accessCode.slice(-4),
      account_type: accountType,
      technician_id: toIntegerOrNull(payload.technicianId),
      organization: nullableText(payload.organization, 180),
      active: payload.active !== false,
      can_submit_reports: payload.canSubmitReports === undefined ? accountType === "PRODUTOR" : Boolean(payload.canSubmitReports),
      can_manage_visits: payload.canManageVisits === undefined ? accountType !== "PRODUTOR" : Boolean(payload.canManageVisits),
      notes: nullableText(payload.notes, 1000)
    }).select("*").single();
    assertNoError(error, duplicateMessage(error, "Esse login já está cadastrado."));
    try {
      await this.replaceAccessScope(data.id, producerIds);
    } catch (scopeError) {
      await this.db.from("paf_access_accounts").delete().eq("id", data.id);
      throw scopeError;
    }
    return { account: await this.hydrateAccessAccount(data), temporaryCode: accessCode };
  }

  async updateAccessAccount(id: number, payload: Row) {
    const { data: current, error: currentError } = await this.db.from("paf_access_accounts").select("*").eq("id", id).neq("account_type", "ADMIN").maybeSingle();
    assertNoError(currentError, "Não foi possível consultar o acesso.");
    if (!current) return null;
    const currentHydrated = await this.hydrateAccessAccount(current);
    const accountType = payload.accountType === undefined ? current.account_type : normalizeEnum(payload.accountType, ACCESS_ACCOUNT_TYPES, current.account_type);
    const producerIds = payload.producerIds === undefined ? currentHydrated.producerIds : toIdList(payload.producerIds);
    if (accountType === "PRODUTOR" && producerIds.length !== 1) throw new Error("O acesso de produtor deve estar vinculado a um produtor.");
    const accessCode = normalizeText(payload.accessCode);
    const update: Row = {
      name: payload.name === undefined ? current.name : normalizeText(payload.name).slice(0, 180) || current.name,
      login: payload.login === undefined ? current.login : normalizeLogin(payload.login),
      account_type: accountType,
      technician_id: payload.technicianId === undefined ? current.technician_id : toIntegerOrNull(payload.technicianId),
      organization: payload.organization === undefined ? current.organization : nullableText(payload.organization, 180),
      active: payload.active === undefined ? current.active : Boolean(payload.active),
      can_submit_reports: payload.canSubmitReports === undefined ? current.can_submit_reports : Boolean(payload.canSubmitReports),
      can_manage_visits: payload.canManageVisits === undefined ? current.can_manage_visits : Boolean(payload.canManageVisits),
      notes: payload.notes === undefined ? current.notes : nullableText(payload.notes, 1000)
    };
    if (!update.login || update.login.length < 3) throw new Error("Informe um login válido.");
    if (accessCode) {
      if (accessCode.length < 8) throw new Error("O código de acesso deve ter pelo menos 8 caracteres.");
      update.access_code_hash = await hashSecret(accessCode);
      update.code_hint = accessCode.slice(-4);
    }
    const { data, error } = await this.db.rpc("paf_update_access_account", {
      p_access_account_id: id,
      p_name: update.name,
      p_login: update.login,
      p_access_code_hash: update.access_code_hash || current.access_code_hash,
      p_code_hint: update.code_hint === undefined ? current.code_hint : update.code_hint,
      p_account_type: update.account_type,
      p_technician_id: update.technician_id,
      p_organization: update.organization,
      p_active: update.active,
      p_can_submit_reports: update.can_submit_reports,
      p_can_manage_visits: update.can_manage_visits,
      p_notes: update.notes,
      p_producer_ids: producerIds,
      p_revoke_sessions: !update.active || Boolean(accessCode)
    }).maybeSingle();
    assertNoError(error, duplicateMessage(error, "Esse login já está cadastrado."));
    return data ? this.hydrateAccessAccount(data) : null;
  }

  async resetAccessCode(id: number) {
    const current = await this.getAccessAccountById(id, false);
    if (!current) return null;
    const accessCode = makeAccessCode();
    const { data, error } = await this.db.rpc("paf_change_access_secret", {
      p_access_account_id: id,
      p_access_code_hash: await hashSecret(accessCode),
      p_code_hint: accessCode.slice(-4)
    }).maybeSingle();
    assertNoError(error, "Não foi possível redefinir o código.");
    if (!data) return null;
    return { account: await this.hydrateAccessAccount(data), temporaryCode: accessCode };
  }

  async deleteAccessAccount(id: number) {
    const account = await this.getAccessAccountById(id, false);
    if (!account) return null;
    const { error } = await this.db.from("paf_access_accounts").delete().eq("id", id).neq("account_type", "ADMIN");
    assertNoError(error, "Não foi possível excluir o acesso.");
    return account;
  }

  async getScopedProducers(accessAccountId: number) {
    const { data: scopes, error } = await this.db.from("paf_access_account_producers").select("producer_id").eq("access_account_id", accessAccountId);
    assertNoError(error, "Não foi possível consultar o escopo do acesso.");
    const ids = (scopes || []).map((scope) => scope.producer_id);
    if (!ids.length) return [];
    const { data, error: producerError } = await this.db.from("paf_producers").select("*").in("id", ids).order("name");
    assertNoError(producerError, "Não foi possível carregar os produtores vinculados.");
    return (data || []).map((row) => mapProducer(row, null));
  }

  async accessCanUseProducer(accessAccountId: number, producerId: number) {
    const { data, error } = await this.db.from("paf_access_account_producers")
      .select("producer_id")
      .eq("access_account_id", accessAccountId)
      .eq("producer_id", producerId)
      .maybeSingle();
    assertNoError(error, "Não foi possível validar o escopo do acesso.");
    return Boolean(data);
  }

  async createSession(accountId: number, role: "admin" | "access", ttlHours = 12) {
    const token = randomHex(32);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    const { error } = await this.db.from("paf_auth_sessions").insert({
      token_hash: await sha256Hex(token),
      role,
      access_account_id: accountId,
      expires_at: expiresAt
    });
    assertNoError(error, "Não foi possível iniciar a sessão.");
    return { token, expiresAt };
  }

  async cleanupAuthenticationState() {
    const now = new Date().toISOString();
    const [sessions, attempts] = await Promise.all([
      this.db.from("paf_auth_sessions").delete().lte("expires_at", now),
      this.db.from("paf_login_attempts").delete().lte("reset_at", now)
    ]);
    if (sessions.error) console.error("Não foi possível limpar sessões expiradas.", sessions.error.message);
    if (attempts.error) console.error("Não foi possível limpar tentativas expiradas.", attempts.error.message);
  }

  async getSession(token: string) {
    if (!token) return null;
    const tokenHash = await sha256Hex(token);
    const { data, error } = await this.db.from("paf_auth_sessions").select("*").eq("token_hash", tokenHash).maybeSingle();
    assertNoError(error, "Não foi possível validar a sessão.");
    if (!data) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) {
      await this.db.from("paf_auth_sessions").delete().eq("id", data.id);
      return null;
    }
    const { data: account, error: accountError } = await this.db.from("paf_access_accounts").select("*").eq("id", data.access_account_id).maybeSingle();
    assertNoError(accountError, "Não foi possível validar a conta.");
    if (!account?.active) {
      await this.db.from("paf_auth_sessions").delete().eq("id", data.id);
      return null;
    }
    return { id: data.id, role: data.role, expiresAt: data.expires_at, account };
  }

  async deleteSession(token: string) {
    if (!token) return;
    await this.db.from("paf_auth_sessions").delete().eq("token_hash", await sha256Hex(token));
  }

  async revokeSessionsForAccess(id: number) {
    const { error } = await this.db.from("paf_auth_sessions").delete().eq("access_account_id", id);
    assertNoError(error, "Não foi possível encerrar as sessões anteriores.");
  }

  async changeAccessSecret(id: number, accessCodeHash: string, codeHint: string) {
    const { data, error } = await this.db.rpc("paf_change_access_secret", {
      p_access_account_id: id,
      p_access_code_hash: accessCodeHash,
      p_code_hint: codeHint
    }).maybeSingle();
    assertNoError(error, "Não foi possível alterar a senha.");
    if (!data) throw new Error("Acesso não encontrado.");
  }

  async recordSuccessfulLogin(id: number) {
    await this.db.from("paf_access_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", id);
  }

  async getLoginAttempt(attemptKey: string) {
    const { data, error } = await this.db.from("paf_login_attempts").select("*").eq("attempt_key", attemptKey).maybeSingle();
    assertNoError(error, "Não foi possível validar as tentativas de acesso.");
    return data || null;
  }

  async recordLoginFailure(attemptKey: string) {
    const current = await this.getLoginAttempt(attemptKey);
    const activeWindow = current && new Date(current.reset_at).getTime() > Date.now();
    const attempts = activeWindow ? Number(current.attempts || 0) + 1 : 1;
    const resetAt = activeWindow ? current.reset_at : new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await this.db.from("paf_login_attempts").upsert({ attempt_key: attemptKey, attempts, reset_at: resetAt });
    assertNoError(error, "Não foi possível registrar a tentativa de acesso.");
  }

  async clearLoginFailures(attemptKey: string) {
    await this.db.from("paf_login_attempts").delete().eq("attempt_key", attemptKey);
  }

  async audit(actor: Row | null, action: string, entityType: string, entityId: unknown, ipAddress: string, details: Row = {}) {
    await this.db.from("paf_audit_logs").insert({
      actor_access_id: actor?.id || null,
      actor_name: actor?.name || null,
      actor_role: actor?.account_type || null,
      action,
      entity_type: entityType,
      entity_id: entityId === null || entityId === undefined ? null : String(entityId),
      ip_address: ipAddress,
      details
    });
  }

  async listReports(filters: Filters = {}, producerIds?: number[]) {
    const { data, error } = await this.db
      .from("paf_reports")
      .select("*, producer:paf_producers(name,cpf,agency,designer)")
      .order("created_at", { ascending: false })
      .range(0, 9999);
    assertNoError(error, "Não foi possível carregar os relatórios.");
    let reports = (data || []).map(mapReport);
    if (producerIds) {
      const allowed = new Set(producerIds);
      reports = reports.filter((report) => allowed.has(report.producerId));
    }
    const search = normalizedSearch(filters.search);
    const digits = normalizeDigits(filters.search);
    if (search) reports = reports.filter((report) => [report.producerName, report.producerCpf, report.notes, report.areaStatus]
      .some((value) => normalizedSearch(value).includes(search)) || (digits && normalizeDigits(report.producerCpf).includes(digits)));
    if (filters.needsVisit === "yes") reports = reports.filter((report) => report.needsVisit);
    if (filters.status) reports = reports.filter((report) => report.processStatus === normalizeUpper(filters.status));
    if (filters.agency) reports = reports.filter((report) => report.producerAgency === normalizeText(filters.agency));
    if (filters.reviewStatus) reports = reports.filter((report) => report.reviewStatus === normalizeUpper(filters.reviewStatus));
    return { reports, summary: buildReportSummary(reports) };
  }

  async getReportsForProducer(producerId: number) {
    const result = await this.listReports({}, [producerId]);
    return result.reports;
  }

  async getReportById(id: number) {
    const { data, error } = await this.db
      .from("paf_reports")
      .select("*, producer:paf_producers(name,cpf,agency,designer)")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Não foi possível consultar o relatório.");
    return data ? mapReport(data) : null;
  }

  async createReport(producerId: number, payload: Row, submittedByAccessId: number | null) {
    const producer = await this.getProducerById(producerId);
    if (!producer) return null;
    const processStatus = normalizeEnum(payload.processStatus || producer.processStatus, PROCESS_STATUSES, producer.processStatus);
    const reportDate = normalizeDate(payload.reportDate) || new Date().toISOString().slice(0, 10);
    const insert = {
      producer_id: producerId,
      report_date: reportDate,
      contact_phone: nullableText(payload.contactPhone || payload.phone, 40),
      process_status: processStatus,
      area_status: nullableText(payload.areaStatus, 180),
      address: nullableText(payload.address, 300) || producer.address,
      area_ha: toNumberOrNull(payload.areaHa) ?? producer.areaHa,
      planting_year: toIntegerOrNull(payload.plantingYear) ?? producer.plantingYear,
      crop: nullableText(payload.crop, 120),
      planting_date: normalizeDate(payload.plantingDate),
      production_note: nullableText(payload.productionNote, 3000),
      needs_visit: Boolean(payload.needsVisit),
      notes: nullableText(payload.notes, 3000),
      submitted_by_access_id: submittedByAccessId
    };
    const { data, error } = await this.db.from("paf_reports").insert(insert).select("id,created_at").single();
    assertNoError(error, "Não foi possível enviar o relatório.");
    const { error: producerError } = await this.db.from("paf_producers").update({
      phone: insert.contact_phone || producer.phone,
      address: insert.address,
      area_ha: insert.area_ha,
      process_status: processStatus,
      planting_year: insert.planting_year,
      last_report_at: data.created_at
    }).eq("id", producerId);
    assertNoError(producerError, "O relatório foi salvo, mas o cadastro do produtor não pôde ser atualizado.");
    return this.getProducerById(producerId);
  }

  async updateReportReview(id: number, payload: Row, reviewer: string) {
    const current = await this.getReportById(id);
    if (!current) return null;
    const { error } = await this.db.from("paf_reports").update({
      review_status: normalizeEnum(payload.reviewStatus, REPORT_REVIEW_STATUSES, current.reviewStatus),
      technical_note: payload.technicalNote === undefined ? current.technicalNote : nullableText(payload.technicalNote, 4000),
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer
    }).eq("id", id);
    assertNoError(error, "Não foi possível salvar a análise técnica.");
    return this.getReportById(id);
  }

  async listVisits(filters: Filters = {}, producerIds?: number[]) {
    const { data, error } = await this.db
      .from("paf_technical_visits")
      .select("*, producer:paf_producers(name,cpf,agency,address,area_ha), report:paf_reports(area_status,created_at)")
      .order("scheduled_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(0, 9999);
    assertNoError(error, "Não foi possível carregar as visitas.");
    let visits = (data || []).map(mapVisit);
    if (producerIds) {
      const allowed = new Set(producerIds);
      visits = visits.filter((visit) => allowed.has(visit.producerId));
    }
    const search = normalizedSearch(filters.search);
    if (search) visits = visits.filter((visit) => [visit.producerName, visit.producerCpf, visit.objective, visit.resultNote, visit.technician]
      .some((value) => normalizedSearch(value).includes(search)));
    if (filters.status) visits = visits.filter((visit) => visit.status === normalizeUpper(filters.status));
    if (filters.priority) visits = visits.filter((visit) => visit.priority === normalizeUpper(filters.priority));
    if (filters.agency) visits = visits.filter((visit) => visit.producerAgency === normalizeText(filters.agency));
    if (filters.technician) visits = visits.filter((visit) => normalizedSearch(visit.technician).includes(normalizedSearch(filters.technician)));
    return { visits, summary: buildVisitSummary(visits) };
  }

  async getVisitsForProducer(producerId: number) {
    const result = await this.listVisits({}, [producerId]);
    return result.visits;
  }

  async getVisitById(id: number) {
    const { data, error } = await this.db
      .from("paf_technical_visits")
      .select("*, producer:paf_producers(name,cpf,agency,address,area_ha), report:paf_reports(area_status,created_at)")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Não foi possível consultar a visita.");
    return data ? mapVisit(data) : null;
  }

  async createVisit(payload: Row, actorAccessId: number | null, actorName: string) {
    const producerId = toIntegerOrNull(payload.producerId);
    if (!producerId || !(await this.getProducerById(producerId))) return null;
    const status = normalizeEnum(payload.status, VISIT_STATUSES, "PROGRAMADA");
    const { data, error } = await this.db.from("paf_technical_visits").insert({
      report_id: toIntegerOrNull(payload.reportId),
      producer_id: producerId,
      status,
      priority: normalizeEnum(payload.priority, VISIT_PRIORITIES, "NORMAL"),
      scheduled_date: normalizeDate(payload.scheduledDate),
      technician: nullableText(payload.technician, 180) || actorName,
      objective: nullableText(payload.objective, 3000),
      result_note: nullableText(payload.resultNote || payload.technicalNote, 4000),
      created_by_access_id: actorAccessId,
      updated_by: actorName,
      completed_at: status === "CONCLUÍDA" ? new Date().toISOString() : null
    }).select("id").single();
    assertNoError(error, "Não foi possível cadastrar a visita.");
    return this.getVisitById(data.id);
  }

  async updateVisit(id: number, payload: Row, actorName: string) {
    const current = await this.getVisitById(id);
    if (!current) return null;
    const status = payload.status === undefined ? current.status : normalizeEnum(payload.status, VISIT_STATUSES, current.status);
    const { error } = await this.db.from("paf_technical_visits").update({
      status,
      priority: payload.priority === undefined ? current.priority : normalizeEnum(payload.priority, VISIT_PRIORITIES, current.priority),
      scheduled_date: payload.scheduledDate === undefined ? current.scheduledDate : normalizeDate(payload.scheduledDate),
      technician: payload.technician === undefined ? current.technician : nullableText(payload.technician, 180),
      objective: payload.objective === undefined ? current.objective : nullableText(payload.objective, 3000),
      result_note: payload.resultNote === undefined ? current.resultNote : nullableText(payload.resultNote, 4000),
      updated_by: actorName,
      completed_at: status === "CONCLUÍDA" ? current.completedAt || new Date().toISOString() : null
    }).eq("id", id);
    assertNoError(error, "Não foi possível atualizar a visita.");
    return this.getVisitById(id);
  }

  async listTasks(filters: Filters = {}) {
    const { data, error } = await this.db
      .from("paf_operational_tasks")
      .select("*, producer:paf_producers(name,cpf,agency), report:paf_reports(area_status,created_at), visit:paf_technical_visits(status,scheduled_date)")
      .order("created_at", { ascending: false })
      .range(0, 9999);
    assertNoError(error, "Não foi possível carregar as pendências.");
    let tasks = (data || []).map(mapTask);
    const search = normalizedSearch(filters.search);
    if (search) tasks = tasks.filter((task) => [task.title, task.producerName, task.producerCpf, task.assignee, task.notes]
      .some((value) => normalizedSearch(value).includes(search)));
    if (filters.status) tasks = tasks.filter((task) => task.status === normalizeUpper(filters.status));
    if (filters.priority) tasks = tasks.filter((task) => task.priority === normalizeUpper(filters.priority));
    if (filters.type) tasks = tasks.filter((task) => task.type === normalizeUpper(filters.type));
    if (filters.agency) tasks = tasks.filter((task) => task.producerAgency === normalizeText(filters.agency));
    if (filters.assignee) tasks = tasks.filter((task) => normalizedSearch(task.assignee).includes(normalizedSearch(filters.assignee)));
    return { tasks, summary: buildTaskSummary(tasks) };
  }

  async getTaskById(id: number) {
    const { data, error } = await this.db
      .from("paf_operational_tasks")
      .select("*, producer:paf_producers(name,cpf,agency), report:paf_reports(area_status,created_at), visit:paf_technical_visits(status,scheduled_date)")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Não foi possível consultar a pendência.");
    return data ? mapTask(data) : null;
  }

  async createTask(payload: Row, actorName: string) {
    const title = normalizeText(payload.title).slice(0, 240);
    if (!title) throw new Error("Informe o título da pendência.");
    const status = normalizeEnum(payload.status, TASK_STATUSES, "ABERTA");
    const { data, error } = await this.db.from("paf_operational_tasks").insert({
      producer_id: toIntegerOrNull(payload.producerId),
      report_id: toIntegerOrNull(payload.reportId),
      visit_id: toIntegerOrNull(payload.visitId),
      title,
      type: normalizeEnum(payload.type, TASK_TYPES, "OUTRO"),
      status,
      priority: normalizeEnum(payload.priority, VISIT_PRIORITIES, "NORMAL"),
      assignee: nullableText(payload.assignee, 180),
      due_date: normalizeDate(payload.dueDate),
      notes: nullableText(payload.notes, 4000),
      created_by: actorName,
      completed_at: status === "CONCLUÍDA" ? new Date().toISOString() : null
    }).select("id").single();
    assertNoError(error, "Não foi possível criar a pendência.");
    return this.getTaskById(data.id);
  }

  async updateTask(id: number, payload: Row) {
    const current = await this.getTaskById(id);
    if (!current) return null;
    const status = payload.status === undefined ? current.status : normalizeEnum(payload.status, TASK_STATUSES, current.status);
    const { error } = await this.db.from("paf_operational_tasks").update({
      title: payload.title === undefined ? current.title : normalizeText(payload.title).slice(0, 240) || current.title,
      type: payload.type === undefined ? current.type : normalizeEnum(payload.type, TASK_TYPES, current.type),
      status,
      priority: payload.priority === undefined ? current.priority : normalizeEnum(payload.priority, VISIT_PRIORITIES, current.priority),
      assignee: payload.assignee === undefined ? current.assignee : nullableText(payload.assignee, 180),
      due_date: payload.dueDate === undefined ? current.dueDate : normalizeDate(payload.dueDate),
      notes: payload.notes === undefined ? current.notes : nullableText(payload.notes, 4000),
      completed_at: status === "CONCLUÍDA" ? current.completedAt || new Date().toISOString() : null
    }).eq("id", id);
    assertNoError(error, "Não foi possível atualizar a pendência.");
    return this.getTaskById(id);
  }

  async listDocuments(filters: Filters = {}) {
    const { data, error } = await this.db
      .from("paf_documents")
      .select("*, producer:paf_producers(name,cpf,agency), report:paf_reports(area_status), visit:paf_technical_visits(status), task:paf_operational_tasks(title)")
      .order("created_at", { ascending: false })
      .range(0, 9999);
    assertNoError(error, "Não foi possível carregar os documentos.");
    let documents = (data || []).map(mapDocument);
    const search = normalizedSearch(filters.search);
    if (search) documents = documents.filter((document) => [document.title, document.fileName, document.producerName, document.producerCpf, document.notes]
      .some((value) => normalizedSearch(value).includes(search)));
    if (filters.status) documents = documents.filter((document) => document.status === normalizeUpper(filters.status));
    if (filters.category) documents = documents.filter((document) => document.category === normalizeUpper(filters.category));
    if (filters.agency) documents = documents.filter((document) => document.producerAgency === normalizeText(filters.agency));
    return { documents, summary: buildDocumentSummary(documents) };
  }

  async getDocumentById(id: number) {
    const { data, error } = await this.db
      .from("paf_documents")
      .select("*, producer:paf_producers(name,cpf,agency), report:paf_reports(area_status), visit:paf_technical_visits(status), task:paf_operational_tasks(title)")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Não foi possível consultar o documento.");
    return data ? mapDocument(data) : null;
  }

  async createDocument(payload: Row, actorName: string, file: Row = {}) {
    const title = normalizeText(payload.title).slice(0, 240);
    if (!title) throw new Error("Informe o título do documento.");
    const { data, error } = await this.db.from("paf_documents").insert({
      producer_id: toIntegerOrNull(payload.producerId),
      report_id: toIntegerOrNull(payload.reportId),
      visit_id: toIntegerOrNull(payload.visitId),
      task_id: toIntegerOrNull(payload.taskId),
      title,
      category: normalizeEnum(payload.category, DOCUMENT_CATEGORIES, "OUTRO"),
      status: normalizeEnum(payload.status, DOCUMENT_STATUSES, "PENDENTE"),
      file_name: file.fileName || null,
      file_mime: file.fileMime || null,
      file_size: file.fileSize || null,
      storage_bucket: file.storageBucket || null,
      storage_path: file.storagePath || null,
      uploaded_by: actorName,
      notes: nullableText(payload.notes, 4000)
    }).select("id").single();
    assertNoError(error, "Não foi possível salvar o documento.");
    return this.getDocumentById(data.id);
  }

  async updateDocument(id: number, payload: Row) {
    const current = await this.getDocumentById(id);
    if (!current) return null;
    const status = payload.status === undefined ? current.status : normalizeEnum(payload.status, DOCUMENT_STATUSES, current.status);
    const { error } = await this.db.from("paf_documents").update({
      title: payload.title === undefined ? current.title : normalizeText(payload.title).slice(0, 240) || current.title,
      category: payload.category === undefined ? current.category : normalizeEnum(payload.category, DOCUMENT_CATEGORIES, current.category),
      status,
      notes: payload.notes === undefined ? current.notes : nullableText(payload.notes, 4000),
      reviewed_at: ["VALIDADO", "REJEITADO"].includes(status) ? new Date().toISOString() : current.reviewedAt
    }).eq("id", id);
    assertNoError(error, "Não foi possível atualizar o documento.");
    return this.getDocumentById(id);
  }

  async listFuel(filters: Filters = {}) {
    const [{ data: recordRows, error: recordError }, { data: vehicleRows, error: vehicleError }, { data: driverRows, error: driverError }] = await Promise.all([
      this.db.from("paf_fuel_records").select("*").order("served_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).range(0, 9999),
      this.db.from("paf_fuel_vehicles").select("*").order("plate").range(0, 9999),
      this.db.from("paf_fuel_drivers").select("*").order("active", { ascending: false }).order("name").range(0, 9999)
    ]);
    assertNoError(recordError, "Não foi possível carregar os abastecimentos.");
    assertNoError(vehicleError, "Não foi possível carregar a frota.");
    assertNoError(driverError, "Não foi possível carregar os motoristas.");

    const drivers = (driverRows || []).map(mapFuelDriver);
    const driverNameById = new Map(drivers.map((driver) => [driver.id, driver.name]));
    let vehicles = (vehicleRows || []).map((row) => mapFuelVehicle(row, driverNameById.get(row.driver_id) || null));
    const vehicleByPlate = new Map((vehicleRows || []).map((row) => [row.plate, row]));
    let records = (recordRows || []).map((row) => mapFuelRecord(row, vehicleByPlate.get(row.plate) || null));

    const search = normalizedSearch(filters.search);
    if (search) records = records.filter((record) => [record.driver, record.plate, record.requisition, record.location, record.notes, record.vehicleResponsible]
      .some((value) => normalizedSearch(value).includes(search)));
    if (filters.year) records = records.filter((record) => record.year === toIntegerOrNull(filters.year));
    if (filters.month) records = records.filter((record) => record.month === normalizeUpper(filters.month));
    if (filters.driver) records = records.filter((record) => record.driver === normalizeText(filters.driver));
    if (filters.plate) {
      const plate = normalizePlate(filters.plate);
      records = records.filter((record) => record.plate === plate);
      vehicles = vehicles.filter((vehicle) => vehicle.plate === plate);
    }
    if (filters.location) records = records.filter((record) => record.location === normalizeText(filters.location));

    return {
      records,
      vehicles,
      drivers,
      summary: buildFuelSummary(records, vehicles),
      options: {
        years: [...new Set((recordRows || []).map((row) => row.year).filter(Boolean))].sort((left, right) => Number(right) - Number(left)),
        months: distinct((recordRows || []).map((row) => row.month)),
        drivers: drivers.filter((driver) => driver.active).map((driver) => driver.name),
        driverItems: drivers,
        plates: distinct([...(recordRows || []).map((row) => row.plate), ...(vehicleRows || []).map((row) => row.plate)]),
        locations: distinct((recordRows || []).map((row) => row.location)),
        fleetTypes: distinct((vehicleRows || []).map((row) => row.fleet_type))
      }
    };
  }

  async getFuelDriverById(id: number) {
    const { data, error } = await this.db.from("paf_fuel_drivers").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Não foi possível consultar o motorista.");
    return data ? mapFuelDriver(data) : null;
  }

  async createFuelDriver(payload: Row) {
    const name = normalizeText(payload.name).slice(0, 180);
    if (!name) throw new Error("Informe o nome do motorista.");
    const { data, error } = await this.db.from("paf_fuel_drivers").insert({
      name,
      cpf: nullableText(payload.cpf, 32),
      phone: nullableText(payload.phone, 40),
      license_number: nullableText(payload.licenseNumber, 80),
      license_category: nullableText(payload.licenseCategory, 20)?.toUpperCase() || null,
      license_expires_at: normalizeDate(payload.licenseExpiresAt),
      active: payload.active !== false,
      notes: nullableText(payload.notes, 1000)
    }).select("*").single();
    assertNoError(error, "Não foi possível cadastrar o motorista.");
    return mapFuelDriver(data);
  }

  async updateFuelDriver(id: number, payload: Row) {
    const current = await this.getFuelDriverById(id);
    if (!current) return null;
    const { data, error } = await this.db.from("paf_fuel_drivers").update({
      name: payload.name === undefined ? current.name : normalizeText(payload.name).slice(0, 180) || current.name,
      cpf: payload.cpf === undefined ? current.cpf : nullableText(payload.cpf, 32),
      phone: payload.phone === undefined ? current.phone : nullableText(payload.phone, 40),
      license_number: payload.licenseNumber === undefined ? current.licenseNumber : nullableText(payload.licenseNumber, 80),
      license_category: payload.licenseCategory === undefined ? current.licenseCategory : nullableText(payload.licenseCategory, 20)?.toUpperCase() || null,
      license_expires_at: payload.licenseExpiresAt === undefined ? current.licenseExpiresAt : normalizeDate(payload.licenseExpiresAt),
      active: payload.active === undefined ? current.active : Boolean(payload.active),
      notes: payload.notes === undefined ? current.notes : nullableText(payload.notes, 1000)
    }).eq("id", id).select("*").single();
    assertNoError(error, "Não foi possível atualizar o motorista.");
    return mapFuelDriver(data);
  }

  async deleteFuelDriver(id: number) {
    const current = await this.getFuelDriverById(id);
    if (!current) return null;
    const { error } = await this.db.from("paf_fuel_drivers").delete().eq("id", id);
    assertNoError(error, "Não foi possível excluir o motorista.");
    return current;
  }

  async getFuelVehicleById(id: number) {
    const { data, error } = await this.db.from("paf_fuel_vehicles").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Não foi possível consultar o veículo.");
    if (!data) return null;
    let driverName: string | null = null;
    if (data.driver_id) {
      const driver = await this.getFuelDriverById(data.driver_id);
      driverName = driver?.name || null;
    }
    return mapFuelVehicle(data, driverName);
  }

  async upsertFuelVehicle(payload: Row) {
    const plate = normalizePlate(payload.plate);
    if (!plate) throw new Error("Informe a placa do veículo.");
    const row = {
      cost_center: nullableText(payload.costCenter, 100),
      department: nullableText(payload.department, 140),
      category: nullableText(payload.category, 140),
      area: nullableText(payload.area, 140),
      vehicle: nullableText(payload.vehicle, 180),
      plate,
      driver_id: toIntegerOrNull(payload.driverId),
      assigned_to: nullableText(payload.assignedTo, 180),
      quota_liters: toNumberOrNull(payload.quotaLiters),
      fleet_type: nullableText(payload.fleetType, 80)?.toUpperCase() || null
    };
    const { data, error } = await this.db.from("paf_fuel_vehicles").upsert(row, { onConflict: "plate" }).select("id").single();
    assertNoError(error, "Não foi possível cadastrar o veículo.");
    return this.getFuelVehicleById(data.id);
  }

  async updateFuelVehicle(id: number, payload: Row) {
    const current = await this.getFuelVehicleById(id);
    if (!current) return null;
    const nextPlate = payload.plate === undefined ? current.plate : normalizePlate(payload.plate);
    if (!nextPlate) throw new Error("Informe a placa do veículo.");
    const { error } = await this.db.from("paf_fuel_vehicles").update({
      cost_center: payload.costCenter === undefined ? current.costCenter : nullableText(payload.costCenter, 100),
      department: payload.department === undefined ? current.department : nullableText(payload.department, 140),
      category: payload.category === undefined ? current.category : nullableText(payload.category, 140),
      area: payload.area === undefined ? current.area : nullableText(payload.area, 140),
      vehicle: payload.vehicle === undefined ? current.vehicle : nullableText(payload.vehicle, 180),
      plate: nextPlate,
      driver_id: payload.driverId === undefined ? current.driverId : toIntegerOrNull(payload.driverId),
      assigned_to: payload.assignedTo === undefined ? current.assignedTo : nullableText(payload.assignedTo, 180),
      quota_liters: payload.quotaLiters === undefined ? current.quotaLiters : toNumberOrNull(payload.quotaLiters),
      fleet_type: payload.fleetType === undefined ? current.fleetType : nullableText(payload.fleetType, 80)?.toUpperCase() || null
    }).eq("id", id);
    assertNoError(error, duplicateMessage(error, "Essa placa já está cadastrada."));
    if (nextPlate !== current.plate) {
      const { error: recordError } = await this.db.from("paf_fuel_records").update({ plate: nextPlate }).eq("plate", current.plate);
      assertNoError(recordError, "O veículo foi atualizado, mas os históricos não puderam receber a nova placa.");
    }
    return this.getFuelVehicleById(id);
  }

  async deleteFuelVehicle(id: number) {
    const current = await this.getFuelVehicleById(id);
    if (!current) return null;
    const { error } = await this.db.from("paf_fuel_vehicles").delete().eq("id", id);
    assertNoError(error, "Não foi possível excluir o veículo.");
    return current;
  }

  async createFuelRecord(payload: Row, sourceKey?: string) {
    const driverId = toIntegerOrNull(payload.driverId);
    let driver = normalizeText(payload.driver).slice(0, 180);
    if (driverId && !driver) driver = (await this.getFuelDriverById(driverId))?.name || "";
    const plate = normalizePlate(payload.plate) || null;
    if (!driver && !plate) throw new Error("Informe ao menos o condutor ou a placa.");
    const servedDate = normalizeDate(payload.servedDate) || new Date().toISOString().slice(0, 10);
    const supplied = toNumberOrNull(payload.suppliedLiters);
    const kmStart = toNumberOrNull(payload.kmStart);
    const kmEnd = toNumberOrNull(payload.kmEnd);
    const explicitKm = toNumberOrNull(payload.kmDriven);
    const kmDriven = explicitKm ?? (kmStart !== null && kmEnd !== null ? kmEnd - kmStart : null);
    const explicitAverage = toNumberOrNull(payload.kmPerLiter);
    const kmPerLiter = explicitAverage ?? (kmDriven !== null && supplied ? kmDriven / supplied : null);
    const year = toIntegerOrNull(payload.year) || Number(servedDate.slice(0, 4));
    const month = normalizeUpper(payload.month) || monthName(servedDate);
    const row = {
      source_key: sourceKey || `manual-${randomHex(12)}`,
      source_file: nullableText(payload.sourceFile, 240) || "Lançamento manual",
      source_row: toIntegerOrNull(payload.sourceRow),
      year,
      month,
      driver_id: driverId,
      driver: driver || null,
      plate,
      vehicle_responsible: nullableText(payload.vehicleResponsible, 180),
      served_date: servedDate,
      requested_liters: toNumberOrNull(payload.requestedLiters),
      supplied_liters: supplied,
      km_start: kmStart,
      km_end: kmEnd,
      km_driven: kmDriven,
      km_per_liter: kmPerLiter,
      requisition: nullableText(payload.requisition, 120),
      notes: nullableText(payload.notes, 3000),
      quantity: toNumberOrNull(payload.quantity),
      location: nullableText(payload.location, 160),
      quota_liters: toNumberOrNull(payload.quotaLiters)
    };
    const { data, error } = await this.db.from("paf_fuel_records").upsert(row, { onConflict: "source_key" }).select("*").single();
    assertNoError(error, "Não foi possível lançar o abastecimento.");
    const fuel = await this.listFuel({ plate: data.plate || undefined });
    return fuel.records.find((record) => record.id === data.id) || mapFuelRecord(data, null);
  }

  async registerImportBatch(payload: Row) {
    const { error } = await this.db.from("paf_import_batches").insert(payload);
    assertNoError(error, "A importação terminou, mas o histórico do lote não pôde ser gravado.");
  }

  private async listProducerRows() {
    const { data, error } = await this.db.from("paf_producers").select("*").order("name").range(0, 9999);
    assertNoError(error, "Não foi possível carregar os produtores.");
    return data || [];
  }

  private async listReportRows() {
    const { data, error } = await this.db.from("paf_reports").select("*").order("created_at", { ascending: false }).range(0, 9999);
    assertNoError(error, "Não foi possível carregar os relatórios.");
    return data || [];
  }

  private async hydrateAccessAccount(row: Row) {
    const [{ data: scopes, error: scopeError }, { data: technician, error: technicianError }] = await Promise.all([
      this.db.from("paf_access_account_producers").select("producer_id").eq("access_account_id", row.id),
      row.technician_id
        ? this.db.from("paf_technicians").select("name").eq("id", row.technician_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);
    assertNoError(scopeError, "Não foi possível carregar o escopo do acesso.");
    assertNoError(technicianError, "Não foi possível carregar o técnico vinculado.");
    const ids = (scopes || []).map((scope: Row) => scope.producer_id);
    let producers: Row[] = [];
    if (ids.length) {
      const { data, error } = await this.db.from("paf_producers").select("id,name,cpf,agency").in("id", ids).order("name");
      assertNoError(error, "Não foi possível carregar os produtores vinculados.");
      producers = data || [];
    }
    return mapAccessAccount(row, producers, technician?.name || null);
  }

  private async replaceAccessScope(accessAccountId: number, producerIds: number[]) {
    const { error } = await this.db.rpc("paf_replace_access_scope", {
      p_access_account_id: accessAccountId,
      p_producer_ids: producerIds
    });
    assertNoError(error, "Não foi possível vincular os produtores ao acesso.");
  }
}

function assertNoError(error: any, message: string): asserts error is null {
  if (error) {
    console.error(message, error.code, error.message);
    throw new Error(message);
  }
}

function duplicateMessage(error: any, fallback: string) {
  return error?.code === "23505" ? fallback : "Não foi possível salvar o registro.";
}

function nullableText(value: unknown, maxLength: number) {
  return normalizeText(value).slice(0, maxLength) || null;
}

function normalizeEnum(value: unknown, allowed: string[], fallback: string) {
  const normalized = normalizeUpper(value);
  return allowed.includes(normalized) ? normalized : fallback;
}

function distinct(values: unknown[]) {
  return [...new Set(values.map(normalizeText).filter(Boolean))].sort((left, right) => left.localeCompare(right, "pt-BR"));
}

function normalizedSearch(value: unknown) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function monthName(dateValue: string) {
  const month = Number(dateValue.slice(5, 7));
  return ["", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"][month] || "";
}
