import { normalizeAudienceFilter } from "@/lib/broadcast/audience";
import { requireBroadcastManage } from "@/lib/broadcast/broadcast-auth";
import type { BroadcastCampaignRow } from "@/lib/broadcast/types";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

function rowToCampaign(row: Record<string, unknown>): BroadcastCampaignRow {
  return {
    ...(row as BroadcastCampaignRow),
    audience: normalizeAudienceFilter(row.audience),
  };
}

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "read");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await ctx.params;
    const { data, error } = await supabase
      .from("broadcast_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: logs } = await supabase
      .from("broadcast_send_logs")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(200);

    return NextResponse.json({
      campaign: rowToCampaign(data as Record<string, unknown>),
      logs: logs ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load campaign" },
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
      audience?: unknown;
      email_provider?: string;
    };

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name != null) patch.name = body.name.trim();
    if (body.subject != null) patch.subject = body.subject.trim() || null;
    if (body.body_html != null) patch.body_html = body.body_html.trim() || null;
    if (body.body_text != null) patch.body_text = body.body_text.trim();
    if (body.audience != null) patch.audience = normalizeAudienceFilter(body.audience);
    if (body.email_provider != null) patch.email_provider = body.email_provider.trim();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("broadcast_campaigns")
      .update(patch)
      .eq("id", id)
      .eq("status", "draft")
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) {
      return NextResponse.json(
        { error: "Campaign not found or already sent" },
        { status: 404 }
      );
    }
    return NextResponse.json({ campaign: rowToCampaign(data as Record<string, unknown>) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update campaign" },
      { status: 500 }
    );
  }
}
