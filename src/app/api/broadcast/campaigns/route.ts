import { normalizeAudienceFilter } from "@/lib/broadcast/audience";
import { requireBroadcastManage } from "@/lib/broadcast/broadcast-auth";
import {
  BROADCAST_CHANNELS,
  EMAIL_PROVIDERS,
  type BroadcastCampaignRow,
} from "@/lib/broadcast/types";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

function rowToCampaign(row: Record<string, unknown>): BroadcastCampaignRow {
  return {
    ...(row as BroadcastCampaignRow),
    audience: normalizeAudienceFilter(row.audience),
  };
}

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "read");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

    const { data, error } = await supabase
      .from("broadcast_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      campaigns: (data ?? []).map((r) => rowToCampaign(r as Record<string, unknown>)),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "create");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = (await req.json()) as {
      name?: string;
      channel?: string;
      template_id?: string | null;
      subject?: string;
      body_html?: string;
      body_text?: string;
      audience?: unknown;
      email_provider?: string;
      send_now?: boolean;
    };

    const channel = (body.channel ?? "email").trim();
    if (!(BROADCAST_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const emailProvider = (body.email_provider ?? "dashboard").trim();
    if (channel === "email" && !(EMAIL_PROVIDERS as readonly string[]).includes(emailProvider)) {
      return NextResponse.json({ error: "Invalid email_provider" }, { status: 400 });
    }

    const audience = normalizeAudienceFilter(body.audience);
    const name = (body.name ?? "").trim() || `Campaign ${new Date().toLocaleString()}`;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("broadcast_campaigns")
      .insert({
        name,
        channel,
        template_id: body.template_id?.trim() || null,
        subject: (body.subject ?? "").trim() || null,
        body_html: (body.body_html ?? "").trim() || null,
        body_text: (body.body_text ?? "").trim(),
        audience,
        email_provider: channel === "email" ? emailProvider : "dashboard",
        status: "draft",
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (body.send_now) {
      const { executeBroadcastCampaign } = await import("@/lib/broadcast/execute-campaign");
      const result = await executeBroadcastCampaign(admin, rowToCampaign(data as Record<string, unknown>));
      const { data: updated } = await admin
        .from("broadcast_campaigns")
        .select("*")
        .eq("id", data.id)
        .single();
      return NextResponse.json({
        campaign: rowToCampaign((updated ?? data) as Record<string, unknown>),
        result,
      });
    }

    return NextResponse.json({ campaign: rowToCampaign(data as Record<string, unknown>) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
