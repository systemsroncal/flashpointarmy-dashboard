import { ChaptersSection } from "@/components/dashboard/chapters/ChaptersSection";
import { MODULE_SLUGS } from "@/config/modules";
import { listDashboardUsersByIdsWithAuthFallback } from "@/lib/admin/dashboard-user-queries";
import { can } from "@/types/permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

function leaderLabel(r: { display_name: string | null; email: string }): string {
  return r.display_name ? `${r.display_name} (${r.email})` : r.email;
}

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

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roleNames);
  const showChapterRowActions = elevated || !roleNames.includes("local_leader");

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
    /** Anyone with the local_leader role OR already linked in chapter_leaders (covers legacy / partial role sync). */
    const leaderIdSet = new Set<string>();

    const { data: leaderRole } = await admin.from("roles").select("id").eq("name", "local_leader").maybeSingle();
    if (leaderRole?.id) {
      const { data: urRows } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role_id", leaderRole.id as string);
      for (const r of urRows ?? []) leaderIdSet.add((r as { user_id: string }).user_id);
    }

    const { data: clUsers } = await admin.from("chapter_leaders").select("user_id");
    for (const r of clUsers ?? []) leaderIdSet.add((r as { user_id: string }).user_id);

    const chapterIds = rows.map((r) => r.id);
    const chapterIdSet = new Set(chapterIds);

    let clRowsForPage: { chapter_id: string; user_id: string }[] = [];
    if (chapterIds.length > 0) {
      const { data: cl } = await admin
        .from("chapter_leaders")
        .select("chapter_id, user_id")
        .in("chapter_id", chapterIds);
      clRowsForPage = (cl ?? []) as { chapter_id: string; user_id: string }[];
    }

    const clUserIdsForPage = [...new Set(clRowsForPage.map((r) => r.user_id))];
    const allLabelIds = [...new Set([...leaderIdSet, ...clUserIdsForPage])];
    const labelRows =
      allLabelIds.length > 0 ? await listDashboardUsersByIdsWithAuthFallback(admin, allLabelIds) : [];
    const labelByUserId = new Map<string, string>();
    for (const r of labelRows) {
      labelByUserId.set(r.id, leaderLabel(r));
    }

    if (leaderIdSet.size > 0) {
      leaderOptions = [...leaderIdSet]
        .map((id) => {
          const row = labelRows.find((u) => u.id === id);
          if (!row) return { id, label: id };
          return { id, label: leaderLabel(row) };
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    }

    const labelsByChapter = new Map<string, Set<string>>();
    const addLabel = (chapterId: string | null | undefined, userId: string) => {
      if (!chapterId || !chapterIdSet.has(chapterId)) return;
      const lab = labelByUserId.get(userId) ?? userId;
      let set = labelsByChapter.get(chapterId);
      if (!set) {
        set = new Set();
        labelsByChapter.set(chapterId, set);
      }
      set.add(lab);
    };

    for (const row of clRowsForPage) {
      addLabel(row.chapter_id, row.user_id);
    }

    /** Leaders assigned via primary chapter (same as Leaders page) may have no chapter_leaders row yet. */
    const leaderIdsArr = [...leaderIdSet];
    if (leaderRole?.id && leaderIdsArr.length > 0 && chapterIds.length > 0) {
      const { data: profRows } = await admin
        .from("profiles")
        .select("id, primary_chapter_id")
        .in("id", leaderIdsArr)
        .in("primary_chapter_id", chapterIds);
      for (const p of profRows ?? []) {
        const row = p as { id: string; primary_chapter_id: string | null };
        if (row.primary_chapter_id && leaderIdSet.has(row.id)) {
          addLabel(row.primary_chapter_id, row.id);
        }
      }

      for (const r of labelRows) {
        if (r.primary_chapter_id && chapterIdSet.has(r.primary_chapter_id) && leaderIdSet.has(r.id)) {
          addLabel(r.primary_chapter_id, r.id);
        }
      }
    }

    for (const [cid, set] of labelsByChapter) {
      leadersByChapter[cid] = [...set].join(", ");
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
      showRowActions={showChapterRowActions}
    />
  );
}
