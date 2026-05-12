import { NextResponse } from "next/server";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: memberships } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("status", "approved");

  const groupIds = [...new Set((memberships ?? []).map((m) => String((m as { group_id: string }).group_id)))];

  const { data: publicEvents, error: e1 } = await admin
    .from("mobilize_events")
    .select("*")
    .eq("is_public", true)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(200);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  let privateEvents: Record<string, unknown>[] = [];
  if (groupIds.length) {
    const { data: pe, error: e2 } = await admin
      .from("mobilize_events")
      .select("*")
      .in("group_id", groupIds)
      .eq("is_public", false)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(200);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    privateEvents = (pe ?? []) as Record<string, unknown>[];
  }

  const merged = [...(publicEvents ?? []), ...privateEvents].sort(
    (a, b) =>
      new Date(String((a as { starts_at: string }).starts_at)).getTime() -
      new Date(String((b as { starts_at: string }).starts_at)).getTime()
  );

  return NextResponse.json({ events: merged.slice(0, 300) });
}
