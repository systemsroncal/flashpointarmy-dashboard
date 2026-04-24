import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import ProgressPageContent from "./ProgressPageContent";

export default async function CourseProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<DataPaneFallback label="Loading progress" />}>
      <ProgressPageContent courseId={id} />
    </Suspense>
  );
}
