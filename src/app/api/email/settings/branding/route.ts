import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

export async function PATCH(req: Request) {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.emails, "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      logo_url?: string | null;
      logo_bg_color?: string;
      container_bg_color?: string;
      footer_html?: string;
    };

    const { error } = await supabase
      .from("email_branding_settings")
      .update({
        logo_url: body.logo_url ?? null,
        logo_bg_color: body.logo_bg_color,
        container_bg_color: body.container_bg_color,
        footer_html: body.footer_html,
        updated_by: user.id,
      })
      .eq("id", true);

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
