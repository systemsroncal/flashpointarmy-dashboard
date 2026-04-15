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

type InviteBody = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
    const phone = (body.phone || "").trim();
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

    const { data: createdData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: fn,
        last_name: ln,
        primary_chapter_id: assignChapter,
        phone: phone || null,
      },
    });

    if (createErr || !createdData?.user?.id) {
      const msg = createErr?.message || "Could not create user.";
      const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    const newId = createdData.user.id;

    await admin.auth.admin.updateUserById(newId, { email_confirm: true });

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
        created_at: createdData.user.created_at ?? new Date().toISOString(),
        primary_chapter_id: assignChapter,
        first_name: fn,
        last_name: ln,
        phone: phone || null,
        role_names: [roleToAssign],
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invite failed." },
      { status: 500 }
    );
  }
}
