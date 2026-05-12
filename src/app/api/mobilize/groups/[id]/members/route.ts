import { NextResponse } from "next/server";
import { isApprovedLeader } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const leader = await isApprovedLeader(admin, id, auth.userId);
  if (!leader) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  let q = admin
    .from("mobilize_group_members")
    .select("id, user_id, member_role, status, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  if (status === "pending" || status === "approved" || status === "rejected") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((r) => String((r as { user_id: string }).user_id)))];
  const labels = new Map<string, string>();
  if (userIds.length) {
    const { data: dash } = await admin
      .from("dashboard_users")
      .select("id, display_name, email")
      .in("id", userIds);
    for (const u of dash ?? []) {
      const row = u as { id: string; display_name: string | null; email: string };
      labels.set(row.id, row.display_name?.trim() || row.email);
    }
  }

  const members = (data ?? []).map((row) => ({
    ...(row as object),
    user_label: labels.get(String((row as { user_id: string }).user_id)) || "Member",
  }));

  return NextResponse.json({ members });
}
