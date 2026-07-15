import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadMobilizeGroupCreatorPolicy } from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

async function loadAutoCloseDays(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("mobilize_policy_settings")
    .select("auto_close_inactive_days")
    .eq("id", 1)
    .maybeSingle();
  const n = Number((data as { auto_close_inactive_days?: number } | null)?.auto_close_inactive_days);
  return Number.isFinite(n) && n >= 1 ? n : 60;
}

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  const auto_close_inactive_days = await loadAutoCloseDays(auth.admin);
  return NextResponse.json({
    allow_member_group_create: policy.allowMember,
    allow_local_leader_group_create: policy.allowLocalLeader,
    auto_close_inactive_days,
  });
}

export async function PUT(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    allow_member_group_create?: unknown;
    allow_local_leader_group_create?: unknown;
    auto_close_inactive_days?: unknown;
  };
  const allowMember = body.allow_member_group_create === true;
  const allowLocalLeader = body.allow_local_leader_group_create !== false;
  const daysRaw = Number(body.auto_close_inactive_days);
  const auto_close_inactive_days = Number.isFinite(daysRaw)
    ? Math.min(3650, Math.max(1, Math.round(daysRaw)))
    : 60;

  const { error } = await auth.admin
    .from("mobilize_policy_settings")
    .upsert(
      {
        id: 1,
        allow_member_group_create: allowMember,
        allow_local_leader_group_create: allowLocalLeader,
        auto_close_inactive_days,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  return NextResponse.json({
    allow_member_group_create: policy.allowMember,
    allow_local_leader_group_create: policy.allowLocalLeader,
    auto_close_inactive_days,
  });
}
