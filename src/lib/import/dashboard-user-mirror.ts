import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserMailingFields } from "@/lib/import/user-mailing-address";
import { mailingForUserMetadata } from "@/lib/import/user-mailing-address";

export async function loadAuthUsersByEmail(
  admin: SupabaseClient,
  emails: string[]
): Promise<Map<string, { id: string }>> {
  const targets = new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const out = new Map<string, { id: string }>();
  if (!targets.size) return out;
  const perPage = 1000;
  for (let page = 1; page <= 500; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = data?.users ?? [];
    for (const u of users) {
      const email = String(u.email || "").trim().toLowerCase();
      if (!email || !targets.has(email)) continue;
      out.set(email, { id: u.id });
    }
    if (users.length < perPage || out.size === targets.size) break;
  }
  return out;
}

/**
 * Ensures `public.dashboard_users` has a row for this auth user (insert if missing).
 * Import/sync used `.update()` only; if the auth trigger did not run, Community/Leaders lists skip the user.
 */
export async function ensureDashboardUserMirror(
  admin: SupabaseClient,
  row: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    primaryChapterId: string | null;
    phone: string | null | undefined;
    /** `undefined` = do not change mailing columns (keep existing). `null` or object = set/clear. */
    mailing?: UserMailingFields | null;
    /**
     * When updating an existing `dashboard_users` row, omit `email` so Fluent sync/webhook
     * does not overwrite the account email (identity stays stable).
     */
    skipEmailOnUpdate?: boolean;
  }
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const mailingPatch =
    row.mailing === undefined
      ? {}
      : row.mailing === null
        ? {
            address_line: null as string | null,
            city: null as string | null,
            state: null as string | null,
            zip_code: null as string | null,
          }
        : {
            address_line: row.mailing.address_line ?? null,
            city: row.mailing.city ?? null,
            state: row.mailing.state ?? null,
            zip_code: row.mailing.zip_code ?? null,
          };
  const { data: exists } = await admin.from("dashboard_users").select("id").eq("id", row.id).maybeSingle();
  const isUpdate = Boolean(exists?.id);
  const skipEmail = Boolean(row.skipEmailOnUpdate && isUpdate);
  const patch = {
    ...(skipEmail ? {} : { email: row.email }),
    first_name: row.firstName,
    last_name: row.lastName,
    display_name: row.displayName,
    primary_chapter_id: row.primaryChapterId,
    phone: row.phone?.trim() || null,
    ...mailingPatch,
    updated_at: now,
  };

  if (isUpdate) {
    const { error } = await admin.from("dashboard_users").update(patch).eq("id", row.id);
    return error ? { error: error.message } : {};
  }

  const { error } = await admin.from("dashboard_users").insert({
    id: row.id,
    email: row.email,
    ...patch,
    created_at: now,
  });
  return error ? { error: error.message } : {};
}

/**
 * Community (and RBAC) expect at least one row in `user_roles`. `handle_new_user` assigns `member`,
 * but if that step was skipped (e.g. `roles` seed missing `member` temporarily, or trigger drift),
 * the user exists in auth/dashboard_users yet never appears in `dashboard_community_members`.
 */
export async function ensureMemberRoleIfUserHasNoRoles(
  admin: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: anyRole, error: countErr } = await admin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (countErr) return { error: countErr.message };
  if (anyRole?.role_id) return {};

  const { data: memberRole, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();
  if (roleErr) return { error: roleErr.message };
  if (!memberRole?.id) {
    return { error: "Table public.roles is missing a row with name = 'member'." };
  }

  const { error: insErr } = await admin.from("user_roles").insert({
    user_id: userId,
    role_id: memberRole.id as string,
  });
  if (insErr) return { error: insErr.message };
  return {};
}

/** Re-sync: assign chapter / roles / mirror when Fluent row matches an existing dashboard user by email. */
export async function syncExistingUserFromFluentForm(
  admin: SupabaseClient,
  opts: {
    userId: string;
    email: string;
    taskKey: "leaders" | "members";
    chapterId: string;
    firstName: string;
    lastName: string;
    phone: string;
    mailing: UserMailingFields;
    leaderRoleId: string | null;
    memberRoleId: string | null;
  }
): Promise<{ error?: string }> {
  const displayName = `${opts.firstName} ${opts.lastName}`.trim();
  const hasMailing =
    !!(opts.mailing.address_line || "").trim() ||
    !!(opts.mailing.city || "").trim() ||
    !!(opts.mailing.state || "").trim() ||
    !!(opts.mailing.zip_code || "").trim();
  const mailMeta = hasMailing ? mailingForUserMetadata(opts.mailing) : {};

  const { data: prof } = await admin
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", opts.userId)
    .maybeSingle();

  const hadNoChapter = prof?.primary_chapter_id == null;
  const primaryChapterId = hadNoChapter ? opts.chapterId : String(prof!.primary_chapter_id);

  /** Never set `password` here — existing users keep their current password. */
  await admin.auth.admin.updateUserById(opts.userId, {
    user_metadata: {
      first_name: opts.firstName,
      last_name: opts.lastName,
      primary_chapter_id: primaryChapterId,
      phone: opts.phone || null,
      ...mailMeta,
    },
  });

  await admin
    .from("profiles")
    .update({
      first_name: opts.firstName,
      last_name: opts.lastName,
      display_name: displayName,
      primary_chapter_id: primaryChapterId,
      ...(opts.phone ? { phone: opts.phone } : {}),
      ...(hasMailing
        ? {
            address_line: opts.mailing.address_line,
            city: opts.mailing.city,
            state: opts.mailing.state,
            zip_code: opts.mailing.zip_code,
          }
        : {}),
    })
    .eq("id", opts.userId);

  const mirror = await ensureDashboardUserMirror(admin, {
    id: opts.userId,
    email: opts.email,
    firstName: opts.firstName,
    lastName: opts.lastName,
    displayName,
    primaryChapterId,
    phone: opts.phone,
    mailing: hasMailing ? opts.mailing : undefined,
    skipEmailOnUpdate: true,
  });
  if (mirror.error) return { error: mirror.error };

  if (opts.taskKey === "leaders") {
    if (!opts.leaderRoleId) return { error: "Role local_leader not found." };
    const { linkExistingUserAsLocalLeader } = await import("@/lib/import/create-local-leader-user");
    const linked = await linkExistingUserAsLocalLeader(admin, {
      userId: opts.userId,
      chapterId: primaryChapterId,
      leaderRoleId: opts.leaderRoleId,
    });
    if ("error" in linked) return { error: linked.error };
  } else {
    if (!opts.memberRoleId) return { error: "Role member not found." };
    const { error: urErr } = await admin.from("user_roles").upsert(
      { user_id: opts.userId, role_id: opts.memberRoleId },
      { onConflict: "user_id,role_id" }
    );
    if (urErr) return { error: urErr.message };
  }

  return {};
}
