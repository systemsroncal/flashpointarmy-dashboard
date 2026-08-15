import { NextResponse } from "next/server";
import { insertGroupInviteShareActivity } from "@/lib/community/group-activity-feed";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

const SHARE_CHANNELS = new Set([
  "whatsapp",
  "facebook",
  "x",
  "linkedin",
  "telegram",
  "email",
  "direct_link",
]);

/**
 * Logs a "Share this group" action into Community in Action (Social Connections).
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  const body = (await req.json().catch(() => ({}))) as { channel?: string };
  const channel = String(body.channel ?? "direct_link").trim().toLowerCase();
  if (!SHARE_CHANNELS.has(channel)) {
    return NextResponse.json({ error: "Invalid share channel." }, { status: 400 });
  }

  const { data: group } = await auth.admin
    .from("mobilize_groups")
    .select("id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  await insertGroupInviteShareActivity({
    supabase: auth.admin,
    userId: auth.userId,
    groupId,
  });

  return NextResponse.json({ ok: true });
}
