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

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: roles } = await admin.from("roles").select("id, name");
const byName = Object.fromEntries((roles ?? []).map((r) => [r.name, r.id]));

async function countRole(name) {
  const { count } = await admin
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role_id", byName[name]);
  return count ?? 0;
}

const memberRoleCount = await countRole("member");
const leaderRoleCount = await countRole("local_leader");
const { count: communityMembers } = await admin
  .from("dashboard_community_members")
  .select("id", { count: "exact", head: true });

let ref = { leaders: 0, members: 0 };
try {
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, "public/backgrounds/cities_donors.json"), "utf8"));
  ref = sumReferenceTotals(json);
} catch {
  /* ignore */
}

const refEnabled = process.env.NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS === "true";

console.log("── Database (Supabase) ──");
console.log("user_roles with member:", memberRoleCount);
console.log("user_roles with local_leader:", leaderRoleCount);
console.log("dashboard_community_members view (excludes leaders/admins):", communityMembers);
console.log("");
console.log("── Reference JSON (cities_donors.json) ──");
console.log("reference leaders:", ref.leaders);
console.log("reference members:", ref.members);
console.log("NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS:", refEnabled);
console.log("");
console.log("── Overview cards (same formula as dashboard) ──");
console.log(
  "Members card:",
  memberRoleCount + (refEnabled ? ref.members : 0),
  refEnabled ? `(DB ${memberRoleCount} + ref ${ref.members})` : `(DB only)`
);
console.log(
  "Local Leaders card:",
  leaderRoleCount + (refEnabled ? ref.leaders : 0),
  refEnabled ? `(DB ${leaderRoleCount} + ref ${ref.leaders})` : `(DB only)`
);
