import { chunkIdsForInQuery, listAllDashboardUsers } from "@/lib/admin/dashboard-user-queries";
import { includeReferenceInOverviewStatTotals } from "@/lib/config/reference-overview-stats";
import type { CitiesDonorsJson } from "@/lib/donors/aggregate-donors-by-state";
import {
  aggregateReferenceLeaderMemberByState,
  sumReferenceTotals,
} from "@/lib/donors/aggregate-donors-by-state";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

export type PeopleOverviewStats = {
  /** Role totals (same formula as National Overview members + leaders, plus admins). */
  totalUsers: number;
  /** Real `dashboard_users` rows (demographics / profile completeness). */
  dashboardUsersCount: number;
  byRole: {
    localLeaders: number;
    members: number;
    admins: number;
    subAdmins: number;
    superAdmins: number;
  };
  byGender: {
    male: number;
    female: number;
    unassigned: number;
  };
  byAgeBucket: Array<{
    label: string;
    male: number;
    female: number;
    unassigned: number;
  }>;
  byState: Array<{ state: string; count: number }>;
  recentlyCreated: Array<{
    id: string;
    name: string;
    created_at: string;
    initials: string;
  }>;
};

const AGE_BUCKETS = [
  { label: "0–17", min: 0, max: 17 },
  { label: "18–25", min: 18, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36–50", min: 36, max: 50 },
  { label: "51–64", min: 51, max: 64 },
  { label: "65+", min: 65, max: 200 },
  { label: "Unknown", min: -1, max: -1 },
] as const;

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(`${dob.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function bucketLabel(age: number | null): string {
  if (age == null) return "Unknown";
  for (const b of AGE_BUCKETS) {
    if (b.min < 0) continue;
    if (age >= b.min && age <= b.max) return b.label;
  }
  return "Unknown";
}

/** Same exact `user_roles` counts National Overview uses for members / local leaders. */
async function countUsersWithRole(admin: SupabaseClient, roleName: string): Promise<number> {
  const { data: role } = await admin.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (!role?.id) return 0;
  const { count, error } = await admin
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role_id", role.id as string);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function loadReferenceLeaderMemberTotals(): Promise<{ leaders: number; members: number } | null> {
  if (!includeReferenceInOverviewStatTotals()) return null;
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public/backgrounds/cities_donors.json"),
      "utf8"
    );
    const json = JSON.parse(raw) as CitiesDonorsJson;
    return sumReferenceTotals(aggregateReferenceLeaderMemberByState(json));
  } catch {
    return null;
  }
}

export async function loadPeopleOverviewStats(admin: SupabaseClient): Promise<PeopleOverviewStats> {
  const [members, localLeaders, admins, subAdmins, superAdmins, users, reference] =
    await Promise.all([
      countUsersWithRole(admin, "member"),
      countUsersWithRole(admin, "local_leader"),
      countUsersWithRole(admin, "admin"),
      countUsersWithRole(admin, "sub_admin"),
      countUsersWithRole(admin, "super_admin"),
      listAllDashboardUsers(admin),
      loadReferenceLeaderMemberTotals(),
    ]);

  const byRole = {
    localLeaders: localLeaders + (reference?.leaders ?? 0),
    members: members + (reference?.members ?? 0),
    admins,
    subAdmins,
    superAdmins,
  };

  const list = [...users].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const ids = list.map((u) => u.id);

  const profileByUser = new Map<
    string,
    { date_of_birth: string | null; gender: string | null; state: string | null }
  >();

  for (const chunk of chunkIdsForInQuery(ids, 100)) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, date_of_birth, gender, state")
      .in("id", chunk);
    for (const p of profiles ?? []) {
      profileByUser.set(p.id as string, {
        date_of_birth: (p.date_of_birth as string | null) ?? null,
        gender: (p.gender as string | null) ?? null,
        state: (p.state as string | null) ?? null,
      });
    }
  }

  const byGender = { male: 0, female: 0, unassigned: 0 };
  const ageMap = new Map<string, { male: number; female: number; unassigned: number }>();
  for (const b of AGE_BUCKETS) {
    ageMap.set(b.label, { male: 0, female: 0, unassigned: 0 });
  }
  const stateCounts = new Map<string, number>();

  for (const u of list) {
    const prof = profileByUser.get(u.id);
    const g = prof?.gender;
    if (g === "male") byGender.male += 1;
    else if (g === "female") byGender.female += 1;
    else byGender.unassigned += 1;

    const age = ageFromDob(prof?.date_of_birth);
    const label = bucketLabel(age);
    const bucket = ageMap.get(label)!;
    if (g === "male") bucket.male += 1;
    else if (g === "female") bucket.female += 1;
    else bucket.unassigned += 1;

    const st = (prof?.state ?? u.state ?? "").trim().toUpperCase().slice(0, 2);
    if (st) stateCounts.set(st, (stateCounts.get(st) ?? 0) + 1);
  }

  const byAgeBucket = AGE_BUCKETS.map((b) => ({
    label: b.label,
    ...(ageMap.get(b.label) ?? { male: 0, female: 0, unassigned: 0 }),
  }));

  const byState = [...stateCounts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const recentlyCreated = list.slice(0, 8).map((u) => {
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.display_name?.trim() ||
      u.email?.split("@")[0] ||
      "User";
    const parts = name.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      id: u.id,
      name,
      created_at: u.created_at,
      initials,
    };
  });

  const totalUsers =
    byRole.localLeaders + byRole.members + byRole.admins + byRole.subAdmins + byRole.superAdmins;

  return {
    totalUsers,
    dashboardUsersCount: list.length,
    byRole,
    byGender,
    byAgeBucket,
    byState,
    recentlyCreated,
  };
}
