// Generated from paf-app by scripts/sync-visit-report.mjs. Do not edit.

// ../paf-app/src/branding.ts
var DEVELOPER_CREDIT = "Desenvolvido por Vinicius Dev";

// ../paf-app/src/reports/visitReportStyles.ts
var visitReportStyles = `
@page{size:A4;margin:12mm 14mm 15mm}
*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:10.5px/1.6 Report,Arial,sans-serif;color:#263126}
header{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:4px solid #E14C25;border-bottom:1px solid #dbe3dc;padding:16px 0 14px}
.paf-brand{display:flex;align-items:center;gap:12px}.logo{width:52px;height:52px;object-fit:contain}
.brand{font-size:20px;font-weight:600;line-height:1.2;color:#183E31}.small{font-size:8px;line-height:1.5;color:#67786c}
.paf-brand .small{margin-top:5px}.company-logo{width:180px;height:auto;margin:-20px -8px;object-fit:contain}.company-name{color:#c3411b;text-align:center;font-size:20px;line-height:1.1}.company-name small{font-size:8px;color:#3F6B2A}
.report-title{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:24px 0 20px}
.eyebrow{font-size:8px;font-weight:600;color:#63796b}h1{font-size:32px;line-height:1.18;font-weight:600;margin:8px 0 0;color:#183E31}h1 span{color:#E14C25}
.visit-date{text-align:right;max-width:200px}.visit-date>span{font-size:8px;color:#67786c}.visit-date>strong{display:block;font-size:17px;font-weight:600;color:#183E31;margin:4px 0 8px}
.status{display:inline-block;font-size:8px;line-height:1.5;color:#365f3b;border:1px solid #cbdcc9;border-radius:4px;padding:5px 8px}
.producer-band{background:#183E31;border-left:5px solid #E14C25;color:white;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 20px}
.producer-band>div{min-width:0}.producer-band span{display:block;font-size:8px;color:#bed0be}.producer-band strong{display:block;font-size:20px;line-height:1.35;font-weight:600;margin-top:4px;overflow-wrap:anywhere}
.producer-band .program{flex-shrink:0;max-width:38%;text-align:right}.producer-band .program strong{font-size:11px;color:#e2eece}
.identity{display:grid;grid-template-columns:1.2fr 1fr 1.2fr;gap:16px;padding:14px 0;margin:0;border-bottom:1px solid #dbe3dc}
.identity>div{min-width:0;break-inside:avoid}dt,.key{font-size:8px;color:#67786c}dd{margin:4px 0 0;font-weight:600;font-size:10px;overflow-wrap:anywhere}
.evidence-summary{display:flex;padding:12px 0 5px;gap:22px}.evidence-summary>div{flex:1;border-left:2px solid #b3c791;padding-left:10px}.evidence-summary strong{display:block;font-size:10px;font-weight:600;color:#183E31}.evidence-summary span{display:block;font-size:8px;color:#67786c}
h2{display:flex;align-items:center;gap:10px;font-size:13px;line-height:1.4;font-weight:600;color:#183E31;padding:0 0 8px;border-bottom:1px solid #cddbd0;margin:19px 0 5px;break-after:avoid}
.section-number{font-size:17px;line-height:1;font-weight:600;color:#c3411b;min-width:24px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 22px}.field{break-inside:avoid;min-width:0;padding:8px 0;border-bottom:1px solid #edf0ec}.wide{grid-column:1/-1}
.response{margin-top:3px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:10px}
.note{padding:12px 14px;border-left:3px solid #E14C25;background:#fff5ef;white-space:pre-wrap;overflow-wrap:anywhere}
.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;break-inside:avoid}.signature{break-inside:avoid;margin-top:12px;min-width:0}
.signature img{width:100%;height:85px;object-fit:contain}.missing-signature{height:85px;display:flex;align-items:center;font-size:9px;color:#67786c}
.signer{border-top:1px solid #8da18e;padding-top:7px;font-weight:600;overflow-wrap:anywhere}.notice{font-size:7.5px;line-height:1.6;color:#67786c;margin-top:10px}
.photo-section{break-before:page}.photo-section>.small{border-top:4px solid #E14C25;padding-top:12px}.photo-section h2{font-size:25px;border:0;margin:7px 0 18px;padding:0}
.photos{display:grid;grid-template-columns:1fr 1fr;gap:20px 16px}figure{margin:0;break-inside:avoid;min-width:0}
.photo-frame{position:relative;height:96mm;background:#17231d;overflow:hidden;border-radius:3px}.photo-frame img{display:block;width:100%;height:100%;object-fit:contain}
.photo-stamp{position:absolute;bottom:0;left:0;right:0;padding:9px;background:rgba(0,0,0,.65);color:white;font-size:7px;line-height:1.6;overflow-wrap:anywhere}
figcaption{font-size:8px;color:#67786c;margin-top:7px;padding-left:8px;border-left:2px solid #E14C25}.missing{padding:20px;color:#fff;font-size:10px}
.document-reference{margin-top:24px;padding:10px 0;border-top:1px solid #dbe3dc;font-size:7px;color:#67786c;display:flex;flex-wrap:wrap;gap:5px 12px;overflow-wrap:anywhere;break-inside:avoid}.document-reference strong{font-weight:600;color:#183E31}
.footer{margin-top:18px;padding-top:8px;border-top:2px solid #183E31;display:flex;justify-content:space-between;gap:10px;font-size:7px;color:#67786c;break-inside:avoid}
a{color:#345f36}section{min-width:0;break-inside:avoid-page}@media print{.wide{break-inside:auto}.response,.note{orphans:3;widows:3}}
`;

// ../paf-app/src/domain/dates.ts
function localDateKey(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseActivityDate(value, time = "09:00", reference = /* @__PURE__ */ new Date()) {
  let raw = value.trim();
  const timed = raw.match(/^(\d{2}\/\d{2}\/\d{4})\s*[· ]\s*(\d{2}:\d{2})$/);
  if (timed) {
    raw = timed[1];
    time = timed[2];
  }
  const label = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  let key = raw;
  if (label === "HOJE" || label === "AMANHA") {
    const day2 = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + (label === "AMANHA" ? 1 : 0));
    key = localDateKey(day2);
  }
  const brazilian = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilian) key = `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  const parts = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const clock = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!parts || !clock) throw new Error("Informe uma data completa e um hor\xE1rio v\xE1lido.");
  const [year, month, day] = parts.slice(1).map(Number);
  const [hour, minute] = clock.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (year < 1900 || year > 2200 || hour > 23 || minute > 59 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error("Confira o dia, o m\xEAs, o ano e o hor\xE1rio.");
  }
  return date;
}

// ../paf-app/src/domain/numbers.ts
function parseLocaleNumber(value) {
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  const normalized = trimmed.includes(",") ? trimmed.replaceAll(".", "").replace(",", ".") : trimmed;
  return Number(normalized);
}

// ../paf-app/src/domain/pafDocuments.ts
var NOTIFICATION_FORM_ID = "paf-notificacao";
var RELEASE_FORM_ID = "paf-liberacao-ater";
var isPafDocument = (id) => id === NOTIFICATION_FORM_ID || id === RELEASE_FORM_ID;
var blankBudgetItem = (id) => ({ id, description: "", amount: "", releaseDate: "" });
function readBudgetItems(value) {
  try {
    const items = JSON.parse(String(value || "[]"));
    if (!Array.isArray(items) || items.length > 40 || items.some((item) => !item || typeof item.id !== "string" || typeof item.description !== "string" || typeof item.amount !== "string" || typeof item.releaseDate !== "string")) return [];
    return items;
  } catch {
    return [];
  }
}
function moneyCents(value) {
  let input = String(value ?? "").trim().replace(/^R\$\s*/, "").replace(/\s/g, "");
  if (input.includes(",")) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(input)) return;
    input = input.replaceAll(".", "").replace(",", ".");
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) return;
  const [whole, fraction = ""] = input.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 999999999999 ? cents : void 0;
}
var formatMoney = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
var budgetTotalCents = (items) => items.reduce((sum, item) => sum + (moneyCents(item.amount) ?? 0), 0);
var field = (id, label, type, section, required = true, options) => ({ id, label, type, section, required, ...options ? { options } : {} });
var identityFields = [
  field("numeroDocumento", "N\xFAmero do documento", "text", "1. Identifica\xE7\xE3o"),
  field("dataElaboracao", "Data de elabora\xE7\xE3o", "date", "1. Identifica\xE7\xE3o"),
  field("nomeProdutor", "Nome completo do produtor", "text", "1. Identifica\xE7\xE3o"),
  field("cpfProdutor", "CPF do produtor", "text", "1. Identifica\xE7\xE3o"),
  field("denominacaoImovel", "Denomina\xE7\xE3o do im\xF3vel", "text", "1. Identifica\xE7\xE3o"),
  field("enderecoImovel", "Endere\xE7o do im\xF3vel", "text", "1. Identifica\xE7\xE3o"),
  field("municipio", "Munic\xEDpio", "text", "1. Identifica\xE7\xE3o"),
  field("localEmissao", "Local de emiss\xE3o", "text", "1. Identifica\xE7\xE3o"),
  field("tecnicoResponsavel", "T\xE9cnico respons\xE1vel", "text", "1. Identifica\xE7\xE3o"),
  field("registroProfissional", "Registro profissional do t\xE9cnico", "text", "1. Identifica\xE7\xE3o", false)
];
var pafDocumentForms = [
  { id: NOTIFICATION_FORM_ID, title: "Notifica\xE7\xE3o ao produtor", description: "Motivo, orienta\xE7\xF5es, prazo, ci\xEAncia e fotos de comprova\xE7\xE3o.", category: "Campo", version: 1, scope: "producer", evidencePolicy: { minPhotos: 0 }, fields: [
    ...identityFields,
    field("dataOcorrencia", "Data da ocorr\xEAncia ou constata\xE7\xE3o", "date", "2. Motivo e provid\xEAncias"),
    field("motivoNotificacao", "Motivo da notifica\xE7\xE3o", "multiline", "2. Motivo e provid\xEAncias"),
    field("providenciasSolicitadas", "Provid\xEAncias solicitadas ao produtor", "multiline", "2. Motivo e provid\xEAncias"),
    field("prazoDias", "Prazo para atendimento em dias", "number", "2. Motivo e provid\xEAncias", false),
    field("observacoesNotificacao", "Informa\xE7\xF5es complementares", "multiline", "2. Motivo e provid\xEAncias", false),
    field("situacaoCiencia", "Ci\xEAncia do destinat\xE1rio", "select", "3. Ci\xEAncia do destinat\xE1rio", true, ["Pendente de entrega", "Assinou a ci\xEAncia", "Recusou assinar", "Ausente"]),
    field("nomeConfirmacaoProdutor", "Nome de quem recebeu a notifica\xE7\xE3o", "text", "3. Ci\xEAncia do destinat\xE1rio", false),
    field("vinculoParticipante", "V\xEDnculo com o produtor", "select", "3. Ci\xEAncia do destinat\xE1rio", false, ["Pr\xF3prio produtor", "Familiar", "Representante", "Outro"]),
    field("dataCiencia", "Data da ci\xEAncia", "date", "3. Ci\xEAncia do destinat\xE1rio", false),
    field("observacoesCiencia", "Observa\xE7\xF5es da entrega", "multiline", "3. Ci\xEAncia do destinat\xE1rio", false)
  ] },
  { id: RELEASE_FORM_ID, title: "Libera\xE7\xE3o de parcela e ATER", description: "Laudo de acompanhamento com or\xE7amento, parecer t\xE9cnico e registro fotogr\xE1fico.", category: "Campo", version: 1, scope: "producer", evidencePolicy: { minPhotos: 2 }, fields: [
    ...identityFields,
    field("numeroParcela", "N\xFAmero da parcela / libera\xE7\xE3o", "number", "2. Opera\xE7\xE3o e vistoria"),
    field("numeroVistoria", "N\xFAmero da vistoria", "text", "2. Opera\xE7\xE3o e vistoria"),
    field("dataVisita", "Data da vistoria", "date", "2. Opera\xE7\xE3o e vistoria"),
    field("numeroOperacao", "N\xFAmero da opera\xE7\xE3o", "text", "2. Opera\xE7\xE3o e vistoria"),
    field("dataContratacao", "Data da contrata\xE7\xE3o", "date", "2. Opera\xE7\xE3o e vistoria"),
    field("recursos", "Recursos / linha de financiamento", "text", "2. Opera\xE7\xE3o e vistoria"),
    field("creditoLiberado", "Cr\xE9dito j\xE1 liberado (R$)", "text", "2. Opera\xE7\xE3o e vistoria"),
    field("coordenadasGeograficas", "Coordenadas geogr\xE1ficas do im\xF3vel", "text", "2. Opera\xE7\xE3o e vistoria", false),
    field("finalidade", "Finalidade da libera\xE7\xE3o solicitada", "multiline", "2. Opera\xE7\xE3o e vistoria"),
    field("itensOrcamento", "Itens do or\xE7amento", "multiline", "3. Itens a liberar"),
    field("aplicacaoCredito", "Aplica\xE7\xE3o do cr\xE9dito", "select", "4. Parecer t\xE9cnico", true, ["Correta", "Em implanta\xE7\xE3o", "Incorreta"]),
    field("situacaoGarantias", "Situa\xE7\xE3o / garantias", "select", "4. Parecer t\xE9cnico", true, ["Normal", "Anormal"]),
    field("situacaoTecnica", "Situa\xE7\xE3o t\xE9cnica", "select", "4. Parecer t\xE9cnico", true, ["Normal", "Anormal"]),
    field("parecerTecnico", "Observa\xE7\xF5es e parecer do t\xE9cnico", "multiline", "4. Parecer t\xE9cnico"),
    field("proximaVistoria", "Previs\xE3o da pr\xF3xima vistoria", "date", "4. Parecer t\xE9cnico", false)
  ] }
];
function documentIdentityAnswers(producer, property) {
  return { nomeProdutor: producer?.name || "", cpfProdutor: producer?.document || "", denominacaoImovel: property?.provisionalName ? producer?.name || property.name : property?.name || "", enderecoImovel: property?.ruralAddress || producer?.address || "", municipio: property?.municipality || "", coordenadasGeograficas: Number.isFinite(property?.latitude) && Number.isFinite(property?.longitude) ? `Latitude: ${property.latitude.toFixed(6)}; Longitude: ${property.longitude.toFixed(6)}` : "" };
}
function initialDocumentAnswers(formId, name, reference) {
  return { numeroDocumento: `${formId === NOTIFICATION_FORM_ID ? "NOT" : "LAU"}-${localDateKey().replaceAll("-", "")}-${reference.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`, dataElaboracao: localDateKey(), tecnicoResponsavel: name, localEmissao: "Tom\xE9-A\xE7u / PA", ...formId === NOTIFICATION_FORM_ID ? { situacaoCiencia: "Pendente de entrega" } : { dataVisita: localDateKey(), itensOrcamento: "[]" } };
}
function validateDocumentAnswers(formId, answers) {
  const errors = {};
  if (!isPafDocument(formId)) return errors;
  if (String(answers.cpfProdutor || "").replace(/\D/g, "").length !== 11) errors.cpfProdutor = "Informe o CPF com 11 d\xEDgitos.";
  if (answers.dataElaboracao && String(answers.dataElaboracao) > localDateKey()) errors.dataElaboracao = "A elabora\xE7\xE3o n\xE3o pode estar no futuro.";
  if (formId === RELEASE_FORM_ID) {
    const items = readBudgetItems(answers.itensOrcamento);
    if (!items.length || items.some((item) => !item.description.trim() || !moneyCents(item.amount) || !item.releaseDate)) errors.itensOrcamento = "Adicione ao menos um item com descri\xE7\xE3o, valor positivo e data.";
    for (const item of items) try {
      parseActivityDate(item.releaseDate);
    } catch {
      errors.itensOrcamento = "Confira as datas dos itens do or\xE7amento.";
    }
    if (moneyCents(answers.creditoLiberado) === void 0) errors.creditoLiberado = "Informe um valor monet\xE1rio v\xE1lido, inclusive zero quando aplic\xE1vel.";
    if (!Number.isInteger(Number(answers.numeroParcela)) || Number(answers.numeroParcela) < 1) errors.numeroParcela = "Informe um n\xFAmero de parcela inteiro, a partir de 1.";
    if (answers.proximaVistoria && String(answers.proximaVistoria) < String(answers.dataVisita)) errors.proximaVistoria = "O retorno n\xE3o pode ser anterior \xE0 vistoria.";
    if (answers.dataVisita && String(answers.dataVisita) > localDateKey()) errors.dataVisita = "A vistoria n\xE3o pode estar no futuro.";
  } else {
    if (answers.prazoDias !== void 0 && answers.prazoDias !== "" && (!Number.isInteger(Number(answers.prazoDias)) || Number(answers.prazoDias) < 1)) errors.prazoDias = "Informe um prazo inteiro e positivo.";
    if (answers.situacaoCiencia === "Assinou a ci\xEAncia" && (!String(answers.nomeConfirmacaoProdutor || "").trim() || !answers.vinculoParticipante || !answers.dataCiencia)) errors.nomeConfirmacaoProdutor = "Informe nome, v\xEDnculo e data de quem recebeu e assinou.";
    if (answers.dataOcorrencia && String(answers.dataOcorrencia) > String(answers.dataElaboracao)) errors.dataOcorrencia = "A ocorr\xEAncia n\xE3o pode ser posterior \xE0 elabora\xE7\xE3o.";
  }
  return errors;
}
var documentSignatureRoles = (formId, answers) => formId === NOTIFICATION_FORM_ID && answers.situacaoCiencia === "Assinou a ci\xEAncia" ? ["technician", "attendee"] : ["technician"];
function documentAnswerText(id, value) {
  return id === "itensOrcamento" ? readBudgetItems(value).map((item) => `${item.description} \xB7 ${formatMoney(moneyCents(item.amount) ?? 0)} \xB7 ${item.releaseDate}`).join("\n") : void 0;
}

// ../paf-app/src/domain/forms.ts
var TECHNICAL_ASSISTANCE_FORM_ID = "assistencia-tecnica-propriedade";
function validateFormAnswers(form, answers) {
  const errors = form.fields.reduce((errors2, field2) => {
    const value = answers[field2.id];
    const empty = value === void 0 || value === null || typeof value === "string" && value.trim() === "" || Array.isArray(value) && value.length === 0;
    if (empty) {
      if (field2.required) errors2[field2.id] = `Informe ${field2.label}.`;
      return errors2;
    }
    if (field2.type === "number" && (!Number.isFinite(parseLocaleNumber(String(value))) || parseLocaleNumber(String(value)) < 0)) {
      errors2[field2.id] = "Informe um n\xFAmero v\xE1lido, igual ou maior que zero.";
    }
    if (field2.type === "date") {
      try {
        parseActivityDate(String(value));
      } catch {
        errors2[field2.id] = "Informe uma data v\xE1lida com dia, m\xEAs e ano.";
      }
    }
    if (field2.type === "boolean" && typeof value !== "boolean") errors2[field2.id] = "Selecione Sim ou N\xE3o.";
    if (field2.type === "select" && !field2.options?.includes(String(value))) errors2[field2.id] = "Selecione uma das op\xE7\xF5es dispon\xEDveis.";
    if (field2.type === "multi_select" && (!Array.isArray(value) || value.some((option) => !field2.options?.includes(option)))) errors2[field2.id] = "Selecione as op\xE7\xF5es dispon\xEDveis.";
    return errors2;
  }, {});
  if (form.id === TECHNICAL_ASSISTANCE_FORM_ID) {
    if (answers.vinculoParticipante === "Outro" && !String(answers.outroVinculoParticipante ?? "").trim()) errors.outroVinculoParticipante = "Informe o v\xEDnculo de quem acompanhou a visita.";
    if (Array.isArray(answers.atividadesManutencao) && answers.atividadesManutencao.includes("Outros") && !String(answers.outraAtividade ?? "").trim()) {
      errors.outraAtividade = "Descreva a outra atividade acompanhada.";
    }
    if (answers.dataVisita && !errors.dataVisita) {
      const visit = localDateKey(parseActivityDate(String(answers.dataVisita)));
      if (visit > localDateKey()) errors.dataVisita = "A data da visita n\xE3o pode estar no futuro.";
      if (answers.proximaVistoria && !errors.proximaVistoria && localDateKey(parseActivityDate(String(answers.proximaVistoria))) < visit) {
        errors.proximaVistoria = "O retorno deve ocorrer na data da visita ou depois dela.";
      }
    }
  }
  return { ...errors, ...validateDocumentAnswers(form.id, answers) };
}
function normalizeFormAnswers(form, answers) {
  const result = { ...answers };
  for (const field2 of form.fields) {
    const value = answers[field2.id];
    if (value === void 0 || value === "") continue;
    if (field2.type === "number") {
      const number = parseLocaleNumber(String(value));
      if (Number.isFinite(number)) result[field2.id] = number;
    }
    if (field2.type === "date") {
      try {
        result[field2.id] = localDateKey(parseActivityDate(String(value)));
      } catch {
      }
    }
  }
  if (form.id === RELEASE_FORM_ID) {
    const credit = moneyCents(result.creditoLiberado);
    if (credit !== void 0) result.creditoLiberado = (credit / 100).toFixed(2);
    const items = readBudgetItems(result.itensOrcamento);
    if (items.length) result.itensOrcamento = JSON.stringify(items.map((item) => ({ ...item, amount: moneyCents(item.amount) === void 0 ? item.amount : (moneyCents(item.amount) / 100).toFixed(2) })));
  }
  return result;
}

// ../paf-app/src/domain/visitPresentation.ts
function producerProgram(value) {
  if (!value?.trim()) return "Modalidade n\xE3o informada";
  return value.split(/\s*[|;,]\s*/).map((part) => ({ PRONAF: "Pronaf", PARCERIA: "Parceria", PRODUTIVO: "Produtivo" })[part.trim().toUpperCase()] || part.trim()).filter(Boolean).join(" \xB7 ");
}
function visitDisplayFields(form, answers) {
  return form.fields.filter((field2) => {
    if (form.id !== TECHNICAL_ASSISTANCE_FORM_ID) return true;
    if (field2.id === "outraAtividade") return Array.isArray(answers.atividadesManutencao) && answers.atividadesManutencao.includes("Outros");
    if (field2.id === "outroVinculoParticipante") return answers.vinculoParticipante === "Outro";
    return true;
  });
}

// ../paf-app/src/domain/visitHistory.ts
function visitDate(collection) {
  try {
    return localDateKey(parseActivityDate(String(collection.answers.dataVisita || collection.answers.dataElaboracao || collection.createdAt.slice(0, 10))));
  } catch {
    return collection.createdAt.slice(0, 10);
  }
}
function displayVisitDate(value) {
  try {
    return parseActivityDate(value).toLocaleDateString("pt-BR");
  } catch {
    return value || "N\xE3o informado";
  }
}
function collectionIdentity(data, collection) {
  const producer = data.producers.find((item) => item.id === collection.producerId);
  const community = data.communities.find((item) => item.id === (collection.communityId || producer?.communityId));
  const property = data.properties.find((item) => item.id === collection.propertyId);
  return {
    program: producerProgram(producer?.producerType),
    name: producer?.name || community?.name || String(collection.answers.nomeConfirmacaoProdutor || "V\xEDnculo a conferir"),
    property: property?.name || String(collection.answers.denominacaoImovel || ""),
    municipality: property?.municipality || community?.municipality || String(collection.answers.municipio || ""),
    technician: data.users.find((item) => item.id === collection.technicianId)?.name || String(collection.answers.tecnicoResponsavel || collection.answers.entrevistador || "T\xE9cnico n\xE3o informado")
  };
}

// ../paf-app/src/reports/reportHtml.ts
function safePng(value) {
  return Boolean(value && value.length < 25e5 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value));
}
function escapeReportHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function reportFonts(regular, semibold) {
  return [[regular, 400], [semibold, 600]].map(([uri, weight]) => typeof uri === "string" && uri.length < 5e5 && /^data:font\/woff2;base64,[A-Za-z0-9+/=]+$/.test(uri) ? `@font-face{font-family:Report;src:url("${uri}") format("woff2");font-weight:${weight};font-style:normal}` : "").join("");
}

// ../paf-app/src/reports/pafDocumentReport.ts
function buildPafDocumentHtml(_data, collection, options = {}) {
  const a = collection.answers, release = collection.formId === RELEASE_FORM_ID;
  const text = (id) => escapeReportHtml(a[id] === void 0 || a[id] === "" ? "N\xE3o informado" : a[id]);
  const date = (id) => a[id] ? escapeReportHtml(displayVisitDate(String(a[id]))) : "____ / ____ / ______";
  const pair = (label, value, colspan = 1) => `<td colspan="${colspan}"><span class="key">${label}</span><strong>${value}</strong></td>`;
  const logo = safePng(options.logo) ? `<img class="logo" src="${options.logo}" alt="PAF"/>` : "";
  const company = safePng(options.companyLogo) ? `<img class="company-logo" src="${options.companyLogo}" alt="Vila Nova Agroindustrial"/>` : "<strong>Vila Nova Agroindustrial</strong>";
  const signatures = options.evidenceSignatures || [];
  const signature = (role, label) => {
    const item = signatures.find((item2) => item2.role === role);
    return `<div class="signature">${safePng(item?.dataUrl) ? `<img src="${item.dataUrl}" alt="Assinatura ${label}"/>` : '<div class="signature-space"></div>'}<strong>${escapeReportHtml(item?.signerName || (role === "technician" ? a.tecnicoResponsavel : a.nomeConfirmacaoProdutor) || label)}</strong><span>${label}</span>${role === "technician" && a.registroProfissional ? `<span>${text("registroProfissional")}</span>` : ""}</div>`;
  };
  const photos = (options.photos || []).map((photo, index) => `<figure><div class="photo-frame">${photo.dataUrl && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.dataUrl) ? `<img src="${photo.dataUrl}" alt="Registro fotogr\xE1fico ${index + 1}"/>` : "<p>Foto indispon\xEDvel nesta emiss\xE3o.</p>"}<div class="photo-stamp">${(photo.stamp || []).map((line) => `<div>${escapeReportHtml(line)}</div>`).join("")}</div></div><figcaption><b>Foto ${index + 1}</b> \xB7 ${escapeReportHtml(photo.caption)}</figcaption></figure>`).join("");
  const items = readBudgetItems(a.itensOrcamento);
  const releaseBody = `<table class="identity"><tbody>
    <tr>${pair("Laudo n\xBA", text("numeroDocumento"))}${pair("Elabora\xE7\xE3o", date("dataElaboracao"))}${pair("Parcela / libera\xE7\xE3o", `${text("numeroParcela")}\xAA`)}</tr>
    <tr>${pair("Vistoria n\xBA", text("numeroVistoria"))}${pair("Data da vistoria", date("dataVisita"))}${pair("Data da contrata\xE7\xE3o", date("dataContratacao"))}</tr>
    <tr>${pair("Opera\xE7\xE3o n\xBA", text("numeroOperacao"))}${pair("Recursos", text("recursos"), 2)}</tr>
    <tr>${pair("Cliente", text("nomeProdutor"), 2)}${pair("CPF", text("cpfProdutor"))}</tr>
    <tr>${pair("Cr\xE9dito j\xE1 liberado", moneyCents(a.creditoLiberado) === void 0 ? text("creditoLiberado") : escapeReportHtml(formatMoney(moneyCents(a.creditoLiberado))))}${pair("Denomina\xE7\xE3o do im\xF3vel", text("denominacaoImovel"), 2)}</tr>
    <tr>${pair("Endere\xE7o do im\xF3vel", text("enderecoImovel"), 3)}</tr>
    <tr>${pair("Munic\xEDpio / UF", `${text("municipio")} / PA`)}${pair("Coordenadas geogr\xE1ficas", text("coordenadasGeograficas"), 2)}</tr>
    <tr>${pair("Finalidade", text("finalidade"), 3)}</tr>
    <tr>${pair("T\xE9cnico respons\xE1vel pela vistoria", text("tecnicoResponsavel"), 3)}</tr>
  </tbody></table>
  <h2>Andamento da execu\xE7\xE3o dos itens previstos no or\xE7amento</h2>
  <table class="budget"><thead><tr><th>Descri\xE7\xE3o</th><th>Valor a liberar</th><th>Data prevista</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeReportHtml(item.description)}</td><td class="money">${escapeReportHtml(formatMoney(moneyCents(item.amount) || 0))}</td><td>${escapeReportHtml(displayVisitDate(item.releaseDate))}</td></tr>`).join("")}</tbody><tfoot><tr><th>Total solicitado</th><th class="money">${escapeReportHtml(formatMoney(budgetTotalCents(items)))}</th><td></td></tr></tfoot></table>
  <table><tbody><tr>${pair("Aplica\xE7\xE3o do cr\xE9dito", text("aplicacaoCredito"))}${pair("Situa\xE7\xE3o / garantias", text("situacaoGarantias"))}${pair("Situa\xE7\xE3o t\xE9cnica", text("situacaoTecnica"))}</tr></tbody></table>
  <h2>Observa\xE7\xF5es e parecer t\xE9cnico</h2><div class="prose">${text("parecerTecnico")}</div>
  <div class="closing"><div><span class="key">Pr\xF3xima vistoria</span><strong>${date("proximaVistoria")}</strong><span class="key">Local e data</span><strong>${text("localEmissao")}, ${date("dataElaboracao")}</strong></div>${signature("technician", "Assinatura do t\xE9cnico")}</div>
  <p class="notice">O laudo registra o acompanhamento e a solicita\xE7\xE3o de libera\xE7\xE3o. O parecer do agente financeiro \xE9 registrado na se\xE7\xE3o pr\xF3pria.</p>
  <section class="bank"><div class="small">Vila Nova Agroindustrial \xB7 PAF VNA \xB7 Laudo ${text("numeroDocumento")}</div><h2>Parecer do agente financeiro</h2><p><strong>Cliente:</strong> ${text("nomeProdutor")} \xB7 <strong>Opera\xE7\xE3o:</strong> ${text("numeroOperacao")}</p><p>Data do recebimento do laudo: ____ / ____ / ______</p><p>Parecer do t\xE9cnico do banco:</p><div class="bank-lines"></div><div class="signature-space"></div><p>________________________________________________________<br>Assinatura / identifica\xE7\xE3o do agente financeiro</p></section>`;
  const notificationBody = `<table class="identity"><tbody><tr>${pair("Notifica\xE7\xE3o n\xBA", text("numeroDocumento"))}${pair("Data de elabora\xE7\xE3o", date("dataElaboracao"))}</tr><tr>${pair("Destinat\xE1rio", text("nomeProdutor"))}${pair("CPF", text("cpfProdutor"))}</tr><tr>${pair("Im\xF3vel", text("denominacaoImovel"))}${pair("Munic\xEDpio / UF", `${text("municipio")} / PA`)}</tr><tr>${pair("Endere\xE7o do im\xF3vel", text("enderecoImovel"), 2)}</tr></tbody></table>
  <p>A Vila Nova Agroindustrial, por interm\xE9dio da equipe de Parceria de Agricultura Familiar, notifica o(a) produtor(a) <strong>${text("nomeProdutor")}</strong> pelo motivo descrito a seguir.</p>
  <h2>Motivo da notifica\xE7\xE3o</h2><p class="key">Data da ocorr\xEAncia ou constata\xE7\xE3o: ${date("dataOcorrencia")}</p><div class="prose">${text("motivoNotificacao")}</div>
  <h2>Provid\xEAncias solicitadas</h2><div class="prose">${text("providenciasSolicitadas")}</div>${a.prazoDias ? `<p class="deadline">Prazo para atendimento: <strong>${text("prazoDias")} dias</strong>, a partir da ci\xEAncia do destinat\xE1rio.</p>` : ""}
  ${a.observacoesNotificacao ? `<div class="prose">${text("observacoesNotificacao")}</div>` : ""}
  <p>Atenciosamente,<br><strong>Parceria de Agricultura Familiar \xB7 Vila Nova Agroindustrial</strong><br>${text("localEmissao")}, ${date("dataElaboracao")}</p>
  <div class="closing">${signature("technician", "T\xE9cnico respons\xE1vel")}${signature("attendee", "Ci\xEAncia do destinat\xE1rio")}</div>
  <table><tbody><tr>${pair("Situa\xE7\xE3o da entrega", text("situacaoCiencia"))}${pair("Data da ci\xEAncia", date("dataCiencia"))}</tr>${a.nomeConfirmacaoProdutor ? `<tr>${pair("Recebido por", text("nomeConfirmacaoProdutor"))}${pair("V\xEDnculo com o produtor", text("vinculoParticipante"))}</tr>` : ""}</tbody></table>
  ${a.observacoesCiencia ? `<div class="prose">${text("observacoesCiencia")}</div>` : ""}<p class="notice">A ci\xEAncia registra o recebimento do documento.</p>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${release ? "Libera\xE7\xE3o ATER" : "Notifica\xE7\xE3o"} ${text("numeroDocumento")}</title><style>${reportFonts(options.fontRegular, options.fontSemibold)}
  @page{size:A4;margin:12mm 14mm 14mm}*{box-sizing:border-box}html{print-color-adjust:exact;-webkit-print-color-adjust:exact}body{margin:0;font:10px/1.5 Report,Arial,sans-serif;color:#263126}header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #3f6b2a;padding-bottom:10px;margin-bottom:18px}.paf-brand{display:flex;gap:10px;align-items:center}.logo{width:46px;height:46px;object-fit:contain}.company-logo{width:160px;height:70px;object-fit:contain}.brand{font-size:17px;font-weight:600;color:#3f6b2a}.small,.key{font-size:8px;color:#5b6d60}h1{font-size:22px;line-height:1.2;color:#183e31;margin:12px 0 4px}h2{font-size:11px;color:#183e31;margin:17px 0 9px;break-after:avoid}.subtitle{color:#65786b;font-size:9px;margin-bottom:16px}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:10px 0}th,td{border:1px solid #c5d0c7;padding:7px 9px;vertical-align:top;overflow-wrap:anywhere}td strong,.signature strong,.signature span,.closing strong,.closing .key{display:block}.key{display:block;margin-bottom:3px}td strong{font-size:10px;font-weight:600}th{background:#edf3e8;color:#183e31;font-weight:600;text-align:left}thead{display:table-header-group}tr,figure,.closing{break-inside:avoid}.budget th:first-child{width:56%}.money{white-space:nowrap;text-align:right}.prose{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;margin:8px 0 16px}.closing{display:flex;gap:24px;justify-content:space-between;margin:20px 0 14px;align-items:flex-end}.closing>div{flex:1;min-width:0}.signature{text-align:center}.signature img{height:70px;width:100%;object-fit:contain}.signature strong{border-top:1px solid #87998a;padding-top:6px}.signature-space{height:70px}.signature span{font-size:8px;color:#5b6d60}.notice{font-size:8px;color:#5b6d60}.bank{break-before:page;padding-top:10px}.bank h2{font-size:16px}.bank-lines{height:100mm;background:repeating-linear-gradient(transparent 0,transparent 31px,#d6dfd8 32px)}.photo-section{break-before:page}.photo-section h2{font-size:20px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:18px 14px}.photo-frame{height:100mm;background:#17231d;position:relative}.photo-frame img{width:100%;height:100%;object-fit:contain}.photo-stamp{position:absolute;bottom:0;left:0;right:0;padding:8px;background:rgba(0,0,0,.65);font-size:7px;color:#fff;overflow-wrap:anywhere}figure{margin:0}figcaption{font-size:9px;line-height:1.6;padding:7px 0;overflow-wrap:anywhere}.reference{font-size:7px;overflow-wrap:anywhere;margin-top:22px;color:#65786b}.footer{display:flex;justify-content:space-between;gap:12px;font-size:7px;border-top:1px solid #aabbaa;padding-top:8px;margin-top:12px;break-inside:avoid}.draft{background:#fff1de;padding:8px 12px;color:#8a4800;font-weight:600}.deadline{background:#f1f5ed;padding:10px}@media screen and (max-width:600px){.photos{grid-template-columns:1fr}.company-logo{width:130px}.closing{flex-wrap:wrap}.closing>div{flex-basis:100%}}@media print{.prose{orphans:3;widows:3}}
  </style></head><body><header><div class="paf-brand">${logo}<div><div class="brand">PAF VNA</div><div class="small">Parceria de Agricultura Familiar</div></div></div>${company}</header>
  ${collection.syncStatus === "draft" ? '<div class="draft">RASCUNHO \xB7 documento ainda n\xE3o conclu\xEDdo</div>' : ""}<h1>${release ? "Laudo de acompanhamento" : "Notifica\xE7\xE3o ao produtor"}</h1><div class="subtitle">${release ? `${text("numeroParcela")}\xAA libera\xE7\xE3o de parcela e ATER` : "Vila Nova Agroindustrial \xB7 Parceria de Agricultura Familiar"}</div>
  ${release ? releaseBody : notificationBody}
  ${photos ? `<section class="photo-section"><div class="small">${text("nomeProdutor")} \xB7 ${text("numeroDocumento")}</div><h2>Registro fotogr\xE1fico</h2><div class="photos">${photos}</div></section>` : ""}
  <div class="reference">Registro: ${escapeReportHtml(collection.remoteId || collection.clientId || collection.id)} \xB7 Emitido por ${escapeReportHtml(options.signerName || a.tecnicoResponsavel)} em ${escapeReportHtml((options.generatedAt || /* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Belem" }))}</div><footer class="footer"><span>Vila Nova Agroindustrial \xB7 PAF VNA</span><span>${DEVELOPER_CREDIT}</span></footer></body></html>`;
}

// ../paf-app/src/reports/visitReport.ts
function answer(value) {
  if (Array.isArray(value)) return value.join(", ") || "N\xE3o informado";
  if (typeof value === "boolean") return value ? "Sim" : "N\xE3o";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return displayVisitDate(value);
  return value === void 0 || value === "" ? "N\xE3o informado" : String(value);
}
var timestamp = (value) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Belem" });
function buildVisitReportHtml(data, collection, options = {}) {
  if (isPafDocument(collection.formId)) return buildPafDocumentHtml(data, collection, options);
  const h = escapeReportHtml, identity = collectionIdentity(data, collection);
  const form = data.forms.find((item) => item.id === collection.formId);
  const repeatedIdentity = /* @__PURE__ */ new Set(["dataVisita", "tecnicoResponsavel", "municipio", "denominacaoImovel"]);
  const fields = form ? visitDisplayFields(form, collection.answers).filter((field2) => !repeatedIdentity.has(field2.id)) : [];
  const sections = [...new Set(fields.map((field2) => field2.section || "Dados da visita"))];
  const status = collection.syncStatus === "draft" ? "Rascunho \xB7 n\xE3o enviado" : collection.syncStatus !== "synced" ? "Aguardando sincroniza\xE7\xE3o" : collection.reviewStatus === "approved" ? "Validada pela equipe" : collection.reviewStatus === "rejected" ? "Ajuste solicitado" : "Recebida \xB7 aguardando valida\xE7\xE3o";
  const generated = options.generatedAt || /* @__PURE__ */ new Date();
  const reference = collection.remoteId || collection.clientId || collection.id;
  const logo = safePng(options.logo) ? `<img class="logo" src="${options.logo}" alt="PAF" />` : "";
  const companyLogo = safePng(options.companyLogo) ? `<img class="company-logo" src="${options.companyLogo}" alt="Vila Nova Agroindustrial" />` : '<strong class="company-name">VILA NOVA<br><small>AGROINDUSTRIAL</small></strong>';
  const fonts = [[options.fontRegular, 400], [options.fontSemibold, 600]].map(([uri, weight]) => typeof uri === "string" && uri.length < 5e5 && /^data:font\/woff2;base64,[A-Za-z0-9+/=]+$/.test(uri) ? `@font-face{font-family:Report;src:url("${uri}") format("woff2");font-weight:${weight};font-style:normal}` : "").join("");
  const hasGps = Number.isFinite(collection.latitude) && Number.isFinite(collection.longitude);
  const gps = hasGps ? `${collection.latitude.toFixed(6)}, ${collection.longitude.toFixed(6)}` : "N\xE3o registrada";
  const map = hasGps ? `https://www.google.com/maps?q=${collection.latitude},${collection.longitude}` : "";
  const meta = (key, value) => `<div><dt>${h(key)}</dt><dd>${h(value)}</dd></div>`;
  const signatures = options.evidenceSignatures ?? [];
  const signedEvidence = signatures.map((item) => `<div class="signature">${safePng(item.dataUrl) ? `<img alt="Assinatura registrada na visita" src="${item.dataUrl}" />` : '<div class="missing-signature">Assinatura indispon\xEDvel nesta emiss\xE3o</div>'}<div class="signer">${h(item.signerName)}</div><div class="small">${item.role === "technician" ? "T\xE9cnico respons\xE1vel" : "Pessoa que acompanhou a visita"}${item.relationship ? ` \xB7 ${h(item.relationship)}` : ""}<br>${h(timestamp(item.capturedAt))}</div></div>`).join("");
  const additionalSignature = !signatures.length || safePng(options.signature) && !signatures.some((item) => item.signerName.trim().toLocaleLowerCase("pt-BR") === (options.signerName || identity.technician).trim().toLocaleLowerCase("pt-BR"));
  const photos = (options.photos || []).map((photo, index) => {
    const valid = photo.dataUrl && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.dataUrl);
    return `<figure><div class="photo-frame">${valid ? `<img src="${photo.dataUrl}" alt="Evid\xEAncia ${index + 1}" /><div class="photo-stamp">${(photo.stamp || [identity.name, `T\xE9cnico: ${identity.technician}`, photo.caption]).map((line) => `<div>${h(line)}</div>`).join("")}</div>` : '<div class="missing">Foto indispon\xEDvel nesta emiss\xE3o. O original n\xE3o foi alterado.</div>'}</div><figcaption>${h(photo.caption)}</figcaption></figure>`;
  }).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  ${fonts}${visitReportStyles}
  </style></head><body><header><div class="paf-brand">${logo}<div><div class="brand">PAF VNA</div><div class="small">Parceria de<br>Agricultura Familiar</div></div></div>${companyLogo}</header>
  <div class="report-title"><div><div class="eyebrow">ACOMPANHAMENTO T\xC9CNICO / CAMPO</div><h1>Relat\xF3rio de<br>visita t\xE9cnica<span>.</span></h1></div><div class="visit-date"><span>DATA DA VISITA</span><strong>${h(displayVisitDate(visitDate(collection)))}</strong><div class="status">${h(status)}</div></div></div>
  <div class="producer-band"><div><span>PRODUTOR / COMUNIDADE</span><strong>${h(identity.name)}</strong></div><div class="program"><span>MODALIDADE</span><strong>${h(identity.program)}</strong></div></div>
  <dl class="identity">${meta("Propriedade", identity.property || "N\xE3o informada")}${meta("Munic\xEDpio", identity.municipality || "N\xE3o informado")}${meta("T\xE9cnico respons\xE1vel", identity.technician)}</dl>
  <div class="evidence-summary"><div><strong>${hasGps ? "GPS registrado" : "Sem GPS"}</strong><span>Localiza\xE7\xE3o da visita</span></div><div><strong>${(options.photos || []).length} fotos</strong><span>Evid\xEAncias fotogr\xE1ficas</span></div><div><strong>${signatures.length} assinaturas</strong><span>Evid\xEAncias registradas</span></div></div>
  ${sections.map((section, index) => `<section><h2><span class="section-number">${String(index + 1).padStart(2, "0")}</span>${h(section.replace(/^\d+\.\s*/, ""))}</h2><div class="fields">${fields.filter((field2) => (field2.section || "Dados da visita") === section).map((field2) => `<div class="field ${field2.type === "multiline" || field2.type === "multi_select" ? "wide" : ""}"><div class="key">${h(field2.label)}</div><div class="response">${h(answer(collection.answers[field2.id]))}</div></div>`).join("")}</div></section>`).join("")}
  ${collection.notes ? `<h2>Observa\xE7\xF5es complementares</h2><div class="note">${h(collection.notes)}</div>` : ""}${collection.reviewNote ? `<h2>Parecer da equipe</h2><div class="note">${h(collection.reviewNote)}</div>` : ""}
  <section><h2>Localiza\xE7\xE3o da visita</h2><p>${h(gps)}${map ? ` \xB7 <a href="${h(map)}">Consultar ponto no Google Maps</a>` : ""}</p>${collection.areaVerification ? `<div class="response">${collection.areaVerification.points.map((point) => `${h(point.label)}: ${point.distanceMeters === 0 ? "dentro da \xE1rea" : `${Math.round(point.distanceMeters)} m do pol\xEDgono`}`).join(" \xB7 ")}<br>${collection.areaVerification.displacement ? `Deslocamento de \xE1rea: ${h(collection.areaVerification.justification)}` : "Toler\xE2ncia de confer\xEAncia: 50 m."}</div>` : ""}</section>
  <section><h2>Assinaturas da visita</h2><div class="signature-grid">${signedEvidence}${additionalSignature ? `<div class="signature">${safePng(options.signature) ? `<img alt="Assinatura manuscrita" src="${options.signature}" />` : '<div class="missing-signature">Assinatura ap\xF3s impress\xE3o</div>'}<div class="signer">${h(options.signerName || identity.technician)}</div><div class="small">Respons\xE1vel pela emiss\xE3o</div></div>` : ""}</div><p class="notice">Assinaturas manuscritas registradas como evid\xEAncias da visita. N\xE3o substituem assinatura digital certificada.<br>Documento emitido por ${h(options.signerName || identity.technician)} em ${h(timestamp(generated))}.</p></section>
  ${photos ? `<section class="photo-section"><div class="small">PAF VNA \xB7 ${h(identity.name)} \xB7 ${h(displayVisitDate(visitDate(collection)))}</div><h2>Evid\xEAncias da visita</h2><div class="photos">${photos}</div><p class="notice">Identifica\xE7\xE3o sobreposta para leitura. Fotos originais e metadados s\xE3o preservados. Hor\xE1rios no fuso do Par\xE1 (UTC\u22123).</p></section>` : ""}
  <div class="document-reference"><strong>RASTREABILIDADE DO REGISTRO</strong><span>${h(reference)}</span><span>Emiss\xE3o: ${h(timestamp(generated))}</span></div><footer class="footer"><span>Vila Nova Agroindustrial \xB7 PAF VNA</span><span>${DEVELOPER_CREDIT}</span></footer></body></html>`;
}

// ../paf-app/node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new TypeError("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var oidNist = (suffix) => ({
  // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
  // Larger suffix values would need base-128 OID encoding and a different length byte.
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../paf-app/node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// ../paf-app/node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.destroyed = true;
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// ../paf-app/src/domain/visitSignatures.ts
function signatureContentHash(value) {
  const ordered = (value2) => Array.isArray(value2) ? value2.map(ordered) : value2 && typeof value2 === "object" ? Object.fromEntries(Object.entries(value2).filter(([, item]) => item !== void 0).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, ordered(item)])) : value2;
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify(ordered(value)))));
}
export {
  NOTIFICATION_FORM_ID,
  RELEASE_FORM_ID,
  blankBudgetItem,
  budgetTotalCents,
  buildVisitReportHtml,
  documentAnswerText,
  documentIdentityAnswers,
  documentSignatureRoles,
  formatMoney,
  initialDocumentAnswers,
  isPafDocument,
  moneyCents,
  normalizeFormAnswers,
  pafDocumentForms,
  readBudgetItems,
  signatureContentHash,
  validateDocumentAnswers,
  validateFormAnswers
};
