import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { DonatePageClient } from "@/components/dashboard/donate/DonatePageClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import type { DonationAmountPreset } from "@/types/donations";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function DonatePageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.donate, "read")) {
    return <AccessDenied message="You do not have access to the donate page." />;
  }

  const { data: presets, error } = await supabase
    .from("donation_amount_presets")
    .select("*")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return <AccessDenied message={error.message} />;
  }

  return (
    <DonatePageClient presets={(presets ?? []) as DonationAmountPreset[]} />
  );
}
