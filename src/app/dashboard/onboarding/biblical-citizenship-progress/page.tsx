import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function BiblicalCitizenshipProgressPage() {
  const { supabase } = await requireServerUser();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", BIBLICAL_CITIZENSHIP_COURSE_SLUG)
    .maybeSingle();

  if (!course?.id) {
    redirect("/dashboard/courses");
  }
  redirect(`/dashboard/courses/${course.id as string}/progress`);
}
