import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates auth user + local_leader role + chapter_leaders link (same behavior as leaders bulk import).
 */
export async function createLocalLeaderUserForChapter(
  admin: SupabaseClient,
  opts: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    chapterId: string;
    leaderRoleId: string;
  }
): Promise<{ userId: string } | { error: string }> {
  const { email, firstName, lastName, phone, chapterId, leaderRoleId } = opts;
  const password = phone || "Welcome123!";
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      primary_chapter_id: chapterId,
      phone: phone || null,
    },
  });
  if (createErr || !created.user?.id) {
    return { error: createErr?.message || "Could not create user." };
  }

  const userId = created.user.id;
  await admin.auth.admin.updateUserById(userId, { email_confirm: true });

  await admin.from("user_roles").delete().eq("user_id", userId);
  const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role_id: leaderRoleId });
  if (roleErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: roleErr.message || "Could not assign role." };
  }

  await admin.from("chapter_leaders").upsert(
    { chapter_id: chapterId, user_id: userId },
    { onConflict: "chapter_id,user_id" }
  );

  return { userId };
}

/**
 * Links an existing dashboard user to a chapter as local leader (adds role + chapter_leaders).
 */
export async function linkExistingUserAsLocalLeader(
  admin: SupabaseClient,
  opts: {
    userId: string;
    chapterId: string;
    leaderRoleId: string;
  }
): Promise<{ userId: string } | { error: string }> {
  const { userId, chapterId, leaderRoleId } = opts;
  const { data: existing } = await admin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .eq("role_id", leaderRoleId)
    .maybeSingle();
  if (!existing) {
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role_id: leaderRoleId });
    if (roleErr) {
      return { error: roleErr.message || "Could not assign local leader role." };
    }
  }
  const { error: clErr } = await admin.from("chapter_leaders").upsert(
    { chapter_id: chapterId, user_id: userId },
    { onConflict: "chapter_id,user_id" }
  );
  if (clErr) {
    return { error: clErr.message || "Could not link chapter leader." };
  }
  return { userId };
}
