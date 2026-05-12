import { NextResponse } from "next/server";
import { fetchMobilizeEventsInRange } from "@/lib/mobilize/fetch-mobilize-calendar-events";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "all").toLowerCase() as "all" | "my";
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (scope !== "my" && scope !== "all") {
    return NextResponse.json({ error: "scope must be all or my." }, { status: 400 });
  }

  const now = new Date();
  const from = fromParam?.trim() || now.toISOString();
  const to =
    toParam?.trim() ||
    new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await fetchMobilizeEventsInRange(auth.admin, auth.userId, from, to, scope);
    return NextResponse.json({ events });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load activities.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
