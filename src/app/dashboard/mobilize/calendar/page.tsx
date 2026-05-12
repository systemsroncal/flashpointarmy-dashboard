import { redirect } from "next/navigation";

export default function MobilizeCalendarRedirectPage() {
  redirect("/dashboard/mobilize/activities?view=calendar");
}
