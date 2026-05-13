import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let read = true;
  try {
    const b = (await req.json()) as { read?: boolean };
    if (typeof b.read === "boolean") read = b.read;
  } catch {
    /* default read true */
  }

  if (read) {
    const { error } = await supabase.from("announcement_reads").upsert(
      {
        user_id: user.id,
        announcement_id: id,
        read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,announcement_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await supabase
      .from("announcement_reads")
      .delete()
      .eq("user_id", user.id)
      .eq("announcement_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
