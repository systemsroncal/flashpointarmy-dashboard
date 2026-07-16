import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadMobilizeHubSidebar } from "@/lib/mobilize/social/load-hub-sidebar";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  try {
    const sidebar = await loadMobilizeHubSidebar(auth.admin, auth.userId);
    return NextResponse.json(sidebar);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load sidebar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
