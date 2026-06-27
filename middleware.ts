import {
  isMaintenanceExemptPath,
  isMaintenanceMode,
  MAINTENANCE_MESSAGE,
} from "@/lib/maintenance";
import { getSupabaseSession } from "@/utils/supabase/middleware";
import {
  applyAppSessionPolicy,
  redirectExpiredAppSession,
} from "@/utils/supabase/middleware-session";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Auth routes call Supabase in the handler; skip session refresh here to avoid
  // duplicate outbound requests (VPS DNS/IPv6 issues can make login time out).
  if (path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (isMaintenanceMode()) {
    if (isMaintenanceExemptPath(path)) {
      return NextResponse.next();
    }
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "service_unavailable", message: MAINTENANCE_MESSAGE },
        { status: 503 }
      );
    }
    if (path !== "/maintenance") {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const { user, supabaseResponse, staleSessionCleared } =
    await getSupabaseSession(request);

  if (user) {
    const sessionResponse = applyAppSessionPolicy(
      request,
      user,
      supabaseResponse
    );
    if (sessionResponse === null) {
      return redirectExpiredAppSession(request);
    }
  }

  if (path.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    if (staleSessionCleared) {
      url.searchParams.set("reason", "session_expired");
    }
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /* Skip static assets and local uploads (public/uploads → /uploads/...) */
    "/((?!_next/|uploads/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
