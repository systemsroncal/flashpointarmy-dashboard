/**
 * Make every existing dashboard user follow a fixed list of target users.
 *
 * Targets (by email):
 *   - gene@fparmy.com
 *   - whutchins@champ.org
 *   - ricardo.a@dreamsanimation.com
 *
 * Uses the service-role key (bypasses RLS) so bulk inserts work in one pass.
 * Idempotent: uses upsert with onConflict on (follower_id, following_id), so
 * re-running will not create duplicates and will not error on existing rows.
 * The auto-follow check constraint (follower_id <> following_id) is respected
 * by filtering each target out of the follower pool.
 *
 * Usage (PowerShell):
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/mobilize-bulk-follow-targets.mjs
 *
 * Dry run (no writes):
 *   $env:DRY_RUN="1"
 *   node scripts/mobilize-bulk-follow-targets.mjs
 *
 * Override targets (comma-separated emails):
 *   $env:FOLLOW_TARGET_EMAILS="a@x.com,b@y.com"
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_TARGET_EMAILS = [
  "gene@fparmy.com",
  "whutchins@champ.org",
  "ricardo.a@dreamsanimation.com",
];

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

/** Resolve a single user id by email from the dashboard_users mirror. */
async function resolveUserId(admin, email) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin
    .from("dashboard_users")
    .select("id, email")
    .ilike("email", normalized)
    .maybeSingle();
  if (error) throw new Error(`lookup ${email}: ${error.message}`);
  if (data?.id) return { id: data.id, email: data.email };

  // Fallback: paginate auth.users in case mirror is stale.
  const perPage = 1000;
  for (let page = 1; page <= 50; page += 1) {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (authError) throw new Error(`auth listUsers: ${authError.message}`);
    const users = authData?.users ?? [];
    const match = users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (match?.id) return { id: match.id, email: match.email };
    if (users.length < perPage) break;
  }
  throw new Error(`User not found: ${email}`);
}

async function main() {
  loadEnvFromProjectRoot();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const dry = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

  const targetEmails = (process.env.FOLLOW_TARGET_EMAILS
    ? process.env.FOLLOW_TARGET_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
    : DEFAULT_TARGET_EMAILS
  );

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Resolving target users...");
  const targets = [];
  for (const email of targetEmails) {
    try {
      const { id } = await resolveUserId(admin, email);
      targets.push({ email, id });
      console.log(`  ${email} -> ${id}`);
    } catch (e) {
      console.error(`  ${email}: ${e.message}`);
    }
  }
  if (targets.length === 0) {
    console.error("No target users resolved. Aborting.");
    process.exit(1);
  }

  const targetIds = new Set(targets.map((t) => t.id));

  console.log("\nFetching all dashboard users (potential followers)...");
  const followers = [];
  const perPage = 1000;
  let page = 0;
  while (true) {
    const { data, error } = await admin
      .from("dashboard_users")
      .select("id, email")
      .order("created_at", { ascending: true })
      .range(page * perPage, (page + 1) * perPage - 1);
    if (error) throw new Error(`fetch dashboard_users: ${error.message}`);
    if (!data || data.length === 0) break;
    followers.push(...data);
    if (data.length < perPage) break;
    page += 1;
  }
  console.log(`  Found ${followers.length} users.`);

  // Exclude targets from follower pool to respect the check constraint
  // (follower_id <> following_id) and avoid self-follows.
  const eligibleFollowers = followers.filter((u) => !targetIds.has(u.id));
  if (eligibleFollowers.length < followers.length) {
    console.log(
      `  Excluded ${followers.length - eligibleFollowers.length} target user(s) from follower pool.`
    );
  }

  console.log(`\nPlan: ${eligibleFollowers.length} followers x ${targets.length} targets = ${
    eligibleFollowers.length * targets.length
  } upserts.`);
  if (dry) {
    console.log("DRY_RUN=1 — no writes will be performed.");
    console.log("Sample (first 5 rows):");
    const sample = [];
    for (const f of eligibleFollowers.slice(0, 5)) {
      for (const t of targets) {
        sample.push({ follower_id: f.id, follower_email: f.email, following_id: t.id, following_email: t.email });
      }
    }
    console.table(sample);
    return;
  }

  // Batch upsert rows: shape must match mobilize_user_follows columns.
  const BATCH = 1000;
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < eligibleFollowers.length; i += BATCH) {
    const followerSlice = eligibleFollowers.slice(i, i + BATCH);
    const rows = [];
    for (const f of followerSlice) {
      for (const t of targets) {
        rows.push({ follower_id: f.id, following_id: t.id });
      }
    }
    const { error } = await admin.from("mobilize_user_follows").upsert(rows, {
      onConflict: "follower_id,following_id",
    });
    if (error) {
      console.error(`batch ${i / BATCH} failed: ${error.message}`);
      errors += rows.length;
      continue;
    }
    inserted += rows.length;
    if ((i / BATCH) % 5 === 0 || i + BATCH >= eligibleFollowers.length) {
      console.log(`  upserted ${inserted} rows...`);
    }
  }

  console.log(`\nDone. Follow rows upserted: ${inserted}. Errors: ${errors}.`);
  console.log("Idempotent: re-running will not create duplicates.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
