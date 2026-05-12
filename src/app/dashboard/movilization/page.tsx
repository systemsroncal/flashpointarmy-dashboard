import { redirect } from "next/navigation";

/** Legacy route: Mobilize lives under `/dashboard/mobilize/*`. */
export default function MovilizationPage() {
  redirect("/dashboard/mobilize/map");
}
