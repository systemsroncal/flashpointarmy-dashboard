import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_KEYS = new Set([
  "verify_email",
  "password_reset",
  "local_leader_assigned",
  "gathering_created",
  "register_otp",
]);

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.emails, "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      template_key?: string;
      subject?: string;
      body_html?: string;
    };

    const templateKey = (body.template_key || "").trim();
    if (!templateKey || !ALLOWED_KEYS.has(templateKey)) {
      return NextResponse.json({ error: "Invalid template_key" }, { status: 400 });
    }

    const subject = (body.subject ?? "").trim();
    const bodyHtml = (body.body_html ?? "").trim();
    if (!subject || !bodyHtml) {
      return NextResponse.json(
        { error: "subject and body_html are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("email_templates")
      .update({
        subject,
        body_html: bodyHtml,
        updated_by: user.id,
      })
      .eq("template_key", templateKey);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 }
    );
  }
}
