"use client";

import * as XLSX from "xlsx";

export type ParsedUpload = {
  rows: Record<string, string>[];
  error?: string;
};

function stringifyCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim();
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function normalizeKeys(row: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = String(k || "").trim();
    if (!key) continue;
    out[key] = stringifyCell(v);
  }
  return out;
}

function rowsFromSheet(ws: XLSX.WorkSheet): Record<string, string>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  return raw.map(normalizeKeys);
}

/** Prefer the sheet that looks like form responses (headers + data), not cover/instructions. */
function pickBestSheetRows(wb: XLSX.WorkBook): Record<string, string>[] {
  let best: Record<string, string>[] = [];
  let bestScore = -1;
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = rowsFromSheet(ws);
    if (rows.length === 0) continue;
    const headerBlob = Object.keys(rows[0] ?? {})
      .join(" ")
      .toLowerCase();
    let score = rows.length;
    if (headerBlob.includes("email")) score += 80;
    if (headerBlob.includes("church") || headerBlob.includes("affiliation")) score += 80;
    if (headerBlob.includes("address") || headerBlob.includes("phone")) score += 40;
    if (score > bestScore) {
      bestScore = score;
      best = rows;
    }
  }
  if (best.length > 0) return best;
  const first = wb.SheetNames[0];
  return first && wb.Sheets[first] ? rowsFromSheet(wb.Sheets[first]) : [];
}

export async function parseUploadFile(file: File): Promise<ParsedUpload> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) {
        return { rows: [], error: "JSON must be an array of objects." };
      }
      const rows = parsed
        .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
        .map(normalizeKeys);
      return { rows };
    } catch {
      return { rows: [], error: "Invalid JSON file." };
    }
  }

  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    if (!wb.SheetNames.length) return { rows: [], error: "File has no sheets." };
    const rows = pickBestSheetRows(wb);
    return { rows };
  } catch {
    return { rows: [], error: "Could not read file. Use Excel, CSV, or JSON." };
  }
}
