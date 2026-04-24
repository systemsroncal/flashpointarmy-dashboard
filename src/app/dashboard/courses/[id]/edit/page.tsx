import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EditCoursePageContent from "./EditCoursePageContent";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<DataPaneFallback label="Loading editor" />}>
      <EditCoursePageContent courseId={id} />
    </Suspense>
  );
}
