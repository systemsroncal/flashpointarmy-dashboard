import { NextResponse } from "next/server";
import { joinMobilizeGroupAsMember } from "@/lib/mobilize/join-group-membership";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const result = await joinMobilizeGroupAsMember(auth.admin, {
    groupId: id,
    userId: auth.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.alreadyMember) {
    return NextResponse.json({ membership: result.membership, alreadyMember: true });
  }
  if (result.alreadyPending) {
    return NextResponse.json({ membership: result.membership, alreadyPending: true });
  }

  return NextResponse.json({ membership: result.membership });
}
