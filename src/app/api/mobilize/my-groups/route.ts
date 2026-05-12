import { NextResponse } from "next/server";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("mobilize_group_members")
    .select(
      "status, member_role, mobilize_groups(id, name, group_type, visibility, created_at, address_line, latitude, longitude)"
    )
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memberships: rows ?? [] });
}
