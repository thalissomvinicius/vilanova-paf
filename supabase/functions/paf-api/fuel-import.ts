import { readSheet } from "npm:read-excel-file@9.3.1/browser";
import { normalizeDate, normalizeText, sha256Hex, toIntegerOrNull } from "./core.ts";
import type { PafRepository } from "./repository.ts";

type Row = unknown[];

export async function importFuelWorkbook(payload: Record<string, any>, repository: PafRepository, actorName: string) {
  const fileName = normalizeText(payload.fileName) || "controle-abastecimento.xlsx";
  if (!/\.(xlsx|xlsm)$/i.test(fileName)) throw new Error("Formato inválido. Use .xlsx ou .xlsm.");
  const bytes = decodeBase64(payload.fileBase64);
  if (!bytes.length) throw new Error("Envie uma planilha válida.");
  if (bytes.length > 8 * 1024 * 1024) throw new Error("A planilha excede o limite de 8 MB.");

  const blob = new Blob([bytes], { type: payload.fileMime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const [vehicleRows, controlRows] = await Promise.all([
    readSheet(blob, "INFORMAÇÕES").catch(() => [] as Row[]),
    readSheet(blob, "CONTROLE")
  ]);

  const vehiclePayloads = parseVehicleRows(vehicleRows as Row[]);
  const recordPayloads = await parseRecordRows(controlRows as Row[], fileName);
  let importedVehicles = 0;
  let importedRecords = 0;
  let skippedRecords = Math.max(0, (controlRows?.length || 1) - 1 - recordPayloads.length);

  for (const chunk of chunks(vehiclePayloads, 12)) {
    const results = await Promise.all(chunk.map((vehicle) => repository.upsertFuelVehicle(vehicle)));
    importedVehicles += results.filter(Boolean).length;
  }

  for (const chunk of chunks(recordPayloads, 12)) {
    const results = await Promise.allSettled(chunk.map((record) => repository.createFuelRecord(record, record.sourceKey)));
    importedRecords += results.filter((result) => result.status === "fulfilled").length;
    skippedRecords += results.filter((result) => result.status === "rejected").length;
  }

  await repository.registerImportBatch({
    import_type: "ABASTECIMENTO",
    file_name: fileName,
    rows_received: Math.max(0, (controlRows?.length || 1) - 1),
    rows_imported: importedRecords,
    rows_rejected: skippedRecords,
    imported_by: actorName,
    details: { importedVehicles }
  });

  return { sourceFile: fileName, importedVehicles, importedRecords, skippedRecords };
}

function parseVehicleRows(rows: Row[]) {
  if (rows.length < 2) return [];
  const headers = buildHeaderIndex(rows[0]);
  return rows.slice(1).map((row) => ({
    costCenter: cellByHeader(row, headers, ["C.C", "CC"]),
    department: cellByHeader(row, headers, ["DEPARTAMENTO"]),
    category: cellByHeader(row, headers, ["TIPO"], { occurrence: 0 }),
    area: cellByHeader(row, headers, ["ÁREA", "AREA"]),
    vehicle: cellByHeader(row, headers, ["VEÍCULO", "VEICULO"]),
    plate: cellByHeader(row, headers, ["PLACA"]),
    assignedTo: cellByHeader(row, headers, ["COLUNA1", "RESPONSÁVEL", "RESPONSAVEL"]),
    quotaLiters: cellByHeader(row, headers, ["COTA"]),
    fleetType: cellByHeader(row, headers, ["TIPO"], { last: true })
  })).filter((vehicle) => normalizeText(vehicle.plate));
}

async function parseRecordRows(rows: Row[], sourceFile: string) {
  if (rows.length < 2) return [];
  const headers = buildHeaderIndex(rows[0]);
  const parsed: Array<Record<string, any>> = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const sourceRow = index + 1;
    const driver = normalizeText(cellByHeader(row, headers, ["CONDUTOR"]));
    const plate = normalizeText(cellByHeader(row, headers, ["PLACA"]));
    if (!driver && !plate) continue;
    const servedDate = normalizeExcelDate(cellByHeader(row, headers, ["DATA ATENDIDA"]));
    const requestedLiters = cellByHeader(row, headers, ["QUANT. SOLICITADA"]);
    const suppliedLiters = cellByHeader(row, headers, ["QUANT. ATENDIDA"]);
    const kmStart = cellByHeader(row, headers, ["KM 0"]);
    const kmEnd = cellByHeader(row, headers, ["KM 1"]);
    const identity = [sourceFile, "CONTROLE", sourceRow, driver, plate, servedDate, requestedLiters, suppliedLiters, kmStart, kmEnd]
      .map(normalizeText)
      .join("|");
    parsed.push({
      sourceKey: (await sha256Hex(identity)).slice(0, 24),
      sourceFile,
      sourceRow,
      year: toIntegerOrNull(cellByHeader(row, headers, ["ANO"])),
      month: cellByHeader(row, headers, ["MÊS", "MES"]),
      driver,
      plate,
      vehicleResponsible: cellByHeader(row, headers, ["RESPONSAVEL VEICULO", "RESPONSÁVEL VEÍCULO"]),
      servedDate,
      requestedLiters,
      suppliedLiters,
      kmStart,
      kmEnd,
      kmDriven: cellByHeader(row, headers, ["KM RODADO"]),
      kmPerLiter: cellByHeader(row, headers, ["MEDIA KM/L", "MÉDIA KM/L"]),
      requisition: cellByHeader(row, headers, ["REQUISIÇÃO", "REQUISICAO"]),
      notes: cellByHeader(row, headers, ["OBS:", "OBS"]),
      quantity: cellByHeader(row, headers, ["QUANTIDADE"]),
      location: cellByHeader(row, headers, ["LOCAL DO ABASTECIMENTO"]),
      quotaLiters: cellByHeader(row, headers, ["COTA"])
    });
  }
  return parsed;
}

function buildHeaderIndex(row: Row) {
  const headers = new Map<string, number[]>();
  row.forEach((value, index) => {
    const header = normalizeHeader(value);
    if (!header) return;
    const indexes = headers.get(header) || [];
    indexes.push(index);
    headers.set(header, indexes);
  });
  return headers;
}

function cellByHeader(row: Row, headers: Map<string, number[]>, names: string[], options: { occurrence?: number; last?: boolean } = {}) {
  for (const name of names) {
    const indexes = headers.get(normalizeHeader(name)) || [];
    if (!indexes.length) continue;
    const index = options.last ? indexes[indexes.length - 1] : indexes[options.occurrence || 0];
    if (index !== undefined) return cellValue(row[index]);
  }
  return "";
}

function normalizeHeader(value: unknown) {
  return normalizeText(cellValue(value)).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function normalizeExcelDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  }
  return normalizeDate(value) || "";
}

function cellValue(value: any) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("result" in value) return value.result ?? "";
    if ("text" in value) return value.text ?? "";
    if (Array.isArray(value.richText)) return value.richText.map((part: any) => part.text).join("");
  }
  return value;
}

function decodeBase64(value: unknown) {
  const source = String(value || "").includes(",") ? String(value).split(",").pop() || "" : String(value || "");
  try {
    const binary = atob(source);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}
