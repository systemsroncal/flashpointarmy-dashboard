import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import {
  DONATION_DEFAULT_CHECKOUT_URL,
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

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeCardStyle(value: unknown): "light" | "accent" | "dark" {
  if (value === "accent" || value === "dark") return value;
  return "light";
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

/** Create a partnership package (SecureGive URL — no Stripe checkout). */
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
      title?: string;
      description?: string | null;
      amount_cents?: number;
      checkout_url?: string;
      is_enabled?: boolean;
      is_recommended?: boolean;
      card_style?: string;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

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

    const checkoutUrl =
      typeof body.checkout_url === "string" && body.checkout_url.trim().length > 0
        ? body.checkout_url.trim()
        : DONATION_DEFAULT_CHECKOUT_URL;
    if (!isValidHttpUrl(checkoutUrl)) {
      return NextResponse.json({ error: "checkout_url must be a valid http(s) URL." }, { status: 400 });
    }

    const amountCents = Math.round(body.amount_cents);
    const label = formatCentsLabel(amountCents);
    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;

    const admin = createAdminClient();

    const { data: maxSort } = await admin
      .from("donation_amount_presets")
      .select("sort_order")
      .eq("is_custom_amount", false)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSort = (maxSort?.sort_order ?? 0) + 1;

    const { data, error } = await admin
      .from("donation_amount_presets")
      .insert({
        label,
        title,
        description,
        checkout_url: checkoutUrl,
        amount_cents: amountCents,
        is_custom_amount: false,
        sort_order: nextSort,
        is_enabled: body.is_enabled ?? true,
        is_recommended: body.is_recommended ?? false,
        card_style: normalizeCardStyle(body.card_style),
        allow_one_time: false,
        allow_monthly: true,
        allow_bimonthly: false,
        allow_quarterly: false,
        allow_yearly: false,
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
        title?: string;
        description?: string | null;
        checkout_url?: string;
        amount_cents?: number;
        label?: string;
        is_enabled?: boolean;
        is_recommended?: boolean;
        card_style?: string;
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
      if (isCustomById.get(row.id)) continue;

      const update: Record<string, unknown> = {
        is_enabled: row.is_enabled,
        is_recommended: row.is_recommended,
        card_style: normalizeCardStyle(row.card_style),
        sort_order: row.sort_order,
        updated_at: new Date().toISOString(),
      };

      if (typeof row.title === "string" && row.title.trim().length > 0) {
        update.title = row.title.trim();
      }

      if (row.description === null || typeof row.description === "string") {
        update.description =
          typeof row.description === "string" && row.description.trim().length > 0
            ? row.description.trim()
            : null;
      }

      if (typeof row.checkout_url === "string") {
        const url = row.checkout_url.trim();
        if (!isValidHttpUrl(url)) {
          return NextResponse.json({ error: "checkout_url must be a valid http(s) URL." }, { status: 400 });
        }
        update.checkout_url = url;
      }

      if (typeof row.amount_cents === "number") {
        if (!Number.isFinite(row.amount_cents) || row.amount_cents <= 0) {
          return NextResponse.json(
            { error: "amount_cents must be a positive integer" },
            { status: 400 }
          );
        }
        update.amount_cents = Math.round(row.amount_cents);
        update.label =
          typeof row.label === "string" && row.label.trim().length > 0
            ? row.label.trim()
            : formatCentsLabel(Math.round(row.amount_cents));
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
