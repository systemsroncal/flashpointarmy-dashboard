import { loadModulePermissions } from "@/lib/auth/load-permissions";
import type { ModulePermissionMap } from "@/types/permissions";
import { getAuthUser } from "@/utils/supabase/get-auth-user";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export type ServerAuthResult = {
  supabase: SupabaseClient;
  user: User | null;
  staleSessionCleared: boolean;
};

export async function getServerAuth(
  supabase?: SupabaseClient
): Promise<ServerAuthResult> {
  const client = supabase ?? (await createClient());
  const { user, staleSessionCleared } = await getAuthUser(client);
  return { supabase: client, user, staleSessionCleared };
}

/** Server Components: redirect to login when unauthenticated or stale refresh token. */
export async function requireServerUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const auth = await getServerAuth();
  if (!auth.user) {
    redirect(
      auth.staleSessionCleared
        ? "/login?reason=session_expired"
        : "/login"
    );
  }
  return { supabase: auth.supabase, user: auth.user };
}

export type ApiAuthOk = { supabase: SupabaseClient; user: User };
export type ApiAuthResult = ApiAuthOk | { response: NextResponse };

/** API routes: 401 JSON when unauthenticated; clears stale Supabase cookies via getAuthUser. */
export async function requireApiAuth(
  supabase?: SupabaseClient
): Promise<ApiAuthResult> {
  const auth = await getServerAuth(supabase);
  if (!auth.user) {
    return {
      response: NextResponse.json(
        {
          error: auth.staleSessionCleared
            ? "Session expired. Please sign in again."
            : "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }
  return { supabase: auth.supabase, user: auth.user };
}

export type ApiSessionWithPermissions =
  | { user: User; permissions: ModulePermissionMap; supabase: SupabaseClient }
  | { error: NextResponse };

export async function getApiSessionWithPermissions(): Promise<ApiSessionWithPermissions> {
  const authResult = await requireApiAuth();
  if ("response" in authResult) {
    return { error: authResult.response };
  }
  const { supabase, user } = authResult;
  const permissions = await loadModulePermissions(supabase, user.id);
  return { user, permissions, supabase };
}
