import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";

function isCommunicationsAdmin(roleNames: string[]) {
  return roleNames.includes("super_admin") || roleNames.includes("admin");
}

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isCommunicationsAdmin(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboard_users")
    .select("id, email, first_name, last_name, display_name")
    .order("email")
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tokens = q.split(/\s+/).filter(Boolean);
  const users = (data ?? [])
    .map((row) => {
      const r = row as {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
      };
      const blob = [
        r.email,
        r.first_name,
        r.last_name,
        r.display_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return { ...r, blob };
    })
    .filter((r) => tokens.every((t) => r.blob.includes(t)))
    .slice(0, 20)
    .map(({ blob: _blob, ...rest }) => rest);

  return NextResponse.json({ users });
}
