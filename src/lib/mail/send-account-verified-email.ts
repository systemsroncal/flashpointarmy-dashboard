import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import { ensureAccountVerifiedEmailTemplate } from "@/lib/mail/ensure-account-verified-email-template";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";

function displayNameFromRow(row: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const dn = (row.display_name ?? "").trim();
  if (dn) return dn;
  const parts = [row.first_name, row.last_name].map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
  if (parts.length) return parts.join(" ");
  return (row.email ?? "").trim() || "Member";
}

/** Sends the account_verified template to one verified user. */
export async function sendAccountVerifiedEmail(
  admin: SupabaseClient,
  userId: string,
  options?: { triggeredByUserId?: string | null }
): Promise<void> {
  const [{ data: du }, { data: profile }, authUserRes] = await Promise.all([
    admin.from("dashboard_users").select("email, display_name, first_name, last_name").eq("id", userId).maybeSingle(),
    admin.from("profiles").select("verified_at").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  const verifiedAt = (profile as { verified_at?: string | null } | null)?.verified_at;
  if (!verifiedAt) {
    throw new Error("User is not verified.");
  }

  const email =
    (du as { email?: string | null } | null)?.email?.trim() ||
    authUserRes.data.user?.email?.trim() ||
    "";
  if (!email) {
    throw new Error("User has no email address.");
  }

  await ensureAccountVerifiedEmailTemplate(admin);

  const siteBase = await getAppBaseUrl(admin);
  const profilePath = mobilizeMemberProfileHref(userId);
  const profileUrl = `${siteBase.replace(/\/+$/, "")}${profilePath}`;

  const row = (du ?? {}) as {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };

  await sendTemplatedEmail(
    "account_verified",
    email,
    {
      user_fullname: displayNameFromRow({ ...row, email }),
      user_email: email,
      profile_url: profileUrl,
      app_name: "FlashPoint Army Chapters",
      current_year: String(new Date().getFullYear()),
    },
    { triggeredByUserId: options?.triggeredByUserId ?? null }
  );
}