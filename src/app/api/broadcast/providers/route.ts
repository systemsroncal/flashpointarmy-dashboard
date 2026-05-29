import { listAvailableProviders } from "@/lib/broadcast/providers/registry";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    return NextResponse.json(listAvailableProviders());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load providers" },
      { status: 500 }
    );
  }
}
