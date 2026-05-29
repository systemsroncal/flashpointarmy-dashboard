import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase } = authResult;

    const { data, error } = await supabase.from("chapters").select("id, name").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ chapters: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load chapters" },
      { status: 500 }
    );
  }
}
