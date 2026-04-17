import { NextResponse } from "next/server";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = { roleName: "member" | "local_leader" };

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const callerRoles = await loadUserRoleNames(supabase, caller.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json({ error: "Only a super admin can change member / leader roles." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.roleName !== "member" && body.roleName !== "local_leader") {
    return NextResponse.json({ error: "Invalid roleName." }, { status: 400 });
  }

  const admin = createAdminClient();
  const targetRoles = await loadUserRoleNames(admin, userId);

  if (targetRoles.includes("super_admin") || targetRoles.includes("admin")) {
    return NextResponse.json(
      { error: "Cannot change roles for administrators from this action." },
      { status: 400 }
    );
  }

  const hasCommunityRole =
    targetRoles.includes("member") || targetRoles.includes("local_leader");
  if (!hasCommunityRole) {
    return NextResponse.json(
      { error: "User must already be a member or local leader to switch roles here." },
      { status: 400 }
    );
  }

  const { error: rpcErr } = await supabase.rpc("assign_invited_user_primary_role", {
    p_user_id: userId,
    p_role_name: body.roleName,
  });

  if (rpcErr) {
    return NextResponse.json(
      { error: rpcErr.message || "Could not update role." },
      { status: 500 }
    );
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", userId)
    .maybeSingle();

  const chapterId = prof?.primary_chapter_id ?? null;

  if (chapterId) {
    if (body.roleName === "local_leader") {
      const { error: clErr } = await admin.from("chapter_leaders").upsert(
        { chapter_id: chapterId, user_id: userId },
        { onConflict: "chapter_id,user_id" }
      );
      if (clErr) {
        return NextResponse.json(
          { error: clErr.message || "Role updated but chapter leader link failed." },
          { status: 500 }
        );
      }
    } else {
      await admin.from("chapter_leaders").delete().eq("chapter_id", chapterId).eq("user_id", userId);
    }
  }

  return NextResponse.json({
    ok: true,
    role_names: [body.roleName] as string[],
  });
}
