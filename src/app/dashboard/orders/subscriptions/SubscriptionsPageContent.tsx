import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { SubscriptionsListClient } from "@/components/dashboard/donations/SubscriptionsListClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import type { DonationSubscription } from "@/types/donations";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function SubscriptionsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.orders, "read")) {
    return <AccessDenied message="You do not have access to subscriptions." />;
  }

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("donation_subscriptions")
    .select(
      "id, user_id, order_id, amount_cents, currency, recurrence_interval, status, donor_name, donor_email, stripe_subscription_id, current_period_end, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return <AccessDenied message={error.message} />;
  }

  return (
    <SubscriptionsListClient subscriptions={(subscriptions ?? []) as DonationSubscription[]} />
  );
}
