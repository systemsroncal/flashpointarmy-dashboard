import { normalizeAudienceFilter, resolveBroadcastRecipients } from "@/lib/broadcast/audience";
import { requireBroadcastManage } from "@/lib/broadcast/broadcast-auth";
import { BROADCAST_CHANNELS } from "@/lib/broadcast/types";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const gate = await requireBroadcastManage(supabase, user.id, "read");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = (await req.json()) as {
      channel?: string;
      audience?: unknown;
    };

    const channel = (body.channel ?? "email").trim();
    if (!(BROADCAST_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const filter = normalizeAudienceFilter(body.audience);
    const admin = createAdminClient();
    const recipients = await resolveBroadcastRecipients(
      admin,
      filter,
      channel as "email" | "sms"
    );

    const sample = recipients.slice(0, 8).map((r) => ({
      userId: r.userId,
      name:
        r.firstName || r.lastName
          ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
          : r.displayName || r.email || r.phone,
      email: r.email,
      phone: r.phone,
      chapterName: r.chapterName,
      roles: r.roleNames,
    }));

    return NextResponse.json({
      count: recipients.length,
      sample,
      filter,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to preview audience" },
      { status: 500 }
    );
  }
}
