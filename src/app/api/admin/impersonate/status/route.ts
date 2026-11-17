import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { readImpersonationMetaFromStore } from "@/lib/auth/impersonation-session";

export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const meta = await readImpersonationMetaFromStore();
  if (!meta || meta.targetUserId !== authResult.user.id) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: true,
    adminDisplayName: meta.adminDisplayName,
    targetDisplayName: meta.targetDisplayName,
  });
}