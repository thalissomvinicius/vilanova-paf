import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readSheet } from "read-excel-file/node";
import {
  makeFuelSourceKey,
  normalizeText,
  toIntegerOrNull,
  toNumberOrNull,
  upsertFuelRecord,
  upsertFuelVehicle
} from "./db.mjs";

const DEFAULT_FILE_NAME = "2025 Controle_de_abastecimento_PAF.xlsm";

export async function importFuelWorkbook(workbookPath, options = {}) {
  const resolvedPath = resolveWorkbookPath(workbookPath);
  const sourceFile = normalizeText(options.sourceFile) || path.basename(resolvedPath);

  const vehicleRows = await readSheet(resolvedPath, "INFORMAÇÕES").catch(() => []);
  const controlRows = await readSheet(resolvedPath, "CONTROLE");

  const importedVehicles = importVehicleRows(vehicleRows);
  const recordResult = importRecordRows(controlRows, sourceFile);

  return {
    sourceFile,
    workbookPath: resolvedPath,
    importedVehicles,
    ...recordResult
  };
}

function importVehicleRows(rows = []) {
  if (!rows.length) return 0;

  const headers = buildHeaderIndex(rows[0] || []);
  let imported = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const plate = normalizeText(cellByHeader(row, headers, ["PLACA"]));

    if (!plate) {
      continue;
    }

    const vehicle = upsertFuelVehicle({
      costCenter: cellByHeader(row, headers, ["C.C", "CC"]),
      department: cellByHeader(row, headers, ["DEPARTAMENTO"]),
      category: cellByHeader(row, headers, ["TIPO"], { occurrence: 0 }),
      area: cellByHeader(row, headers, ["ÁREA", "AREA"]),
      vehicle: cellByHeader(row, headers, ["VEÍCULO", "VEICULO"]),
      plate,
      assignedTo: cellByHeader(row, headers, ["COLUNA1", "RESPONSÁVEL", "RESPONSAVEL"]),
      quotaLiters: cellByHeader(row, headers, ["COTA"]),
      fleetType: cellByHeader(row, headers, ["TIPO"], { last: true })
    });

    if (vehicle) imported += 1;
  }

  return imported;
}

function importRecordRows(rows = [], sourceFile) {
  if (!rows.length) {
    return { importedRecords: 0, skippedRecords: 0 };
  }

  const headers = buildHeaderIndex(rows[0] || []);
  let importedRecords = 0;
  let skippedRecords = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const sourceRow = rowIndex + 1;
    const driver = normalizeText(cellByHeader(row, headers, ["CONDUTOR"]));
    const plate = normalizeText(cellByHeader(row, headers, ["PLACA"]));
    const servedDate = normalizeDateValue(cellByHeader(row, headers, ["DATA ATENDIDA"]));
    const requestedLiters = cellByHeader(row, headers, ["QUANT. SOLICITADA"]);
    const suppliedLiters = cellByHeader(row, headers, ["QUANT. ATENDIDA"]);

    if (!driver && !plate) {
      skippedRecords += 1;
      continue;
    }

    const record = upsertFuelRecord({
      sourceKey: makeFuelSourceKey([
        sourceFile,
        "CONTROLE",
        sourceRow,
        driver,
        plate,
        servedDate,
        requestedLiters,
        suppliedLiters,
        cellByHeader(row, headers, ["KM 0"]),
        cellByHeader(row, headers, ["KM 1"])
      ]),
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
      kmStart: cellByHeader(row, headers, ["KM 0"]),
      kmEnd: cellByHeader(row, headers, ["KM 1"]),
      kmDriven: cellByHeader(row, headers, ["KM RODADO"]),
      kmPerLiter: cellByHeader(row, headers, ["MEDIA KM/L", "MÉDIA KM/L"]),
      requisition: cellByHeader(row, headers, ["REQUISIÇÃO", "REQUISICAO"]),
      notes: cellByHeader(row, headers, ["OBS:", "OBS"]),
      quantity: cellByHeader(row, headers, ["QUANTIDADE"]),
      location: cellByHeader(row, headers, ["LOCAL DO ABASTECIMENTO"]),
      quotaLiters: cellByHeader(row, headers, ["COTA"])
    });

    if (record) {
      importedRecords += 1;
    } else {
      skippedRecords += 1;
    }
  }

  return { importedRecords, skippedRecords };
}

function resolveWorkbookPath(workbookPath) {
  const candidates = [
    workbookPath ? path.resolve(process.cwd(), workbookPath) : "",
    path.resolve(process.cwd(), "..", DEFAULT_FILE_NAME),
    path.join(os.homedir(), "Downloads", DEFAULT_FILE_NAME)
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(`Arquivo de abastecimento não encontrado. Informe o caminho do ${DEFAULT_FILE_NAME}.`);
  }

  return found;
}

function buildHeaderIndex(row = []) {
  const headers = new Map();

  row.forEach((value, index) => {
    const header = normalizeHeader(value);
    if (!header) return;
    if (!headers.has(header)) headers.set(header, []);
    headers.get(header).push(index);
  });

  return headers;
}

function cellByHeader(row, headers, names, options = {}) {
  for (const name of names) {
    const indexes = headers.get(normalizeHeader(name)) || [];
    if (!indexes.length) continue;
    const columnIndex = options.last ? indexes[indexes.length - 1] : indexes[options.occurrence || 0];
    if (columnIndex !== undefined) {
      return cellValue(row[columnIndex]);
    }
  }

  return "";
}

function normalizeHeader(value) {
  return normalizeText(cellValue(value))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function normalizeDateValue(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && value > 20000 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  }

  const text = normalizeText(value);
  const brazilian = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
}

function cellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object") {
    if ("result" in value) return value.result ?? "";
    if ("text" in value) return value.text ?? "";
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("hyperlink" in value && "text" in value) return value.text;
  }

  return value;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await importFuelWorkbook(process.argv[2]);
  console.log(
    `Importação de abastecimento concluída: ${result.importedRecords} registros e ${result.importedVehicles} veículos em ${result.workbookPath}`
  );
}
