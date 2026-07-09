import type { SupabaseClient } from "@supabase/supabase-js";

export type PeopleOverviewStats = {
  totalUsers: number;
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

export async function loadPeopleOverviewStats(admin: SupabaseClient): Promise<PeopleOverviewStats> {
  const { data: users } = await admin
    .from("dashboard_users")
    .select("id, first_name, last_name, display_name, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const list = users ?? [];
  const ids = list.map((u) => u.id as string);

  const roleByUser = new Map<string, Set<string>>();
  const profileByUser = new Map<
    string,
    { date_of_birth: string | null; gender: string | null; state: string | null }
  >();

  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const [{ data: ur }, { data: profiles }] = await Promise.all([
      admin.from("user_roles").select("user_id, roles ( name )").in("user_id", chunk),
      admin.from("profiles").select("id, date_of_birth, gender, state").in("id", chunk),
    ]);
    for (const row of ur ?? []) {
      const uid = row.user_id as string;
      const name = (row.roles as { name?: string } | null)?.name;
      if (!name) continue;
      if (!roleByUser.has(uid)) roleByUser.set(uid, new Set());
      roleByUser.get(uid)!.add(name);
    }
    for (const p of profiles ?? []) {
      profileByUser.set(p.id as string, {
        date_of_birth: (p.date_of_birth as string | null) ?? null,
        gender: (p.gender as string | null) ?? null,
        state: (p.state as string | null) ?? null,
      });
    }
  }

  const byRole = {
    localLeaders: 0,
    members: 0,
    admins: 0,
    subAdmins: 0,
    superAdmins: 0,
  };
  const byGender = { male: 0, female: 0, unassigned: 0 };
  const ageMap = new Map<string, { male: number; female: number; unassigned: number }>();
  for (const b of AGE_BUCKETS) {
    ageMap.set(b.label, { male: 0, female: 0, unassigned: 0 });
  }
  const stateCounts = new Map<string, number>();

  for (const u of list) {
    const uid = u.id as string;
    const roles = roleByUser.get(uid) ?? new Set();
    if (roles.has("super_admin")) byRole.superAdmins += 1;
    else if (roles.has("admin")) byRole.admins += 1;
    else if (roles.has("sub_admin")) byRole.subAdmins += 1;
    else if (roles.has("local_leader")) byRole.localLeaders += 1;
    else if (roles.has("member")) byRole.members += 1;

    const prof = profileByUser.get(uid);
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

    const st = (prof?.state ?? "").trim().toUpperCase().slice(0, 2);
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
      (u.display_name as string | null)?.trim() ||
      (u.email as string)?.split("@")[0] ||
      "User";
    const parts = name.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      id: u.id as string,
      name,
      created_at: u.created_at as string,
      initials,
    };
  });

  return {
    totalUsers: list.length,
    byRole,
    byGender,
    byAgeBucket,
    byState,
    recentlyCreated,
  };
}
