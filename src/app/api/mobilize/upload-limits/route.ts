import { NextResponse } from "next/server";
import { loadMobilizeImageUploadLimits } from "@/lib/mobilize/image-upload-limits";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

/** Public (authenticated Mobilize) upload limits for Groups wall & User profile posts. */
export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const limits = await loadMobilizeImageUploadLimits(auth.admin);
  return NextResponse.json(limits);
}
