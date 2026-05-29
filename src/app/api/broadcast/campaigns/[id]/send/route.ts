import { normalizeAudienceFilter } from "@/lib/broadcast/audience";
import { executeBroadcastCampaign } from "@/lib/broadcast/execute-campaign";
import { requireBroadcastSend } from "@/lib/broadcast/broadcast-auth";
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

export async function POST(_req: Request, ctx: RouteCtx) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastSend(supabase, user.id);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("broadcast_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (data.status !== "draft") {
      return NextResponse.json({ error: "Campaign was already sent" }, { status: 409 });
    }

    const campaign = rowToCampaign(data as Record<string, unknown>);
    if (campaign.channel === "email" && (!campaign.subject || !campaign.body_html)) {
      return NextResponse.json(
        { error: "Subject and body are required before sending email" },
        { status: 400 }
      );
    }
    if (campaign.channel === "sms" && !campaign.body_text?.trim()) {
      return NextResponse.json({ error: "SMS body is required" }, { status: 400 });
    }

    const result = await executeBroadcastCampaign(admin, campaign);
    const { data: updated } = await admin
      .from("broadcast_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({
      campaign: rowToCampaign((updated ?? data) as Record<string, unknown>),
      result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send campaign" },
      { status: 500 }
    );
  }
}
