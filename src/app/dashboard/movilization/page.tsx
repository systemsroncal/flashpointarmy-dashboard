import { redirect } from "next/navigation";

/** Accent toggle lives in the sidebar; this URL only exists for bookmarks / old links. */
export default function MovilizationPage() {
  redirect("/dashboard");
}
