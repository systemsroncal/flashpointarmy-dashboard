import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedUserEmail = {
  email: string;
  /** Where the delivery address came from. */
  source: "auth" | "dashboard_users" | "none";
  /** Mirror email when it differs from auth (helps debug “sent but not received”). */
  mirrorEmail: string | null;
};

/** Prefer auth.users email — it is what the member logs in with. */
export async function resolveUserEmailForDelivery(
  admin: SupabaseClient,
  userId: string
): Promise<ResolvedUserEmail> {
  const [{ data: du }, authRes] = await Promise.all([
    admin.from("dashboard_users").select("email").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  const authEmail = (authRes.data?.user?.email ?? "").trim().toLowerCase();
  const mirrorEmail = ((du?.email as string | undefined) ?? "").trim().toLowerCase() || null;

  if (authEmail && authEmail.includes("@")) {
    return { email: authEmail, source: "auth", mirrorEmail };
  }
  if (mirrorEmail && mirrorEmail.includes("@")) {
    return { email: mirrorEmail, source: "dashboard_users", mirrorEmail };
  }
  return { email: "", source: "none", mirrorEmail };
}
