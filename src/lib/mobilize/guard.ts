import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";

export type MobilizeAuthed = {
  userId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export async function getMobilizeAuth(): Promise<
  | { ok: true; userId: string; flags: MobilizeAuthed }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const permissions = await loadModulePermissions(supabase, user.id);
  const flags: MobilizeAuthed = {
    userId: user.id,
    canRead: can(permissions, MODULE_SLUGS.movilization, "read"),
    canCreate: can(permissions, MODULE_SLUGS.movilization, "create"),
    canUpdate: can(permissions, MODULE_SLUGS.movilization, "update"),
    canDelete: can(permissions, MODULE_SLUGS.movilization, "delete"),
  };

  if (!flags.canRead) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, flags };
}
