import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  if (auth.userId === userId) {
    return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  }

  const { data: target } = await auth.admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const { error } = await auth.admin.from("mobilize_user_follows").upsert(
    { follower_id: auth.userId, following_id: userId },
    { onConflict: "follower_id,following_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, is_following: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const { error } = await auth.admin
    .from("mobilize_user_follows")
    .delete()
    .eq("follower_id", auth.userId)
    .eq("following_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, is_following: false });
}
