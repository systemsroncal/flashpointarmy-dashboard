import { NextResponse } from "next/server";
import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

async function displayNameForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string
) {
  const { data: prof } = await admin
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.first_name || prof?.last_name) {
    return `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim();
  }
  if (prof?.display_name) return prof.display_name;
  return email;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { gatheringId?: string };
    const gatheringId = (body.gatheringId || "").trim();
    if (!gatheringId) {
      return NextResponse.json({ error: "gatheringId required" }, { status: 400 });
    }

    const roles = await loadUserRoleNames(supabase, user.id);
    const elevated = isElevatedRole(roles);
    const isLeader = roles.includes("local_leader");
    if (!elevated && !isLeader) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data: ev, error: evErr } = await supabase
      .from("gatherings")
      .select("id, title, chapter_id, audience_scope, created_by")
      .eq("id", gatheringId)
      .maybeSingle();

    if (evErr || !ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (ev.created_by !== user.id && !elevated) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const admin = createAdminClient();
    let recipientRows: { id: string; email: string }[] = [];

    if (!elevated) {
      if (!ev.chapter_id) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const { data: profs } = await admin
        .from("profiles")
        .select("id")
        .eq("primary_chapter_id", ev.chapter_id);
      const ids = (profs ?? []).map((p: { id: string }) => p.id);
      if (ids.length === 0) {
        return NextResponse.json({ ok: true, sent: 0 });
      }
      const { data: du } = await admin.from("dashboard_users").select("id, email").in("id", ids);
      recipientRows = (du ?? []) as { id: string; email: string }[];
    } else {
      if (ev.audience_scope === "all") {
        const { data: du } = await admin.from("dashboard_users").select("id, email");
        recipientRows = (du ?? []) as { id: string; email: string }[];
      } else {
        if (!ev.chapter_id) {
          return NextResponse.json({ ok: true, skipped: true });
        }
        const { data: profs } = await admin
          .from("profiles")
          .select("id")
          .eq("primary_chapter_id", ev.chapter_id);
        const ids = (profs ?? []).map((p: { id: string }) => p.id);
        if (ids.length === 0) {
          return NextResponse.json({ ok: true, sent: 0 });
        }
        const { data: du } = await admin.from("dashboard_users").select("id, email").in("id", ids);
        recipientRows = (du ?? []) as { id: string; email: string }[];
      }
    }

    const gatheringUrl = `${siteUrl()}/dashboard/gatherings/${ev.id}`;
    const seen = new Set<string>();
    let sent = 0;

    for (const row of recipientRows) {
      const to = row.email?.trim().toLowerCase();
      if (!to || seen.has(to)) continue;
      seen.add(to);
      const full = await displayNameForUser(admin, row.id, to);
      await sendTemplatedEmail(
        "gathering_created",
        to,
        {
          user_fullname: full,
          user_email: to,
          gathering_title: ev.title,
          gathering_url: gatheringUrl,
          resetpassword_url: "",
          validateemail_url: "",
          app_name: "Flashpoint Dashboard",
        },
        { triggeredByUserId: user.id }
      );
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send" },
      { status: 500 }
    );
  }
}
