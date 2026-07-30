import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/email-otp";

/** Resolve auth.users row by login email (paginated; not limited to first 2k users). */
export async function resolveAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return null;

  const { data: mirror } = await admin
    .from("dashboard_users")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (mirror?.id) {
    const { data: byId, error: byIdErr } = await admin.auth.admin.getUserById(mirror.id);
    if (!byIdErr && byId.user) return byId.user;
  }

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => normalizeEmail(u.email || "") === normalized);
    if (hit) return hit;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 100) return null;
  }
}
