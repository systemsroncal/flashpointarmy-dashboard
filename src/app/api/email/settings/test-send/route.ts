import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { sendTemplatedEmail, type TemplateKey } from "@/lib/mail/send-templated-email";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED = new Set<TemplateKey>([
  "verify_email",
  "password_reset",
  "local_leader_assigned",
  "gathering_created",
  "register_otp",
]);

const DEMO_SHORTCODES = {
  user_fullname: "Jane D.",
  user_email: "jane.doe@example.com",
  validateemail_url: "https://example.com/auth/verify?token=demo",
  resetpassword_url: "https://example.com/auth/reset-password?token=demo",
  gathering_title: "Sunday community gathering",
  gathering_url: "https://example.com/dashboard/gatherings/demo",
  app_name: "Flashpoint Dashboard",
  otp: "123456",
};

export async function POST(req: Request) {
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

    const body = (await req.json()) as { template_key?: string; to_email?: string };
    const templateKey = (body.template_key || "").trim() as TemplateKey;
    const toEmail = (body.to_email || "").trim().toLowerCase();
    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json({ error: "Valid to_email required" }, { status: 400 });
    }
    if (!ALLOWED.has(templateKey)) {
      return NextResponse.json({ error: "Invalid template_key" }, { status: 400 });
    }

    await sendTemplatedEmail(templateKey, toEmail, DEMO_SHORTCODES, {
      triggeredByUserId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 }
    );
  }
}
