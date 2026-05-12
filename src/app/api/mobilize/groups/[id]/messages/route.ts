import { NextResponse } from "next/server";
import { isApprovedMember } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

const PAGE = 30;

export async function GET(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const ok = await isApprovedMember(admin, id, auth.userId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  let q = admin
    .from("mobilize_group_messages")
    .select("id, group_id, author_id, body, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(PAGE);
  if (before) {
    q = q.lt("created_at", before);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = [...new Set((data ?? []).map((m) => String((m as { author_id: string }).author_id)))];
  const names = new Map<string, string>();
  if (authorIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profs ?? []) {
      names.set(String((p as { id: string }).id), String((p as { display_name: string | null }).display_name ?? ""));
    }
    const { data: dash } = await admin
      .from("dashboard_users")
      .select("id, display_name, email")
      .in("id", authorIds);
    for (const u of dash ?? []) {
      const row = u as { id: string; display_name: string | null; email: string };
      const label = row.display_name?.trim() || row.email;
      names.set(row.id, names.get(row.id) || label);
    }
  }

  const messages = (data ?? []).map((m) => {
    const row = m as { id: string; author_id: string; body: string; created_at: string };
    return {
      ...row,
      author_label: names.get(row.author_id) || "Member",
    };
  });

  const nextCursor =
    messages.length === PAGE ? (messages[messages.length - 1]?.created_at ?? null) : null;
  return NextResponse.json({ messages, nextCursor });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canCreate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const ok = await isApprovedMember(admin, id, auth.userId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const { data, error } = await admin
    .from("mobilize_group_messages")
    .insert({ group_id: id, author_id: auth.userId, body: text })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
