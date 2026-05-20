import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import {
  DONATION_MAX_CUSTOM_CENTS,
  DONATION_MIN_CUSTOM_CENTS,
} from "@/lib/donations/constants";
import { presetAllowsMode, resolvePresetAmountCents } from "@/lib/donations/presets";
import { createDonationCheckoutSession, isStripeConfigured } from "@/lib/donations/stripe";
import { MODULE_SLUGS } from "@/config/modules";
import type { DonationPaymentMode, DonationRecurrenceInterval } from "@/types/donations";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

function appBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.donate, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Online payments are not configured yet. Contact an administrator." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      presetId: string;
      customAmountCents?: number;
      paymentMode: DonationPaymentMode;
      recurrenceInterval?: DonationRecurrenceInterval | null;
      donorName?: string | null;
    };

    const admin = createAdminClient();
    const { data: preset, error: presetError } = await admin
      .from("donation_amount_presets")
      .select("*")
      .eq("id", body.presetId)
      .eq("is_enabled", true)
      .maybeSingle();

    if (presetError || !preset) {
      return NextResponse.json({ error: "Invalid donation option" }, { status: 400 });
    }

    const paymentMode = body.paymentMode;
    const interval =
      paymentMode === "recurring" ? (body.recurrenceInterval ?? null) : null;

    if (!presetAllowsMode(preset, paymentMode, interval)) {
      return NextResponse.json({ error: "This payment type is not available for the selected amount" }, { status: 400 });
    }

    if (paymentMode === "recurring" && !interval) {
      return NextResponse.json({ error: "Recurrence interval required" }, { status: 400 });
    }

    const amountCents = resolvePresetAmountCents(preset, body.customAmountCents);
    if (amountCents == null) {
      return NextResponse.json({ error: "Enter a valid custom amount" }, { status: 400 });
    }

    if (preset.is_custom_amount) {
      if (amountCents < DONATION_MIN_CUSTOM_CENTS || amountCents > DONATION_MAX_CUSTOM_CENTS) {
        return NextResponse.json(
          {
            error: `Custom amount must be between $${DONATION_MIN_CUSTOM_CENTS / 100} and $${DONATION_MAX_CUSTOM_CENTS / 100}`,
          },
          { status: 400 }
        );
      }
    }

    const donorEmail = user.email?.trim();
    if (!donorEmail) {
      return NextResponse.json({ error: "Your account must have an email to donate" }, { status: 400 });
    }

    const donorName =
      body.donorName?.trim() ||
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      null;

    const { data: order, error: orderError } = await admin
      .from("donation_orders")
      .insert({
        user_id: user.id,
        preset_id: preset.id,
        amount_cents: amountCents,
        payment_mode: paymentMode,
        recurrence_interval: interval,
        status: "pending",
        donor_email: donorEmail,
        donor_name: donorName,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Could not create order" }, { status: 400 });
    }

    const base = appBaseUrl(req);
    const session = await createDonationCheckoutSession({
      orderId: order.id,
      amountCents,
      donorEmail,
      donorName,
      paymentMode,
      recurrenceInterval: interval,
      successUrl: `${base}/dashboard/donate?status=success`,
      cancelUrl: `${base}/dashboard/donate?status=cancelled`,
    });

    await admin
      .from("donation_orders")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
