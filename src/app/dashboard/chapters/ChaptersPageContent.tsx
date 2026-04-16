import { ChaptersSection } from "@/components/dashboard/chapters/ChaptersSection";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createAdminClient } from "@/utils/supabase/admin";
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
  let leadersByChapter: Record<string, string> = {};

  try {
    const admin = createAdminClient();
    const { data: leaderRole } = await admin.from("roles").select("id").eq("name", "local_leader").maybeSingle();
    if (leaderRole?.id) {
      const { data: urRows } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role_id", leaderRole.id as string);
      const leaderIds = [...new Set((urRows ?? []).map((r: { user_id: string }) => r.user_id))];
      if (leaderIds.length > 0) {
        const { data: du } = await admin
          .from("dashboard_users")
          .select("id, email, display_name")
          .in("id", leaderIds)
          .order("email");
        leaderOptions =
          du?.map((r) => ({
            id: r.id,
            label: r.display_name ? `${r.display_name} (${r.email})` : r.email,
          })) ?? [];
      }
    }

    if (rows.length > 0) {
      const chapterIds = rows.map((r) => r.id);
      const { data: cl } = await admin
        .from("chapter_leaders")
        .select("chapter_id, user_id")
        .in("chapter_id", chapterIds);
      const userIds = [...new Set((cl ?? []).map((r: { user_id: string }) => r.user_id))];
      const displayById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: duCl } = await admin
          .from("dashboard_users")
          .select("id, email, display_name")
          .in("id", userIds);
        for (const r of duCl ?? []) {
          displayById.set(
            r.id,
            r.display_name ? `${r.display_name} (${r.email})` : r.email
          );
        }
      }
      const acc = new Map<string, string[]>();
      for (const row of cl ?? []) {
        const lab = displayById.get(row.user_id) ?? row.user_id;
        const arr = acc.get(row.chapter_id) ?? [];
        arr.push(lab);
        acc.set(row.chapter_id, arr);
      }
      for (const [cid, labs] of acc) {
        leadersByChapter[cid] = labs.join(", ");
      }
    }
  } catch {
    leaderOptions = [];
    leadersByChapter = {};
  }

  return (
    <ChaptersSection
      initialRows={rows}
      leaderOptions={leaderOptions}
      leadersByChapter={leadersByChapter}
      canRead={read}
      canCreate={create}
      canUpdate={update}
      canDelete={del}
    />
  );
}
