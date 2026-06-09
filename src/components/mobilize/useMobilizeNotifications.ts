"use client";

import {
  getNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notifications/notification-sound-pref";
import { playNotificationSound } from "@/lib/notifications/play-notification-sound";
import type { MobilizeNotificationsPayload } from "@/lib/mobilize/fetch-mobilize-notifications";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 12_000;

const EMPTY: MobilizeNotificationsPayload = {
  pendingJoinRequests: [],
  recentGroupEvents: [],
  pendingCount: 0,
};

function notificationKeys(data: MobilizeNotificationsPayload): string[] {
  return [
    ...data.pendingJoinRequests.map((p) => `join:${p.id}`),
    ...data.recentGroupEvents.map((e) => `event:${e.id}`),
  ];
}

export function formatMobilizeTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleString();
}

export function useMobilizeNotifications(options?: { playSound?: boolean }) {
  const playSound = options?.playSound ?? false;
  const [data, setData] = useState<MobilizeNotificationsPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownKeysRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    setSoundEnabled(getNotificationSoundEnabled());
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mobilize/notifications", { cache: "no-store" });
      const json = (await res.json()) as MobilizeNotificationsPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load notifications.");
      setData({
        pendingJoinRequests: json.pendingJoinRequests ?? [],
        recentGroupEvents: json.recentGroupEvents ?? [],
        pendingCount: json.pendingCount ?? json.pendingJoinRequests?.length ?? 0,
      });
    } catch {
      /* keep previous data on transient errors */
    } finally {
      setLoading(false);
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
    if (!playSound) return;
    const keys = notificationKeys(data);
    if (knownKeysRef.current === null) {
      knownKeysRef.current = new Set(keys);
      return;
    }
    let hasNew = false;
    for (const key of keys) {
      if (!knownKeysRef.current.has(key)) {
        knownKeysRef.current.add(key);
        hasNew = true;
      }
    }
    if (hasNew && soundEnabled) playNotificationSound();
  }, [data, playSound, soundEnabled]);

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    setNotificationSoundEnabled(enabled);
  }, []);

  return {
    data,
    loading,
    soundEnabled,
    toggleSound,
    refresh: load,
    pendingCount: data.pendingCount,
  };
}
