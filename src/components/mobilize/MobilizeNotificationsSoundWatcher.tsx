"use client";

import { useMobilizeNotifications } from "@/components/mobilize/useMobilizeNotifications";

/** Plays sound when new Mobilize notifications arrive while browsing the module. */
export function MobilizeNotificationsSoundWatcher() {
  useMobilizeNotifications({ playSound: true });
  return null;
}
