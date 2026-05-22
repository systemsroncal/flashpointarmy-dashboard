import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Delete a donation preset. Refuses when the target row has
 * `is_custom_amount = true` — the custom row is required for the public
 * Donate page to render the "Other amount" entry. Migration 045 enforces a
 * single custom row via a unique partial index, so it must be preserved.
 *
 * Historical orders / subscriptions reference `preset_id` via ON DELETE SET
 * NULL (migration 045), so deleting a preset never breaks past records.
 */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid preset id." }, { status: 400 });
    }

    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.donations, "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: target, error: lookupErr } = await admin
      .from("donation_amount_presets")
      .select("id, is_custom_amount, label")
      .eq("id", id)
      .maybeSingle();

    if (lookupErr) {
      return NextResponse.json({ error: lookupErr.message }, { status: 400 });
    }
    if (!target) {
      return NextResponse.json({ error: "Preset not found." }, { status: 404 });
    }
    if (target.is_custom_amount) {
      return NextResponse.json(
        { error: "The custom-amount row cannot be deleted." },
        { status: 400 }
      );
    }

    const { error: deleteErr } = await admin
      .from("donation_amount_presets")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete preset" },
      { status: 500 }
    );
  }
}
