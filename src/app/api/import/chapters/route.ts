import { MODULE_SLUGS } from "@/config/modules";
import {
  containsTestText,
  parseCityFromAddress,
  parseZipFromAddress,
  pickField,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type Body = { rows?: FlatRow[] };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.chapters, "create")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, created: 0, omitted: 0, results: [] });
  }

  const admin = createAdminClient();
  const chapterNames = rows
    .map((r) => pickField(r, ["Church Affiliation", "Chapter name", "chapter name"]))
    .map((n) => n.trim())
    .filter(Boolean);
  const { data: existingRows } = await admin.from("chapters").select("name").in("name", chapterNames);
  const existing = new Set((existingRows ?? []).map((r) => r.name.trim().toLowerCase()));
  const batch = new Set<string>();
  const results: ImportResultItem[] = [];

  for (const row of rows) {
    const chapterName = pickField(row, ["Church Affiliation", "Chapter name", "chapter name"]).trim();
    const address = pickField(row, ["Address", "address"]);
    const city = parseCityFromAddress(address) || pickField(row, ["City", "city"]);
    const state = pickField(row, ["Church State", "State", "state"]).toUpperCase().slice(0, 2);
    const zip = parseZipFromAddress(address) || pickField(row, ["ZIP code", "Zip", "zip"]);
    const key = chapterName.toLowerCase();

    if (containsTestText(row)) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Contains test text." });
      continue;
    }
    if (!chapterName) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Missing chapter name." });
      continue;
    }
    if (existing.has(key) || batch.has(key)) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Duplicate chapter." });
      continue;
    }

    const { error } = await admin.from("chapters").insert({
      name: chapterName,
      address_line: address || null,
      city: city || null,
      state: state || "FL",
      zip_code: zip || null,
      status: "approved",
      created_by: user.id,
    });
    if (error) {
      results.push({ status: "omitted", chapter: chapterName, reason: error.message || "Insert failed." });
      continue;
    }
    batch.add(key);
    results.push({ status: "imported", chapter: chapterName });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
