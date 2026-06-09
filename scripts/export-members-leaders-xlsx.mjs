/**
 * Export members and local leaders to Excel (.xlsx), matching National Overview counts.
 *
 * Overview "Members" = every user with role `member` in user_roles (includes people
 * who also have local_leader / admin). This is NOT the same as Community → Members
 * (dashboard_community_members), which excludes leaders and admins.
 *
 * Overview "Local Leaders" = every user with role `local_leader` in user_roles.
 *
 * Note: if NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS=true on the dashboard, overview
 * cards also add synthetic counts from cities_donors.json — those are not real users
 * and are not included in this export.
 *
 * Usage:
 *   npm run export:members-leaders
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGE_SIZE = 1000;
const ID_CHUNK = 200;

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

function preferNonEmpty(primary, fallback) {
  const a = typeof primary === "string" ? primary.trim() : "";
  if (a) return a;
  const b = typeof fallback === "string" ? fallback.trim() : "";
  return b || "";
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function countRoleAssignments(admin, roleId) {
  const { count, error } = await admin
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role_id", roleId);
  if (error) throw new Error(`user_roles count: ${error.message}`);
  return count ?? 0;
}

async function collectUserIdsForRole(admin, roleName) {
  const { data: role, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!role?.id) return [];

  const ids = new Set();
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role_id", role.id)
      .order("user_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`user_roles (${roleName}): ${error.message}`);
    const batch = data ?? [];
    for (const row of batch) ids.add(row.user_id);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return [...ids];
}

async function fetchUsersByIds(admin, ids) {
  if (ids.length === 0) return [];
  const rows = [];
  for (const part of chunkArray(ids, ID_CHUNK)) {
    const { data, error } = await admin
      .from("dashboard_users")
      .select(
        "id, email, first_name, last_name, display_name, phone, primary_chapter_id, address_line, city, state, zip_code, created_at"
      )
      .in("id", part);
    if (error) throw new Error(`dashboard_users: ${error.message}`);
    rows.push(...(data ?? []));
  }
  return rows;
}

async function fetchProfilesByIds(admin, ids) {
  const byId = new Map();
  if (ids.length === 0) return byId;
  for (const part of chunkArray(ids, ID_CHUNK)) {
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, phone, primary_chapter_id, address_line, city, state, zip_code, avatar_url"
      )
      .in("id", part);
    if (error) throw new Error(`profiles: ${error.message}`);
    for (const row of data ?? []) byId.set(row.id, row);
  }
  return byId;
}

async function fetchChapterMap(admin) {
  const { data, error } = await admin
    .from("chapters")
    .select("id, name, city, state, zip_code");
  if (error) throw new Error(`chapters: ${error.message}`);
  const map = new Map();
  for (const ch of data ?? []) map.set(ch.id, ch);
  return map;
}

async function fetchRoleNamesByUserIds(admin, ids) {
  const byUser = new Map();
  if (ids.length === 0) return byUser;

  const { data: roles, error: rErr } = await admin.from("roles").select("id, name");
  if (rErr) throw new Error(rErr.message);
  const nameById = new Map((roles ?? []).map((r) => [r.id, r.name]));

  for (const part of chunkArray(ids, ID_CHUNK)) {
    const { data, error } = await admin
      .from("user_roles")
      .select("user_id, role_id")
      .in("user_id", part);
    if (error) throw new Error(`user_roles: ${error.message}`);
    for (const row of data ?? []) {
      const uid = row.user_id;
      const roleName = nameById.get(row.role_id);
      if (!roleName) continue;
      if (!byUser.has(uid)) byUser.set(uid, new Set());
      byUser.get(uid).add(roleName);
    }
  }

  const out = new Map();
  for (const [uid, set] of byUser) out.set(uid, [...set].sort().join(", "));
  return out;
}

function buildExportRow(user, profile, chapterMap, roleNames) {
  const p = profile ?? {};
  const chapterId = p.primary_chapter_id ?? user.primary_chapter_id ?? null;
  const chapter = chapterId ? chapterMap.get(chapterId) : null;

  return {
    Email: user.email ?? "",
    "First name": user.first_name ?? "",
    "Last name": user.last_name ?? "",
    "Display name": user.display_name ?? "",
    Phone: preferNonEmpty(p.phone, user.phone),
    "Address line": preferNonEmpty(p.address_line, user.address_line),
    City: preferNonEmpty(p.city, user.city),
    State: preferNonEmpty(p.state, user.state),
    ZIP: preferNonEmpty(p.zip_code, user.zip_code),
    "Chapter name": chapter?.name ?? "",
    "Chapter city": chapter?.city ?? "",
    "Chapter state": chapter?.state ?? "",
    Roles: roleNames ?? "",
    "Registered at": user.created_at ?? "",
    "User ID": user.id ?? "",
  };
}

function writeWorkbook(rows, filePath, sheetName) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
}

function sumReferenceTotals(data) {
  let leaders = 0;
  let members = 0;
  for (const row of data.Cities ?? []) {
    const d = Math.max(0, Math.floor(Number(row.Donors) || 0));
    if (d >= 1) leaders += 1;
    members += Math.max(0, d - 1);
  }
  return { leaders, members };
}

async function main() {
  loadEnvFromProjectRoot();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const exportsDir = path.join(ROOT, "exports");
  fs.mkdirSync(exportsDir, { recursive: true });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const membersPath = path.join(exportsDir, `members-${dateStamp}.xlsx`);
  const leadersPath = path.join(exportsDir, `leaders-${dateStamp}.xlsx`);

  const { data: roleRows } = await admin.from("roles").select("id, name");
  const roleIdByName = Object.fromEntries((roleRows ?? []).map((r) => [r.name, r.id]));

  console.log("Loading chapters…");
  const chapterMap = await fetchChapterMap(admin);

  console.log("Fetching all users with role member (Overview Members)…");
  const memberIds = await collectUserIdsForRole(admin, "member");
  const memberRoleAssignments = await countRoleAssignments(admin, roleIdByName.member);
  const memberUsers = await fetchUsersByIds(admin, memberIds);
  memberUsers.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "", undefined, { sensitivity: "base" }));
  const memberProfiles = await fetchProfilesByIds(admin, memberIds);
  const memberRoles = await fetchRoleNamesByUserIds(admin, memberIds);

  const membersExport = memberUsers.map((u) =>
    buildExportRow(u, memberProfiles.get(u.id), chapterMap, memberRoles.get(u.id) ?? "member")
  );
  writeWorkbook(membersExport, membersPath, "Members");
  console.log(`Members export: ${membersExport.length} rows → ${membersPath}`);
  if (membersExport.length !== memberRoleAssignments) {
    console.warn(
      `  Note: ${memberRoleAssignments} user_roles rows for member, but only ${membersExport.length} dashboard_users found.`
    );
  }

  console.log("Fetching all users with role local_leader (Overview Local Leaders)…");
  const leaderIds = await collectUserIdsForRole(admin, "local_leader");
  const leaderRoleAssignments = await countRoleAssignments(admin, roleIdByName.local_leader);
  const leaderUsers = await fetchUsersByIds(admin, leaderIds);
  leaderUsers.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "", undefined, { sensitivity: "base" }));
  const leaderProfiles = await fetchProfilesByIds(admin, leaderIds);
  const leaderRoles = await fetchRoleNamesByUserIds(admin, leaderIds);

  const leadersExport = leaderUsers.map((u) =>
    buildExportRow(
      u,
      leaderProfiles.get(u.id),
      chapterMap,
      leaderRoles.get(u.id) ?? "local_leader"
    )
  );
  writeWorkbook(leadersExport, leadersPath, "Leaders");
  console.log(`Leaders export: ${leadersExport.length} rows → ${leadersPath}`);
  if (leadersExport.length !== leaderRoleAssignments) {
    console.warn(
      `  Note: ${leaderRoleAssignments} user_roles rows for local_leader, but only ${leadersExport.length} dashboard_users found.`
    );
  }

  const { count: communityOnlyMembers } = await admin
    .from("dashboard_community_members")
    .select("id", { count: "exact", head: true });

  let ref = { leaders: 0, members: 0 };
  try {
    const json = JSON.parse(
      fs.readFileSync(path.join(ROOT, "public/backgrounds/cities_donors.json"), "utf8")
    );
    ref = sumReferenceTotals(json);
  } catch {
    /* ignore */
  }
  const refEnabled = process.env.NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS === "true";

  console.log("");
  console.log("── Reconcile with dashboard ──");
  console.log(`Community → Members only (excludes leaders/admins): ${communityOnlyMembers ?? "?"}`);
  console.log(
    `Overview Members card (DB): ${memberRoleAssignments}` +
      (refEnabled ? ` + reference ${ref.members} = ${memberRoleAssignments + ref.members}` : "")
  );
  console.log(
    `Overview Local Leaders card (DB): ${leaderRoleAssignments}` +
      (refEnabled ? ` + reference ${ref.leaders} = ${leaderRoleAssignments + ref.leaders}` : "")
  );
  if (refEnabled) {
    console.log(
      "  Reference stats are synthetic (cities_donors.json) — not exported as user rows."
    );
  }
  console.log(`Supabase project: ${url}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
