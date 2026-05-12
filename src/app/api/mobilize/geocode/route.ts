import { NextResponse } from "next/server";
import { geocodeWithNominatim } from "@/lib/mobilize/geocode-nominatim";
import { getMobilizeAuth } from "@/lib/mobilize/guard";

export async function POST(req: Request) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const q = typeof (body as { query?: unknown })?.query === "string" ? (body as { query: string }).query : "";
  if (q.trim().length < 3) {
    return NextResponse.json({ hits: [] as const });
  }

  try {
    const hits = await geocodeWithNominatim(q);
    return NextResponse.json({ hits });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Geocode failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
