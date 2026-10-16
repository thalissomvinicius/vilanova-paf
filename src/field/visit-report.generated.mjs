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

// ../paf-app/src/domain/forms.ts
var TECHNICAL_ASSISTANCE_FORM_ID = "assistencia-tecnica-propriedade";

// ../paf-app/src/domain/visitPresentation.ts
function producerProgram(value) {
  if (!value?.trim()) return "Modalidade n\xE3o informada";
  return value.split(/\s*[|;,]\s*/).map((part) => ({ PRONAF: "Pronaf", PARCERIA: "Parceria", PRODUTIVO: "Produtivo" })[part.trim().toUpperCase()] || part.trim()).filter(Boolean).join(" \xB7 ");
}
function visitDisplayFields(form, answers) {
  return form.fields.filter((field) => {
    if (form.id !== TECHNICAL_ASSISTANCE_FORM_ID) return true;
    if (field.id === "outraAtividade") return Array.isArray(answers.atividadesManutencao) && answers.atividadesManutencao.includes("Outros");
    if (field.id === "outroVinculoParticipante") return answers.vinculoParticipante === "Outro";
    return true;
  });
}

// ../paf-app/src/domain/visitHistory.ts
function visitDate(collection) {
  try {
    return localDateKey(parseActivityDate(String(collection.answers.dataVisita || collection.createdAt.slice(0, 10))));
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

// ../paf-app/src/reports/visitReport.ts
function safePng(value) {
  return Boolean(value && value.length < 25e5 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value));
}
function escapeReportHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function answer(value) {
  if (Array.isArray(value)) return value.join(", ") || "N\xE3o informado";
  if (typeof value === "boolean") return value ? "Sim" : "N\xE3o";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return displayVisitDate(value);
  return value === void 0 || value === "" ? "N\xE3o informado" : String(value);
}
var timestamp = (value) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Belem" });
function buildVisitReportHtml(data, collection, options = {}) {
  const h = escapeReportHtml, identity = collectionIdentity(data, collection);
  const form = data.forms.find((item) => item.id === collection.formId);
  const repeatedIdentity = /* @__PURE__ */ new Set(["dataVisita", "tecnicoResponsavel", "municipio", "denominacaoImovel"]);
  const fields = form ? visitDisplayFields(form, collection.answers).filter((field) => !repeatedIdentity.has(field.id)) : [];
  const sections = [...new Set(fields.map((field) => field.section || "Dados da visita"))];
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
  ${sections.map((section, index) => `<section><h2><span class="section-number">${String(index + 1).padStart(2, "0")}</span>${h(section.replace(/^\d+\.\s*/, ""))}</h2><div class="fields">${fields.filter((field) => (field.section || "Dados da visita") === section).map((field) => `<div class="field ${field.type === "multiline" || field.type === "multi_select" ? "wide" : ""}"><div class="key">${h(field.label)}</div><div class="response">${h(answer(collection.answers[field.id]))}</div></div>`).join("")}</div></section>`).join("")}
  ${collection.notes ? `<h2>Observa\xE7\xF5es complementares</h2><div class="note">${h(collection.notes)}</div>` : ""}${collection.reviewNote ? `<h2>Parecer da equipe</h2><div class="note">${h(collection.reviewNote)}</div>` : ""}
  <section><h2>Localiza\xE7\xE3o da visita</h2><p>${h(gps)}${map ? ` \xB7 <a href="${h(map)}">Consultar ponto no Google Maps</a>` : ""}</p>${collection.areaVerification ? `<div class="response">${collection.areaVerification.points.map((point) => `${h(point.label)}: ${point.distanceMeters === 0 ? "dentro da \xE1rea" : `${Math.round(point.distanceMeters)} m do pol\xEDgono`}`).join(" \xB7 ")}<br>${collection.areaVerification.displacement ? `Deslocamento de \xE1rea: ${h(collection.areaVerification.justification)}` : "Toler\xE2ncia de confer\xEAncia: 50 m."}</div>` : ""}</section>
  <section><h2>Assinaturas da visita</h2><div class="signature-grid">${signedEvidence}${additionalSignature ? `<div class="signature">${safePng(options.signature) ? `<img alt="Assinatura manuscrita" src="${options.signature}" />` : '<div class="missing-signature">Assinatura ap\xF3s impress\xE3o</div>'}<div class="signer">${h(options.signerName || identity.technician)}</div><div class="small">Respons\xE1vel pela emiss\xE3o</div></div>` : ""}</div><p class="notice">Assinaturas manuscritas registradas como evid\xEAncias da visita. N\xE3o substituem assinatura digital certificada.<br>Documento emitido por ${h(options.signerName || identity.technician)} em ${h(timestamp(generated))}.</p></section>
  ${photos ? `<section class="photo-section"><div class="small">PAF VNA \xB7 ${h(identity.name)} \xB7 ${h(displayVisitDate(visitDate(collection)))}</div><h2>Evid\xEAncias da visita</h2><div class="photos">${photos}</div><p class="notice">Identifica\xE7\xE3o sobreposta para leitura. Fotos originais e metadados s\xE3o preservados. Hor\xE1rios no fuso do Par\xE1 (UTC\u22123).</p></section>` : ""}
  <div class="document-reference"><strong>RASTREABILIDADE DO REGISTRO</strong><span>${h(reference)}</span><span>Emiss\xE3o: ${h(timestamp(generated))}</span></div><footer class="footer"><span>Vila Nova Agroindustrial \xB7 PAF VNA</span><span>${DEVELOPER_CREDIT}</span></footer></body></html>`;
}
export {
  buildVisitReportHtml,
  escapeReportHtml,
  safePng
};
