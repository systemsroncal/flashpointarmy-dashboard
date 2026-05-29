import { requireBroadcastManage } from "@/lib/broadcast/broadcast-auth";
import { BROADCAST_CHANNELS, DEFAULT_SHORTCODES_HELP } from "@/lib/broadcast/types";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "read");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await ctx.params;
    const { data, error } = await supabase
      .from("broadcast_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ template: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load template" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "update");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await ctx.params;
    const body = (await req.json()) as {
      name?: string;
      subject?: string;
      body_html?: string;
      body_text?: string;
      shortcodes_help?: string;
    };

    const patch: Record<string, unknown> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (body.name != null) patch.name = body.name.trim();
    if (body.subject != null) patch.subject = body.subject.trim() || null;
    if (body.body_html != null) patch.body_html = body.body_html.trim() || null;
    if (body.body_text != null) patch.body_text = body.body_text.trim();
    if (body.shortcodes_help != null) {
      patch.shortcodes_help = body.shortcodes_help.trim() || DEFAULT_SHORTCODES_HELP;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("broadcast_templates")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ template: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "delete");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { error } = await admin.from("broadcast_templates").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete template" },
      { status: 500 }
    );
  }
}
