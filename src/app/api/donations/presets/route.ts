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
        amount_cents?: number;
        label?: string;
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

    const { data: existing, error: existingError } = await admin
      .from("donation_amount_presets")
      .select("id, is_custom_amount");
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }
    const isCustomById = new Map(
      (existing ?? []).map((p) => [p.id, Boolean(p.is_custom_amount)] as const)
    );

    for (const row of body.presets) {
      const update: Record<string, unknown> = {
        is_enabled: row.is_enabled,
        allow_one_time: row.allow_one_time,
        allow_monthly: row.allow_monthly,
        allow_bimonthly: row.allow_bimonthly,
        allow_quarterly: row.allow_quarterly,
        allow_yearly: row.allow_yearly,
        sort_order: row.sort_order,
        updated_at: new Date().toISOString(),
      };

      const isCustom = isCustomById.get(row.id) ?? false;
      if (!isCustom && typeof row.amount_cents === "number") {
        if (!Number.isFinite(row.amount_cents) || row.amount_cents <= 0) {
          return NextResponse.json(
            { error: "amount_cents must be a positive integer" },
            { status: 400 }
          );
        }
        update.amount_cents = Math.round(row.amount_cents);
        if (typeof row.label !== "string" || row.label.trim().length === 0) {
          const dollars = Math.round(row.amount_cents) / 100;
          update.label = `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
        } else {
          update.label = row.label.trim();
        }
      }

      const { error } = await admin
        .from("donation_amount_presets")
        .update(update)
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
