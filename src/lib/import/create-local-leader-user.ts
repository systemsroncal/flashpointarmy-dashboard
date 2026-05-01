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
    /** Webhook / external: use this password when set (min 8 chars checked by caller). */
    passwordOverride?: string | null;
  }
): Promise<{ userId: string } | { error: string }> {
  const { email, firstName, lastName, phone, chapterId, leaderRoleId, passwordOverride } = opts;
  const trimmedOverride = passwordOverride?.trim() ?? "";
  const password =
    trimmedOverride.length >= 8 ? trimmedOverride : phone || "Welcome123!";
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

  await admin.from("user_roles").delete().eq("user_id", userId);
  const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role_id: leaderRoleId });
  if (roleErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: roleErr.message || "Could not assign role." };
  }

  const { error: clErr } = await admin.from("chapter_leaders").insert({
    chapter_id: chapterId,
    user_id: userId,
  });
  if (clErr && clErr.code !== "23505" && !/duplicate|unique|23505/i.test(clErr.message)) {
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    return { error: clErr.message || "Could not link chapter leader." };
  }

  const displayName = `${firstName} ${lastName}`.trim();
  await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      primary_chapter_id: chapterId,
      phone: phone || null,
    },
  });

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: chapterId,
      ...(phone ? { phone } : {}),
    })
    .eq("id", userId);
  if (profErr) {
    await admin.from("chapter_leaders").delete().eq("user_id", userId).eq("chapter_id", chapterId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    return { error: profErr.message || "Could not set profile primary chapter." };
  }

  await admin
    .from("dashboard_users")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: chapterId,
      ...(phone ? { phone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

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
