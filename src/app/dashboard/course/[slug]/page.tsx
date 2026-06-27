import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CoursePageContent from "./CoursePageContent";

export default async function CourseBySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { slug } = await params;
  const { start } = await searchParams;
  const startAtLessons = start === "lessons";

  return (
    <Suspense fallback={<DataPaneFallback label="Loading course" />}>
      <CoursePageContent slug={slug} startAtLessons={startAtLessons} />
    </Suspense>
  );
}
