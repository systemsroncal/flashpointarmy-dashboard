import { NextResponse } from "next/server";
import {
  listAllDashboardUsers,
  listRoleNamesByUserIds,
} from "@/lib/admin/dashboard-user-queries";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export type AutoFollowTargetUser = {
  id: string;
  label: string;
  email: string;
  avatar_url: string | null;
  roleNames: string[];
};

export type AutoFollowTarget = {
  user_id: string;
  created_at: string;
  user: AutoFollowTargetUser;
};

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  if (!isMobilizeSuperAdmin(auth.roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: rows } = await auth.admin
    .from("mobilize_auto_follow_targets")
    .select("user_id, created_at")
    .order("created_at", { ascending: true });

  const targetRows = (rows ?? []) as { user_id: string; created_at: string }[];
  if (!targetRows.length) return NextResponse.json({ targets: [] });

  const ids = targetRows.map((r) => r.user_id);
  const allUsers = await listAllDashboardUsers(auth.admin);
  const byId = new Map(allUsers.map((u) => [u.id, u]));

  const [rolesByUser, { data: profRows }] = await Promise.all([
    listRoleNamesByUserIds(auth.admin, ids),
    auth.admin.from("profiles").select("id, avatar_url").in("id", ids),
  ]);
  const avatarByUser = new Map(
    ((profRows ?? []) as { id: string; avatar_url: string | null }[]).map((p) => [
      p.id,
      p.avatar_url ?? null,
    ])
  );

  const targets: AutoFollowTarget[] = targetRows.flatMap((r) => {
    const u = byId.get(r.user_id);
    if (!u) return [];
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    const label = `${name || u.display_name?.trim() || u.email}`.trim();
    return [
      {
        user_id: r.user_id,
        created_at: r.created_at,
        user: {
          id: u.id,
          label,
          email: String(u.email ?? ""),
          avatar_url: avatarByUser.get(u.id) ?? null,
          roleNames: rolesByUser.get(u.id) ?? [],
        },
      },
    ];
  });

  return NextResponse.json({ targets });
}

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  if (!isMobilizeSuperAdmin(auth.roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    userIds?: unknown;
    emails?: unknown;
  };

  const rawIds = Array.isArray(body.userIds)
    ? body.userIds.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const rawEmails = Array.isArray(body.emails)
    ? [
        ...new Set(
          body.emails
            .filter((v): v is string => typeof v === "string")
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.length > 0)
        ),
      ]
    : [];

  const userIds = [...new Set(rawIds)];
  const notFound: string[] = [];

  // Resolve emails against the dashboard_users mirror (case-insensitive).
  for (const email of rawEmails) {
    const { data: match } = await auth.admin
      .from("dashboard_users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (match) {
      const id = (match as { id: string }).id;
      if (!userIds.includes(id)) userIds.push(id);
    } else {
      notFound.push(email);
    }
  }

  if (!userIds.length) {
    return NextResponse.json(
      { error: "Provide at least one userId or email." },
      { status: 400 }
    );
  }

  // Only users that actually exist can be whitelisted.
  const { data: existingRows } = await auth.admin
    .from("dashboard_users")
    .select("id")
    .in("id", userIds);
  const existingIds = new Set(
    ((existingRows ?? []) as { id: string }[]).map((r) => r.id)
  );
  const validIds = userIds.filter((id) => existingIds.has(id));

  if (!validIds.length) {
    return NextResponse.json(
      { error: "None of the provided users exist." },
      { status: 400 }
    );
  }

  const rows = validIds.map((user_id) => ({
    user_id,
    created_by: auth.userId,
  }));
  const { error } = await auth.admin
    .from("mobilize_auto_follow_targets")
    .upsert(rows, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    added: validIds.length,
    notFound,
  });
}
