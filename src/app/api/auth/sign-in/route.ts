import { normalizeAuthEmail } from "@/lib/auth/normalize-auth-email";
import { isInvalidLoginCredentialsError } from "@/lib/auth/sign-in-credentials";
import { signInPasswordCandidates } from "@/lib/auth/sign-in-password";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const normalizedEmail = normalizeAuthEmail(body.email ?? "");
    const rawPassword = body.password ?? "";

    if (!normalizedEmail || !rawPassword) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const candidates = signInPasswordCandidates(rawPassword);
    let lastMessage = "Invalid login credentials";

    for (let i = 0; i < candidates.length; i++) {
      const pwd = candidates[i]!;
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pwd,
      });
      if (!error) {
        return NextResponse.json({ ok: true });
      }
      lastMessage = error.message || lastMessage;
      if (!isInvalidLoginCredentialsError(error) || i === candidates.length - 1) {
        break;
      }
    }

    return NextResponse.json(
      {
        error: lastMessage,
        code: "invalid_credentials",
      },
      { status: 401 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not sign in." },
      { status: 500 }
    );
  }
}
