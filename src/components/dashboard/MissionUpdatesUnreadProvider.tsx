"use client";

import { getMissionUpdateSoundEnabled } from "@/lib/notifications/mission-update-sound-pref";
import { playMissionUpdateSoundAlert } from "@/lib/notifications/play-mission-update-sound";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const POLL_MS = 12_000;

type MissionUpdatesUnreadContextValue = {
  unread: number;
  hasUnread: boolean;
};

const MissionUpdatesUnreadContext = createContext<MissionUpdatesUnreadContextValue>({
  unread: 0,
  hasUnread: false,
});

export function useMissionUpdatesUnread() {
  return useContext(MissionUpdatesUnreadContext);
}

export function MissionUpdatesUnreadProvider({ children }: { children: React.ReactNode }) {
  const [unread, setUnread] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/announcements", { cache: "no-store" });
      const data = (await res.json()) as { unreadCount?: number };
      if (res.ok && typeof data.unreadCount === "number") {
        setUnread(data.unreadCount);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unread;
      return;
    }
    if (unread > prevUnreadRef.current && getMissionUpdateSoundEnabled()) {
      playMissionUpdateSoundAlert();
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  return (
    <MissionUpdatesUnreadContext.Provider value={{ unread, hasUnread: unread > 0 }}>
      {children}
    </MissionUpdatesUnreadContext.Provider>
  );
}
