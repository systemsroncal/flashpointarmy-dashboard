/**
 * Sets password to FLASHPOINT and require_password_change on auth for users who have
 * member or local_leader and are not admin/super_admin.
 *
 * Usage (PowerShell):
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/bulk-flashpoint-password-members-leaders.mjs
 *
 * Dry run (no updates):
 *   $env:DRY_RUN="1"
 *   node scripts/bulk-flashpoint-password-members-leaders.mjs
 *
 * Optional: loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from `.env.local`
 * then `.env.production` in the project root when env vars are unset (VPS often only has the latter).
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_PASSWORD = "FLASHPOINT";

function loadEnvFile(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function loadEnvFromProjectRoot() {
  loadEnvFile(".env.local");
  loadEnvFile(".env.production");
}

async function collectTargetUserIds(admin) {
  const { data: roles, error: rErr } = await admin.from("roles").select("id,name").in("name", [
    "member",
    "local_leader",
    "admin",
    "super_admin",
  ]);
  if (rErr) throw new Error(rErr.message);
  const idByName = new Map((roles ?? []).map((r) => [r.name, r.id]));

  const { data: ur, error: uErr } = await admin.from("user_roles").select("user_id,role_id");
  if (uErr) throw new Error(uErr.message);

  const adminish = new Set(
    [idByName.get("admin"), idByName.get("super_admin")].filter(Boolean).map(String)
  );
  const memberish = new Set(
    [idByName.get("member"), idByName.get("local_leader")].filter(Boolean).map(String)
  );

  const elevatedUsers = new Set();
  const candidateUsers = new Set();
  for (const row of ur ?? []) {
    const uid = String(row.user_id);
    const rid = String(row.role_id);
    if (adminish.has(rid)) elevatedUsers.add(uid);
    if (memberish.has(rid)) candidateUsers.add(uid);
  }

  const out = [];
  for (const uid of candidateUsers) {
    if (!elevatedUsers.has(uid)) out.push(uid);
  }
  return out.sort();
}

async function main() {
  loadEnvFromProjectRoot();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const dry = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ids = await collectTargetUserIds(admin);
  console.log(`Target users (member or local_leader, not admin/super_admin): ${ids.length}`);
  if (dry) {
    console.log("DRY_RUN=1 — no updates performed.");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;
  for (const userId of ids) {
    const { data: u, error: gErr } = await admin.auth.admin.getUserById(userId);
    if (gErr || !u?.user) {
      console.warn(`skip getUser ${userId}: ${gErr?.message || "not found"}`);
      fail += 1;
      continue;
    }
    const prevMeta = (u.user.user_metadata ?? {}) ?? {};
    const user_metadata = { ...prevMeta, require_password_change: true };
    const { error: upErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEFAULT_PASSWORD,
      user_metadata,
    });
    if (upErr) {
      console.warn(`fail ${userId}: ${upErr.message}`);
      fail += 1;
    } else {
      ok += 1;
    }
  }
  console.log(`Done. Updated: ${ok}. Failed: ${fail}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
