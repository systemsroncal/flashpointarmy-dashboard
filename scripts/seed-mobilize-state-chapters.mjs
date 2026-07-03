/**
 * Creates 50 Mobilize groups — one per US state — named "{{StateName}} Chapter".
 *
 * Defaults per group:
 *   type: other
 *   visibility: public (listed on map & groups browse)
 *   event_create_policy: leader_only
 *   wall_post_policy: leaders_only
 *   resources_post_policy: all_approved
 *   primary owner + group admin: gene@fparmy.com (created_by + approved leader)
 *
 * Usage (PowerShell):
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/seed-mobilize-state-chapters.mjs
 *
 * Dry run:
 *   $env:DRY_RUN="1"
 *   node scripts/seed-mobilize-state-chapters.mjs
 *
 * Optional owner email:
 *   $env:OWNER_EMAIL="gene@fparmy.com"
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_OWNER_EMAIL = "gene@fparmy.com";

/** 50 states (no DC). Names match src/data/usStates.ts */
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
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

async function resolveOwnerId(admin, email) {
  const normalized = email.trim().toLowerCase();
  const { data: mirror } = await admin
    .from("dashboard_users")
    .select("id, email")
    .ilike("email", normalized)
    .maybeSingle();
  if (mirror?.id) return mirror.id;

  const perPage = 1000;
  for (let page = 1; page <= 50; page += 1) {
    const { data: authData, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth listUsers: ${error.message}`);
    const users = authData?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === normalized);
    if (match?.id) return match.id;
    if (users.length < perPage) break;
  }
  throw new Error(`Owner not found: ${email}`);
}

async function findExistingStateChapter(admin, stateCode, name) {
  const { data: byRegion } = await admin
    .from("mobilize_groups")
    .select("id, name, region_code")
    .eq("region_code", stateCode)
    .limit(1)
    .maybeSingle();
  if (byRegion?.id) return byRegion;

  const { data: byName } = await admin
    .from("mobilize_groups")
    .select("id, name, region_code")
    .eq("name", name)
    .maybeSingle();
  return byName ?? null;
}

async function columnExists(admin, table, column) {
  const { error } = await admin.from(table).select(column).limit(0);
  if (!error) return true;
  const msg = error.message ?? "";
  if (
    (msg.includes("Could not find") && msg.includes(column)) ||
    (msg.includes("does not exist") && msg.includes(column))
  ) {
    return false;
  }
  throw new Error(`Unexpected error probing ${table}.${column}: ${msg}`);
}

async function main() {
  loadEnvFromProjectRoot();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const dry = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  const ownerEmail = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim();

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const centroids = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "us-state-centroids.json"), "utf8")
  );

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await resolveOwnerId(admin, ownerEmail);
  const hasWallPolicy = await columnExists(admin, "mobilize_groups", "wall_post_policy");
  const hasResourcesPolicy = await columnExists(admin, "mobilize_groups", "resources_post_policy");
  if (!hasWallPolicy) {
    console.warn(
      "Column mobilize_groups.wall_post_policy missing — apply migration 036_mobilize_group_cover_wall.sql."
    );
  }
  if (!hasResourcesPolicy) {
    console.warn(
      "Column mobilize_groups.resources_post_policy missing — apply migration 054_mobilize_group_resources.sql. " +
        "Groups will use DB default for resources (all_approved once migration runs)."
    );
  }

  console.log(`Owner: ${ownerEmail} (${ownerId})`);
  console.log(`States to seed: ${US_STATES.length}`);
  if (dry) console.log("DRY_RUN=1 — no inserts.");

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const state of US_STATES) {
    const name = `${state.name} Chapter`;
    const geo = centroids[state.code];
    if (!geo) {
      console.warn(`No centroid for ${state.code}, skipping ${name}`);
      failed += 1;
      continue;
    }

    const existing = await findExistingStateChapter(admin, state.code, name);

    if (existing?.id) {
      const label =
        existing.region_code === state.code
          ? `skip (exists region ${state.code}): ${existing.name}`
          : `skip (exists name): ${name}`;
      console.log(label);
      skipped += 1;
      continue;
    }

    if (dry) {
      console.log(`would create: ${name}`);
      created += 1;
      continue;
    }

    const row = {
      name,
      group_type: "other",
      description: null,
      address: null,
      latitude: geo.lat,
      longitude: geo.lng,
      visibility: "public",
      event_create_policy: "leader_only",
      region_code: state.code,
      created_by: ownerId,
    };
    if (hasWallPolicy) {
      row.wall_post_policy = "leaders_only";
    }
    if (hasResourcesPolicy) {
      row.resources_post_policy = "all_approved";
    }

    const { data: inserted, error } = await admin
      .from("mobilize_groups")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.warn(`fail ${name}: ${error.message}`);
      failed += 1;
      continue;
    }

    // Trigger should add owner as leader; ensure leader row exists anyway.
    const { error: memberErr } = await admin.from("mobilize_group_members").upsert(
      {
        group_id: inserted.id,
        user_id: ownerId,
        member_role: "leader",
        membership_status: "approved",
      },
      { onConflict: "group_id,user_id" }
    );
    if (memberErr) {
      console.warn(`member upsert ${name}: ${memberErr.message}`);
    }

    console.log(`created: ${name} (${inserted.id})`);
    created += 1;
  }

  console.log(`Done. Created: ${created}. Skipped: ${skipped}. Failed: ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
