import { requireBroadcastManage } from "@/lib/broadcast/broadcast-auth";
import { BROADCAST_CHANNELS, DEFAULT_SHORTCODES_HELP } from "@/lib/broadcast/types";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "read");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const url = new URL(req.url);
    const channel = url.searchParams.get("channel")?.trim();

    let query = supabase
      .from("broadcast_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (channel && (BROADCAST_CHANNELS as readonly string[]).includes(channel)) {
      query = query.eq("channel", channel);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ templates: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load templates" },
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
      subject?: string;
      body_html?: string;
      body_text?: string;
      shortcodes_help?: string;
    };

    const name = (body.name ?? "").trim();
    const channel = (body.channel ?? "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!(BROADCAST_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const subject = (body.subject ?? "").trim() || null;
    const bodyHtml = (body.body_html ?? "").trim() || null;
    const bodyText = (body.body_text ?? "").trim();
    if (channel === "sms" && !bodyText) {
      return NextResponse.json({ error: "body_text is required for SMS templates" }, { status: 400 });
    }
    if (channel === "email" && (!subject || !bodyHtml)) {
      return NextResponse.json(
        { error: "subject and body_html are required for email templates" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("broadcast_templates")
      .insert({
        name,
        channel,
        subject,
        body_html: bodyHtml,
        body_text: bodyText || (bodyHtml ? stripHtml(bodyHtml) : ""),
        shortcodes_help: (body.shortcodes_help ?? DEFAULT_SHORTCODES_HELP).trim(),
        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ template: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create template" },
      { status: 500 }
    );
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
