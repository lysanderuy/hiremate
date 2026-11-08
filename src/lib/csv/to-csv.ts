export type CsvCell = string | number | null | undefined;

const BOM = "﻿";
const FORMULA_PREFIXES = new Set(["=", "+", "-", "@", "\t", "\r"]);

function formatCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  let text = String(cell);
  if (typeof cell === "string" && FORMULA_PREFIXES.has(text.charAt(0))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(","));
  return `${BOM}${lines.join("\r\n")}\r\n`;
}

export function csvFileName(prefix: string, date: Date = new Date()): string {
  const safe = prefix.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "export";
  return `${safe}_${date.toISOString().slice(0, 10)}.csv`;
}
