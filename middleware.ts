import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await getSupabaseSession(request);

  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
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
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
