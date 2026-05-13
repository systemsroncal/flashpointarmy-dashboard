import { NextResponse } from "next/server";
import { isAdminButNotSuper, isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Identificador de usuario no válido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const callerRoles = await loadUserRoleNames(supabase, user.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json(
      { error: "Solo un super administrador puede asignar el rol de super administrador." },
      { status: 403 }
    );
  }

  if (user.id === userId) {
    return NextResponse.json(
      { error: "No puedes modificar tu propio rol desde esta acción." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const targetRoles = await loadUserRoleNames(admin, userId);

    if (targetRoles.includes("super_admin")) {
      return NextResponse.json(
        { error: "Esta cuenta ya es super administradora." },
        { status: 400 }
      );
    }
    if (!isAdminButNotSuper(targetRoles)) {
      return NextResponse.json(
        {
          error:
            "Solo se puede ascender a super administrador a un usuario que ya sea administrador (sin rol super).",
        },
        { status: 400 }
      );
    }

    const { data: roleRows, error: rolesErr } = await admin
      .from("roles")
      .select("id, name")
      .in("name", ["admin", "super_admin"]);

    if (rolesErr || !roleRows?.length) {
      return NextResponse.json(
        { error: rolesErr?.message || "No se pudieron cargar los roles." },
        { status: 500 }
      );
    }

    const byName = new Map(roleRows.map((r) => [r.name, r.id] as const));
    const adminRoleId = byName.get("admin");
    const superRoleId = byName.get("super_admin");
    if (!adminRoleId || !superRoleId) {
      return NextResponse.json({ error: "Roles admin o super_admin no encontrados." }, { status: 500 });
    }

    await admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", adminRoleId);

    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_id: superRoleId });

    if (insErr) {
      return NextResponse.json(
        { error: insErr.message || "No se pudo asignar el rol de super administrador." },
        { status: 500 }
      );
    }

    const nextRoles = [...new Set(targetRoles.filter((n) => n !== "admin").concat("super_admin"))].sort();

    return NextResponse.json({ ok: true, role_names: nextRoles });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error del servidor.";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "El servidor no está configurado para actualizar roles (falta service role key)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
