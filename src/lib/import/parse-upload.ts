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
    const first = wb.SheetNames[0];
    if (!first) return { rows: [], error: "File has no sheets." };
    const ws = wb.Sheets[first];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });
    return { rows: raw.map(normalizeKeys) };
  } catch {
    return { rows: [], error: "Could not read file. Use Excel, CSV, or JSON." };
  }
}
