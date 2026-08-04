import { NextResponse } from "next/server";
import { loadMobilizeImageUploadLimits } from "@/lib/mobilize/image-upload-limits";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";

/** Authenticated upload limits (Groups wall & User profile images). */
export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const admin = createAdminClient();
  const limits = await loadMobilizeImageUploadLimits(admin);
  return NextResponse.json(limits);
}
