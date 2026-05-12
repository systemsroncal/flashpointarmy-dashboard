import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  const { data, error } = await auth.admin
    .from("mobilize_events")
    .select("id, group_id, title, description, date_time, address, latitude, longitude, event_type, is_public")
    .eq("is_public", true)
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data ?? [] });
}
