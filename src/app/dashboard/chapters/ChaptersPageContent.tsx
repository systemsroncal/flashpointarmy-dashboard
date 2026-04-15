import { ChaptersSection } from "@/components/dashboard/chapters/ChaptersSection";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ChaptersPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  const read = can(permissions, MODULE_SLUGS.chapters, "read");
  const create = can(permissions, MODULE_SLUGS.chapters, "create");
  const update = can(permissions, MODULE_SLUGS.chapters, "update");
  const del = can(permissions, MODULE_SLUGS.chapters, "delete");

  let rows: {
    id: string;
    name: string;
    address_line: string | null;
    city: string | null;
    state: string;
    zip_code: string | null;
    status: string;
    created_at: string;
  }[] = [];

  try {
    const { data } = await supabase
      .from("chapters")
      .select("id,name,address_line,city,state,zip_code,status,created_at")
      .order("name");
    rows = data ?? [];
  } catch {
    rows = [];
  }

  let leaderOptions: { id: string; label: string }[] = [];
  try {
    const { data: du } = await supabase
      .from("dashboard_users")
      .select("id, email, display_name")
      .order("email");
    leaderOptions =
      du?.map((r) => ({
        id: r.id,
        label: r.display_name ? `${r.display_name} (${r.email})` : r.email,
      })) ?? [];
  } catch {
    leaderOptions = [];
  }

  return (
    <ChaptersSection
      initialRows={rows}
      leaderOptions={leaderOptions}
      canRead={read}
      canCreate={create}
      canUpdate={update}
      canDelete={del}
    />
  );
}
