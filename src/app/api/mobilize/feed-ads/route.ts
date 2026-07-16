import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadMobilizeFeedAds, parseMobilizeFeedAds, serializeMobilizeFeedAds } from "@/lib/mobilize/feed-ads";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const items = await loadMobilizeFeedAds(auth.admin);
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as { items?: unknown };
  const items = serializeMobilizeFeedAds(parseMobilizeFeedAds(body.items));

  const { error } = await auth.admin
    .from("mobilize_policy_settings")
    .update({
      group_feed_ads: items,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items });
}
