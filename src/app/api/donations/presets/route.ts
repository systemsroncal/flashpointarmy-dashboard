import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import {
  DONATION_MAX_CUSTOM_CENTS,
  DONATION_MIN_CUSTOM_CENTS,
} from "@/lib/donations/constants";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

function formatCentsLabel(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

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

/**
 * Create a new fixed-amount donation preset. Custom-amount presets are
 * intentionally not creatable from this endpoint: migration 045 enforces a
 * unique partial index that guarantees there is at most one row with
 * `is_custom_amount = true`, and the seed inserts it.
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.donations, "create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      amount_cents?: number;
      label?: string;
      is_enabled?: boolean;
      allow_one_time?: boolean;
      allow_monthly?: boolean;
      allow_bimonthly?: boolean;
      allow_quarterly?: boolean;
      allow_yearly?: boolean;
    };

    if (
      typeof body.amount_cents !== "number" ||
      !Number.isFinite(body.amount_cents) ||
      body.amount_cents < DONATION_MIN_CUSTOM_CENTS ||
      body.amount_cents > DONATION_MAX_CUSTOM_CENTS
    ) {
      return NextResponse.json(
        {
          error: `amount_cents must be between ${DONATION_MIN_CUSTOM_CENTS} and ${DONATION_MAX_CUSTOM_CENTS}.`,
        },
        { status: 400 }
      );
    }

    const amountCents = Math.round(body.amount_cents);
    const label =
      typeof body.label === "string" && body.label.trim().length > 0
        ? body.label.trim()
        : formatCentsLabel(amountCents);

    const admin = createAdminClient();

    /** Place new fixed presets just before the custom row (sort_order = 99). */
    const { data: maxFixed } = await admin
      .from("donation_amount_presets")
      .select("sort_order")
      .eq("is_custom_amount", false)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSort = Math.min(98, (maxFixed?.sort_order ?? 0) + 1);

    const { data, error } = await admin
      .from("donation_amount_presets")
      .insert({
        label,
        amount_cents: amountCents,
        is_custom_amount: false,
        sort_order: nextSort,
        is_enabled: body.is_enabled ?? true,
        allow_one_time: body.allow_one_time ?? true,
        allow_monthly: body.allow_monthly ?? false,
        allow_bimonthly: body.allow_bimonthly ?? false,
        allow_quarterly: body.allow_quarterly ?? false,
        allow_yearly: body.allow_yearly ?? false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ preset: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create preset" },
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
