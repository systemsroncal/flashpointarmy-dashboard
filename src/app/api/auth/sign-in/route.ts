import { normalizeAuthEmail } from "@/lib/auth/normalize-auth-email";
import { isInvalidLoginCredentialsError } from "@/lib/auth/sign-in-credentials";
import { signInPasswordCandidates } from "@/lib/auth/sign-in-password";
import { createClient } from "@/utils/supabase/server";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabaseUrl = getPublicSupabaseUrl();
    const supabaseKey = getPublicSupabaseAnonKey();
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Sign-in is not configured on this server (missing Supabase URL or anon key in .env.production).",
          code: "server_config",
        },
        { status: 503 }
      );
    }

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
        code: /failed to fetch|fetch failed|network|econnrefused|etimedout|enotfound/i.test(
          lastMessage
        )
          ? "network_error"
          : "invalid_credentials",
      },
      {
        status: /failed to fetch|fetch failed|network|econnrefused|etimedout|enotfound/i.test(
          lastMessage
        )
          ? 503
          : 401,
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not sign in." },
      { status: 500 }
    );
  }
}
