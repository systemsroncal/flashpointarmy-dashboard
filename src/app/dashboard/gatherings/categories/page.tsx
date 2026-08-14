import { redirect } from "next/navigation";

/** Legacy path — categories live under Settings. */
export default function EventCategoriesPage() {
  redirect("/dashboard/settings/event-categories");
}
