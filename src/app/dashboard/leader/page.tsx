import { redirect } from "next/navigation";

/** Singular URL typo / old bookmarks → canonical leaders list. */
export default function DashboardLeaderRedirectPage() {
  redirect("/dashboard/leaders");
}
