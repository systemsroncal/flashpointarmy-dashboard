import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.donations, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("donation_amount_presets")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ presets: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load presets" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.donations, "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      presets?: Array<{
        id: string;
        is_enabled?: boolean;
        allow_one_time?: boolean;
        allow_monthly?: boolean;
        allow_bimonthly?: boolean;
        allow_quarterly?: boolean;
        allow_yearly?: boolean;
        sort_order?: number;
      }>;
    };

    if (!Array.isArray(body.presets) || body.presets.length === 0) {
      return NextResponse.json({ error: "presets array required" }, { status: 400 });
    }

    const admin = createAdminClient();
    for (const row of body.presets) {
      const { error } = await admin
        .from("donation_amount_presets")
        .update({
          is_enabled: row.is_enabled,
          allow_one_time: row.allow_one_time,
          allow_monthly: row.allow_monthly,
          allow_bimonthly: row.allow_bimonthly,
          allow_quarterly: row.allow_quarterly,
          allow_yearly: row.allow_yearly,
          sort_order: row.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save presets" },
      { status: 500 }
    );
  }
}
