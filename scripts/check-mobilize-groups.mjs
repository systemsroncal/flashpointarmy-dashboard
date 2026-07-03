/**
 * Quick check: Mobilize group counts + migration 054 status.
 * Usage: node scripts/check-mobilize-groups.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const host = new URL(url).hostname;
const { count: total, error: totalErr } = await admin
  .from("mobilize_groups")
  .select("id", { count: "exact", head: true });
const { count: withRegion, error: regionErr } = await admin
  .from("mobilize_groups")
  .select("id", { count: "exact", head: true })
  .not("region_code", "is", null);
const { error: colErr } = await admin.from("mobilize_groups").select("resources_post_policy").limit(0);

console.log(`Supabase: ${host}`);
console.log(`mobilize_groups total: ${totalErr ? totalErr.message : total ?? 0}`);
console.log(`with region_code (state chapters): ${regionErr ? regionErr.message : withRegion ?? 0}`);
console.log(
  `migration 054 (resources_post_policy): ${colErr ? "MISSING" : "applied"}`
);
