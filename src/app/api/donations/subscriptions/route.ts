import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.orders, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("donation_subscriptions")
      .select(
        "id, user_id, order_id, amount_cents, currency, recurrence_interval, status, donor_name, donor_email, stripe_subscription_id, current_period_end, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ subscriptions: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load subscriptions" },
      { status: 500 }
    );
  }
}
