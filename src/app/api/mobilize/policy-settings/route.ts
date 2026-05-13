import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadMobilizeGroupCreatorPolicy } from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  return NextResponse.json({
    allow_member_group_create: policy.allowMember,
    allow_local_leader_group_create: policy.allowLocalLeader,
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
  };
  const allowMember = body.allow_member_group_create === true;
  const allowLocalLeader = body.allow_local_leader_group_create !== false;

  const { error } = await auth.admin
    .from("mobilize_policy_settings")
    .upsert(
      {
        id: 1,
        allow_member_group_create: allowMember,
        allow_local_leader_group_create: allowLocalLeader,
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
  });
}
