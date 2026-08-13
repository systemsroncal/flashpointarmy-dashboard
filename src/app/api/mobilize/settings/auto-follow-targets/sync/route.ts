import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/http/in-memory-rate-limit";
import { syncMobilizeAutoFollow, type AutoFollowSyncEvent } from "@/lib/mobilize/auto-follow";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

const SYNC_MAX_PER_MIN = 5;
const SYNC_WINDOW_MS = 60_000;

export async function POST() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  if (!isMobilizeSuperAdmin(auth.roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const limited = consumeRateLimit(`auto-follow-sync:${auth.userId}`, SYNC_MAX_PER_MIN, SYNC_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many sync requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let streamEnded = false;
      const send = (evt: AutoFollowSyncEvent) => {
        if (streamEnded) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(evt)}\n`));
        } catch {
          streamEnded = true;
        }
      };
      const endStream = () => {
        if (streamEnded) return;
        streamEnded = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      void (async () => {
        try {
          await syncMobilizeAutoFollow(auth.admin, send);
        } catch (e) {
          send({
            level: "error",
            message: e instanceof Error ? e.message : "Sync failed.",
          });
        } finally {
          endStream();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
