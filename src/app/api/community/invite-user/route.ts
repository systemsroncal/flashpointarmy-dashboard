import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { MODULE_SLUGS } from "@/config/modules";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function absoluteAuthLink(link: string) {
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (!base) return link;
  const path = link.startsWith("/") ? link : `/${link}`;
  return `${base}${path}`;
}

type InviteBody = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  primaryChapterId?: string;
  roleName?: string;
  context?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: InviteBody;
    try {
      body = (await req.json()) as InviteBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const fn = (body.firstName || "").trim();
    const ln = (body.lastName || "").trim();
    const chapterRaw = (body.primaryChapterId || "").trim();
    const context = body.context === "leaders" ? "leaders" : "community";
    const roleToAssign: "member" | "local_leader" =
      context === "leaders"
        ? "local_leader"
        : body.roleName === "local_leader"
          ? "local_leader"
          : "member";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!fn || !ln) {
      return NextResponse.json({ error: "First name and last name are required." }, { status: 400 });
    }
    if (!UUID_RE.test(chapterRaw)) {
      return NextResponse.json({ error: "Select a valid primary chapter." }, { status: 400 });
    }

    const permissions = await loadModulePermissions(supabase, caller.id);
    const callerRoles = await loadUserRoleNames(supabase, caller.id);
    const elevated = isElevatedRole(callerRoles);
    const isLocalLeader = callerRoles.includes("local_leader");

    if (context === "community") {
      if (!can(permissions, MODULE_SLUGS.community, "create")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    } else {
      if (!can(permissions, MODULE_SLUGS.leaders, "create")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (!elevated) {
        return NextResponse.json(
          { error: "Only admins can add leaders from this screen." },
          { status: 403 }
        );
      }
    }

    if (roleToAssign === "local_leader" && !elevated) {
      return NextResponse.json(
        { error: "Only admins can invite Local leaders." },
        { status: 403 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_chapter_id")
      .eq("id", caller.id)
      .maybeSingle();

    const localChapterId = profile?.primary_chapter_id ?? null;
    const assignChapter =
      isLocalLeader && localChapterId && !elevated ? localChapterId : chapterRaw;

    if (isLocalLeader && !elevated && chapterRaw !== localChapterId) {
      return NextResponse.json(
        { error: "You can only invite users to your primary chapter." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          first_name: fn,
          last_name: ln,
          primary_chapter_id: assignChapter,
        },
        redirectTo: `${siteUrl()}/login`,
      },
    });

    if (linkErr || !linkData?.user?.id) {
      const msg = linkErr?.message || "Could not create user.";
      const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    const newId = linkData.user.id;
    const rawLink = linkData.properties?.action_link;
    if (!rawLink) {
      await admin.auth.admin.deleteUser(newId);
      return NextResponse.json({ error: "Auth did not return a confirmation link." }, { status: 500 });
    }

    const actionLink = absoluteAuthLink(rawLink);

    const { error: rpcError } = await supabase.rpc("assign_invited_user_primary_role", {
      p_user_id: newId,
      p_role_name: roleToAssign,
    });

    if (rpcError) {
      await admin.auth.admin.deleteUser(newId);
      return NextResponse.json(
        { error: rpcError.message || "Could not assign role." },
        { status: 500 }
      );
    }

    const displayName = `${fn} ${ln}`.trim();
    let emailWarning: string | null = null;
    try {
      await sendTemplatedEmail(
        "verify_email",
        email,
        {
          user_fullname: displayName,
          user_email: email,
          validateemail_url: actionLink,
          resetpassword_url: "",
          gathering_title: "",
          gathering_url: "",
          app_name: "Flashpoint Dashboard",
        },
        { triggeredByUserId: caller.id }
      );
    } catch (e) {
      emailWarning =
        e instanceof Error
          ? e.message
          : "Confirmation email could not be sent; resend from Email settings or Supabase.";
    }

    if (roleToAssign === "local_leader") {
      try {
        await sendTemplatedEmail(
          "local_leader_assigned",
          email,
          {
            user_fullname: displayName,
            user_email: email,
            resetpassword_url: "",
            validateemail_url: "",
            gathering_title: "",
            gathering_url: "",
            app_name: "Flashpoint Dashboard",
          },
          { triggeredByUserId: caller.id }
        );
      } catch {
        /* optional notice */
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: newId,
        email,
        display_name: displayName,
        created_at: linkData.user.created_at ?? new Date().toISOString(),
        primary_chapter_id: assignChapter,
        first_name: fn,
        last_name: ln,
        role_names: [roleToAssign],
      },
      emailWarning,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invite failed." },
      { status: 500 }
    );
  }
}
