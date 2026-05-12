import { NextResponse } from "next/server";
import { geocodeForward } from "@/lib/mobilize/geocode-nominatim";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await req.json()) as { q?: string };
    const q = String(body.q ?? "").trim();
    if (q.length < 3) {
      return NextResponse.json({ results: [] as { display_name: string; lat: number; lon: number }[] });
    }
    const results = await geocodeForward(q);
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Geocode error.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
