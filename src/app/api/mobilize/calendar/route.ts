import { NextResponse } from "next/server";
import { fetchMobilizeEventsInRange } from "@/lib/mobilize/fetch-mobilize-calendar-events";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const scope = (url.searchParams.get("scope") || "all").toLowerCase() as "all" | "my";

  if (!from || !to) {
    return NextResponse.json({ error: "from and to ISO date query params are required." }, { status: 400 });
  }

  if (scope !== "my" && scope !== "all") {
    return NextResponse.json({ error: "scope must be all or my." }, { status: 400 });
  }

  try {
    const events = await fetchMobilizeEventsInRange(auth.admin, auth.userId, from, to, scope);
    return NextResponse.json({ events });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load calendar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
