import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const roleNames = await loadUserRoleNames(auth.admin, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: members } = await auth.admin
    .from("mobilize_group_members")
    .select("user_id, member_role, membership_status")
    .eq("group_id", id)
    .eq("membership_status", "approved");

  const userIds = new Set((members ?? []).map((m) => String(m.user_id)));

  const { data: chapterLeaders } = await auth.admin.from("chapter_leaders").select("user_id");
  for (const row of chapterLeaders ?? []) {
    userIds.add(String(row.user_id));
  }

  const { data: chapters } = await auth.admin.from("chapters").select("created_by").not("created_by", "is", null);
  for (const row of chapters ?? []) {
    if (row.created_by) userIds.add(String(row.created_by));
  }

  const ids = [...userIds];
  if (!ids.length) return NextResponse.json({ candidates: [] });

  const { data: users } = await auth.admin
    .from("dashboard_users")
    .select("id, email, first_name, last_name, display_name")
    .in("id", ids);

  const candidates = (users ?? []).map((u) => {
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.display_name?.trim() ||
      u.email;
    return { userId: u.id as string, label: name as string, email: u.email as string };
  });

  candidates.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  return NextResponse.json({ candidates });
}
