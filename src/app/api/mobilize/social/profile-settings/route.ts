import { NextResponse } from "next/server";
import { insertProfileUpdateActivity } from "@/lib/community/group-activity-feed";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.admin
    .from("profiles")
    .select("profile_visibility, bio")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    profile_visibility: data?.profile_visibility === "private" ? "private" : "public",
    bio: (data?.bio as string | null) ?? null,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    profile_visibility?: "public" | "private";
    bio?: string;
  };

  const { data: before } = await auth.admin
    .from("profiles")
    .select("profile_visibility, bio")
    .eq("id", auth.userId)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (body.profile_visibility === "public" || body.profile_visibility === "private") {
    patch.profile_visibility = body.profile_visibility;
  }
  if (typeof body.bio === "string") {
    patch.bio = body.bio.trim().slice(0, 500) || null;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("profiles")
    .update(patch)
    .eq("id", auth.userId)
    .select("profile_visibility, bio")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const beforeVisibility = before?.profile_visibility === "private" ? "private" : "public";
  const visibilityChanged =
    typeof patch.profile_visibility === "string" && patch.profile_visibility !== beforeVisibility;
  const bioChanged =
    "bio" in patch && ((before?.bio as string | null) ?? null) !== ((data.bio as string | null) ?? null);

  if (visibilityChanged || bioChanged) {
    await insertProfileUpdateActivity({
      supabase: auth.admin,
      userId: auth.userId,
    });
  }

  return NextResponse.json({ settings: data });
}
