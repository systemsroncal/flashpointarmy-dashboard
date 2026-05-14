"use client";

import { createClient } from "@/utils/supabase/client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const PRESENCE_CHANNEL = "dashboard-global-presence-v1";
/** Throttle DB pulses (RPC) to limit writes; presence WebSocket handles “now”. */
const PULSE_MS = 120_000;

type DashboardPresenceValue = {
  onlineUserCount: number;
};

const DashboardPresenceContext = createContext<DashboardPresenceValue | null>(null);

function countPresenceUsers(state: Record<string, unknown[]>): number {
  return Object.keys(state).length;
}

export function DashboardPresenceProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const lastPulseRef = useRef(0);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseDb = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.rpc("dashboard_presence_pulse");
    if (error) {
      /* RLS / migration not applied — ignore in dev */
      console.warn("dashboard_presence_pulse:", error.message);
    }
  }, []);

  const maybePulseDb = useCallback(() => {
    const now = Date.now();
    if (now - lastPulseRef.current < PULSE_MS) return;
    lastPulseRef.current = now;
    void pulseDb();
  }, [pulseDb]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setOnlineUserCount(countPresenceUsers(channel.presenceState() as Record<string, unknown[]>));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: userId, ts: Date.now() });
        setOnlineUserCount(countPresenceUsers(channel.presenceState() as Record<string, unknown[]>));
        lastPulseRef.current = 0;
        void pulseDb();
        lastPulseRef.current = Date.now();
      }
    });

    const onVis = () => {
      if (document.visibilityState === "visible") {
        maybePulseDb();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    pulseTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        maybePulseDb();
      }
    }, PULSE_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [userId, maybePulseDb, pulseDb]);

  const value = useMemo(() => ({ onlineUserCount }), [onlineUserCount]);

  return <DashboardPresenceContext.Provider value={value}>{children}</DashboardPresenceContext.Provider>;
}

export function useDashboardPresence(): DashboardPresenceValue {
  const ctx = useContext(DashboardPresenceContext);
  if (!ctx) {
    return { onlineUserCount: 0 };
  }
  return ctx;
}
