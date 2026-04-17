import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  primaryChapterId?: string;
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

    const permissions = await loadModulePermissions(supabase, caller.id);
    const callerRoles = await loadUserRoleNames(supabase, caller.id);
    if (!isSuperAdminUser(callerRoles) || !can(permissions, MODULE_SLUGS.admins, "create")) {
      return NextResponse.json(
        { error: "Only a super admin with create permission on Administrators can invite admins." },
        { status: 403 }
      );
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const fn = (body.firstName || "").trim();
    const ln = (body.lastName || "").trim();
    const phone = (body.phone || "").trim();
    const chapterRaw = (body.primaryChapterId || "").trim();

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

    const admin = createAdminClient();

    const { data: createdData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: fn,
        last_name: ln,
        primary_chapter_id: chapterRaw,
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

    const { data: adminRole, error: roleErr } = await admin
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .maybeSingle();

    if (roleErr || !adminRole?.id) {
      await admin.auth.admin.deleteUser(newId);
      return NextResponse.json(
        { error: roleErr?.message || "Role admin not found." },
        { status: 500 }
      );
    }

    await admin.from("user_roles").delete().eq("user_id", newId);
    const { error: insRole } = await admin
      .from("user_roles")
      .insert({ user_id: newId, role_id: adminRole.id as string });

    if (insRole) {
      await admin.auth.admin.deleteUser(newId);
      return NextResponse.json(
        { error: insRole.message || "Could not assign administrator role." },
        { status: 500 }
      );
    }

    const displayName = `${fn} ${ln}`.trim();
    const { error: profErr } = await admin
      .from("profiles")
      .update({
        first_name: fn,
        last_name: ln,
        display_name: displayName,
        primary_chapter_id: chapterRaw,
        ...(phone ? { phone } : {}),
      })
      .eq("id", newId);

    if (profErr) {
      await admin.auth.admin.deleteUser(newId);
      return NextResponse.json(
        { error: profErr.message || "Could not update profile." },
        { status: 500 }
      );
    }

    if (phone) {
      await admin.from("dashboard_users").update({ phone }).eq("id", newId);
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: newId,
        email,
        display_name: displayName,
        created_at: createdData.user.created_at ?? new Date().toISOString(),
        primary_chapter_id: chapterRaw,
        first_name: fn,
        last_name: ln,
        phone: phone || null,
        role_names: ["admin"],
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invite failed." },
      { status: 500 }
    );
  }
}
