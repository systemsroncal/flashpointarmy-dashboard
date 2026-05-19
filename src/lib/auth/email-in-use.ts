import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/email-otp";

/** Returns true if another auth user already has this email. */
export async function isEmailInUse(
  admin: SupabaseClient,
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const target = normalizeEmail(email);
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.some(
      (u) =>
        (u.email || "").toLowerCase() === target &&
        (!excludeUserId || u.id !== excludeUserId)
    );
    if (hit) return true;
    if (data.users.length < perPage) return false;
    page += 1;
    if (page > 50) return false;
  }
}
