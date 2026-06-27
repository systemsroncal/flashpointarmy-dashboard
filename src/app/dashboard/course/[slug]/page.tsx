import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CoursePageContent from "./CoursePageContent";

export default async function CourseBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<DataPaneFallback label="Loading course" />}>
      <CoursePageContent slug={slug} />
    </Suspense>
  );
}
