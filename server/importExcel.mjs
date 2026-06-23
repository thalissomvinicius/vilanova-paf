import path from "node:path";
import process from "node:process";
import { readSheet } from "read-excel-file/node";
import {
  makeProducerToken,
  normalizeCpfDigits,
  normalizeStatus,
  normalizeText,
  toIntegerOrNull,
  toNumberOrNull,
  upsertProducer
} from "./db.mjs";

const fileArg = process.argv[2];
const workbookPath = fileArg
  ? path.resolve(process.cwd(), fileArg)
  : path.resolve(process.cwd(), "../PROJETOS INTERNALIZADOS PAF 26_27.xlsx");

let rows;

try {
  rows = await readSheet(workbookPath, "Plan1");
} catch {
  rows = await readSheet(workbookPath);
}

const headerColumns = new Map(
  (rows[0] || [])
    .map((value, index) => [normalizeHeader(value), index])
    .filter(([header]) => header)
);

let imported = 0;

for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
  const row = rows[rowIndex];
  const name = normalizeText(cellByHeader(row, headerColumns, ["NOME:", "NOME"]));
  const cpf = normalizeText(cellByHeader(row, headerColumns, ["CPF:", "CPF"]));
  const cpfDigits = normalizeCpfDigits(cpf);
  const originalRow = rowIndex + 1;

  if (!name) {
    continue;
  }

  const producer = {
    token: makeProducerToken({ cpfDigits, name, originalRow }),
    name,
    cpf,
    cpfDigits,
    address: normalizeText(cellByHeader(row, headerColumns, ["ENDEREÇO", "ENDERECO"])),
    agency: normalizeText(cellByHeader(row, headerColumns, ["AGENCIA:", "AGENCIA"])),
    areaHa: toNumberOrNull(cellByHeader(row, headerColumns, ["TAMANHO DA AREA (HÁ)"])) ?? 0,
    processStatus: normalizeStatus(cellByHeader(row, headerColumns, ["STATUS DO PROCESSO"])),
    plantingYear: toIntegerOrNull(cellByHeader(row, headerColumns, ["ANO PLANTIO"])),
    designer: normalizeText(cellByHeader(row, headerColumns, ["PROJETISTA"])),
    originalRow
  };

  upsertProducer(producer);
  imported += 1;
}

console.log(`Importação concluída: ${imported} produtores em ${workbookPath}`);

function cellByHeader(row, headers, names) {
  for (const name of names) {
    const columnIndex = headers.get(normalizeHeader(name));
    if (columnIndex !== undefined) {
      return cellValue(row[columnIndex]);
    }
  }

  return "";
}

function normalizeHeader(value) {
  return normalizeText(cellValue(value)).toUpperCase();
}

function cellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object") {
    if ("result" in value) return value.result ?? "";
    if ("text" in value) return value.text ?? "";
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("hyperlink" in value && "text" in value) return value.text;
  }

  return value;
}
