import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Cell = {
  role_id: string;
  module_id: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.adminRoles, "update")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    let body: { cells?: unknown };
    try {
      body = (await req.json()) as { cells?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    if (!Array.isArray(body.cells) || body.cells.length === 0) {
      return NextResponse.json({ error: "cells[] required." }, { status: 400 });
    }

    const cells: Cell[] = [];
    for (const raw of body.cells) {
      if (!raw || typeof raw !== "object") continue;
      const c = raw as Record<string, unknown>;
      const role_id = String(c.role_id ?? "");
      const module_id = String(c.module_id ?? "");
      if (!UUID_RE.test(role_id) || !UUID_RE.test(module_id)) {
        return NextResponse.json({ error: "Invalid role_id or module_id." }, { status: 400 });
      }
      cells.push({
        role_id,
        module_id,
        can_create: Boolean(c.can_create),
        can_read: Boolean(c.can_read),
        can_update: Boolean(c.can_update),
        can_delete: Boolean(c.can_delete),
      });
    }

    if (cells.length === 0) {
      return NextResponse.json({ error: "No valid cells." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("role_permissions").upsert(cells, {
      onConflict: "role_id,module_id",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 500 }
    );
  }
}
