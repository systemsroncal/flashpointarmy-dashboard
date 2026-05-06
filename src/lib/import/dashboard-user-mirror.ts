import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserMailingFields } from "@/lib/import/user-mailing-address";
import { mailingForUserMetadata } from "@/lib/import/user-mailing-address";

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
    mailing?: UserMailingFields | null;
  }
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const patch = {
    email: row.email,
    first_name: row.firstName,
    last_name: row.lastName,
    display_name: row.displayName,
    primary_chapter_id: row.primaryChapterId,
    phone: row.phone?.trim() || null,
    address_line: row.mailing?.address_line ?? null,
    city: row.mailing?.city ?? null,
    state: row.mailing?.state ?? null,
    zip_code: row.mailing?.zip_code ?? null,
    updated_at: now,
  };

  const { data: exists } = await admin.from("dashboard_users").select("id").eq("id", row.id).maybeSingle();
  if (exists?.id) {
    const { error } = await admin.from("dashboard_users").update(patch).eq("id", row.id);
    return error ? { error: error.message } : {};
  }

  const { error } = await admin.from("dashboard_users").insert({
    id: row.id,
    ...patch,
    created_at: now,
  });
  return error ? { error: error.message } : {};
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
  const mailMeta = mailingForUserMetadata(opts.mailing);

  const { data: prof } = await admin
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", opts.userId)
    .maybeSingle();

  const hadNoChapter = prof?.primary_chapter_id == null;
  const primaryChapterId = hadNoChapter ? opts.chapterId : String(prof!.primary_chapter_id);

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
      address_line: opts.mailing.address_line,
      city: opts.mailing.city,
      state: opts.mailing.state,
      zip_code: opts.mailing.zip_code,
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
    mailing: opts.mailing,
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
