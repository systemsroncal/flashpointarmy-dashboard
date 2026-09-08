import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { ensureLocalLeaderRoleForChapterAssignee } from "@/lib/chapters/ensure-local-leader-role";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = {
  addUserIds?: string[];
  removeUserIds?: string[];
};

/**
 * Sync chapter_leaders rows and promote newly assigned users to local_leader
 * so overview leader counts stay accurate.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: chapterId } = await context.params;
  if (!UUID_RE.test(chapterId)) {
    return NextResponse.json({ error: "Invalid chapter id." }, { status: 400 });
  }

  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const callerRoles = await loadUserRoleNames(supabase, user.id);
  if (!isChapterStaffRole(callerRoles)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const addUserIds = Array.from(
    new Set((body.addUserIds ?? []).map((id) => id.trim()).filter((id) => UUID_RE.test(id)))
  );
  const removeUserIds = Array.from(
    new Set((body.removeUserIds ?? []).map((id) => id.trim()).filter((id) => UUID_RE.test(id)))
  );

  const admin = createAdminClient();

  const { data: chapterOk } = await admin
    .from("chapters")
    .select("id")
    .eq("id", chapterId)
    .maybeSingle();
  if (!chapterOk?.id) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }

  for (const uid of removeUserIds) {
    await admin.from("chapter_leaders").delete().eq("chapter_id", chapterId).eq("user_id", uid);
  }

  if (addUserIds.length > 0) {
    const { error: insErr } = await admin.from("chapter_leaders").upsert(
      addUserIds.map((uid) => ({ chapter_id: chapterId, user_id: uid })),
      { onConflict: "chapter_id,user_id" }
    );
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    for (const uid of addUserIds) {
      const roleFix = await ensureLocalLeaderRoleForChapterAssignee(admin, uid);
      if (roleFix.error) {
        console.error("[sync-leaders] ensureLocalLeaderRole:", uid, roleFix.error);
      }
    }
  }

  return NextResponse.json({ ok: true, added: addUserIds.length, removed: removeUserIds.length });
}
