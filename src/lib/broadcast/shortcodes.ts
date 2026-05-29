import type { BroadcastRecipient } from "@/lib/broadcast/types";
import type { BroadcastShortcodes } from "@/lib/broadcast/render-broadcast";

export function displayNameForRecipient(r: BroadcastRecipient): string {
  if (r.firstName || r.lastName) {
    return `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
  }
  if (r.displayName) return r.displayName;
  return r.email ?? r.phone ?? "User";
}

export function shortcodesForRecipient(r: BroadcastRecipient): BroadcastShortcodes {
  const full = displayNameForRecipient(r);
  return {
    user_fullname: full,
    user_first_name: r.firstName ?? "",
    user_last_name: r.lastName ?? "",
    user_email: r.email ?? "",
    user_phone: r.phone ?? "",
    chapter_name: r.chapterName ?? "",
    app_name: "Flashpoint Dashboard",
  };
}
