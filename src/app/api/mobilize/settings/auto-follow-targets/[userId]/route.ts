import { NextResponse } from "next/server";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ userId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  if (!isMobilizeSuperAdmin(auth.roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await ctx.params;

  const { error } = await auth.admin
    .from("mobilize_auto_follow_targets")
    .delete()
    .eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
