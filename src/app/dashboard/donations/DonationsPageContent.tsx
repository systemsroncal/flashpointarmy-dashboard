import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { DonationsSettingsClient } from "@/components/dashboard/donations/DonationsSettingsClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import type { DonationAmountPreset } from "@/types/donations";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function DonationsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.donations, "read")) {
    return <AccessDenied message="You do not have access to donation settings." />;
  }

  const admin = createAdminClient();
  const { data: presets, error } = await admin
    .from("donation_amount_presets")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return <AccessDenied message={error.message} />;
  }

  const canEdit = can(permissions, MODULE_SLUGS.donations, "update");
  const canCreate = can(permissions, MODULE_SLUGS.donations, "create");
  const canDelete = can(permissions, MODULE_SLUGS.donations, "delete");

  return (
    <DonationsSettingsClient
      initialPresets={(presets ?? []) as DonationAmountPreset[]}
      canEdit={canEdit}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
