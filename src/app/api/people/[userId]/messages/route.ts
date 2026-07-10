import { loadPersonMessages, loadPersonProfilePage } from "@/lib/people/person-profile-data";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const access = await loadPersonProfilePage(auth.supabase, auth.user.id, userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const url = new URL(req.url);
  const direction = url.searchParams.get("direction") === "sent" ? "sent" : "received";
  const items = await loadPersonMessages(access.person, direction);
  return NextResponse.json({ ok: true, items });
}
