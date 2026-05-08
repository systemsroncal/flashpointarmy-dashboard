import { redirect } from "next/navigation";

/** Growth Track removed from nav; legacy URL redirects to the dashboard. */
export default function GrowthPage() {
  redirect("/dashboard");
}
