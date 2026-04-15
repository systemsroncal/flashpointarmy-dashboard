import { NextResponse } from "next/server";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type Body = { limit?: number; dryRun?: boolean; confirm?: string };

/**
 * Removes the most recently created **member-only** accounts (role = member, nothing else).
 * Super admin only. Use dryRun first to verify the list matches your mistaken import.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isSuperAdminUser(roles)) {
    return NextResponse.json({ error: "Forbidden — super admin only." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const limit = Math.min(500, Math.max(1, Math.floor(Number(body.limit) || 0)));
  if (!limit) {
    return NextResponse.json({ error: "Provide limit between 1 and 500." }, { status: 400 });
  }

  const dryRun = Boolean(body.dryRun);
  if (!dryRun && body.confirm !== "DELETE_RECENT_MEMBERS") {
    return NextResponse.json(
      { error: 'Set confirm to the exact string "DELETE_RECENT_MEMBERS" to execute.' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: duRows } = await admin
      .from("dashboard_users")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(600);

    if (!duRows?.length) {
      return NextResponse.json({ ok: true, dryRun, count: 0, users: [], deleted: 0 });
    }

    const ids = duRows.map((r) => r.id);
    const { data: urRows } = await admin
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", ids);

    const byUser = new Map<string, string[]>();
    for (const row of urRows ?? []) {
      const rel = row.roles as unknown;
      const n = Array.isArray(rel)
        ? (rel[0] as { name?: string } | undefined)?.name
        : (rel as { name?: string } | null)?.name;
      if (!n) continue;
      const list = byUser.get(row.user_id as string) ?? [];
      list.push(n);
      byUser.set(row.user_id as string, list);
    }

    const candidates: { id: string; email: string | null; created_at: string }[] = [];
    for (const row of duRows) {
      const rnames = (byUser.get(row.id) ?? []).sort();
      const memberOnly = rnames.length === 1 && rnames[0] === "member";
      if (!memberOnly) continue;
      candidates.push({
        id: row.id,
        email: row.email,
        created_at: row.created_at,
      });
      if (candidates.length >= limit) break;
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        count: candidates.length,
        users: candidates,
      });
    }

    let deleted = 0;
    const errors: string[] = [];
    for (const c of candidates) {
      const { error } = await admin.auth.admin.deleteUser(c.id);
      if (error) {
        errors.push(`${c.email ?? c.id}: ${error.message}`);
      } else {
        deleted++;
      }
    }

    return NextResponse.json({
      ok: true,
      deleted,
      matchedMemberOnly: candidates.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured (missing service role key)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
