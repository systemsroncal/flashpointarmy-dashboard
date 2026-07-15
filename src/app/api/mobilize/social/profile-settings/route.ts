import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function PATCH(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    profile_visibility?: "public" | "private";
    bio?: string;
  };

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
  return NextResponse.json({ settings: data });
}
