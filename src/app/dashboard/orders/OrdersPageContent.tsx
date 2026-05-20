import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { OrdersListClient } from "@/components/dashboard/donations/OrdersListClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import type { DonationOrder } from "@/types/donations";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function OrdersPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.orders, "read")) {
    return <AccessDenied message="You do not have access to orders." />;
  }

  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("donation_orders")
    .select(
      "id, user_id, preset_id, amount_cents, currency, payment_mode, recurrence_interval, status, donor_name, donor_email, stripe_checkout_session_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return <AccessDenied message={error.message} />;
  }

  return <OrdersListClient orders={(orders ?? []) as DonationOrder[]} />;
}
