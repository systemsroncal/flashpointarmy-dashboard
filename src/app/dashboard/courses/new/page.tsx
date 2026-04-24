import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import NewCoursePageContent from "./NewCoursePageContent";

export default function NewCoursePage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading" />}>
      <NewCoursePageContent />
    </Suspense>
  );
}
