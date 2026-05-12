import { redirect } from "next/navigation";

/** Legacy URL: send users into the Mobilize subsystem. */
export default function MovilizationPage() {
  redirect("/dashboard/mobilize");
}
